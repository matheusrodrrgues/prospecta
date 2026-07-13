"""Incremental Earth Engine -> Cloud Storage -> PostGIS metadata pipeline."""
from __future__ import annotations

import argparse
import datetime as dt
import os
import time
from dataclasses import dataclass

import ee
from supabase import Client, create_client

BBOX = [-46.5, -18.5, -37.0, -8.5]


@dataclass(frozen=True)
class Period:
    label: str
    start: dt.date
    end: dt.date


def latest_complete_period(today: dt.date | None = None) -> Period:
    today = today or dt.date.today()
    if today.month >= 7:
        return Period(f"{today.year}_1", dt.date(today.year, 1, 1), dt.date(today.year, 6, 30))
    year = today.year - 1
    return Period(f"{year}_2", dt.date(year, 7, 1), dt.date(year, 12, 31))


def mask_landsat(image: ee.Image) -> ee.Image:
    qa = image.select("QA_PIXEL")
    clear = qa.bitwiseAnd(1 << 3).eq(0).And(qa.bitwiseAnd(1 << 4).eq(0)).And(qa.bitwiseAnd(1 << 1).eq(0))
    sensor = ee.String(image.get("SPACECRAFT_ID"))
    newer = sensor.match("LANDSAT_8|LANDSAT_9").length().gt(0)
    red = ee.String(ee.Algorithms.If(newer, "SR_B4", "SR_B3"))
    nir = ee.String(ee.Algorithms.If(newer, "SR_B5", "SR_B4"))
    sr = image.select([red, nir]).multiply(0.0000275).add(-0.2)
    return image.updateMask(clear).addBands(sr.normalizedDifference().rename("NDVI"))


def collection_for(period: Period, geometry: ee.Geometry) -> ee.ImageCollection:
    year = period.start.year
    if year >= 2021:
        sources = ["LANDSAT/LC08/C02/T1_L2", "LANDSAT/LC09/C02/T1_L2"]
    elif year >= 2013:
        sources = ["LANDSAT/LC08/C02/T1_L2"]
    elif year == 2012:
        sources = ["LANDSAT/LE07/C02/T1_L2"]
    else:
        sources = ["LANDSAT/LT05/C02/T1_L2"]
    result = ee.ImageCollection(sources[0])
    for source in sources[1:]:
        result = result.merge(ee.ImageCollection(source))
    return result.filterBounds(geometry).filterDate(period.start.isoformat(), (period.end + dt.timedelta(days=1)).isoformat()).map(mask_landsat)


def visualized_mosaic(collection: ee.ImageCollection, year: int) -> ee.Image:
    mosaic = collection.qualityMosaic("NDVI")
    bands = ["SR_B4", "SR_B3", "SR_B2"] if year >= 2013 else ["SR_B3", "SR_B2", "SR_B1"]
    return mosaic.select(bands).multiply(0.0000275).add(-0.2).multiply(3.5).clamp(0, 1).multiply(255).toUint8()


def wait_for_task(task: ee.batch.Task, timeout_seconds: int = 21_600) -> dict:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        status = task.status()
        if status["state"] == "COMPLETED":
            return status
        if status["state"] in {"FAILED", "CANCELLED"}:
            raise RuntimeError(status.get("error_message", f"Earth Engine task {status['state']}"))
        time.sleep(30)
    task.cancel()
    raise TimeoutError("Earth Engine export exceeded six hours")


def database() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def run(run_id: str, mode: str) -> None:
    db = database()
    try:
        ee.Initialize(project=os.environ["EARTH_ENGINE_PROJECT"])
        period = latest_complete_period()
        if mode == "incremental":
            existing = db.table("imagery_periods").select("id,status").eq("label", period.label).execute().data
            if existing and existing[0]["status"] == "ready":
                db.table("processing_runs").update({"status": "completed", "finished_at": dt.datetime.now(dt.UTC).isoformat(), "metadata": {"skipped": True, "period": period.label}}).eq("id", run_id).execute()
                return

        geometry = ee.Geometry.Rectangle(BBOX)
        collection = collection_for(period, geometry)
        scene_count = int(collection.size().getInfo())
        if scene_count == 0:
            raise RuntimeError(f"No scenes for {period.label}")
        cloud_value = collection.aggregate_mean("CLOUD_COVER").getInfo()
        cloud_coverage = round(float(cloud_value or 0), 2)
        quality = max(0, min(100, round(100 - cloud_coverage)))

        image = visualized_mosaic(collection, period.start.year)
        bucket = os.environ["GCS_BUCKET"]
        prefix = f"cogs/{period.label}/mosaic_{period.label}"
        task = ee.batch.Export.image.toCloudStorage(
            image=image,
            description=f"prospecta_{period.label}",
            bucket=bucket,
            fileNamePrefix=prefix,
            region=geometry,
            scale=30,
            crs="EPSG:4326",
            maxPixels=1e13,
            fileFormat="GeoTIFF",
            formatOptions={"cloudOptimized": True},
        )
        task.start()
        db.table("processing_runs").update({"status": "running", "external_job_id": task.id, "metadata": {"period": period.label, "sceneCount": scene_count}}).eq("id", run_id).execute()
        wait_for_task(task)

        cog_url = f"https://storage.googleapis.com/{bucket}/{prefix}.tif"
        titiler = os.environ.get("TITILER_BASE_URL", "").rstrip("/")
        tile_url = f"{titiler}/cog/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}.png?url={cog_url}" if titiler else None
        payload = {
            "label": period.label, "starts_at": period.start.isoformat(), "ends_at": period.end.isoformat(),
            "quality": quality, "cloud_coverage": cloud_coverage, "scene_count": scene_count, "cog_url": cog_url,
            "tile_url": tile_url, "status": "ready", "processed_at": dt.datetime.now(dt.UTC).isoformat(),
            "metadata": {"earthEngineTask": task.id, "pipelineVersion": 1},
        }
        db.table("imagery_periods").upsert(payload, on_conflict="label").execute()
        db.table("processing_runs").update({"status": "completed", "finished_at": dt.datetime.now(dt.UTC).isoformat(), "metadata": {"period": period.label, "sceneCount": scene_count, "cogUrl": cog_url}}).eq("id", run_id).execute()
    except Exception as exc:
        db.table("processing_runs").update({"status": "failed", "finished_at": dt.datetime.now(dt.UTC).isoformat(), "error_message": str(exc)[:4000]}).eq("id", run_id).execute()
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--mode", choices=["incremental", "force"], default="incremental")
    args = parser.parse_args()
    run(args.run_id, args.mode)

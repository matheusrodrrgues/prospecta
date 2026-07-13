"""Authenticated Cloud Run service that starts the durable Cloud Run Job."""
from __future__ import annotations

import os
from fastapi import FastAPI, Header, HTTPException
from google.cloud import run_v2
from pydantic import BaseModel

app = FastAPI(title="Prospecta Pipeline Launcher", docs_url=None, redoc_url=None)


class LaunchRequest(BaseModel):
    runId: str
    mode: str = "incremental"


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/")
def launch(payload: LaunchRequest, authorization: str | None = Header(default=None)) -> dict[str, str]:
    secret = os.environ.get("PIPELINE_WEBHOOK_SECRET")
    if not secret or authorization != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    project = os.environ["GOOGLE_CLOUD_PROJECT"]
    region = os.environ.get("GOOGLE_CLOUD_REGION", "southamerica-east1")
    job_name = os.environ.get("CLOUD_RUN_JOB", "prospecta-imagery")
    name = f"projects/{project}/locations/{region}/jobs/{job_name}"
    client = run_v2.JobsClient()
    operation = client.run_job(
        request=run_v2.RunJobRequest(
            name=name,
            overrides=run_v2.RunJobRequest.Overrides(
                container_overrides=[run_v2.RunJobRequest.Overrides.ContainerOverride(
                    args=["pipeline.py", "--run-id", payload.runId, "--mode", payload.mode]
                )]
            ),
        )
    )
    return {"status": "started", "operation": operation.operation.name, "runId": payload.runId}

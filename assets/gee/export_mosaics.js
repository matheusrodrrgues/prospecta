// =============================================================================
// PROSPECTA 4.0 — EXPORTAÇÃO EM LOTE DE MOSAICOS SEMESTRAIS
// Cole este script no GEE Code Editor: code.earthengine.google.com
//
// Coleções usadas:
//   Landsat 5 (TM)   → LANDSAT/LT05/C02/T1_L2  (2000–2011)
//   Landsat 7 (ETM+) → LANDSAT/LE07/C02/T1_L2  (2012)
//   Landsat 8 (OLI)  → LANDSAT/LC08/C02/T1_L2  (2013–2021)
//   Landsat 9 (OLI-2)→ LANDSAT/LC09/C02/T2_L2  (2021–)
//
// Fórmula de qualidade: qualityMosaic baseado em NDVI + máscara de nuvem QA_PIXEL
// Exportação: Google Drive → pasta 'Prospecta40_Mosaicos' como COG GeoTIFF
// =============================================================================

var BBOX = ee.Geometry.Rectangle([-46.5, -18.5, -37.0, -8.5]); // Bahia

// ── FUNÇÕES DE PRÉ-PROCESSAMENTO ─────────────────────────────────────────────

function maskAndScore_L5L7(img) {
  var qa = img.select('QA_PIXEL');
  var clear = qa.bitwiseAnd(1 << 3).eq(0)   // sem nuvem
    .and(qa.bitwiseAnd(1 << 4).eq(0))        // sem sombra de nuvem
    .and(qa.bitwiseAnd(1 << 1).eq(0));       // sem cirrus/dilatação
  var sr = img.select(['SR_B3','SR_B4']).multiply(0.0000275).add(-0.2);
  var ndvi = sr.normalizedDifference().rename('NDVI');
  return img.updateMask(clear).addBands(ndvi);
}

function maskAndScore_L8L9(img) {
  var qa = img.select('QA_PIXEL');
  var clear = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 1).eq(0));
  var sr = img.select(['SR_B4','SR_B5']).multiply(0.0000275).add(-0.2);
  var ndvi = sr.normalizedDifference().rename('NDVI');
  return img.updateMask(clear).addBands(ndvi);
}

function getCollection(year) {
  if (year >= 2021) {
    var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T2_L2').filterBounds(BBOX).map(maskAndScore_L8L9);
    var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(BBOX).map(maskAndScore_L8L9);
    return l8.merge(l9);
  }
  if (year >= 2013) {
    return ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(BBOX).map(maskAndScore_L8L9);
  }
  if (year === 2012) {
    return ee.ImageCollection('LANDSAT/LE07/C02/T1_L2').filterBounds(BBOX).map(maskAndScore_L5L7);
  }
  return ee.ImageCollection('LANDSAT/LT05/C02/T1_L2').filterBounds(BBOX).map(maskAndScore_L5L7);
}

function buildMosaic(year, sem) {
  var start = year + '-' + (sem === 1 ? '01-01' : '07-01');
  var end   = year + '-' + (sem === 1 ? '06-30' : '12-31');
  return getCollection(year).filterDate(start, end).qualityMosaic('NDVI');
}

function visualize(mosaic, year) {
  var isL8 = year >= 2013;
  var bands  = isL8 ? ['SR_B4','SR_B3','SR_B2'] : ['SR_B3','SR_B2','SR_B1'];
  return mosaic.select(bands)
    .multiply(0.0000275).add(-0.2)
    .multiply(3.5)
    .clamp(0, 1)
    .visualize({ min: 0, max: 1 });
}

// ── PERÍODOS SEMESTRAIS ──────────────────────────────────────────────────────
// Comente períodos que já foram exportados para evitar reprocessamento

var PERIODS = [
  // { year: 2009, sem: 1 },  // descomente para re-exportar
  { year: 2009, sem: 2 },
  { year: 2010, sem: 1 },
  { year: 2010, sem: 2 },
  { year: 2011, sem: 1 },
  { year: 2011, sem: 2 },
  // 2012_1 = ND (dados insuficientes — não exportar)
  { year: 2012, sem: 2 },
  { year: 2013, sem: 1 },
  { year: 2013, sem: 2 },
  { year: 2014, sem: 1 },
  { year: 2014, sem: 2 },
  { year: 2015, sem: 1 },
  { year: 2015, sem: 2 },
  { year: 2016, sem: 1 },
  { year: 2016, sem: 2 },
  { year: 2017, sem: 1 },
  { year: 2017, sem: 2 },
  { year: 2018, sem: 1 },
  { year: 2018, sem: 2 },
  { year: 2019, sem: 1 },
  { year: 2019, sem: 2 },
  { year: 2020, sem: 1 },
  { year: 2020, sem: 2 }
];

// ── EXPORTAÇÃO SEMESTRAIS ────────────────────────────────────────────────────

PERIODS.forEach(function(p) {
  var name   = p.year + '_' + p.sem;
  var mosaic = buildMosaic(p.year, p.sem);
  var imgVis = visualize(mosaic, p.year);

  Export.image.toDrive({
    image: imgVis,
    description: 'prospecta_' + name,
    folder: 'Prospecta40_Mosaicos',
    fileNamePrefix: 'mosaic_' + name,
    region: BBOX,
    scale: 30,
    crs: 'EPSG:4326',
    maxPixels: 1e13,
    formatOptions: { cloudOptimized: true }
  });

  print('Export queued: ' + name);
});

// ── MOSAICO COMBINADO 2000–2008 ───────────────────────────────────────────────

var combined2000_2008 = (function() {
  var cols = [];
  for (var y = 2000; y <= 2008; y++) {
    cols.push(getCollection(y).filterDate(y + '-01-01', y + '-12-31'));
  }
  return cols.reduce(function(a, b) { return a.merge(b); }).qualityMosaic('NDVI');
})();

Export.image.toDrive({
  image: visualize(combined2000_2008, 2005),
  description: 'prospecta_2000-2008',
  folder: 'Prospecta40_Mosaicos',
  fileNamePrefix: 'mosaic_2000-2008',
  region: BBOX,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13,
  formatOptions: { cloudOptimized: true }
});

// =============================================================================
// PRÓXIMOS PASSOS — CONVERTER PARA TILES WEB
// =============================================================================
//
// 1. Baixe os GeoTIFFs exportados do Google Drive
//
// 2. Para cada arquivo, gere tiles XYZ com gdal2tiles (Python):
//    gdal2tiles.py --zoom=5-12 --processes=4 --webviewer=none \
//      mosaic_2019_2.tif prospecta-tiles/2019_2/
//
//    Ou com rio-cogeo + rio-tiler se preferir tiles servidos dinamicamente.
//
// 3. Upload para Google Cloud Storage:
//    gsutil -m rsync -r prospecta-tiles/ gs://prospecta40-tiles/
//
// 4. Torne o bucket público (leitura):
//    gsutil iam ch allUsers:objectViewer gs://prospecta40-tiles
//
// 5. A URL dos tiles no dashboard (dashboard.js → GEE_TILES_BASE) será:
//    https://storage.googleapis.com/prospecta40-tiles/{período}/{z}/{x}/{y}.png
//
// 6. Ative o layer Satélite no dashboard e mova o slider de período —
//    os mosaicos GEE serão sobrepostos ao basemap Esri.
// =============================================================================

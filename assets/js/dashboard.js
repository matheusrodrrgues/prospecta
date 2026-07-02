// ── DATA ──────────────────────────────────────────────────────────────────────

var PERIODS = [
  '2000-2008',
  '2009_1','2009_2',
  '2010_1','2010_2',
  '2011_1','2011_2',
  '2012_2',
  '2013_1','2013_2',
  '2014_1','2014_2',
  '2015_1','2015_2',
  '2016_1','2016_2',
  '2017_1','2017_2',
  '2018_1','2018_2',
  '2019_1','2019_2',
  '2020_1','2020_2'
];

var PERIOD_DATA = {
  '2000-2008': { quality: 84, clouds: 3,  scenes: 134 },
  '2009_1':    { quality: 57, clouds: 24, scenes: 7   },
  '2009_2':    { quality: 79, clouds: 6,  scenes: 9   },
  '2010_1':    { quality: 52, clouds: 28, scenes: 6   },
  '2010_2':    { quality: 76, clouds: 9,  scenes: 8   },
  '2011_1':    { quality: 61, clouds: 21, scenes: 8   },
  '2011_2':    { quality: 83, clouds: 5,  scenes: 10  },
  '2012_2':    { quality: 74, clouds: 11, scenes: 9   },
  '2013_1':    { quality: 49, clouds: 31, scenes: 7   },
  '2013_2':    { quality: 80, clouds: 7,  scenes: 11  },
  '2014_1':    { quality: 55, clouds: 26, scenes: 8   },
  '2014_2':    { quality: 77, clouds: 8,  scenes: 10  },
  '2015_1':    { quality: 63, clouds: 19, scenes: 9   },
  '2015_2':    { quality: 85, clouds: 4,  scenes: 12  },
  '2016_1':    { quality: 48, clouds: 33, scenes: 6   },
  '2016_2':    { quality: 78, clouds: 8,  scenes: 10  },
  '2017_1':    { quality: 60, clouds: 22, scenes: 8   },
  '2017_2':    { quality: 82, clouds: 6,  scenes: 11  },
  '2018_1':    { quality: 64, clouds: 18, scenes: 9   },
  '2018_2':    { quality: 87, clouds: 3,  scenes: 13  },
  '2019_1':    { quality: 59, clouds: 23, scenes: 8   },
  '2019_2':    { quality: 84, clouds: 5,  scenes: 12  },
  '2020_1':    { quality: 62, clouds: 20, scenes: 9   },
  '2020_2':    { quality: 81, clouds: 7,  scenes: 11  }
};

var REGIONS = {
  all: {
    name: 'Bahia', center: [-12.5,-41.8], zoom: 7, bounds: null,
    area: 4842, pontos: 6,
    minerais: ['Fosfato','Terras-raras','Urânio','Magnesita','Cromo']
  },
  irece: {
    name: 'Bacia de Irecê', center: [-11.30,-41.85], zoom: 9,
    bounds: [[-12.5,-43.0],[-9.8,-40.5]],
    area: 1240, pontos: 1, minerais: ['Fosfato'],
    desc: 'Formação carbonática com potencial para fosfato sedimentar. Principal alvo do Prospecta 4.0 na Bahia.'
  },
  chapada: {
    name: 'Chapada Diamantina', center: [-12.50,-41.50], zoom: 9,
    bounds: [[-14.0,-42.8],[-11.5,-40.0]],
    area: 1580, pontos: 1, minerais: ['Terras-raras'],
    desc: 'Ocorrências de ETR associadas a carbonatitos e rochas alcalinas na Chapada Diamantina.'
  },
  caetite: {
    name: 'Caetité', center: [-14.07,-42.48], zoom: 10,
    bounds: [[-14.8,-43.5],[-13.5,-41.5]],
    area: 680, pontos: 1, minerais: ['Urânio'],
    desc: 'Granitos proterozóicos da Formação Lagoa Real com mineralização uranífera de expressão regional.'
  },
  brumado: {
    name: 'Brumado', center: [-14.20,-41.66], zoom: 10,
    bounds: [[-15.0,-42.5],[-13.5,-40.5]],
    area: 520, pontos: 1, minerais: ['Magnesita'],
    desc: 'Depósito de magnesita metamórfica de classe mundial no Grupo Rio Pardo, sudoeste baiano.'
  },
  jacobina: {
    name: 'Jacobina', center: [-11.18,-40.52], zoom: 10,
    bounds: [[-12.0,-41.5],[-10.5,-39.5]],
    area: 440, pontos: 1, minerais: ['Cromo'],
    desc: 'Complexo máfico-ultramáfico de Jacobina com potencial para cromo e platinoides.'
  },
  serrinha: {
    name: 'Serrinha', center: [-11.66,-39.00], zoom: 10,
    bounds: [[-12.5,-40.0],[-10.5,-38.0]],
    area: 382, pontos: 1, minerais: ['Terras-raras'],
    desc: 'Granitoides e ortognaisses do Cinturão de Cisalhamento com anomalias de ETR.'
  }
};

var MARKERS_DATA = [
  { id:'irece',    regionKey:'irece',    name:'Bacia de Irecê',     coords:[-11.30,-41.85], type:'estrategico', mineral:'Fosfato',      status:'Em estudo',    desc:'Formação carbonática com potencial para fosfato sedimentar. Principal alvo do Prospecta 4.0.' },
  { id:'chapada',  regionKey:'chapada',  name:'Chapada Diamantina', coords:[-12.50,-41.50], type:'critico',     mineral:'Terras-raras', status:'Identificado', desc:'Ocorrências de ETR associadas a carbonatitos e rochas alcalinas na Chapada.' },
  { id:'caetite',  regionKey:'caetite',  name:'Caetité',            coords:[-14.07,-42.48], type:'estrategico', mineral:'Urânio',       status:'Mapeado',      desc:'Granitos proterozóicos da Formação Lagoa Real com mineralização uranífera.' },
  { id:'brumado',  regionKey:'brumado',  name:'Brumado',            coords:[-14.20,-41.66], type:'critico',     mineral:'Magnesita',    status:'Mapeado',      desc:'Depósito de magnesita metamórfica de classe mundial no Grupo Rio Pardo.' },
  { id:'jacobina', regionKey:'jacobina', name:'Jacobina',           coords:[-11.18,-40.52], type:'estrategico', mineral:'Cromo',        status:'Identificado', desc:'Complexo máfico-ultramáfico com potencial para cromo e platinoides.' },
  { id:'serrinha', regionKey:'serrinha', name:'Serrinha',           coords:[-11.66,-39.00], type:'critico',     mineral:'Terras-raras', status:'Em estudo',    desc:'Granitoides e ortognaisses com anomalias de ETR no Cinturão de Cisalhamento.' },
  { id:'hub',      regionKey:null,       name:'LAPIG · UEFS',       coords:[-12.26,-38.96], type:'hub',         mineral:'Hub',          status:'Ativo',        desc:'Base de pesquisa do Prospecta 4.0 na Universidade Estadual de Feira de Santana (UEFS).' }
];

var GEE_TILES_BASE = 'https://storage.googleapis.com/prospecta40-tiles';

// ── STATE ─────────────────────────────────────────────────────────────────────

var state = {
  periodIdx: 23,
  region: 'all',
  type: 'critico',
  minerals: new Set(['Terras-raras','Magnesita','Urânio','Fosfato','Cromo']),
  baseLayer: 'satellite'
};

// ── MAP INIT ──────────────────────────────────────────────────────────────────

var map, mapLayer, satelliteLayer, geeTileLayer = null;
var leafletMarkers = [];
var overlays = {};

function initMap() {
  map = L.map('dbMap', {
    center: [-12.5, -41.8],
    zoom: 7,
    zoomControl: false,
    attributionControl: true
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  mapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>'
  });

  satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 18, attribution: '© <a href="https://www.esri.com/">Esri</a>' }
  );

  satelliteLayer.addTo(map);

  // Leaflet needs invalidateSize when container is sized by flex after init
  setTimeout(function() { map.invalidateSize(); }, 100);
  window.addEventListener('resize', function() { map.invalidateSize(); });
}

// ── MARKERS ───────────────────────────────────────────────────────────────────

function mkMarkerIcon(type, active) {
  var colors = { estrategico: '#b7d36b', critico: '#c7a46a', hub: '#f8f4e9' };
  var c = colors[type] || '#b7d36b';
  var s = active ? 22 : 14;
  var glowColor = type === 'hub' ? 'rgba(248,244,233,0.18)' : 'rgba(183,211,107,0.22)';
  var glow = active
    ? 'box-shadow:0 0 0 6px ' + glowColor + ',0 0 0 14px ' + (type === 'hub' ? 'rgba(248,244,233,0.06)' : 'rgba(183,211,107,0.08)') + ';'
    : '';
  return L.divIcon({
    className: '',
    html: '<span style="display:block;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + c + ';' + glow + 'border:2px solid rgba(255,255,255,0.28);transition:all .2s;"></span>',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2]
  });
}

function buildPopupHtml(item) {
  var typeLabel = { estrategico: 'Estratégico', critico: 'Crítico', hub: 'Base de pesquisa' }[item.type] || item.type;
  var typeColor = { estrategico: '#b7d36b', critico: '#c7a46a', hub: '#f8f4e9' }[item.type] || '#b7d36b';
  return [
    '<div style="font-family:Nunito,sans-serif;padding:16px 18px 14px;min-width:210px;max-width:250px;">',
    '<div style="font-family:JetBrains Mono,monospace;font-size:0.52rem;font-weight:700;color:', typeColor, ';letter-spacing:0.16em;text-transform:uppercase;margin-bottom:5px;">', typeLabel, '</div>',
    '<div style="font-size:1.05rem;font-weight:900;color:#f8f4e9;margin-bottom:5px;line-height:1.15;">', item.mineral, '</div>',
    '<div style="font-size:0.78rem;color:rgba(248,244,233,0.6);margin-bottom:9px;font-weight:600;">', item.name, '</div>',
    '<div style="font-size:0.72rem;color:rgba(248,244,233,0.46);line-height:1.45;margin-bottom:11px;">', item.desc, '</div>',
    '<span style="display:inline-block;font-family:JetBrains Mono,monospace;font-size:0.52rem;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(183,211,107,0.08);border:1px solid rgba(183,211,107,0.25);color:', typeColor, ';">', item.status, '</span>',
    '</div>'
  ].join('');
}

function renderMarkers() {
  leafletMarkers.forEach(function(m) { m.remove(); });
  leafletMarkers = [];

  MARKERS_DATA.forEach(function(item, i) {
    if (item.type !== 'hub') {
      if (item.type !== state.type) return;
      if (!state.minerals.has(item.mineral)) return;
      if (state.region !== 'all' && item.regionKey !== state.region) return;
    }

    var marker = L.marker(item.coords, { icon: mkMarkerIcon(item.type, false) }).addTo(map);
    marker.bindPopup(buildPopupHtml(item), {
      className: 'db-popup',
      maxWidth: 270,
      autoPan: true,
      closeButton: true
    });

    marker.on('click', function() {
      leafletMarkers.forEach(function(m) {
        m.setIcon(mkMarkerIcon(MARKERS_DATA[m._dbIdx].type, m === marker));
      });
      if (item.regionKey && REGIONS[item.regionKey]) {
        document.getElementById('dataRegionName').textContent = REGIONS[item.regionKey].name;
      }
    });

    marker._dbIdx = i;
    leafletMarkers.push(marker);
  });
}

// ── PERIOD ────────────────────────────────────────────────────────────────────

function updatePeriod(idx) {
  state.periodIdx = parseInt(idx, 10);
  var p = PERIODS[state.periodIdx];

  document.getElementById('headerPeriod').textContent = p;
  document.getElementById('tlLabel').innerHTML = 'Período: <strong>' + p + '</strong>';
  document.getElementById('dataPeriodTag').textContent = 'Período: ' + p;

  if (geeTileLayer) {
    geeTileLayer.remove();
    geeTileLayer = null;
  }

  var EMPTY_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  geeTileLayer = L.tileLayer(GEE_TILES_BASE + '/' + p + '/{z}/{x}/{y}.png', {
    opacity: 0.6,
    errorTileUrl: EMPTY_PIXEL
  });

  if (state.baseLayer === 'satellite') {
    geeTileLayer.addTo(map);
  }

  updateDataPanel();
  renderQualityChart(state.periodIdx);
}

// ── REGION ────────────────────────────────────────────────────────────────────

function updateRegion(regionKey) {
  state.region = regionKey;
  var r = REGIONS[regionKey];
  document.getElementById('dataRegionName').textContent = r.name;
  map.flyTo(r.center, r.zoom, { duration: 1.1, easeLinearity: 0.3 });
  renderMarkers();
  updateDataPanel();
}

// ── DATA PANEL ────────────────────────────────────────────────────────────────

function updateDataPanel() {
  var pd = PERIOD_DATA[PERIODS[state.periodIdx]];
  var r = REGIONS[state.region];
  var grid = document.getElementById('statsGrid');

  grid.innerHTML = [
    mkStatCard(pd.quality + '%', 'Qualidade', pd.quality < 65 ? 'warn' : ''),
    mkStatCard(pd.clouds + '%', 'Nuvens', pd.clouds > 20 ? 'warn' : ''),
    mkStatCard(pd.scenes, 'Cenas Landsat', ''),
    mkStatCard(r.area.toLocaleString('pt-BR') + ' km²', 'Área mapeada', ''),
    mkStatCard(r.pontos, 'Pontos', ''),
    '<div class="db-stat-card" style="min-width:160px;max-width:220px;">' +
      '<div class="db-stat-val sm">' + r.minerais.join(', ') + '</div>' +
      '<div class="db-stat-label">Minerais</div>' +
    '</div>'
  ].join('');
}

function mkStatCard(val, label, cls) {
  return '<div class="db-stat-card">' +
    '<div class="db-stat-val' + (cls ? ' ' + cls : '') + '">' + val + '</div>' +
    '<div class="db-stat-label">' + label + '</div>' +
    '</div>';
}

// ── QUALITY CHART ─────────────────────────────────────────────────────────────

function renderQualityChart(activePeriodIdx) {
  var BAR_W = 22, PAD = 10, H = 72, BASELINE = 58;

  var yearMarks = {
    0:'\'08', 1:'\'09', 3:'\'10', 5:'\'11', 7:'\'12',
    8:'\'13', 10:'\'14', 12:'\'15', 14:'\'16', 16:'\'17',
    18:'\'18', 20:'\'19', 22:'\'20'
  };

  var total = PERIODS.length;
  var svgW = total * BAR_W + PAD * 2;

  var bars = '';
  var labels = '';

  PERIODS.forEach(function(p, i) {
    var pd = PERIOD_DATA[p];
    var q = pd.quality;
    var barH = Math.max(2, Math.round(q * (BASELINE - 6) / 100));
    var x = PAD + i * BAR_W;
    var y = BASELINE - barH;
    var bw = BAR_W - 4;
    var isActive = i === activePeriodIdx;
    var color = q > 75 ? '#b7d36b' : q > 55 ? '#c7a46a' : '#8b4040';
    var op = isActive ? 1 : 0.42;
    var rx = 2;

    bars += '<rect x="' + (x + 2) + '" y="' + y + '" width="' + bw + '" height="' + barH + '"' +
      ' fill="' + color + '" opacity="' + op + '" rx="' + rx + '"' +
      ' class="qbar" data-idx="' + i + '">' +
      '<title>' + p + ': qualidade ' + q + '% · nuvens ' + pd.clouds + '%</title></rect>';

    if (isActive) {
      bars += '<rect x="' + (x + 2) + '" y="' + (y - 3) + '" width="' + bw + '" height="3"' +
        ' fill="' + color + '" opacity="0.6" rx="1"></rect>';
      bars += '<text x="' + (x + BAR_W/2) + '" y="' + (y - 6) + '"' +
        ' text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="7" fill="' + color + '" opacity="0.9">' + q + '%</text>';
    }

    if (yearMarks[i] !== undefined) {
      labels += '<text x="' + (x + BAR_W/2) + '" y="' + (H - 1) + '"' +
        ' text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6.5" fill="rgba(248,244,233,0.22)">' + yearMarks[i] + '</text>';
    }
  });

  var baseLine = '<line x1="' + PAD + '" y1="' + BASELINE + '" x2="' + (svgW - PAD) + '" y2="' + BASELINE + '"' +
    ' stroke="rgba(248,244,233,0.08)" stroke-width="1"/>';

  var svg = '<svg viewBox="0 0 ' + svgW + ' ' + H + '" width="' + svgW + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">' +
    baseLine + bars + labels + '</svg>';

  var chartEl = document.getElementById('qualityChart');
  chartEl.innerHTML = svg;

  var activeX = PAD + activePeriodIdx * BAR_W;
  var visCenter = chartEl.scrollLeft + chartEl.clientWidth / 2;
  if (Math.abs(activeX - visCenter) > chartEl.clientWidth / 3) {
    chartEl.scrollLeft = Math.max(0, activeX - chartEl.clientWidth / 2);
  }

  chartEl.querySelectorAll('.qbar').forEach(function(bar) {
    bar.addEventListener('click', function() {
      var idx = parseInt(bar.getAttribute('data-idx'), 10);
      document.getElementById('periodSlider').value = idx;
      updatePeriod(idx);
    });
  });
}

// ── BASE LAYER TOGGLE ─────────────────────────────────────────────────────────

function setBaseLayer(lyr) {
  state.baseLayer = lyr;
  if (lyr === 'satellite') {
    if (map.hasLayer(mapLayer)) mapLayer.remove();
    if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
    if (geeTileLayer && !map.hasLayer(geeTileLayer)) geeTileLayer.addTo(map);
  } else {
    if (map.hasLayer(satelliteLayer)) satelliteLayer.remove();
    if (geeTileLayer && map.hasLayer(geeTileLayer)) geeTileLayer.remove();
    if (!map.hasLayer(mapLayer)) mapLayer.addTo(map);
  }
}

// ── OVERLAY LAYERS ────────────────────────────────────────────────────────────

var OVERLAY_CLASSES = {
  layerRodovias: 'db-overlay-rodovias',
  layerReservas:  'db-overlay-reservas',
  layerCidades:   'db-overlay-cidades'
};

function toggleOverlay(id) {
  var mapWrap = document.querySelector('.db-map-wrap');
  if (overlays[id]) {
    overlays[id].remove();
    delete overlays[id];
  } else {
    var div = document.createElement('div');
    div.className = 'db-overlay ' + OVERLAY_CLASSES[id];
    mapWrap.appendChild(div);
    overlays[id] = div;
  }
}

// ── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  initMap();
  renderMarkers();
  updateDataPanel();
  renderQualityChart(state.periodIdx);

  // Region select
  document.getElementById('regionSelect').addEventListener('change', function() {
    updateRegion(this.value);
  });

  // Type buttons
  document.querySelectorAll('.db-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.db-type-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.type = btn.dataset.type;
      var showCritico = state.type === 'critico';
      document.getElementById('mineralGroupCritico').style.display = showCritico ? '' : 'none';
      document.getElementById('mineralGroupEstrategico').style.display = showCritico ? 'none' : '';
      renderMarkers();
    });
  });

  // Mineral toggles
  document.querySelectorAll('[data-mineral]').forEach(function(input) {
    input.addEventListener('change', function() {
      if (this.checked) state.minerals.add(this.dataset.mineral);
      else state.minerals.delete(this.dataset.mineral);
      renderMarkers();
    });
  });

  // Period slider
  document.getElementById('periodSlider').addEventListener('input', function() {
    updatePeriod(parseInt(this.value, 10));
  });

  // Base layer buttons
  document.querySelectorAll('.db-lyr-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.db-lyr-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setBaseLayer(btn.dataset.lyr);
    });
  });

  // Overlay layer checkboxes
  Object.keys(OVERLAY_CLASSES).forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function() { toggleOverlay(id); });
  });

  // GEE notice close
  var geeClose = document.getElementById('geeNoticeClose');
  var geeNotice = document.getElementById('geeNotice');
  if (geeClose && geeNotice) {
    geeClose.addEventListener('click', function() {
      geeNotice.style.display = 'none';
    });
  }
});

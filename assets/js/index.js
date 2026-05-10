var els = document.querySelectorAll('.reveal');
var obs = new IntersectionObserver(function(e) {
	e.forEach(function(x) {
		if (x.isIntersecting) { x.target.classList.add('in'); obs.unobserve(x.target); }
	});
}, { threshold: 0.08 });
els.forEach(function(el) { obs.observe(el); });

var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.snav-link');
var secObs = new IntersectionObserver(function(entries) {
	entries.forEach(function(entry) {
		if (entry.isIntersecting) {
			navLinks.forEach(function(a) {
				a.classList.remove('active');
				if (a.getAttribute('href') === '#' + entry.target.id) {
					a.classList.add('active');
				}
			});
		}
	});
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(function(s) { secObs.observe(s); });

var contactForm = document.querySelector('.form-box');
if (contactForm) {
	contactForm.addEventListener('submit', function(event) {
		event.preventDefault();
	});
}

(function() {
	var carousel = document.getElementById('team-carousel');
	if (!carousel) return;
	var isDragging = false, startX = 0, scrollLeft = 0;
	carousel.addEventListener('mousedown', function(e) {
		isDragging = true;
		carousel.classList.add('dragging');
		startX = e.pageX - carousel.offsetLeft;
		scrollLeft = carousel.scrollLeft;
	});
	document.addEventListener('mouseup', function() {
		isDragging = false;
		carousel.classList.remove('dragging');
	});
	carousel.addEventListener('mousemove', function(e) {
		if (!isDragging) return;
		e.preventDefault();
		var x = e.pageX - carousel.offsetLeft;
		carousel.scrollLeft = scrollLeft - (x - startX) * 1.4;
	});
	carousel.addEventListener('mouseleave', function() {
		isDragging = false;
		carousel.classList.remove('dragging');
	});
})();

(function() {
	if (!document.getElementById('mineral-map') || typeof L === 'undefined') return;

	var map = L.map('mineral-map', {
		center: [-12.5, -41.8],
		zoom: 7,
		zoomControl: false,
		attributionControl: true
	});

	L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
		subdomains: 'abcd',
		maxZoom: 19,
		attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>'
	}).addTo(map);

	L.control.zoom({ position: 'bottomright' }).addTo(map);

	var data = [
		{ name: 'Bacia de Irecê',      coords: [-11.30, -41.85], type: 'estrategico', mineral: 'Fosfato',      status: 'Em estudo',    desc: 'Formação carbonática com potencial para fosfato sedimentar. Principal alvo do Prospecta 4.0 na Bahia.' },
		{ name: 'Chapada Diamantina',   coords: [-12.50, -41.50], type: 'critico',     mineral: 'Terras-raras', status: 'Identificado',  desc: 'Ocorrências de ETR associadas a carbonatitos e rochas alcalinas na Chapada Diamantina.' },
		{ name: 'Caetité',             coords: [-14.07, -42.48], type: 'estrategico', mineral: 'Urânio',        status: 'Mapeado',       desc: 'Granitos proterozóicos da Formação Lagoa Real com mineralização uranífera de expressão regional.' },
		{ name: 'Brumado',             coords: [-14.20, -41.66], type: 'critico',     mineral: 'Magnesita',     status: 'Mapeado',       desc: 'Depósito de magnesita metamórfica de classe mundial em rochas do Grupo Rio Pardo, sudoeste baiano.' },
		{ name: 'Jacobina',            coords: [-11.18, -40.52], type: 'estrategico', mineral: 'Cromo',         status: 'Identificado',  desc: 'Complexo máfico-ultramáfico de Jacobina com potencial para cromo e platinoides.' },
		{ name: 'Serrinha',            coords: [-11.66, -39.00], type: 'critico',     mineral: 'Terras-raras', status: 'Em estudo',     desc: 'Granitoides e ortognaisses do Cinturão de Cisalhamento com anomalias de ETR.' },
		{ name: 'LAPIG · UEFS',        coords: [-12.26, -38.96], type: 'hub',         mineral: 'Base',          status: 'Ativo',         desc: 'Base de pesquisa do Prospecta 4.0 na Universidade Estadual de Feira de Santana (UEFS).' }
	];

	var mColors = { estrategico: '#b7d36b', critico: '#c7a46a', hub: '#f8f4e9' };
	var activeIdx = -1;
	var markers = [];

	function mkIcon(type, active) {
		var c = mColors[type] || '#b7d36b';
		var s = active ? 20 : 14;
		var glow = active ? 'box-shadow:0 0 0 6px rgba(183,211,107,0.2),0 0 0 14px rgba(183,211,107,0.09);' : '';
		return L.divIcon({
			className: '',
			html: '<span style="display:block;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + c + ';' + glow + 'border:2px solid rgba(255,255,255,0.28);transition:all .2s;"></span>',
			iconSize: [s, s],
			iconAnchor: [s / 2, s / 2]
		});
	}

	function showInfo(i) {
		var item = data[i];
		document.getElementById('info-mineral').textContent = item.mineral;
		document.getElementById('info-name').textContent = item.name;
		document.getElementById('info-type').textContent = item.type === 'estrategico' ? 'Estratégico' : 'Crítico';
		document.getElementById('info-status').textContent = item.status;
		document.getElementById('info-desc').textContent = item.desc;
		markers.forEach(function(m, j) { m.setIcon(mkIcon(data[j].type, j === i)); });
		activeIdx = i;
	}

	data.forEach(function(item, i) {
		var m = L.marker(item.coords, { icon: mkIcon(item.type, false) }).addTo(map);
		m.on('click', function() { showInfo(i); });
		markers.push(m);
	});

	document.querySelectorAll('.mfilter-btn').forEach(function(btn) {
		btn.addEventListener('click', function() {
			document.querySelectorAll('.mfilter-btn').forEach(function(b) { b.classList.remove('active'); });
			btn.classList.add('active');
			var filter = btn.dataset.filter;
			markers.forEach(function(m, i) {
				if (filter === 'todos' || data[i].type === filter) { m.addTo(map); }
				else { m.remove(); }
			});
		});
	});
})();

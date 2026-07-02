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
	var modalData = {
		pub1: {
			type: 'pub',
			src: 'XII SimeXmin · 2025', ref: 'AT1-01-189',
			title: 'Fosfogênese Proterozoica do Cráton do São Francisco: Conexões com Eventos Globais Paleoproterozoicos e Neoproterozoicos e Implicações Exploratórias',
			authors: 'Ribeiro, T.S. · Franca-Rocha, W.S. · Oliveira, L.R. · Santana, A.V.A. · Misi, A.',
			body: 'Revisão das condições paleoambientais das mineralizações de fosfato no Cráton do São Francisco, conectando eventos glaciais e biogeoquímicos do Proterozóico a janelas específicas de formação de depósitos fosforíticos na Bahia. A recorrência dessas condições paleoambientais no Cráton do São Francisco sugere que a fosfogênese está condicionada a janelas específicas de transições climáticas globais e mudanças no estado redox dos oceanos ao longo do tempo geológico e da paleoproductividade oceânica.',
			tags: ['Fosfogênese', 'Proterozoico', 'Bahia', 'Cráton São Francisco']
		},
		pub2: {
			type: 'pub',
			src: 'XII SimeXmin · 2025', ref: 'AT1-01-190',
			title: 'Caracterização Petrográfica e Litogeoquímica de Granitoides Associados à Mineralização de Apatita em Ambiente Skarn no Complexo Tanque Novo – Ipirá, Bahia, Brasil',
			authors: 'Silva, L.C. · Ribeiro, T.S. · Franca-Rocha, W.S. · Brito, L.P.',
			body: 'Análise petrográfica e litogeoquímica de 10 amostras do Complexo Tanque Novo–Ipirá, identificando assinaturas composicionais distintas entre o núcleo e a borda das zonas de reação relacionadas à mineralização de apatita em skarn. As rochas do núcleo apresentam composição dominada por quartzo (~50%) e ortoclásio (~30%), enquanto as amostras da borda exibem maior participação de piroxênio. A integração dos dados geoquímicos permite identificar diferenças mineralógicas e composicionais entre granitoides em posições distintas, indicando processos de evolução magmática e interação hidrotermal relacionados à mineralização fosforítica.',
			tags: ['Petrografia', 'Litogeoquímica', 'Skarn', 'Apatita', 'Ipirá']
		},
		pub3: {
			type: 'pub',
			src: 'XII SimeXmin · 2025', ref: 'AT1-01-191',
			title: 'Predição de Fosforita com Estratigrafia de Sequências, Assinaturas Geofísica e Geoquímica: Exemplo na Formação Salitre, Sub-Bacia de Irecê, Neoproterozoico, BA',
			authors: 'Santana, A.V.A. · Lima, M.S. · Queiroz, G.S. · Freitas Jr., D.J. · Sousa, A.L. · Ribeiro, T.S. · Franca-Rocha, W.S.',
			body: 'Uso de pFRX e gamaespectrometria portátil para identificação de sequências deposicionais e parâmetros preditivos de fosfato sedimentar na Sub-Bacia de Irecê, com integração de perfis colunares de alta resolução na Formação Salitre. Foram identificadas 8 sequências deposicionais com espessura métrica. Os dados de P₂O₅ mais expressivos foram obtidos na Sequência 8, associados à fácies Estromatólito dolomitizado. As concentrações de P₂O₅ e MgO indicam tendências correlativas com os dados geoquímicos, sugerindo que fosforitização ocorreu em zonas de rampa interna.',
			tags: ['Estratigrafia', 'Fosforita', 'Irecê', 'Formação Salitre', 'Neoproterozoico']
		},
		news1: {
			type: 'news',
			src: 'G1 · Globo', ref: '07 Mai 2026',
			title: 'Lula e Trump discutem potencial brasileiro em terras raras e minerais críticos na Casa Branca',
			body: 'Lula afirmou que discutiu com Trump o potencial brasileiro na exploração de terras raras e minerais críticos, considerados estratégicos para a economia global. Segundo Lula, o Brasil pretende ampliar o conhecimento sobre o próprio território e avançar na exploração desses recursos de forma planejada. O presidente disse que o país não quer repetir o modelo histórico de exportação de matéria-prima sem agregação de valor. De acordo com ele, a proposta é desenvolver a cadeia produtiva no Brasil, incluindo etapas de processamento e industrialização — criando empregos e renda no país em vez de exportar minério bruto.',
			tags: ['Terras-raras', 'Política mineral', 'Brasil', 'Trump · Lula']
		},
		news2: {
			type: 'news',
			src: 'Prospecta 4.0', ref: 'Contexto',
			title: 'A pesquisa que antecipa o que o mundo vai precisar',
			body: 'Enquanto governos negociam acesso a minerais críticos e estratégicos, o Prospecta 4.0 já mapeia e modela o potencial mineral da Bahia com ferramentas de inteligência artificial e geotecnologias. O projeto identifica áreas com ocorrência de terras-raras, fosfato, urânio, cromo e magnesita — exatamente os minerais no centro das disputas geopolíticas atuais. Ciência pública brasileira construindo vantagem estratégica antes que a demanda chegue.',
			tags: ['Prospecta 4.0', 'Minerais críticos', 'Bahia', 'IA & Geotecnologias']
		}
	};

	var overlay = document.getElementById('modalOverlay');
	var inner   = document.getElementById('modalInner');
	var closeBtn = document.getElementById('modalClose');

	function openModal(id) {
		var d = modalData[id];
		if (!d) return;
		var isNews = d.type === 'news';
		var tagsHtml = d.tags.map(function(t) {
			return '<span class="modal-tag">' + t + '</span>';
		}).join('');
		var authorsHtml = d.authors
			? '<div class="modal-authors">' + d.authors + '</div>'
			: '';
		inner.innerHTML =
			'<div class="modal-head">' +
				'<span class="modal-src' + (isNews ? ' news' : '') + '">' + d.src + '</span>' +
				'<span class="modal-ref">' + d.ref + '</span>' +
			'</div>' +
			'<h2 class="modal-title">' + d.title + '</h2>' +
			authorsHtml +
			'<p class="modal-body">' + d.body + '</p>' +
			'<div class="modal-tags">' + tagsHtml + '</div>';
		overlay.classList.add('open');
		document.body.style.overflow = 'hidden';
	}

	function closeModal() {
		overlay.classList.remove('open');
		document.body.style.overflow = '';
	}

	document.querySelectorAll('.blog-card').forEach(function(card) {
		card.addEventListener('click', function() { openModal(card.dataset.id); });
	});

	if (closeBtn) closeBtn.addEventListener('click', closeModal);
	if (overlay) overlay.addEventListener('click', function(e) {
		if (e.target === overlay) closeModal();
	});
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape') closeModal();
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

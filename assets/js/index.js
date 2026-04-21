var els = document.querySelectorAll('.reveal');
var obs = new IntersectionObserver(function(e) {
	e.forEach(function(x) {
		if (x.isIntersecting) { x.target.classList.add('in'); obs.unobserve(x.target); }
	});
}, { threshold: 0.08 });
els.forEach(function(el) { obs.observe(el); });

// counter
setTimeout(function() {
	var el = document.getElementById('cnt');
	if (!el) return;
	var n = 0;
	var iv = setInterval(function() {
		n++; el.textContent = n;
		if (n >= 47) clearInterval(iv);
	}, 20);
}, 300);

// active nav link
var sections = document.querySelectorAll('section[id], div[id]');
var navLinks = document.querySelectorAll('nav ul a');
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

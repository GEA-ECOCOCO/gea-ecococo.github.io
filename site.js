// Transición entre páginas: barrido verde al salir
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  var href = a.getAttribute('href');
  if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(href)) return;
  e.preventDefault();
  document.body.classList.add('saliendo');
  setTimeout(function () { window.location.href = href; }, 400);
});
// Al volver con el botón atrás, quitar el barrido
window.addEventListener('pageshow', function () { document.body.classList.remove('saliendo'); });

// Animaciones de inicio
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // Aparición escalonada de tarjetas al hacer scroll
  var items = document.querySelectorAll('.rev');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('vis'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
  }

  // Brillo que sigue al dedo o al cursor sobre las tarjetas
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  // Brasas y chispas que suben en la portada
  var cv = document.getElementById('brasas');
  if (!cv || reduce) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, ps = [], raf = 0;
  function size() {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function nueva(inicio) {
    var lima = Math.random() < 0.7;
    return {
      x: Math.random() * W, y: inicio ? Math.random() * H : H + 10,
      r: 0.8 + Math.random() * 2.2, v: 0.25 + Math.random() * 0.8,
      a: 0.25 + Math.random() * 0.6, f: Math.random() * 6.28, s: 0.4 + Math.random() * 0.9,
      c: lima ? '139,224,0' : '255,140,50'
    };
  }
  function init() {
    size(); ps = [];
    var n = W < 600 ? 26 : 48;
    for (var i = 0; i < n; i++) ps.push(nueva(true));
  }
  function paso() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.y -= p.v; p.f += 0.015; p.x += Math.sin(p.f) * p.s * 0.4;
      var fade = Math.min(1, p.y / (H * 0.8));
      if (p.y < -10) { ps[i] = nueva(false); continue; }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * Math.max(fade, 0)) + ')';
      ctx.shadowColor = 'rgba(' + p.c + ',.9)'; ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    raf = requestAnimationFrame(paso);
  }
  init(); paso();
  window.addEventListener('resize', init);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf); else { cancelAnimationFrame(raf); paso(); }
  });
})();

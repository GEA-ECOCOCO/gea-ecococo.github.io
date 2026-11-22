var GEA_EN=document.documentElement.lang==='en',GEA_LOC=GEA_EN?'en-US':GEA_LOC;function gL(a,b){return GEA_EN?b:a}

/* Iconos propios (línea 24x24, mismo trazo que los botones del menú) */
var GEA_ICO={x:'<path d="M6 6l12 12M18 6L6 18"/>',ar:'<path d="M5 12h14M13 6l6 6-6 6"/>',al:'<path d="M19 12H5M11 6l-6 6 6 6"/>',out:'<path d="M7 17L17 7M9 7h8v8"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',app:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M11 18.5h2"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',clip:'<path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/>',home:'<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',store:'<path d="M4 9l1.5-5h13L20 9M4 9a3 3 0 0 0 5.3 1.8 3 3 0 0 0 5.4 0A3 3 0 0 0 20 9M5 12.5V20h14v-7.5M10 20v-4h4v4"/>',fire:'<path d="M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.2 2 1 2.5 1.5 2.5C10.5 8 11 5 12 3z"/>',truck:'<path d="M2 6.5h11V16H2zM13 9.5h4l4 3.5v3h-8"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>'};
function gI(n,z){z=z||20;return '<svg class="ico" viewBox="0 0 24 24" width="'+z+'" height="'+z+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+GEA_ICO[n]+'</svg>'}
// Transición entre páginas: barrido verde al salir
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download') || /\.pdf(\?|#|$)/i.test(a.getAttribute('href') || '')) return;
  var href = a.getAttribute('href');
  if (!href || href.charAt(0) === '#' || /^[a-z][a-z0-9+.-]*:/i.test(href)) return;
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

// Lema que se escribe solo en la portada
(function () {
  var l = document.getElementById('lema');
  if (!l) return;
  var texto = l.getAttribute('data-t') || '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visto = false;
  try { visto = sessionStorage.getItem('intro-ecococo') === '1'; sessionStorage.setItem('intro-ecococo', '1'); } catch (e) {}
  if (visto) document.documentElement.classList.add('rapido');
  if (reduce || visto) { l.textContent = texto; return; }
  /* La frase completa se reserva invisible y la escritura va encima: la caja no cambia de tamaño ni empuja el contenido */
  l.classList.add('typing');
  var g = document.createElement('span'); g.className = 'lm-g'; g.textContent = texto;
  var v = document.createElement('span'); v.className = 'lm-t';
  l.textContent = ''; l.appendChild(g); l.appendChild(v);
  v.innerHTML = '<span class="caret"></span>';
  var i = 0;
  setTimeout(function escribir() {
    if (i <= texto.length) {
      v.innerHTML = '';
      v.appendChild(document.createTextNode(texto.slice(0, i)));
      var c = document.createElement('span'); c.className = 'caret'; v.appendChild(c);
      i++; setTimeout(escribir, 42);
    } else {
      setTimeout(function () {
        v.classList.add('fin');
        setTimeout(function () { l.classList.remove('typing'); l.textContent = texto; }, 700);
      }, 900);
    }
  }, 2100 + (document.documentElement.classList.contains('splash-on') ? 1800 : 0));
})();

// Calculadora de pedido
(function () {
  var kg = document.getElementById('kg');
  if (!kg) return;
  var tot = document.getElementById('tot'), nota = document.getElementById('nota'), wa = document.getElementById('calc-wa');
  var P=window.GEA_PRODUCTS||{k1:{p:20},k25:{p:350}}, PRECIO = P.k1.p, GRANDE = 50, actual = 0, anim = 0;
  function pintar(n) { tot.textContent = 'Q' + Math.round(n).toLocaleString(GEA_LOC); }
  function actualizar() {
    var v = Math.max(1, Math.min(999, parseInt(kg.value, 10) || 1));
    var meta = v * PRECIO;
    cancelAnimationFrame(anim);
    var ini = actual, t0 = null;
    (function paso(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / 300);
      actual = ini + (meta - ini) * k; pintar(actual);
      if (k < 1) anim = requestAnimationFrame(paso);
    })(performance.now());
    nota.textContent = v >= GRANDE
      ? gL('Para pedidos grandes te cotizamos precio por volumen por WhatsApp.','For large orders we quote a volume price on WhatsApp.')
      : gL('Precio al consumidor final: Q'+PRECIO+' por kg. Venta de contado.','End-consumer price: Q'+PRECIO+' per kg. Cash sale.');
    var Qf = function (n) { return 'Q' + n.toLocaleString(GEA_LOC); };
    var msg = gL('Hola, quiero hacer este pedido de ECOCOCO:\n• Briquetas ECOCOCO: ' + v + ' kg × ' + Qf(PRECIO) + ' por kg = ' + Qf(meta) + '\nTotal del pedido: ' + Qf(meta) + '\nEntrega y forma de pago: por coordinar.\nUbicación / departamento: ',
      'Hi, I\'d like to place this ECOCOCO order:\n• ECOCOCO briquettes: ' + v + ' kg × ' + Qf(PRECIO) + ' per kg = ' + Qf(meta) + '\nOrder total: ' + Qf(meta) + '\nDelivery and payment: to be arranged.\nLocation / department: ');
    wa.href = 'https://wa.me/50242794894?text=' + encodeURIComponent(msg);
    document.querySelectorAll('.chips button').forEach(function (b) {
      b.classList.toggle('on', parseInt(b.getAttribute('data-k'), 10) === v);
    });
  }
  kg.addEventListener('input', actualizar);
  kg.addEventListener('change', function () { var n = Math.floor(Number(kg.value)); kg.value = (isFinite(n) && n > 0) ? Math.min(999, n) : 1; actualizar(); });
  document.getElementById('menos').addEventListener('click', function () { kg.value = Math.max(1, (parseInt(kg.value, 10) || 1) - 1); actualizar(); });
  document.getElementById('mas').addEventListener('click', function () { kg.value = Math.min(999, (parseInt(kg.value, 10) || 0) + 1); actualizar(); });
  document.querySelectorAll('.chips button').forEach(function (b) {
    b.addEventListener('click', function () { kg.value = b.getAttribute('data-k'); actualizar(); });
  });
  actual = 5 * PRECIO; actualizar();
})();

// Menú de compartir
(function () {
  var sheet = document.getElementById('compartir');
  if (!sheet) return;
  var TEXTO = gL('ECOCOCO: briquetas de carbón de cáscara de coco hechas en Retalhuleu, Guatemala.','ECOCOCO: coconut shell charcoal briquettes made in Retalhuleu, Guatemala.');
  var IMG = 'https://gea-ecococo.github.io/img/og.jpg';
  var modoApp = false;
  function enApp() { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (x) { return false; } }
  function appUrl() { return location.origin + (gL('', '/en') + '/') + '?utm_source=compartir_app&utm_medium=referral'; }
  var TEXTO_APP = gL('Instala la app de ECOCOCO en tu celular: briquetas de carbón de cáscara de coco hechas en Retalhuleu. Es gratis y se instala desde el enlace.','Install the ECOCOCO app on your phone: coconut shell charcoal briquettes made in Retalhuleu. It is free and installs from the link.');
  function url() { return modoApp ? appUrl() : location.href.split('#')[0]; }
  function texto() { return modoApp ? TEXTO_APP : TEXTO; }
  function e(x) { return encodeURIComponent(x); }
  function redes() {
    var u = url(), t = texto(), ut = t + ' ' + u;
    var movil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var l = [
      ['WhatsApp', 'W', '#25D366', 'https://wa.me/?text=' + e(ut)],
      ['Facebook', 'f', '#1877F2', 'https://www.facebook.com/sharer/sharer.php?u=' + e(u)],
      ['X', 'X', '#000', 'https://twitter.com/intent/tweet?url=' + e(u) + '&text=' + e(t)],
      ['Telegram', 'T', '#26A5E4', 'https://t.me/share/url?url=' + e(u) + '&text=' + e(t)],
      ['LinkedIn', 'in', '#0A66C2', 'https://www.linkedin.com/sharing/share-offsite/?url=' + e(u)],
      ['Pinterest', 'P', '#E60023', 'https://pinterest.com/pin/create/button/?url=' + e(u) + '&media=' + e(IMG) + '&description=' + e(t)],
      ['Reddit', 'R', '#FF4500', 'https://www.reddit.com/submit?url=' + e(u) + '&title=' + e(t)],
      ['Threads', '@', '#111', 'https://www.threads.net/intent/post?text=' + e(ut)],
      ['Bluesky', 'B', '#1185FE', 'https://bsky.app/intent/compose?text=' + e(ut)],
      [gL('Correo','Email'), gI('mail',20), '#5A6A7A', 'mailto:?subject=' + e(modoApp ? gL('Instala la app ECOCOCO','Install the ECOCOCO app') : gL('ECOCOCO | Briquetas de carbón de cáscara de coco','ECOCOCO | Coconut shell charcoal briquettes')) + '&body=' + e(ut)]
    ];
    if (movil) {
      l.splice(2, 0, ['Messenger', 'm', '#0084FF', 'fb-messenger://share?link=' + e(u)]);
      l.push(['SMS', 'SMS', '#34A853', 'sms:?&body=' + e(ut)]);
    }
    return l;
  }
  function aviso(msg) {
    var d = document.createElement('div'); d.className = 'toast'; d.textContent = msg;
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2000);
  }
  function copiar() {
    var u = url();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(u).then(function () { aviso(gL('¡Enlace copiado!','Link copied!')); }, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = u; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); aviso(gL('¡Enlace copiado!','Link copied!')); } catch (x) { aviso(gL('Copia el enlace de la barra','Copy the link from the address bar')); }
      ta.remove();
    }
  }
  function abrir(app) {
    modoApp = app === true;
    var h = '<div class="panel"><button type="button" class="cerrar" aria-label="'+gL('Cerrar','Close')+'">'+gI('x',18)+'</button>' +
      '<h3>'+(modoApp ? gL('Compartir la app ECOCOCO','Share the ECOCOCO app') : gL('Compartir ECOCOCO','Share ECOCOCO'))+'</h3><p class="sub">'+(modoApp ? gL('Comparte el enlace de la app para que otras personas la instalen en su celular.','Share the app link so other people can install it on their phone.') : gL('Elige dónde quieres compartir esta página.','Choose where you want to share this page.'))+'</p><div class="redes">';
    if (navigator.share) h += '<button type="button" data-nativo><i style="background:linear-gradient(135deg,#8BE000,#1FA23A);color:#04100A">'+gI('out',20)+'</i>'+gL('Más opciones','More options')+'</button>';
    redes().forEach(function (r) {
      h += '<a href="' + r[3] + '" target="_blank" rel="noopener"><i style="background:' + r[2] + '">' + r[1] + '</i>' + r[0] + '</a>';
    });
    h += '<button type="button" data-copiar><i style="background:#2f4a3a">'+gI('link',20)+'</i>'+gL('Copiar enlace','Copy link')+'</button>' +
      (modoApp && enApp() ? '<button type="button" data-pag-modo><i style="background:#2f4a3a">'+gI('doc',20)+'</i>'+gL('Compartir esta página','Share this page')+'</button>' : '') +
      (modoApp ? '' : '<button type="button" data-app-modo><i style="background:#B6F23C;color:#04100A">'+gI('app',20)+'</i>'+gL('Compartir la app','Share the app')+'</button>') + '</div>' +
      (modoApp ? '<p class="nota">'+gL('Quien abra el enlace puede instalarla: en Android con el aviso del navegador y en iPhone con Compartir → Añadir a pantalla de inicio.','Anyone who opens the link can install it: on Android with the browser prompt and on iPhone with Share → Add to Home Screen.')+'</p>' : '') +
      '<p class="nota">'+gL('Para Instagram y TikTok no existe un botón directo: usa «Más opciones» en tu teléfono o copia el enlace y pégalo en tu publicación o historia.','There is no direct button for Instagram and TikTok: use “More options” on your phone or copy the link and paste it into your post or story.')+'</p></div>';
    sheet.innerHTML = h; sheet.hidden = false; document.body.style.overflow = 'hidden';
    sheet.querySelector('.cerrar').focus();
  }
  function cerrar() { sheet.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', function (ev) {
    var cb = ev.target.closest('[data-compartir]');
    if (cb) { var vv = cb.getAttribute('data-compartir'); var ap = vv === 'app' || (vv === '' && enApp()); if (ap) { try { if (window.geaTrack) geaTrack('compartir_app'); } catch (x) {} } abrir(ap); return; }
    if (!sheet.hidden && ev.target.closest('[data-app-modo]')) { abrir(true); return; }
    if (!sheet.hidden && ev.target.closest('[data-pag-modo]')) { abrir(false); return; }
    if (sheet.hidden) return;
    if (ev.target === sheet || ev.target.closest('.cerrar')) { cerrar(); return; }
    if (ev.target.closest('[data-copiar]')) { copiar(); return; }
    if (ev.target.closest('[data-nativo]')) {
      navigator.share({ title: modoApp ? gL('App ECOCOCO','ECOCOCO app') : 'ECOCOCO', text: texto(), url: url() }).catch(function () {}); return;
    }
    if (ev.target.closest('.redes a')) setTimeout(cerrar, 150);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !sheet.hidden) cerrar(); });
  window.GEA_SHARE_APP = function () { try { if (window.geaTrack) geaTrack('compartir_app'); } catch (x) {} abrir(true); };
})();

// Pedido mayorista por bultos de 25 kg
(function () {
  var inp = document.getElementById('bultos');
  if (!inp) return;
  var KG = 25, kgEl = document.getElementById('b-kg'), nota = document.getElementById('b-nota'), wa = document.getElementById('b-wa');
  function act() {
    var n = Math.max(1, Math.min(200, parseInt(inp.value, 10) || 1));
    var kg = n * KG;
    kgEl.textContent = kg.toLocaleString(GEA_LOC) + ' kg';
    var q = document.getElementById('b-q'); if (q) q.textContent = 'Q' + (n * ((window.GEA_PRODUCTS||{k25:{p:350}}).k25.p)).toLocaleString(GEA_LOC);
    nota.textContent = n === 1
      ? gL('Un bulto sirve para entrega en Retalhuleu y la Costa Sur. Para otros departamentos el mínimo son 2 bultos (50 kg).','One sack works for delivery in Retalhuleu and the South Coast. For other departments the minimum is 2 sacks (50 kg).')
      : gL('El precio de lista es referencial: con este volumen te cotizamos precio especial y confirmamos la fecha de entrega.','The list price is a reference: for this volume we quote a special price and confirm the delivery date.');
    var msg = GEA_EN ? 'Hi, I am a wholesaler and I would like ' + n + (n === 1 ? ' sack' : ' sacks') + ' of 25 kg of ECOCOCO (' + kg + ' kg). I would like to know the special volume price.\nBusiness: \nLocation: ' : 'Hola, soy mayorista y quiero ' + n + (n === 1 ? ' bulto' : ' bultos') + ' de 25 kg de ECOCOCO (' + kg + ' kg). Quiero conocer el precio especial por volumen.\nNegocio: \nUbicación: ';
    wa.href = 'https://wa.me/50242794894?text=' + encodeURIComponent(msg);
    document.querySelectorAll('.chips button[data-b]').forEach(function (b) {
      b.classList.toggle('on', parseInt(b.getAttribute('data-b'), 10) === n);
    });
  }
  inp.addEventListener('input', act);
  document.getElementById('b-menos').addEventListener('click', function () { inp.value = Math.max(1, (parseInt(inp.value, 10) || 1) - 1); act(); });
  document.getElementById('b-mas').addEventListener('click', function () { inp.value = Math.min(200, (parseInt(inp.value, 10) || 0) + 1); act(); });
  document.querySelectorAll('.chips button[data-b]').forEach(function (b) {
    b.addEventListener('click', function () { inp.value = b.getAttribute('data-b'); act(); });
  });
  act();
})();

// Panel de impacto: animación al entrar en pantalla
(function () {
  var p = document.getElementById('panel-impacto');
  if (!p) return;
  var cont = p.querySelectorAll('[data-count]');
  function contar() {
    cont.forEach(function (el) {
      var fin = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suf') || '', t0 = null;
      function paso(t) { if (!t0) t0 = t; var k = Math.min((t - t0) / 1600, 1); el.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(paso); }
      requestAnimationFrame(paso);
    });
  }
  function ir() { p.classList.add('go'); contar(); }
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    p.classList.add('go'); cont.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suf') || ''); }); return;
  }
  var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { ir(); io.disconnect(); } }, { threshold: .25 });
  io.observe(p);
})();

/* carruseles */
(function(){
  document.querySelectorAll('[data-carrusel]').forEach(function(c){
    var tr=c.querySelector('.track'),bar=c.querySelector('.prog i'),
        pv=c.querySelector('.prev'),nx=c.querySelector('.next');
    function paso(){var k=tr.children[0];return k?k.getBoundingClientRect().width+18:300}
    function upd(){
      var max=tr.scrollWidth-tr.clientWidth;
      var w=Math.max(12,Math.min(100,tr.clientWidth/tr.scrollWidth*100));
      bar.style.width=w+'%';
      bar.style.left=(max>0?tr.scrollLeft/max*(100-w):0)+'%';
    }
    pv.addEventListener('click',function(){tr.scrollBy({left:-paso(),behavior:'smooth'})});
    nx.addEventListener('click',function(){tr.scrollBy({left:paso(),behavior:'smooth'})});
    tr.addEventListener('scroll',upd,{passive:true});
    window.addEventListener('resize',upd);upd();
  });
  /* pie: en escritorio los acordeones quedan abiertos */
  function pie(){document.querySelectorAll('.pie-acc details').forEach(function(d){d.open=window.innerWidth>=900})}
  pie();window.addEventListener('resize',pie);
})();

/* Buscador y carrito */
(function(){
  var WA='50242794894';
  var PROD=window.GEA_PRODUCTS||{k1:{n:'ECOCOCO, bolsa de 1 kg',p:20},k25:{n:'ECOCOCO, bulto de 25 kg',p:350}};
  var IDX=[
   ['Misión y visión','Transformamos recursos. Desarrollamos industria.','quienes-somos.html#mision-vision','misión visión valores filosofía pilares'],
   ['Quiénes somos','Visión industrial y sostenible de GEA Carbón | ECOCOCO','quienes-somos.html','empresa visión misión gea retalhuleu'],
   ['Nuestro producto','Briquetas ECOCOCO: tiempo de encendido, beneficios, uso seguro','producto.html','briqueta carbón coco encendido 5 10 minutos calor seguridad monóxido'],
   ['Míralo encender','Video y fotos de las briquetas en la brasa','en-accion.html','video fotos brasa parrilla encender'],
   ['Proceso de producción','De la cáscara de coco a la briqueta','proceso.html','cáscara carbonización molienda mezcla secado'],
   ['Bitácora de la planta','Avance real: hornos, pruebas y primeros lotes','bitacora.html','planta horno pruebas lotes avance'],
   ['Ventas','Precios, pedido mínimo, pago, entrega y factura en un solo lugar','ventas.html','ventas comprar compra pedir pedido cotizar cotización precio mínimo pago entrega factura whatsapp cerrar'],
   ['Factura electrónica FEL','Solicita tu factura: llena tus datos con NIT, descarga la proforma y envíala','factura.html','factura fel nit proforma facturar facturacion comprobante cf consumidor final'],
   ['Guías y fichas PDF','Descarga ficha del producto, uso seguro, compra, exportación, preguntas frecuentes y catálogo','descargas.html','pdf guia guias ficha catalogo folleto descargar documento manual exportacion preguntas frecuentes uso seguro'],
   ['Precios','Precio por kg, bulto de 25 kg para mayoristas y calculadora','precios.html','precio costo cuánto bulto kg calculadora mayorista'],
   ['Distribuidores y mayoristas','Condiciones comerciales y pedidos por volumen','distribuidores.html','distribuidor mayorista tienda restaurante volumen negocio'],
   ['Distribuidores: precios y margen','Escala de precios mayorista, bulto de 25 kg y simulador de margen','distribuidores-precios.html','precio mayorista margen ganancia calculadora bulto volumen distribuidor'],
   ['Distribuidores: mercado y argumentos','Por qué ECOCOCO, comparación con leña y datos de demanda','distribuidores-mercado.html','mercado demanda leña argumentos vender distribuidor'],
   ['Distribuidores: condiciones y entrega','Pago, cobertura, disponibilidad y cómo pedir','distribuidores-condiciones.html','condiciones pago entrega cobertura disponibilidad pedir distribuidor'],
   ['Distribuidores: material para vender','Catálogo, fichas y guías en PDF','distribuidores-herramientas.html','material catálogo fichas guías pdf vender distribuidor'],
   ['Inscripción de distribuidores','Solicitud para ser distribuidor ECOCOCO','distribuidores-inscripcion.html','inscripción solicitud formulario distribuidor registrar'],
   ['Impacto ambiental','Aprovechamiento de la cáscara de coco, datos de fuentes públicas y metas','impacto-ambiental.html','ambiente cáscara coco residuo agroindustrial contaminación leña guatemala potencial'],
   ['Cómo comprar y preguntas frecuentes','Pasos para pedir, mínimos, pago y entregas','como-comprar.html','cómo comprar pedir preguntas frecuentes pago entrega factura'],
   ['Tecnología GEA','Ingeniería y producción mecanizada','tecnologia-gea.html','tecnología ingeniería horno molino mezcladora prensa'],
   ['Contacto','WhatsApp +502 4279-4894 y correo','contacto.html','whatsapp teléfono correo pedido'],
   ['Entregas y devoluciones','Cómo entregamos y cuándo aplican devoluciones','entregas-devoluciones.html','envío entrega devolución'],
   ['Términos y condiciones','Condiciones de uso y compra','terminos.html','términos legal'],
   ['Privacidad','Cómo tratamos tus datos','privacidad.html','datos privacidad']
  ];
  var IDX_EN=[
   ['Who we are','Industrial and sustainable vision of GEA Carbón | ECOCOCO','quienes-somos.html','company vision mission gea retalhuleu'],
   ['Mission and vision','We transform resources. We develop industry.','quienes-somos.html#mision-vision','mission vision values philosophy pillars'],
   ['Our product','ECOCOCO briquettes: ignition time, benefits, safe use','producto.html','briquette charcoal coconut ignition 5 10 minutes heat safety monoxide'],
   ['See it light up','Video and photos of the briquettes on the embers','en-accion.html','video photos embers grill light'],
   ['Production process','From coconut shell to briquette','proceso.html','shell carbonization grinding mixing drying'],
   ['Plant updates','Real progress: kilns, tests and first batches','bitacora.html','plant kiln tests batches progress'],
   ['Sales','Prices, minimum order, payment, delivery and invoice in one place','ventas.html','sales buy buying order quote price minimum payment delivery invoice whatsapp close'],
   ['FEL electronic invoice','Request your invoice: fill in your NIT details, download the proforma and send it','factura.html','invoice fel nit proforma billing tax receipt cf end consumer'],
   ['PDF guides and sheets','Download product sheet, safe use, buying, export, FAQ and catalog','descargas.html','pdf guide guides sheet catalog brochure download document manual export faq safe use'],
   ['Prices','Price per kg, 25 kg sack for wholesalers and calculator','precios.html','price cost how much sack kg calculator wholesale'],
   ['How to buy and FAQ','Steps to order, minimums, payment and delivery','como-comprar.html','how buy order faq questions payment delivery invoice'],
   ['Distributors and wholesalers','Commercial terms and volume orders','distribuidores.html','distributor wholesale shop restaurant volume business'],
   ['Distributors: prices and margin','Wholesale price scale, 25 kg sack and margin simulator','distribuidores-precios.html','wholesale price margin profit calculator sack volume distributor'],
   ['Distributors: market and selling points','Why ECOCOCO, comparison with firewood and demand data','distribuidores-mercado.html','market demand firewood selling points distributor'],
   ['Distributors: terms and delivery','Payment, coverage, availability and how to order','distribuidores-condiciones.html','terms payment delivery coverage availability order distributor'],
   ['Distributors: sales material','Catalog, data sheets and PDF guides','distribuidores-herramientas.html','material catalog data sheets guides pdf sell distributor'],
   ['Distributor sign-up','Application to become an ECOCOCO distributor','distribuidores-inscripcion.html','sign up application form distributor register'],
   ['Environmental impact','Making use of coconut shell, public-source data and goals','impacto-ambiental.html','environment coconut shell agro-industrial waste pollution firewood guatemala potential'],
   ['GEA Technology','Engineering and mechanized production','tecnologia-gea.html','technology engineering kiln mill mixer press'],
   ['Contact','WhatsApp +502 4279-4894 and email','contacto.html','whatsapp phone email order'],
   ['Delivery and returns','How we deliver and when returns apply','entregas-devoluciones.html','shipping delivery returns'],
   ['Terms and conditions','Terms of use and purchase','terminos.html','terms legal'],
   ['Privacy','How we handle your data','privacidad.html','data privacy']
  ];
  if(GEA_EN)IDX=IDX_EN;
  function pn(k){return GEA_EN&&PROD[k].e?PROD[k].e:PROD[k].n}
  function norm(t){return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
  var q=function(s,r){return (r||document).querySelector(s)};
  var body=document.body;
  /* ---- almacenamiento ---- */
  var cart={};
  try{cart=JSON.parse(localStorage.getItem('carrito-ecococo')||'{}')||{}}catch(e){cart={}}
  (function(){var c={};Object.keys(cart||{}).forEach(function(k){var n=Math.floor(Number(cart[k]));if(window.GEA_PRODUCTS&&GEA_PRODUCTS[k]&&isFinite(n)&&n>0)c[k]=Math.min(n,999)});cart=c})();
  Object.keys(cart).forEach(function(k){if(!PROD[k]||!(cart[k]>0))delete cart[k]});
  function save(){try{localStorage.setItem('carrito-ecococo',JSON.stringify(cart))}catch(e){}}
  function Q(n){return 'Q'+n.toLocaleString(GEA_LOC)}
  function fxR(){var f=window.geaFX?window.geaFX():null;return f&&f.r?f.r:(Number((window.GEA_CONFIG||{}).usdRate)||7.65)}
  function Us(n){return 'US$'+(n/fxR()).toLocaleString(GEA_EN?'en-US':'es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function QU(n){return Q(n)+'<span class="usd" data-q="'+n+'">(≈ '+Us(n)+')</span>'}
  function fxNote(){var f=window.geaFX?window.geaFX():{r:fxR(),d:''};return gL('Tipo de cambio de referencia: Q'+f.r.toFixed(2)+' por US$1'+(f.d?' ('+f.d+')':'')+'. El monto en dólares es aproximado; el cobro es en quetzales.','Reference exchange rate: Q'+f.r.toFixed(2)+' per US$1'+(f.d?' ('+f.d+')':'')+'. USD amounts are approximate; payment is in quetzales.')}
  /* ---- DOM ---- */
  var wrap=document.createElement('div');
  wrap.innerHTML=
   '<div id="buscar" class="ovl" role="dialog" aria-modal="true" aria-label="'+gL('Buscar','Search')+'" hidden><div class="ovl-in"><div class="ovl-top"><h2>'+gL('¿Qué estás buscando?','What are you looking for?')+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar','Close')+'">'+gI('x',18)+'</button></div><form data-buscar-form2 role="search" class="bx"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="'+gL('Busca precios, proceso, distribuidores…','Search prices, process, distributors…')+'" aria-label="'+gL('Buscar','Search')+'"><button type="submit" class="go" aria-label="'+gL('Buscar','Search')+'">'+gI('ar',20)+'</button></form><ul class="res"></ul></div></div>'+
   '<div id="cart-bg" class="cart-bg" hidden></div>'+
   '<aside id="carrito" class="cart" role="dialog" aria-modal="true" aria-label="'+gL('Tu carrito','Your cart')+'" aria-hidden="true"><div class="cart-h"><h2>'+gL('Tu carrito','Your cart')+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar carrito','Close cart')+'">'+gI('x',18)+'</button></div><div class="cart-b"></div><div class="cart-f"></div></aside>';
  while(wrap.firstChild)body.appendChild(wrap.firstChild);
  var sb=q('#buscar'),sin=q('input',sb),sres=q('.res',sb),cd=q('#carrito'),cbg=q('#cart-bg'),cb=q('.cart-b',cd),cf=q('.cart-f',cd);
  /* ---- buscador ---- */
  function render(t){
    var n=norm(t).split(/\s+/).filter(Boolean),out=[];
    if(n.length){IDX.forEach(function(it){
      var h=norm(it[0]+' '+it[1]+' '+it[3]),ok=n.every(function(w){return h.indexOf(w)>-1});
      if(ok)out.push(it)})}
    var pr=n.length&&n.some(function(w){return /precio|carrito|comprar|bolsa|bulto|kg|ecococo|carbon|briqueta|price|cart|buy|bag|sack|charcoal|briquette/.test(w)});
    var h='';
    if(pr){h+='<li class="prodres"><div><b>'+pn('k1')+'</b><span>'+Q(PROD.k1.p)+'</span></div><button type="button" class="btn pill add" data-add="k1">'+gL('Agregar','Add')+'</button></li><li class="prodres"><div><b>'+pn('k25')+'</b><span>'+Q(PROD.k25.p)+'</span></div><button type="button" class="btn pill add" data-add="k25">'+gL('Agregar','Add')+'</button></li>'}
    out.forEach(function(it){h+='<li><a href="'+it[2]+'"><b>'+it[0]+'</b><span>'+it[1]+'</span></a></li>'});
    if(!h)h=n.length?'<li class="vacio">'+gL('No encontramos resultados. Escríbenos por <a href="https://wa.me/'+WA+'">WhatsApp</a> y te ayudamos.','No results found. Message us on <a href="https://wa.me/'+WA+'">WhatsApp</a> and we will help you.')+'</li>':'<li class="vacio">'+gL('Prueba con: precios, proceso, distribuidores, impacto…','Try: prices, process, distributors, impact…')+'</li>';
    sres.innerHTML=h}
  function abrirB(v){closeC();sb.hidden=false;body.classList.add('noscroll');sin.value=v||'';render(v||'');setTimeout(function(){sin.focus()},30)}
  function cerrarB(){sb.hidden=true;if(cd.getAttribute('aria-hidden')!=='false')body.classList.remove('noscroll')}
  sin.addEventListener('input',function(){render(sin.value)});
  q('form',sb).addEventListener('submit',function(e){e.preventDefault();var f=sres.querySelector('a');if(f)location.href=f.href});
  /* ---- carrito ---- */
  function count(){return Object.keys(cart).reduce(function(a,k){return a+cart[k]},0)}
  function total(){return Object.keys(cart).reduce(function(a,k){return a+cart[k]*PROD[k].p},0)}
  var cD={},DEPS=['Alta Verapaz','Baja Verapaz','Chimaltenango','Chiquimula','El Progreso','Escuintla','Guatemala','Huehuetenango','Izabal','Jalapa','Jutiapa','Petén','Quetzaltenango','Quiché','Retalhuleu','Sacatepéquez','San Marcos','Santa Rosa','Sololá','Suchitepéquez','Totonicapán','Zacapa'];
  function cfield(k,lab,type,ac,max,ph){return '<div class="cf"><label for="c-'+k+'">'+lab+'</label><input id="c-'+k+'" data-c="'+k+'" type="'+type+'"'+(type==='tel'?' inputmode="tel"':'')+' maxlength="'+max+'" autocomplete="'+ac+'"'+(ph?' placeholder="'+ph+'"':'')+'><span class="ce"></span></div>'}
  function paint(){
    var n=count();
    document.querySelectorAll('.cart-n').forEach(function(b){b.textContent=n;b.hidden=!n});
    var ks=Object.keys(cart);
    if(!ks.length){cb.innerHTML='<p class="vacio">'+gL('Tu carrito está vacío. Agrega tu carbón ECOCOCO para armar tu pedido.','Your cart is empty. Add your ECOCOCO charcoal to build your order.')+'</p><p><button type="button" class="btn pill add" data-add="k1">'+gL('Agregar bolsa 1 kg','Add 1 kg bag')+' · Q'+PROD.k1.p+'</button></p><p><button type="button" class="btn pill add" data-add="k25">'+gL('Agregar bulto 25 kg','Add 25 kg sack')+' · Q'+PROD.k25.p+'</button></p>';cf.innerHTML='';return}
    cb.innerHTML=ks.map(function(k){var p=PROD[k];return '<div class="li"><div class="li-t"><b>'+pn(k)+'</b><span>'+QU(p.p)+' '+gL('c/u','each')+'</span></div><div class="li-q"><button type="button" data-q="-1" data-k="'+k+'" aria-label="'+gL('Quitar uno','Remove one')+'">−</button><span>'+cart[k]+'</span><button type="button" data-q="1" data-k="'+k+'" aria-label="'+gL('Agregar uno','Add one')+'">+</button></div><div class="li-s">'+QU(cart[k]*p.p)+'</div><button type="button" class="li-x" data-del="'+k+'" aria-label="'+gL('Eliminar','Remove')+'">'+gI('x',18)+'</button></div>'}).join('');
    var ordNo='';
    function msgWA(){
      var L=[gL('Hola, quiero hacer este pedido de ECOCOCO:','Hi, I\'d like to place this ECOCOCO order:')];
      L.push('');L.push(gL('DATOS DE ENTREGA','DELIVERY DETAILS'));
      if(cD.nom)L.push(gL('Nombre: ','Name: ')+cD.nom);
      if(cD.tel)L.push(gL('Teléfono: ','Phone: ')+cD.tel);
      if(cD.dep)L.push(gL('Departamento: ','Department: ')+cD.dep);
      if(cD.mun)L.push(gL('Municipio: ','Town: ')+cD.mun);
      if(cD.zon)L.push(gL('Colonia / lotificación / sección / zona: ','Neighborhood / subdivision / section / zone: ')+cD.zon);
      if(cD.dir)L.push(gL('Calle o avenida y N.º de casa o lote: ','Street or avenue and house or lot no.: ')+cD.dir);
      if(cD.ref)L.push(gL('Referencia: ','Landmark: ')+cD.ref);
      if(cD.nit)L.push('NIT: '+cD.nit);
      if(cD.nota)L.push(gL('Notas: ','Notes: ')+cD.nota);
      L.push('');L.push(gL('PEDIDO','ORDER')+(ordNo?' '+ordNo:''));
      ks.forEach(function(k){var p=PROD[k];L.push('• '+pn(k)+': '+cart[k]+' × '+Q(p.p)+' = '+Q(cart[k]*p.p)+' (≈ '+Us(cart[k]*p.p)+')')});
      L.push('');L.push(gL('Total del pedido: ','Order total: ')+Q(total())+' (≈ '+Us(total())+')');
      L.push(gL('Tipo de cambio: Q','Exchange rate: Q')+fxR().toFixed(2)+gL(' por US$1 (aproximado; el pago es en quetzales).',' per US$1 (approximate; payment is in quetzales).'));
      L.push(gL('Entrega y forma de pago: por coordinar.','Delivery and payment: to be arranged.'));
      return 'https://wa.me/'+WA+'?text='+encodeURIComponent(L.join('\n'));
    }
    var bulto=cart.k25>0;
    cf.innerHTML='<div class="tot"><span>'+gL('Total estimado','Estimated total')+'</span><b>'+QU(total())+'</b></div><p class="nota fxn">'+fxNote()+'</p><p class="nota">'+gL('Precio a consumidor final. ','End-consumer price. ')+(bulto?gL('En bultos de 25 kg hay precio especial según volumen, lo confirmamos por WhatsApp. ','For 25 kg sacks there is a special volume price, which we confirm on WhatsApp. '):'')+gL('Entrega y forma de pago se acuerdan por WhatsApp. Aún no cobramos en línea.','Delivery and payment are arranged on WhatsApp. We do not charge online yet.')+'</p><p class="nota exp-l">'+gL('¿Envío fuera de Guatemala? ','Shipping outside Guatemala? ')+'<button type="button" class="lnk" data-exp>'+gL('Solicita una cotización de exportación','Request an export quote')+'</button></p><div class="cdat"><p class="cdat-h">'+gL('Datos para la entrega','Delivery details')+'</p>'+
      cfield('nom',gL('Nombre completo *','Full name *'),'text','name',80)+cfield('tel',gL('Teléfono (WhatsApp) *','Phone (WhatsApp) *'),'tel','tel',20)+
      '<div class="cf"><label for="c-dep">'+gL('Departamento *','Department *')+'</label><select id="c-dep" data-c="dep"><option value="">'+gL('Selecciona','Select')+'</option>'+DEPS.map(function(x){return '<option>'+x+'</option>'}).join('')+'</select><span class="ce"></span></div>'+
      cfield('mun',gL('Municipio *','Town *'),'text','address-level2',60)+cfield('zon',gL('Colonia, lotificación, sección o zona *','Neighborhood, subdivision, section or zone *'),'text','off',80)+
      cfield('dir',gL('Calle o avenida y número de casa o lote *','Street or avenue and house or lot number *'),'text','street-address',100)+cfield('ref',gL('Referencia para llegar *','Landmark to find you *'),'text','off',120,gL('Ej. frente a la iglesia, portón negro','E.g. in front of the church, black gate'))+cfield('nit',gL('NIT para factura (opcional; si no tienes, CF)','Tax ID (NIT) for invoice (optional; use CF if none)'),'text','off',20)+cfield('nota',gL('Notas o especificaciones (opcional)','Notes or specifications (optional)'),'text','off',150)+
      '<p class="cdat-p">'+gL('Estos datos solo se usan para coordinar tu entrega y viajan en el mensaje de WhatsApp. No los guardamos en el sitio.','These details are only used to arrange your delivery and travel in the WhatsApp message. We do not store them on the site.')+'</p></div><a class="btn wa" id="c-wa" href="'+msgWA()+'" target="_blank" rel="noopener">'+gL('Enviar pedido por WhatsApp','Send order on WhatsApp')+'</a><button type="button" class="btn pdf" id="c-pdf">'+gL('Descargar orden en PDF','Download order PDF')+'</button><button type="button" class="vaciar" data-vaciar>'+gL('Vaciar carrito','Empty cart')+'</button>';
    var aW=q('#c-wa',cf),REQ=['nom','tel','dep','mun','zon','dir','ref'];
    cf.querySelectorAll('[data-c]').forEach(function(el){el.value=cD[el.getAttribute('data-c')]||'';
      var h=function(){cD[el.getAttribute('data-c')]=el.value.replace(/\s+/g,' ').trim();aW.href=msgWA()};el.addEventListener('input',h);el.addEventListener('change',h)});
    function valida(){
      var bad=null;
      cf.querySelectorAll('.ce').forEach(function(e){e.textContent=''});cf.querySelectorAll('.inv').forEach(function(e){e.classList.remove('inv');e.removeAttribute('aria-invalid')});
      REQ.forEach(function(k){
        var el=cf.querySelector('[data-c="'+k+'"]'),v=(cD[k]||''),m='';
        if(!v)m=gL('Completa este dato.','Please fill in this field.');
        else if(k==='tel'){var t=v.replace(/[\s()-]/g,'').replace(/^\+?502/,'');if(!/^[2-7]\d{7}$/.test(t))m=gL('Escribe un teléfono de 8 dígitos (Guatemala).','Enter an 8-digit phone number (Guatemala).')}
        else if(k!=='dep'&&v.length<2)m=gL('Escribe al menos 2 letras.','Enter at least 2 characters.');
        if(m){el.classList.add('inv');el.setAttribute('aria-invalid','true');el.parentNode.querySelector('.ce').textContent=m;bad=bad||el}
      });
      return bad;
    }
    var aP=q('#c-pdf',cf);
    if(aP)aP.addEventListener('click',function(){
      var bad=valida();if(bad){bad.focus();return}
      if(typeof window.geaOrdenPDF!=='function'){alert(gL('El generador de PDF aún no cargó. Intenta de nuevo en unos segundos.','The PDF generator has not loaded yet. Please try again in a few seconds.'));return}
      ordNo=window.geaOrdenNo();aW.href=msgWA();
      var items=Object.keys(cart).map(function(k){return {cod:PROD[k].c,nom:pn(k),cant:cart[k],p:PROD[k].p}});
      var blob=window.geaOrdenPDF({en:GEA_EN,no:ordNo,fecha:window.geaOrdenFecha(GEA_EN),cli:cD,items:items,bulto:cart.k25>0,fx:window.geaFX?window.geaFX():{r:fxR(),d:''}});
      var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ECOCOCO-'+ordNo+'.pdf';document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(url);a.remove()},1500);
      if(window.geaTrack)geaTrack('download_order_pdf',{destino:'carrito'});
      ordenListo(blob,'ECOCOCO-'+ordNo+'.pdf',ordNo,aW.href);
    });
    aW.addEventListener('click',function(e){var bad=valida();if(bad){e.preventDefault();e.stopPropagation();bad.focus();return}aW.href=msgWA();if(window.geaTrack)geaTrack('click_whatsapp',{destino:'carrito'})});
  }
  function ordenListo(blob,name,no,href){
    var old=document.getElementById('ord-ok');if(old)old.remove();
    var m=document.createElement('div');m.className='wch';m.id='ord-ok';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label',gL('Tu orden está lista','Your order is ready'));
    var canShare=false;
    try{var f=new File([blob],name,{type:'application/pdf'});canShare=!!(navigator.canShare&&navigator.canShare({files:[f]}))}catch(e){}
    m.innerHTML='<div class="wch-in"><div class="wch-h"><h2>'+gL('Tu orden está lista','Your order is ready')+'</h2><button type="button" class="wch-b" aria-label="'+gL('Cerrar','Close')+'" data-x>'+gI('x',18)+'</button></div>'+
      '<p class="wch-s">'+gL('Se descargó el PDF <b>'+name+'</b>. Para que GEA Carbón lo reciba, sigue estos pasos:','The PDF <b>'+name+'</b> was downloaded. To send it to GEA Carbón, follow these steps:')+'</p>'+
      '<ol class="ord-p"><li>'+gL('Toca <b>Abrir WhatsApp</b>. Se abre el chat con tu pedido ya escrito. Envíalo.','Tap <b>Open WhatsApp</b>. The chat opens with your order already written. Send it.')+'</li>'+
      '<li>'+gL('En el chat toca el clip <b class="ic-in">'+gI('clip',16)+'</b>, elige <b>Documento</b> y selecciona el PDF <b>'+name+'</b> (está en tus Descargas). Envíalo.','In the chat tap the paperclip <b class="ic-in">'+gI('clip',16)+'</b>, choose <b>Document</b> and select the PDF <b>'+name+'</b> (it is in your Downloads). Send it.')+'</li></ol>'+
      '<a class="btn wa" data-direct target="_blank" rel="noopener" href="'+href+'">'+gL('Abrir WhatsApp','Open WhatsApp')+'</a>'+
      (canShare?'<button type="button" class="btn pdf" data-share>'+gL('Compartir el PDF desde mi teléfono','Share the PDF from my phone')+'</button><p class="ord-n">'+gL('Al compartir, elige WhatsApp y luego el chat de GEA Carbón (+502 4279-4894).','When sharing, choose WhatsApp and then the GEA Carbón chat (+502 4279-4894).')+'</p>':'')+
      '<button type="button" class="vaciar" data-again>'+gL('Descargar el PDF otra vez','Download the PDF again')+'</button></div>';
    document.body.appendChild(m);
    function cierra(){m.remove()}
    m.addEventListener('click',function(e){
      var t=e.target;
      if(t===m||t.closest('[data-x]')){cierra();return}
      if(t.closest('[data-again]')){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove()},1500)}
      if(t.closest('[data-share]')){navigator.share({files:[new File([blob],name,{type:'application/pdf'})],title:'ECOCOCO '+no,text:gL('Orden de pedido ','Order ')+no}).catch(function(){});if(window.geaTrack)geaTrack('click_whatsapp',{destino:'orden_pdf_compartir'})}
      if(t.closest('a[data-direct]')&&window.geaTrack)geaTrack('click_whatsapp',{destino:'orden_pdf'});
    });
    document.addEventListener('keydown',function k(e){if(e.key==='Escape'){cierra();document.removeEventListener('keydown',k)}});
    var first=m.querySelector('a[data-direct]');if(first)first.focus();
  }
  var last=null;
  function abrirC(){sb.hidden=true;last=document.activeElement;cd.setAttribute('aria-hidden','false');cbg.hidden=false;body.classList.add('noscroll');cd.classList.add('on');paint();q('.ovl-x',cd).focus()}
  function closeC(){cd.setAttribute('aria-hidden','true');cd.classList.remove('on');cbg.hidden=true;if(sb.hidden)body.classList.remove('noscroll')}
  function add(k,n){if(!PROD[k])return;n=Math.floor(Number(n));if(!isFinite(n)||n===0)n=1;cart[k]=Math.min(999,Math.max(0,(cart[k]||0)+n));if(cart[k]<=0)delete cart[k];save();paint()}
  document.addEventListener('click',function(e){
    var t=e.target;
    var a=t.closest('[data-add]');if(a){add(a.getAttribute('data-add'));if(sb.hidden===false)sb.hidden=true;abrirC();return}
    if(t.closest('[data-buscar]')){abrirB();return}
    if(t.closest('[data-carrito]')){abrirC();return}
    var qb=t.closest('[data-q]');if(qb){add(qb.getAttribute('data-k'),+qb.getAttribute('data-q'));return}
    var d=t.closest('[data-del]');if(d){delete cart[d.getAttribute('data-del')];save();paint();return}
    if(t.closest('[data-vaciar]')){cart={};save();paint();return}
    if(t.closest('#carrito .ovl-x')||t===cbg){closeC();if(last&&last.focus)last.focus();return}
    if(t.closest('#buscar .ovl-x')||t===sb){cerrarB();return}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){cerrarB();closeC()}});
  document.addEventListener('submit',function(e){var f=e.target.closest&&e.target.closest('[data-buscar-form]');if(f){e.preventDefault();abrirB(q('input',f).value)}});
  paint();
})();

/* submenús */
(function(){
  document.querySelectorAll('.has-sub').forEach(function(li){
    var b=li.querySelector('.sub-t');
    b.addEventListener('click',function(e){e.stopPropagation();var o=li.classList.toggle('open');b.setAttribute('aria-expanded',o)});
  });
  document.addEventListener('click',function(e){if(!e.target.closest('.has-sub'))document.querySelectorAll('.has-sub.open').forEach(function(l){l.classList.remove('open');l.querySelector('.sub-t').setAttribute('aria-expanded','false')})});
})();

/* filtros de la bitácora */
(function(){
  var lista=document.getElementById('lista-bit');if(!lista)return;
  var bs=document.querySelectorAll('.filtros button');
  bs.forEach(function(b){b.addEventListener('click',function(){
    var f=b.getAttribute('data-f');
    bs.forEach(function(x){x.classList.toggle('on',x===b)});
    lista.querySelectorAll('li[data-cat]').forEach(function(li){
      li.hidden=!(f==='todas'||(' '+li.getAttribute('data-cat')+' ').indexOf(' '+f+' ')>-1);
    });
  })});
})();

/* Selector de motivo + formulario antes de abrir WhatsApp */
(function(){
  var WA='50242794894',dlg=null,last=null,cur=null;
  var DEP=['Alta Verapaz','Baja Verapaz','Chimaltenango','Chiquimula','El Progreso','Escuintla','Guatemala','Huehuetenango','Izabal','Jalapa','Jutiapa','Petén','Quetzaltenango','Quiché','Retalhuleu','Sacatepéquez','San Marcos','Santa Rosa','Sololá','Suchitepéquez','Totonicapán','Zacapa'];
  /* campo: [clave, etiqueta ES, etiqueta EN, tipo, obligatorio] */
  var F={
    nom:['nom','Tu nombre','Your name','text',1],
    neg:['neg','Nombre del negocio','Business name','text',1],
    cant:['cant','Cantidad','Quantity','qty',1],
    dep:['dep','Departamento','Department','dep',1],
    mun:['mun','Municipio o zona','Town or area','text',1],
    esp:['esp','Especificaciones o comentarios (opcional)','Specifications or comments (optional)','area',0],
    pais:['pais','País de destino','Destination country','text',1],
    dest:['dest','Ciudad o puerto de destino','Destination city or port','text',1],
    inc:['inc','Condición de entrega (Incoterm)','Delivery terms (Incoterm)','sel',1],
    mail:['mail','Correo electrónico','Email','mail',1]
  };
  var INC=[['FOB (puerto de salida en Guatemala)','FOB (Guatemalan port of departure)'],['CIF (hasta el puerto de destino)','CIF (to the destination port)'],['EXW (en la planta, Retalhuleu)','EXW (at the plant, Retalhuleu)'],['No estoy seguro; necesito asesoría','Not sure; I need guidance']];
  var OPT=[
    {i:'home',t:['Consumidor final','End consumer'],d:['Quiero comprar carbón para mi casa','I want to buy charcoal for home'],
      saludo:['Hola, soy consumidor final y quiero comprar carbón ECOCOCO.','Hi, I am an end consumer and I want to buy ECOCOCO charcoal.'],
      f:['nom','cant','dep','mun','esp'],unidades:[['bolsa','bolsas de 1 kg','1 kg bags',1]],
      lug:'Ubicación de entrega'},
    {i:'store',t:['Tienda o abarrotes','Shop or grocery store'],d:['Quiero surtir mi negocio','I want to stock my shop'],
      saludo:['Hola, tengo una tienda o abarrotería y quiero información para vender ECOCOCO.','Hi, I have a shop or grocery store and I want information to sell ECOCOCO.'],
      f:['neg','nom','cant','dep','mun','esp'],unidades:[['kg','kg','kg',1],['bulto','bultos de 25 kg','25 kg sacks',25]]},
    {i:'fire',t:['Restaurante o parrillada','Restaurant or grill'],d:['Uso el carbón en mi cocina o asador','I use charcoal in my kitchen or grill'],
      saludo:['Hola, tengo un restaurante o parrillada y quiero cotizar carbón ECOCOCO.','Hi, I have a restaurant or grill and I would like a quote for ECOCOCO charcoal.'],
      f:['neg','nom','cant','dep','mun','esp'],unidades:[['kg','kg por semana','kg per week',1],['kgm','kg por mes','kg per month',1]]},
    {i:'truck',t:['Distribuidor o mayorista','Distributor or wholesaler'],d:['Bultos de 25 kg y precio por volumen','25 kg sacks and volume price'],
      saludo:['Hola, quiero ser distribuidor o comprar al por mayor ECOCOCO.','Hi, I want to become a distributor or buy ECOCOCO wholesale.'],
      f:['neg','nom','cant','dep','mun','esp'],unidades:[['bulto','bultos de 25 kg','25 kg sacks',25],['kg','kg','kg',1]]},
    {i:'globe',t:['Exportación (fuera de Guatemala)','Export (outside Guatemala)'],d:['Quiero comprar para otro país','I want to buy for another country'],
      saludo:['Hola, quiero una cotización de exportación de carbón ECOCOCO.','Hi, I would like an export quote for ECOCOCO charcoal.'],
      nota:['Los precios en dólares son de referencia, en base EXW (en planta, Retalhuleu): no incluyen flete internacional, seguro ni trámites de exportación. El flete se cotiza según el volumen y el país de destino; FOB y CIF se cotizan aparte. Confirmamos disponibilidad, empaque y documentos en la cotización.','USD prices are for reference, on an EXW basis (at the plant, Retalhuleu): they do not include international freight, insurance or export procedures. Freight is quoted by volume and destination country; FOB and CIF are quoted separately. We confirm availability, packaging and documents in the quote.'],
      f:['neg','nom','mail','pais','dest','cant','inc','esp'],unidades:[['kg','kg','kg',1],['bulto','bultos de 25 kg','25 kg sacks',25],['ton','toneladas','metric tons',1000]],exp:1},
    {i:'chat',t:['Quiero más información','I want more information'],d:['Tengo preguntas sobre el producto','I have questions about the product'],
      saludo:['Hola, quiero más información sobre el carbón ECOCOCO.','Hi, I would like more information about ECOCOCO charcoal.'],
      f:['nom','esp'],preg:1}
  ];
  var OPT_ES=['Consumidor final','Tienda o abarrotes','Restaurante o parrillada','Distribuidor o mayorista','Exportación','Más información'];
  function X(a){return gL(a[0],a[1])}
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function Qf(n){return 'Q'+n.toLocaleString(GEA_LOC)}
  function cerrar(){if(!dlg)return;dlg.hidden=true;document.body.classList.remove('noscroll');if(last&&last.focus)last.focus()}
  function lista(){
    cur=null;
    dlg.querySelector('.wch-in').innerHTML='<div class="wch-h"><h2>'+gL('¿Qué necesitas?','What do you need?')+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar','Close')+'">'+gI('x',18)+'</button></div><p class="wch-s">'+gL('Elige una opción, completa los datos y abrimos WhatsApp con el mensaje listo.','Choose an option, fill in the details and we open WhatsApp with the message ready.')+'</p><div class="wch-l">'+
      OPT.map(function(o,i){return '<button type="button" data-o="'+i+'"><span class="wch-i" aria-hidden="true">'+gI(o.i,24)+'</span><span><b>'+X(o.t)+'</b><small>'+X(o.d)+'</small></span></button>'}).join('')+'</div>';
    var f=dlg.querySelector('[data-o]');if(f)f.focus();
  }
  function campo(o,k){
    var d=F[k],id='wf-'+k,r=d[4]?' required':'',lab=gL(d[1],d[2]),h='';
    if(k==='nom'&&o.preg===undefined&&false)lab=lab;
    if(k==='nom'){var req=!o.preg;h+='<label for="'+id+'">'+lab+(req?' *':gL(' (opcional)',' (optional)'))+'</label><input id="'+id+'" name="nom" maxlength="60" autocomplete="name"'+(req?' required':'')+'>';}
    else if(k==='neg')h+='<label for="'+id+'">'+lab+' *</label><input id="'+id+'" name="neg" maxlength="80" autocomplete="organization" required>';
    else if(k==='cant'){
      var u=o.unidades;
      h+='<label for="'+id+'">'+gL('Cantidad','Quantity')+' *</label><div class="wf-q"><input id="'+id+'" name="cant" type="number" inputmode="numeric" min="1" max="99999" step="1" required>'+
        (u.length>1?'<select name="uni" aria-label="'+gL('Unidad','Unit')+'">'+u.map(function(x,i){return '<option value="'+i+'">'+gL(x[1],x[2])+'</option>'}).join('')+'</select>':'<span class="wf-u">'+gL(u[0][1],u[0][2])+'</span>')+'</div>';
    }
    else if(k==='dep')h+='<label for="'+id+'">'+gL(o.lug||'Departamento','Department')+' *</label><select id="'+id+'" name="dep" required><option value="">'+gL('Selecciona','Select')+'</option>'+DEP.map(function(x){return '<option>'+x+'</option>'}).join('')+'</select>';
    else if(k==='mun')h+='<label for="'+id+'">'+lab+' *</label><input id="'+id+'" name="mun" maxlength="80" autocomplete="address-level2" required>';
    else if(k==='pais')h+='<label for="'+id+'">'+lab+' *</label><input id="'+id+'" name="pais" maxlength="60" autocomplete="country-name" required>';
    else if(k==='dest')h+='<label for="'+id+'">'+lab+' *</label><input id="'+id+'" name="dest" maxlength="80" required>';
    else if(k==='mail')h+='<label for="'+id+'">'+lab+' *</label><input id="'+id+'" name="mail" type="email" inputmode="email" maxlength="100" autocomplete="email" required>';
    else if(k==='inc')h+='<label for="'+id+'">'+lab+' *</label><select id="'+id+'" name="inc" required><option value="">'+gL('Selecciona','Select')+'</option>'+INC.map(function(x){return '<option>'+gL(x[0],x[1])+'</option>'}).join('')+'</select>';
    else if(k==='esp')h+='<label for="'+id+'">'+(o.preg?gL('¿Qué quieres saber? *','What would you like to know? *'):lab)+'</label><textarea id="'+id+'" name="esp" rows="'+(o.preg?4:3)+'" maxlength="400"'+(o.preg?' required':'')+'></textarea>';
    return '<div class="wf-c">'+h+'<span class="wf-e" aria-live="polite"></span></div>';
  }
  function formulario(n){
    var o=OPT[n];cur=n;
    dlg.querySelector('.wch-in').innerHTML='<div class="wch-h"><button type="button" class="wch-b" data-back aria-label="'+gL('Volver','Back')+'">'+gI('al',18)+'</button><h2>'+X(o.t)+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar','Close')+'">'+gI('x',18)+'</button></div><p class="wch-s">'+gL('Completa los datos. Los campos con * son obligatorios.','Fill in the details. Fields with * are required.')+'</p>'+(o.nota?'<p class="wch-s wf-x">'+X(o.nota)+'</p>':'')+'<form class="wf" novalidate>'+o.f.map(function(k){return campo(o,k)}).join('')+'<button type="submit" class="btn wa wf-go">'+gL('Enviar por WhatsApp','Send on WhatsApp')+'</button><p class="wf-n">'+gL('Se abrirá WhatsApp con tu mensaje ya escrito. Puedes revisarlo antes de enviarlo.','WhatsApp will open with your message ready. You can review it before sending.')+'</p></form>';
    var f=dlg.querySelector('input,select,textarea');if(f)f.focus();
  }
  function mensaje(o,v){
    var L=[X(o.saludo),''];
    if(v.neg)L.push(gL('Negocio: ','Business: ')+v.neg);
    if(v.nom)L.push(gL('Nombre: ','Name: ')+v.nom);
    if(v.cant){
      var u=o.unidades[+(v.uni||0)],n=+v.cant;
      L.push(gL('Cantidad: ','Quantity: ')+n.toLocaleString(GEA_LOC)+' '+gL(u[1],u[2]));
      var kg=n*u[3],P=window.GEA_PRODUCTS;
      if(o.exp){
        if(P){
          var tq=kg*(P.k25.p/25),fx=window.geaFX?window.geaFX():null,rt=fx&&fx.r;
          L.push(gL('Total de referencia (precio de lista, base EXW Retalhuleu, sin flete): ','Reference total (list price, EXW Retalhuleu basis, excluding freight): ')+Qf(tq)+(rt?' ≈ US$'+(tq/rt).toLocaleString(GEA_LOC,{minimumFractionDigits:2,maximumFractionDigits:2}):''));
          if(rt)L.push(gL('Tipo de cambio aplicado: Q'+rt.toFixed(2)+' por US$1 ('+fx.d+')','Exchange rate applied: Q'+rt.toFixed(2)+' per US$1 ('+fx.d+')'));
          L.push(gL('Flete internacional: se cotiza según volumen y país de destino.','International freight: quoted by volume and destination country.'))
        }
        if(u[0]==='bulto')L.push(gL('Total aproximado: ','Approximate total: ')+(kg/1000>=1?(kg/1000).toLocaleString(GEA_LOC)+gL(' toneladas',' metric tons'):kg.toLocaleString(GEA_LOC)+' kg'))}
      else if(P&&(u[0]==='bolsa'))L.push(gL('Total estimado (Q'+P.k1.p+' por bolsa): ','Estimated total (Q'+P.k1.p+' per bag): ')+Qf(n*P.k1.p));
      else if(P&&u[0]==='bulto')L.push(gL('Precio de lista estimado (Q'+P.k25.p+' por bulto): ','Estimated list price (Q'+P.k25.p+' per sack): ')+Qf(n*P.k25.p)+gL(' (kg totales: ',' (total kg: ')+kg.toLocaleString(GEA_LOC)+')');
    }
    if(v.pais)L.push(gL('País de destino: ','Destination country: ')+v.pais);
    if(v.dest)L.push(gL('Ciudad o puerto de destino: ','Destination city or port: ')+v.dest);
    if(v.inc)L.push(gL('Condición de entrega: ','Delivery terms: ')+v.inc);
    if(v.mail)L.push(gL('Correo: ','Email: ')+v.mail);
    if(v.dep)L.push(gL(o.lug?'Ubicación de entrega: ':'Departamento: ',o.lug?'Delivery location: ':'Department: ')+v.dep+(v.mun?', '+v.mun:''));
    if(v.esp)L.push((o.preg?gL('Consulta: ','Question: '):gL('Especificaciones: ','Specifications: '))+v.esp);
    return L.join('\n');
  }
  function enviar(form){
    var o=OPT[cur],v={},bad=null;
    form.querySelectorAll('.wf-e').forEach(function(e){e.textContent=''});
    form.querySelectorAll('.inv').forEach(function(e){e.classList.remove('inv');e.removeAttribute('aria-invalid')});
    Array.prototype.forEach.call(form.elements,function(el){if(el.name)v[el.name]=(el.value||'').replace(/\s+/g,' ').trim()});
    var ta=form.elements.esp;if(ta)v.esp=ta.value.replace(/[ \t]+/g,' ').trim();
    function err(el,t){el.classList.add('inv');el.setAttribute('aria-invalid','true');var s=el.closest('.wf-c').querySelector('.wf-e');s.textContent=t;bad=bad||el}
    Array.prototype.forEach.call(form.elements,function(el){
      if(!el.name||el.type==='submit')return;
      if(el.required&&!v[el.name]){err(el,gL('Completa este dato.','Please fill in this field.'));return}
      if(el.name==='cant'){var n=Number(v.cant);if(!isFinite(n)||n<1||Math.floor(n)!==n||n>99999)err(el,gL('Escribe un número entero mayor que 0.','Enter a whole number greater than 0.'))}
      if(el.name==='mail'&&v.mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.mail))err(el,gL('Escribe un correo válido.','Enter a valid email address.'));
      if((el.name==='nom'||el.name==='neg'||el.name==='mun'||el.name==='pais'||el.name==='dest')&&v[el.name]&&v[el.name].length<2)err(el,gL('Escribe al menos 2 letras.','Enter at least 2 characters.'));
      if(el.name==='esp'&&o.preg&&v.esp&&v.esp.length<5)err(el,gL('Cuéntanos un poco más.','Tell us a little more.'));
    });
    if(bad){bad.focus();return}
    if(window.geaTrack){geaTrack('click_whatsapp',{destino:'formulario: '+OPT_ES[cur]});if(cur>=1&&cur<=4)geaTrack('generate_lead',{tipo:OPT_ES[cur],via:'whatsapp'})}
    window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(mensaje(o,v)),'_blank','noopener');
    cerrar();
  }
  function build(){
    dlg=document.createElement('div');dlg.className='wch';dlg.hidden=true;dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-label',gL('¿Qué necesitas?','What do you need?'));
    dlg.innerHTML='<div class="wch-in"></div>';document.body.appendChild(dlg);
    dlg.addEventListener('click',function(e){
      if(e.target===dlg||e.target.closest('.ovl-x')){cerrar();return}
      if(e.target.closest('[data-back]')){lista();return}
      var b=e.target.closest('[data-o]');if(b)formulario(+b.getAttribute('data-o'));
    });
    dlg.addEventListener('submit',function(e){e.preventDefault();enviar(e.target)});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="https://wa.me/'+WA+'"]');
    if(!a||e.defaultPrevented)return;
    if(a.id==='c-wa'||a.id==='calc-wa'||a.hasAttribute('data-direct')||a.closest('.form-ok'))return;
    if(/25%20kg/.test(a.getAttribute('href'))&&/cotizar/i.test(a.getAttribute('href')))return;
    e.preventDefault();
    if(!dlg)build();
    last=a;lista();dlg.hidden=false;document.body.classList.add('noscroll');
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dlg&&!dlg.hidden)cerrar()});
  var EXP=OPT.length-2;
  window.geaExport=function(from){
    if(!dlg)build();
    last=from||document.activeElement;formulario(EXP);dlg.hidden=false;document.body.classList.add('noscroll');
    if(window.geaTrack)geaTrack('click_whatsapp',{destino:'exportacion_desde_carrito'});
  };
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-exp]');if(!b)return;
    e.preventDefault();
    var c=document.getElementById('carrito')||document.querySelector('.cart');
    if(c&&c.classList.contains('on')){c.classList.remove('on');c.setAttribute('aria-hidden','true');var bg=document.querySelector('.cart-bg');if(bg)bg.hidden=true;document.body.classList.remove('noscroll')}
    window.geaExport(b);
  });
})();

// Comparador de precio por libra (página de distribuidores)
(function(){
  var inp=document.getElementById('cmp-in'),out=document.getElementById('cmp-out');if(!inp||!out)return;
  var P=Number(String(inp.getAttribute('data-p')).replace(/[^0-9.]/g,''));
  function f(n){return 'Q'+n.toLocaleString(GEA_EN?'en-US':'es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function upd(){
    var v=parseFloat(String(inp.value).replace(',','.'));
    if(!isFinite(v)||v<=0||v>999){out.textContent='';return}
    var d=v-P,pct=Math.abs(d)/v*100,lb100=Math.abs(d)*100;
    if(Math.abs(d)<0.005)out.textContent=gL('Pagas lo mismo por libra que con ECOCOCO en bulto ('+f(P)+').','You pay the same per pound as with ECOCOCO in sacks ('+f(P)+').');
    else if(d>0)out.textContent=gL('Con ECOCOCO en bulto pagarías '+f(P)+' por libra: '+f(d)+' menos que hoy ('+pct.toFixed(0)+' %). En 100 libras, '+f(lb100)+' de diferencia. Compara solo precio; el rendimiento lo publicaremos con resultados de laboratorio.','With ECOCOCO in sacks you would pay '+f(P)+' per pound: '+f(d)+' less than today ('+pct.toFixed(0)+'%). On 100 pounds, a difference of '+f(lb100)+'. This compares price only; we will publish performance once we have laboratory results.');
    else out.textContent=gL('Con ECOCOCO en bulto pagarías '+f(P)+' por libra: '+f(-d)+' más que hoy. Compara también la forma y el origen; el rendimiento lo publicaremos con resultados de laboratorio.','With ECOCOCO in sacks you would pay '+f(P)+' per pound: '+f(-d)+' more than today. Also compare shape and origin; we will publish performance once we have laboratory results.');
    if(window.geaTrack&&!inp._t){inp._t=1;geaTrack('use_comparador',{destino:'distribuidores'})}
  }
  inp.addEventListener('input',upd);
})();

// Equivalencia aproximada en USD junto a los precios en quetzales (español e inglés).
// Usa el tipo de cambio del día (open.er-api.com, se guarda 6 h en el dispositivo). Si falla, usa el de config.js.
(function(){
  var CFG=window.GEA_CONFIG||{},FB=Number(CFG.usdRate)||7.65,FBD=GEA_EN?(CFG.usdDate||'Nov 20, 2026'):(CFG.usdDateEs||'20 nov 2026');
  var R=FB,live=false,when='';
  var re=/Q\s?(\d{1,3}(?:,\d{3})*|\d+)(\.\d{1,2})?(?![\d,])/g;
  function usd(q){return 'US$'+(q/R).toLocaleString(GEA_EN?'en-US':'es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function mark(){
    var main=document.querySelector('main')||document.body,w=document.createTreeWalker(main,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|OPTION)$/.test(p.nodeName))return NodeFilter.FILTER_REJECT;
      if(p.closest('.cart,#carrito,.wch,#ord-ok,.consent,.sheet,.ovl,[data-usd="no"],#tot,#b-tot,.total,.tot,.li-s,.res,.usd'))return NodeFilter.FILTER_REJECT;
      re.lastIndex=0;return re.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}}),L=[],n,any=false;
    while((n=w.nextNode()))L.push(n);
    L.forEach(function(t){
      var str=t.nodeValue,frag=document.createDocumentFragment(),last=0,m;re.lastIndex=0;
      while((m=re.exec(str))){
        var pre=str.slice(0,m.index);if(pre.lastIndexOf('(')>pre.lastIndexOf(')'))continue;
        var q=parseFloat(String(m[1]).replace(/,/g,'')+(m[2]||''));if(!isFinite(q)||q<=0)continue;
        var end=m.index+m[0].length;frag.appendChild(document.createTextNode(str.slice(last,end)+' '));
        var sp=document.createElement('span');sp.className='usd';sp.setAttribute('data-q',q);sp.textContent='(≈ '+usd(q)+')';frag.appendChild(sp);
        last=end;any=true}
      if(last){frag.appendChild(document.createTextNode(str.slice(last)));t.parentNode.replaceChild(frag,t)}});
    return any;
  }
  function refresh(){document.querySelectorAll('.fxn').forEach(function(e){e.textContent=GEA_EN?'Reference exchange rate: Q'+R.toFixed(2)+' per US$1 ('+(live?when:FBD)+'). USD amounts are approximate; payment is in quetzales.':'Tipo de cambio de referencia: Q'+R.toFixed(2)+' por US$1 ('+(live?when:FBD)+'). El monto en dólares es aproximado; el cobro es en quetzales.'});document.querySelectorAll('.usd').forEach(function(s){s.textContent='(≈ '+usd(Number(s.getAttribute('data-q')))+')'});note()}
  function note(){
    if(!document.querySelector('.usd'))return;
    var f=document.querySelector('.pie-dat');if(!f)return;
    var p=document.getElementById('usd-note');if(!p){p=document.createElement('p');p.id='usd-note';p.className='usd-note';f.parentNode.insertBefore(p,f.nextSibling)}
    p.textContent=GEA_EN?((live?'Exchange rate today: Q'+R.toFixed(2)+' per US$1 (updated '+when+'). ':'Reference rate: Q'+R.toFixed(2)+' per US$1 (Banco de Guatemala, '+FBD+'). ')+'USD amounts are approximate. Prices are charged in quetzales (Q). Export reference: EXW Retalhuleu; international freight is quoted by volume and destination country. '):((live?'Tipo de cambio de hoy: Q'+R.toFixed(2)+' por US$1 (actualizado '+when+'). ':'Tipo de cambio de referencia: Q'+R.toFixed(2)+' por US$1 (Banco de Guatemala, '+FBD+'). ')+'Los montos en dólares son aproximados. Los precios se cobran en quetzales (Q). Referencia para exportación: EXW Retalhuleu; el flete internacional se cotiza según el volumen y el país de destino. ');
    if(live){var a=document.createElement('a');a.href='https://www.exchangerate-api.com';a.target='_blank';a.rel='noopener';a.textContent='Rates By Exchange Rate API';p.appendChild(a)}
  }
  window.geaFX=function(){return {r:R,live:live,d:live?when:FBD}};
  function apply(r,t){if(!(r>5&&r<12))return false;R=r;live=true;when=t;refresh();return true}
  function fmt(ms){try{return new Date(ms).toLocaleDateString(GEA_EN?'en-US':'es-GT',{month:'short',day:'numeric',year:'numeric'})}catch(e){return ''}}
  function getRate(){
    var c=null;try{c=JSON.parse(localStorage.getItem('gea-usd')||'null')}catch(e){}
    if(c&&c.r&&Date.now()-c.t<6*3600e3){apply(c.r,fmt(c.t));return}
    if(!window.fetch)return;
    fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store'}).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){
      var g=j&&j.result==='success'&&j.rates&&Number(j.rates.GTQ),t=Date.now();
      if(g&&apply(g,fmt(j.time_last_update_unix?j.time_last_update_unix*1000:t)))try{localStorage.setItem('gea-usd',JSON.stringify({r:g,t:t}))}catch(e){}
    }).catch(function(){});
  }
  function run(){if(mark())note();getRate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();

/* App instalable (PWA): service worker + invitación a instalar */
(function(){
  if('serviceWorker' in navigator){addEventListener('load',function(){try{navigator.serviceWorker.register('/sw.js').catch(function(){})}catch(e){}})}
  function std(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}}
  var en=(document.documentElement.lang||'').indexOf('en')===0,dp=null;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  function help(){
    if(ios)return en?'On iPhone: tap the Share button in Safari, then "Add to Home Screen".':'En iPhone: toca el botón Compartir de Safari y luego "Añadir a pantalla de inicio".';
    return en?'On Android: open the browser menu (the three dots) and tap "Install app" or "Add to Home screen".':'En Android: abre el menú del navegador (los tres puntos) y toca "Instalar aplicación" o "Añadir a pantalla de inicio".';
  }
  /* Se expone para el chat: install(cb) intenta el aviso nativo; si no hay, devuelve instrucciones */
  window.GEA_INSTALL={standalone:std,help:help,install:function(cb){
    if(dp){var p=dp;dp=null;p.prompt();p.userChoice.then(function(c){cb&&cb(c&&c.outcome==='accepted'?'ok':'no')},function(){cb&&cb('no')})}
    else cb&&cb('manual',help())}};
  var promo=document.querySelector('[data-app-promo]');
  if(promo&&!std()){promo.hidden=false;var pb=promo.querySelector('[data-app-install]'),pn=promo.querySelector('[data-app-note]');
    pb.addEventListener('click',function(){try{window.geaTrack&&geaTrack('click_instalar_app',{origen:'inicio'})}catch(e){}GEA_INSTALL.install(function(r,h){if(r==='manual'){pn.textContent=h;pn.hidden=false}else if(r==='ok')promo.hidden=true})})}
  if(std())return;
  function mount(){
    if(document.getElementById('pwa-i'))return;
    var f=document.querySelector('footer.pie .wrap');if(!f)return;
    var d=document.createElement('div');d.className='pwa-box';
    var b=document.createElement('button');b.id='pwa-i';b.type='button';b.className='pwa-i';
    b.textContent=en?'Install the ECOCOCO app':'Instalar la app ECOCOCO';
    var n=document.createElement('p');n.className='pwa-n';n.hidden=true;
    b.onclick=function(){GEA_INSTALL.install(function(r,h){if(r==='manual'){n.textContent=h;n.hidden=false}else if(r==='ok'){d.remove()}})};
    d.appendChild(b);d.appendChild(n);f.appendChild(d);
  }
  addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e});
  addEventListener('appinstalled',function(){var d=document.querySelector('.pwa-box');if(d)d.remove();var pr=document.querySelector('[data-app-promo]');if(pr)pr.hidden=true});
  function init(){mount()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* PDF: Descargar guarda el archivo; Imprimir abre el diálogo de impresión (en celular, el menú Compartir/Imprimir) */
(function(){
  function aviso(m){var d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(function(){d.remove()},3500)}
  function nombre(u){return decodeURIComponent(String(u).split('?')[0].split('/').pop())}
  function bajar(blob,n){var o=URL.createObjectURL(blob),a=document.createElement('a');a.href=o;a.download=n;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(o)},4000)}
  function traer(u){return fetch(u,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){return new Blob([b],{type:'application/pdf'})})}
  function imprimir(blob,n2){
    var touch=false;try{touch=matchMedia('(pointer:coarse)').matches}catch(x){}
    if(touch){
      var f=new File([blob],n2,{type:'application/pdf'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){
        aviso(gL('Elige «Imprimir» en el menú','Choose “Print” in the menu'));
        return navigator.share({files:[f],title:n2}).catch(function(){});
      }
      window.open(URL.createObjectURL(blob),'_blank');aviso(gL('En el visor, abre el menú ⋮ y elige Imprimir','In the viewer, open the ⋮ menu and choose Print'));return;
    }
    var o=URL.createObjectURL(blob),fr=document.createElement('iframe');
    fr.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
    fr.onload=function(){setTimeout(function(){try{fr.contentWindow.focus();fr.contentWindow.print()}catch(x){window.open(o,'_blank')}},400)};
    fr.src=o;document.body.appendChild(fr);
    setTimeout(function(){if(fr.parentNode)fr.parentNode.removeChild(fr);URL.revokeObjectURL(o)},120000);
  }
  window.geaPdfBajar=bajar;window.geaPdfImprimir=imprimir;
  document.addEventListener('click',function(e){
    var d=e.target.closest&&e.target.closest('a[download]');
    if(d&&/\.pdf(\?|#|$)/i.test(d.getAttribute('href')||'')){
      e.preventDefault();var u=d.href,n=nombre(u);
      traer(u).then(function(b){bajar(b,n);aviso(gL('Descargando: ','Downloading: ')+n)},function(){window.open(u,'_blank','noopener')});
      return;
    }
    var b=e.target.closest&&e.target.closest('[data-print]');if(!b)return;
    e.preventDefault();var u2=new URL(b.getAttribute('data-print'),location.href).href,n2=nombre(u2);
    try{window.geaTrack&&geaTrack('imprimir_pdf',{archivo:n2})}catch(x){}
    var touch=false;try{touch=matchMedia('(pointer:coarse)').matches}catch(x){}
    traer(u2).then(function(blob){imprimir(blob,n2)    },function(){window.open(u2,'_blank','noopener')});
  });
})();

/* Pantalla de inicio de la app: se retira al terminar la animación */
(function(){var h=document.documentElement;if(!h.classList.contains('splash-on'))return;
  setTimeout(function(){var bq=document.querySelector('.barrido');if(bq)bq.classList.add('quiet');h.classList.add('splash-done');var e=document.querySelector('.splash');if(e&&e.parentNode)e.parentNode.removeChild(e)},4400);
  try{window.geaTrack&&geaTrack('inicio_app',{})}catch(x){}})();

// Simulador de margen del distribuidor
(function () {
  var pv = document.getElementById('mg-pv'), nb = document.getElementById('mg-b'), tp = document.getElementById('mg-t');
  if (!pv || !nb || !tp) return;
  function f(n) { return n.toLocaleString(GEA_LOC, { maximumFractionDigits: 2 }); }
  function act() {
    var p = parseFloat(pv.value), kg = parseInt(nb.value, 10), costo = parseFloat(tp.value) || 14;
    if (!(p > 0)) p = 0;
    if (!(kg > 0)) kg = 0;
    kg = Math.min(kg, 20000);
    var g = p - costo, sg = g < 0 ? '−Q' : 'Q';
    document.getElementById('mg-c').textContent = 'Q' + f(costo);
    document.getElementById('mg-g').textContent = sg + f(Math.abs(g));
    document.getElementById('mg-p').textContent = p > 0 ? f(Math.round(g / p * 1000) / 10) + '%' : '—';
    document.getElementById('mg-m').textContent = sg + f(Math.abs(Math.round(g * kg)));
    var bulto = costo === 14, nt;
    if (g < 0) nt = gL('A ese precio de venta pierdes dinero: súbelo por encima del costo.', 'At that selling price you lose money: raise it above cost.');
    else if (kg >= 250) nt = gL('Con ' + f(kg) + ' kg al mes ya puedes pedir precio especial por volumen.', 'With ' + f(kg) + ' kg per month you can already ask for a special volume price.');
    else if (!bulto && kg < 20) nt = gL('El pedido mínimo por kilo es de 20 kg.', 'The minimum order by the kilo is 20 kg.');
    else if (bulto && kg < 25) nt = gL('El bulto es de 25 kg: ese es el mínimo para este precio.', 'The sack is 25 kg: that is the minimum for this price.');
    else nt = gL('Con ' + f(kg) + ' kg al mes. Si compras más de 250 kg por pedido, cotizamos precio especial.', 'With ' + f(kg) + ' kg per month. If you buy over 250 kg per order, we quote a special price.');
    document.getElementById('mg-n').textContent = nt;
    var msg = GEA_EN
      ? 'Hi, I am a distributor. I would buy ' + (bulto ? 'by the 25 kg sack (Q14/kg)' : 'by the kilo (Q15/kg)') + ', sell at Q' + f(p) + '/kg and move about ' + f(kg) + ' kg per month. I would like to know the special volume price.\nBusiness: \nLocation: '
      : 'Hola, soy distribuidor. Compraria ' + (bulto ? 'por bulto de 25 kg (Q14/kg)' : 'por kilo (Q15/kg)') + ', venderia a Q' + f(p) + '/kg y moveria unos ' + f(kg) + ' kg al mes. Quiero conocer el precio especial por volumen.\nNegocio: \nUbicacion: ';
    document.getElementById('mg-wa').href = 'https://wa.me/50242794894?text=' + encodeURIComponent(msg);
  }
  pv.addEventListener('input', act); nb.addEventListener('input', act); tp.addEventListener('change', act); act();
})();

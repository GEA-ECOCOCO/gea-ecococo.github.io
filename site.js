var GEA_EN=document.documentElement.lang==='en',GEA_LOC=GEA_EN?'en-US':GEA_LOC;function gL(a,b){return GEA_EN?b:a}
// Transición entre páginas: barrido verde al salir
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
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
  l.innerHTML = '<span class="caret"></span>';
  var i = 0;
  setTimeout(function escribir() {
    if (i <= texto.length) {
      l.innerHTML = texto.slice(0, i) + '<span class="caret"></span>';
      i++; setTimeout(escribir, 42);
    } else {
      setTimeout(function () { l.textContent = texto; }, 900);
    }
  }, 2100);
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
  function url() { return location.href.split('#')[0]; }
  function e(x) { return encodeURIComponent(x); }
  function redes() {
    var u = url(), t = TEXTO, ut = t + ' ' + u;
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
      [gL('Correo','Email'), '✉', '#5A6A7A', 'mailto:?subject=' + e(gL('ECOCOCO | Briquetas de carbón de cáscara de coco','ECOCOCO | Coconut shell charcoal briquettes')) + '&body=' + e(ut)]
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
  function abrir() {
    var h = '<div class="panel"><button type="button" class="cerrar" aria-label="'+gL('Cerrar','Close')+'">✕</button>' +
      '<h3>'+gL('Compartir ECOCOCO','Share ECOCOCO')+'</h3><p class="sub">'+gL('Elige dónde quieres compartir esta página.','Choose where you want to share this page.')+'</p><div class="redes">';
    if (navigator.share) h += '<button type="button" data-nativo><i style="background:linear-gradient(135deg,#8BE000,#1FA23A);color:#04100A">↗</i>'+gL('Más opciones','More options')+'</button>';
    redes().forEach(function (r) {
      h += '<a href="' + r[3] + '" target="_blank" rel="noopener"><i style="background:' + r[2] + '">' + r[1] + '</i>' + r[0] + '</a>';
    });
    h += '<button type="button" data-copiar><i style="background:#2f4a3a">🔗</i>'+gL('Copiar enlace','Copy link')+'</button></div>' +
      '<p class="nota">'+gL('Para Instagram y TikTok no existe un botón directo: usa «Más opciones» en tu teléfono o copia el enlace y pégalo en tu publicación o historia.','There is no direct button for Instagram and TikTok: use “More options” on your phone or copy the link and paste it into your post or story.')+'</p></div>';
    sheet.innerHTML = h; sheet.hidden = false; document.body.style.overflow = 'hidden';
    sheet.querySelector('.cerrar').focus();
  }
  function cerrar() { sheet.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-compartir]')) { abrir(); return; }
    if (sheet.hidden) return;
    if (ev.target === sheet || ev.target.closest('.cerrar')) { cerrar(); return; }
    if (ev.target.closest('[data-copiar]')) { copiar(); return; }
    if (ev.target.closest('[data-nativo]')) {
      navigator.share({ title: 'ECOCOCO', text: TEXTO, url: url() }).catch(function () {}); return;
    }
    if (ev.target.closest('.redes a')) setTimeout(cerrar, 150);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !sheet.hidden) cerrar(); });
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
   ['Precios','Precio por kg, bulto de 25 kg para mayoristas y calculadora','precios.html','precio costo cuánto bulto kg calculadora mayorista'],
   ['Distribuidores y mayoristas','Condiciones comerciales y pedidos por volumen','distribuidores.html','distribuidor mayorista tienda restaurante volumen negocio'],
   ['Impacto ambiental','Aprovechamiento de la cáscara de coco, datos de fuentes públicas y metas','impacto-ambiental.html','ambiente cáscara coco residuo agroindustrial contaminación leña guatemala potencial'],
   ['Cómo comprar y preguntas frecuentes','Pasos para pedir, mínimos, pago y entregas','como-comprar.html','cómo comprar pedir preguntas frecuentes pago entrega factura'],
   ['Tecnología GEA','Ingeniería y producción mecanizada','tecnologia-gea.html','tecnología ingeniería horno molino mezcladora prensa'],
   ['Contacto','WhatsApp 4279-4894 y correo','contacto.html','whatsapp teléfono correo pedido'],
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
   ['Plant log','Real progress: kilns, tests and first batches','bitacora.html','plant kiln tests batches progress'],
   ['Prices','Price per kg, 25 kg sack for wholesalers and calculator','precios.html','price cost how much sack kg calculator wholesale'],
   ['How to buy and FAQ','Steps to order, minimums, payment and delivery','como-comprar.html','how buy order faq questions payment delivery invoice'],
   ['Distributors and wholesalers','Commercial terms and volume orders','distribuidores.html','distributor wholesale shop restaurant volume business'],
   ['Environmental impact','Making use of coconut shell, public-source data and goals','impacto-ambiental.html','environment coconut shell agro-industrial waste pollution firewood guatemala potential'],
   ['GEA Technology','Engineering and mechanized production','tecnologia-gea.html','technology engineering kiln mill mixer press'],
   ['Contact','WhatsApp 4279-4894 and email','contacto.html','whatsapp phone email order'],
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
  /* ---- DOM ---- */
  var wrap=document.createElement('div');
  wrap.innerHTML=
   '<div id="buscar" class="ovl" role="dialog" aria-modal="true" aria-label="'+gL('Buscar','Search')+'" hidden><div class="ovl-in"><div class="ovl-top"><h2>'+gL('¿Qué estás buscando?','What are you looking for?')+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar','Close')+'">✕</button></div><form data-buscar-form2 role="search" class="bx"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="'+gL('Busca precios, proceso, distribuidores…','Search prices, process, distributors…')+'" aria-label="'+gL('Buscar','Search')+'"><button type="submit" class="go" aria-label="'+gL('Buscar','Search')+'">→</button></form><ul class="res"></ul></div></div>'+
   '<div id="cart-bg" class="cart-bg" hidden></div>'+
   '<aside id="carrito" class="cart" role="dialog" aria-modal="true" aria-label="'+gL('Tu carrito','Your cart')+'" aria-hidden="true"><div class="cart-h"><h2>'+gL('Tu carrito','Your cart')+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar carrito','Close cart')+'">✕</button></div><div class="cart-b"></div><div class="cart-f"></div></aside>';
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
  var cNom='',cUbi='';
  function paint(){
    var n=count();
    document.querySelectorAll('.cart-n').forEach(function(b){b.textContent=n;b.hidden=!n});
    var ks=Object.keys(cart);
    if(!ks.length){cb.innerHTML='<p class="vacio">'+gL('Tu carrito está vacío. Agrega tu carbón ECOCOCO para armar tu pedido.','Your cart is empty. Add your ECOCOCO charcoal to build your order.')+'</p><p><button type="button" class="btn pill add" data-add="k1">'+gL('Agregar bolsa 1 kg','Add 1 kg bag')+' · Q'+PROD.k1.p+'</button></p><p><button type="button" class="btn pill add" data-add="k25">'+gL('Agregar bulto 25 kg','Add 25 kg sack')+' · Q'+PROD.k25.p+'</button></p>';cf.innerHTML='';return}
    cb.innerHTML=ks.map(function(k){var p=PROD[k];return '<div class="li"><div class="li-t"><b>'+pn(k)+'</b><span>'+Q(p.p)+' '+gL('c/u','each')+'</span></div><div class="li-q"><button type="button" data-q="-1" data-k="'+k+'" aria-label="'+gL('Quitar uno','Remove one')+'">−</button><span>'+cart[k]+'</span><button type="button" data-q="1" data-k="'+k+'" aria-label="'+gL('Agregar uno','Add one')+'">+</button></div><div class="li-s">'+Q(cart[k]*p.p)+'</div><button type="button" class="li-x" data-del="'+k+'" aria-label="'+gL('Eliminar','Remove')+'">✕</button></div>'}).join('');
    function msgWA(){
      var L=[gL('Hola, quiero hacer este pedido de ECOCOCO:','Hi, I\'d like to place this ECOCOCO order:')];
      if(cNom)L.push(gL('Nombre: ','Name: ')+cNom);
      if(cUbi)L.push(gL('Ubicación / departamento: ','Location / department: ')+cUbi);
      L.push('');
      ks.forEach(function(k){var p=PROD[k];L.push('• '+pn(k)+': '+cart[k]+' × '+Q(p.p)+' = '+Q(cart[k]*p.p))});
      L.push('');L.push(gL('Total del pedido: ','Order total: ')+Q(total()));
      L.push(gL('Entrega y forma de pago: por coordinar.','Delivery and payment: to be arranged.'));
      return 'https://wa.me/'+WA+'?text='+encodeURIComponent(L.join('\n'));
    }
    var bulto=cart.k25>0;
    cf.innerHTML='<div class="tot"><span>'+gL('Total estimado','Estimated total')+'</span><b>'+Q(total())+'</b></div><p class="nota">'+gL('Precio a consumidor final. ','End-consumer price. ')+(bulto?gL('En bultos de 25 kg hay precio especial según volumen, lo confirmamos por WhatsApp. ','For 25 kg sacks there is a special volume price, which we confirm on WhatsApp. '):'')+gL('Entrega y forma de pago se acuerdan por WhatsApp. Aún no cobramos en línea.','Delivery and payment are arranged on WhatsApp. We do not charge online yet.')+'</p><div class="cdat"><label>'+gL('Tu nombre (opcional)','Your name (optional)')+'<input type="text" id="c-nom" maxlength="60" autocomplete="name"></label><label>'+gL('Ubicación o departamento (opcional)','Location or department (optional)')+'<input type="text" id="c-ubi" maxlength="60" autocomplete="address-level1"></label></div><a class="btn wa" id="c-wa" href="'+msgWA()+'" target="_blank" rel="noopener">'+gL('Enviar pedido por WhatsApp','Send order on WhatsApp')+'</a><button type="button" class="vaciar" data-vaciar>'+gL('Vaciar carrito','Empty cart')+'</button>';
    var iN=q('#c-nom',cf),iU=q('#c-ubi',cf),aW=q('#c-wa',cf);
    iN.value=cNom;iU.value=cUbi;
    function sync(){cNom=iN.value.replace(/\s+/g,' ').trim();cUbi=iU.value.replace(/\s+/g,' ').trim();aW.href=msgWA()}
    iN.addEventListener('input',sync);iU.addEventListener('input',sync);
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

/* Selector de motivo antes de abrir WhatsApp */
(function(){
  var WA='50242794894',dlg=null,last=null;
  var OPT=[
    ['🛒',gL('Consumidor final','End consumer'),gL('Quiero comprar carbón para mi casa','I want to buy charcoal for home'),
      gL('Hola, soy consumidor final y quiero comprar carbón ECOCOCO (bolsa de 1 kg).\nCantidad: \nUbicación / departamento: ','Hi, I am an end consumer and I want to buy ECOCOCO charcoal (1 kg bag).\nQuantity: \nLocation / department: ')],
    ['🏪',gL('Tienda o abarrotes','Shop or grocery store'),gL('Quiero surtir mi negocio','I want to stock my shop'),
      gL('Hola, tengo una tienda o abarrotería y quiero información para vender ECOCOCO.\nNombre del negocio: \nCantidad aproximada (kg): \nUbicación / departamento: ','Hi, I have a shop or grocery store and I want information to sell ECOCOCO.\nBusiness name: \nApproximate quantity (kg): \nLocation / department: ')],
    ['🍖',gL('Restaurante o parrillada','Restaurant or grill'),gL('Uso el carbón en mi cocina o asador','I use charcoal in my kitchen or grill'),
      gL('Hola, tengo un restaurante o parrillada y quiero cotizar carbón ECOCOCO.\nNombre del negocio: \nConsumo aproximado por semana (kg): \nUbicación / departamento: ','Hi, I have a restaurant or grill and I would like a quote for ECOCOCO charcoal.\nBusiness name: \nApproximate weekly use (kg): \nLocation / department: ')],
    ['🚚',gL('Distribuidor o mayorista','Distributor or wholesaler'),gL('Bultos de 25 kg y precio por volumen','25 kg sacks and volume price'),
      gL('Hola, quiero ser distribuidor o comprar al por mayor (bultos de 25 kg) de ECOCOCO.\nNegocio: \nCantidad (kg): \nUbicación / departamento: ','Hi, I want to become a distributor or buy ECOCOCO wholesale (25 kg sacks).\nBusiness: \nQuantity (kg): \nLocation / department: ')],
    ['💬',gL('Quiero más información','I want more information'),gL('Tengo preguntas sobre el producto','I have questions about the product'),
      gL('Hola, quiero más información sobre el carbón ECOCOCO.','Hi, I would like more information about ECOCOCO charcoal.')]
  ];
  function cerrar(){if(!dlg)return;dlg.hidden=true;document.body.classList.remove('noscroll');if(last&&last.focus)last.focus()}
  function build(){
    dlg=document.createElement('div');dlg.className='wch';dlg.hidden=true;dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-label',gL('¿Qué necesitas?','What do you need?'));
    dlg.innerHTML='<div class="wch-in"><div class="wch-h"><h2>'+gL('¿Qué necesitas?','What do you need?')+'</h2><button type="button" class="ovl-x" aria-label="'+gL('Cerrar','Close')+'">✕</button></div><p class="wch-s">'+gL('Elige una opción y abrimos WhatsApp con el mensaje listo.','Choose an option and we open WhatsApp with the message ready.')+'</p><div class="wch-l">'+
      OPT.map(function(o,i){return '<button type="button" data-o="'+i+'"><span class="wch-i" aria-hidden="true">'+o[0]+'</span><span><b>'+o[1]+'</b><small>'+o[2]+'</small></span></button>'}).join('')+'</div></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click',function(e){
      if(e.target===dlg||e.target.closest('.ovl-x')){cerrar();return}
      var b=e.target.closest('[data-o]');if(!b)return;
      var o=OPT[+b.getAttribute('data-o')];
      if(window.geaTrack)geaTrack('click_whatsapp',{pagina:location.pathname,destino:'selector: '+o[1]});
      window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(o[3]),'_blank','noopener');
      cerrar();
    });
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="https://wa.me/'+WA+'"]');
    if(!a||e.defaultPrevented)return;
    if(a.id==='c-wa'||a.id==='calc-wa'||a.hasAttribute('data-direct')||a.closest('.form-ok'))return;
    if(/25%20kg/.test(a.getAttribute('href'))&&/cotizar/i.test(a.getAttribute('href')))return;
    e.preventDefault();
    if(!dlg)build();
    last=a;dlg.hidden=false;document.body.classList.add('noscroll');
    var f=dlg.querySelector('[data-o]');if(f)f.focus();
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dlg&&!dlg.hidden)cerrar()});
})();

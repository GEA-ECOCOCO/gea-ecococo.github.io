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
  var PRECIO = 20, GRANDE = 50, actual = 0, anim = 0;
  function pintar(n) { tot.textContent = 'Q' + Math.round(n).toLocaleString('es-GT'); }
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
      ? 'Para pedidos grandes te cotizamos precio por volumen por WhatsApp.'
      : 'Precio al consumidor final: Q20 por kg. Venta de contado.';
    var msg = 'Hola, quiero ' + v + ' kg de briquetas ECOCOCO. ¿Disponibilidad y entrega?';
    wa.href = 'https://wa.me/50242794894?text=' + encodeURIComponent(msg);
    document.querySelectorAll('.chips button').forEach(function (b) {
      b.classList.toggle('on', parseInt(b.getAttribute('data-k'), 10) === v);
    });
  }
  kg.addEventListener('input', actualizar);
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
  var TEXTO = 'ECOCOCO: briquetas de carbón de cáscara de coco hechas en Retalhuleu, Guatemala.';
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
      ['Correo', '✉', '#5A6A7A', 'mailto:?subject=' + e('ECOCOCO | Briquetas de carbón de cáscara de coco') + '&body=' + e(ut)]
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
      navigator.clipboard.writeText(u).then(function () { aviso('¡Enlace copiado!'); }, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = u; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); aviso('¡Enlace copiado!'); } catch (x) { aviso('Copia el enlace de la barra'); }
      ta.remove();
    }
  }
  function abrir() {
    var h = '<div class="panel"><button type="button" class="cerrar" aria-label="Cerrar">✕</button>' +
      '<h3>Compartir ECOCOCO</h3><p class="sub">Elige dónde quieres compartir esta página.</p><div class="redes">';
    if (navigator.share) h += '<button type="button" data-nativo><i style="background:linear-gradient(135deg,#8BE000,#1FA23A);color:#04100A">↗</i>Más opciones</button>';
    redes().forEach(function (r) {
      h += '<a href="' + r[3] + '" target="_blank" rel="noopener"><i style="background:' + r[2] + '">' + r[1] + '</i>' + r[0] + '</a>';
    });
    h += '<button type="button" data-copiar><i style="background:#2f4a3a">🔗</i>Copiar enlace</button></div>' +
      '<p class="nota">Para Instagram y TikTok no existe un botón directo: usa «Más opciones» en tu teléfono o copia el enlace y pégalo en tu publicación o historia.</p></div>';
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
    kgEl.textContent = kg.toLocaleString('es-GT') + ' kg';
    var q = document.getElementById('b-q'); if (q) q.textContent = 'Q' + (n * 350).toLocaleString('es-GT');
    nota.textContent = n === 1
      ? 'Un bulto sirve para entrega en Retalhuleu y la Costa Sur. Para otros departamentos el mínimo son 2 bultos (50 kg).'
      : 'El precio de lista es referencial: con este volumen te cotizamos precio especial y confirmamos la fecha de entrega.';
    var msg = 'Hola, soy mayorista y quiero ' + n + (n === 1 ? ' bulto' : ' bultos') + ' de 25 kg de ECOCOCO (' + kg + ' kg). Quiero conocer el precio especial por volumen.\nNegocio: \nUbicación: ';
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
  var PROD={k1:{n:'ECOCOCO, bolsa de 1 kg',p:20},k25:{n:'ECOCOCO, bulto de 25 kg',p:350}};
  var IDX=[
   ['Quiénes somos','Visión industrial y sostenible de GEA EcoCoco','quienes-somos.html','empresa visión misión gea retalhuleu'],
   ['Nuestro producto','Briquetas ECOCOCO: beneficios, por qué enciende rápido, uso seguro','producto.html','briqueta carbón coco enciende resistencia calor seguridad monóxido'],
   ['Míralo encender','Video y fotos de las briquetas en la brasa','en-accion.html','video fotos brasa parrilla encender'],
   ['Proceso de producción','De la cáscara de coco a la briqueta','proceso.html','cáscara carbonización molienda mezcla secado'],
   ['Bitácora de la planta','Avance real: hornos, pruebas y primeros lotes','bitacora.html','planta horno pruebas lotes avance'],
   ['Precios','Q20 por kg · bulto de 25 kg a Q350 · calculadora','precios.html','precio costo cuánto bulto kg calculadora mayorista'],
   ['Distribuidores y mayoristas','Condiciones comerciales y pedidos por volumen','distribuidores.html','distribuidor mayorista tienda restaurante volumen negocio'],
   ['Impacto ambiental','Datos de los residuos de coco y del aceite usado, y cómo los reducimos','impacto-ambiental.html','ambiente aceite reciclado contaminación leña guatemala residuos'],
   ['Contacto','WhatsApp 4279-4894 y correo','contacto.html','whatsapp teléfono correo pedido'],
   ['Entregas y devoluciones','Cómo entregamos y cuándo aplican devoluciones','entregas-devoluciones.html','envío entrega devolución'],
   ['Términos y condiciones','Condiciones de uso y compra','terminos.html','términos legal'],
   ['Privacidad','Cómo tratamos tus datos','privacidad.html','datos privacidad']
  ];
  function norm(t){return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
  var q=function(s,r){return (r||document).querySelector(s)};
  var body=document.body;
  /* ---- almacenamiento ---- */
  var cart={};
  try{cart=JSON.parse(localStorage.getItem('carrito-ecococo')||'{}')||{}}catch(e){cart={}}
  Object.keys(cart).forEach(function(k){if(!PROD[k]||!(cart[k]>0))delete cart[k]});
  function save(){try{localStorage.setItem('carrito-ecococo',JSON.stringify(cart))}catch(e){}}
  function Q(n){return 'Q'+n.toLocaleString('es-GT')}
  /* ---- DOM ---- */
  var wrap=document.createElement('div');
  wrap.innerHTML=
   '<div id="buscar" class="ovl" role="dialog" aria-modal="true" aria-label="Buscar" hidden><div class="ovl-in"><div class="ovl-top"><h2>¿Qué estás buscando?</h2><button type="button" class="ovl-x" aria-label="Cerrar">✕</button></div><form data-buscar-form2 role="search" class="bx"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="Busca precios, proceso, distribuidores…" aria-label="Buscar"><button type="submit" class="go" aria-label="Buscar">→</button></form><ul class="res"></ul></div></div>'+
   '<div id="cart-bg" class="cart-bg" hidden></div>'+
   '<aside id="carrito" class="cart" role="dialog" aria-modal="true" aria-label="Tu carrito" aria-hidden="true"><div class="cart-h"><h2>Tu carrito</h2><button type="button" class="ovl-x" aria-label="Cerrar carrito">✕</button></div><div class="cart-b"></div><div class="cart-f"></div></aside>';
  while(wrap.firstChild)body.appendChild(wrap.firstChild);
  var sb=q('#buscar'),sin=q('input',sb),sres=q('.res',sb),cd=q('#carrito'),cbg=q('#cart-bg'),cb=q('.cart-b',cd),cf=q('.cart-f',cd);
  /* ---- buscador ---- */
  function render(t){
    var n=norm(t).split(/\s+/).filter(Boolean),out=[];
    if(n.length){IDX.forEach(function(it){
      var h=norm(it[0]+' '+it[1]+' '+it[3]),ok=n.every(function(w){return h.indexOf(w)>-1});
      if(ok)out.push(it)})}
    var pr=n.length&&n.some(function(w){return /precio|carrito|comprar|bolsa|bulto|kg|ecococo|carbon|briqueta/.test(w)});
    var h='';
    if(pr){h+='<li class="prodres"><div><b>ECOCOCO, bolsa de 1 kg</b><span>Q20</span></div><button type="button" class="btn pill add" data-add="k1">Agregar</button></li><li class="prodres"><div><b>ECOCOCO, bulto de 25 kg</b><span>Q350</span></div><button type="button" class="btn pill add" data-add="k25">Agregar</button></li>'}
    out.forEach(function(it){h+='<li><a href="'+it[2]+'"><b>'+it[0]+'</b><span>'+it[1]+'</span></a></li>'});
    if(!h)h=n.length?'<li class="vacio">No encontramos resultados. Escríbenos por <a href="https://wa.me/'+WA+'">WhatsApp</a> y te ayudamos.</li>':'<li class="vacio">Prueba con: precios, proceso, distribuidores, impacto…</li>';
    sres.innerHTML=h}
  function abrirB(v){closeC();sb.hidden=false;body.classList.add('noscroll');sin.value=v||'';render(v||'');setTimeout(function(){sin.focus()},30)}
  function cerrarB(){sb.hidden=true;if(cd.getAttribute('aria-hidden')!=='false')body.classList.remove('noscroll')}
  sin.addEventListener('input',function(){render(sin.value)});
  q('form',sb).addEventListener('submit',function(e){e.preventDefault();var f=sres.querySelector('a');if(f)location.href=f.href});
  /* ---- carrito ---- */
  function count(){return Object.keys(cart).reduce(function(a,k){return a+cart[k]},0)}
  function total(){return Object.keys(cart).reduce(function(a,k){return a+cart[k]*PROD[k].p},0)}
  function paint(){
    var n=count();
    document.querySelectorAll('.cart-n').forEach(function(b){b.textContent=n;b.hidden=!n});
    var ks=Object.keys(cart);
    if(!ks.length){cb.innerHTML='<p class="vacio">Tu carrito está vacío. Agrega tu carbón ECOCOCO para armar tu pedido.</p><p><button type="button" class="btn pill add" data-add="k1">Agregar bolsa 1 kg · Q20</button></p><p><button type="button" class="btn pill add" data-add="k25">Agregar bulto 25 kg · Q350</button></p>';cf.innerHTML='';return}
    cb.innerHTML=ks.map(function(k){var p=PROD[k];return '<div class="li"><div class="li-t"><b>'+p.n+'</b><span>'+Q(p.p)+' c/u</span></div><div class="li-q"><button type="button" data-q="-1" data-k="'+k+'" aria-label="Quitar uno">−</button><span>'+cart[k]+'</span><button type="button" data-q="1" data-k="'+k+'" aria-label="Agregar uno">+</button></div><div class="li-s">'+Q(cart[k]*p.p)+'</div><button type="button" class="li-x" data-del="'+k+'" aria-label="Eliminar">✕</button></div>'}).join('');
    var msg='Hola, quiero hacer este pedido de ECOCOCO:%0A'+ks.map(function(k){return '• '+cart[k]+' × '+PROD[k].n+' = '+Q(cart[k]*PROD[k].p)}).map(encodeURIComponent).join('%0A')+'%0A'+encodeURIComponent('Total estimado: '+Q(total()))+'%0A'+encodeURIComponent('Mi nombre y ubicación: ');
    var bulto=cart.k25>0;
    cf.innerHTML='<div class="tot"><span>Total estimado</span><b>'+Q(total())+'</b></div><p class="nota">Precio a consumidor final. '+(bulto?'En bultos de 25 kg hay precio especial según volumen, lo confirmamos por WhatsApp. ':'')+'Entrega y forma de pago se acuerdan por WhatsApp. Aún no cobramos en línea.</p><a class="btn wa" href="https://wa.me/'+WA+'?text='+msg+'">Enviar pedido por WhatsApp</a><button type="button" class="vaciar" data-vaciar>Vaciar carrito</button>'}
  var last=null;
  function abrirC(){sb.hidden=true;last=document.activeElement;cd.setAttribute('aria-hidden','false');cbg.hidden=false;body.classList.add('noscroll');cd.classList.add('on');paint();q('.ovl-x',cd).focus()}
  function closeC(){cd.setAttribute('aria-hidden','true');cd.classList.remove('on');cbg.hidden=true;if(sb.hidden)body.classList.remove('noscroll')}
  function add(k,n){cart[k]=(cart[k]||0)+(n||1);if(cart[k]<=0)delete cart[k];save();paint()}
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

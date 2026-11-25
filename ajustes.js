/* Configuración del visitante: sonido, voz del asistente, animaciones, tamaño de texto e idioma.
   Todo se guarda solo en este dispositivo (localStorage). Se abre con el botón de engranaje, junto al menú. */
(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en', L = function (a, b) { return EN ? b : a };
  var d = document.documentElement;
  function get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function put(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k) } catch (e) {} }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e }
  var IC = {
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  function svg(n, z) { return '<svg viewBox="0 0 24 24" width="' + z + '" height="' + z + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>' }

  /* ---------- aplicar ajustes ---------- */
  function aplicaTexto(n) { d.style.fontSize = n > 0 ? ['', '112.5%', '125%'][n] : '' }
  function aplicaAnim(si) { d.classList.toggle('sin-anim', !si) }
  var chatDisp = function () { try { window.dispatchEvent(new Event('gea-chat-mute')) } catch (e) {} };

  /* ---------- panel ---------- */
  var bg = null, pn = null, btn = null, ult = null;
  function sw(id, titulo, ayuda, activo, fn) {
    var r = el('div', 'aj-r'), tx = el('div', 'aj-t', '<b>' + titulo + '</b>' + (ayuda ? '<small>' + ayuda + '</small>' : ''));
    var b = el('button', 'aj-sw'); b.type = 'button'; b.setAttribute('role', 'switch'); b.id = id; b.setAttribute('aria-label', titulo);
    b.innerHTML = '<i></i>'; var est = !!activo;
    function p() { b.setAttribute('aria-checked', est ? 'true' : 'false') } p();
    b.addEventListener('click', function () { est = !est; p(); fn(est) });
    r.appendChild(tx); r.appendChild(b); r._set = function (v) { est = !!v; p() }; return r;
  }
  function seccion(t) { return el('h3', 'aj-h', t) }
  function construir() {
    bg = el('div', 'aj-bg'); bg.hidden = true;
    pn = el('div', 'aj'); pn.hidden = true; pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-modal', 'true'); pn.setAttribute('aria-label', L('Configuración', 'Settings'));
    var hd = el('div', 'aj-hd'), x = el('button', 'aj-x', svg('x', 20)); x.type = 'button'; x.setAttribute('aria-label', L('Cerrar', 'Close'));
    hd.appendChild(el('div', 'aj-tt', '<b>' + L('Configuración', 'Settings') + '</b><small>' + L('Personaliza tu visita', 'Make the site yours') + '</small>')); hd.appendChild(x);
    var bd = el('div', 'aj-bd'), filas = [];
    function add(n) { bd.appendChild(n); return n }

    add(seccion(L('Sonido', 'Sound')));
    var snd = add(sw('aj-snd', L('Sonidos de la página', 'Page sounds'), L('Logo sonoro al abrir y al pasar entre ECOCOCO y Consultora', 'Sonic logo on opening and when moving between ECOCOCO and Consultora'), window.geaSonidoOn ? window.geaSonidoOn() : get('gea-sound') !== '0', function (v) { if (window.geaSonidoSet) window.geaSonidoSet(v); else put('gea-sound', v ? '1' : '0') }));
    var vr = el('div', 'aj-r aj-vol'), v0 = parseInt(get('gea-vol'), 10); if (isNaN(v0)) v0 = 85;
    var rg = el('input'); rg.type = 'range'; rg.min = 0; rg.max = 100; rg.step = 5; rg.value = v0; rg.setAttribute('aria-label', L('Volumen', 'Volume'));
    var pb = el('button', 'aj-b', L('Probar', 'Test')); pb.type = 'button';
    vr.appendChild(el('div', 'aj-t', '<b>' + L('Volumen', 'Volume') + '</b>')); vr.appendChild(rg); vr.appendChild(pb);
    rg.addEventListener('input', function () { put('gea-vol', rg.value) });
    pb.addEventListener('click', function () { put('gea-vol', rg.value); if (window.geaProbarSonido) window.geaProbarSonido() });
    add(vr);

    if ('speechSynthesis' in window) {
      add(seccion(L('Asistente', 'Assistant')));
      add(sw('aj-voz', L('Leer respuestas en voz alta', 'Read answers aloud'), L('Cuando le hablas al asistente con el micrófono', 'When you talk to the assistant with the microphone'), get('gea-chat-mute') !== '1', function (v) { put('gea-chat-mute', v ? '0' : '1'); chatDisp() }));
    }

    add(seccion(L('Pantalla', 'Display')));
    add(sw('aj-anim', L('Animaciones y transiciones', 'Animations and transitions'), L('Apágalas si tu teléfono va lento o te molestan', 'Turn off if your phone is slow or they bother you'), get('gea-anim') !== '0', function (v) { put('gea-anim', v ? '1' : '0'); aplicaAnim(v) }));
    var tr = el('div', 'aj-r aj-fs'), f0 = parseInt(get('gea-fs'), 10) || 0, sg = el('div', 'aj-seg'); sg.setAttribute('role', 'group'); sg.setAttribute('aria-label', L('Tamaño del texto', 'Text size'));
    [[0, 'A', L('Normal', 'Normal')], [1, 'A', L('Grande', 'Large')], [2, 'A', L('Muy grande', 'Extra large')]].forEach(function (o) {
      var b = el('button', 'aj-s' + o[0], o[1]); b.type = 'button'; b.setAttribute('aria-label', o[2]); b.title = o[2]; b.setAttribute('aria-pressed', o[0] === f0 ? 'true' : 'false');
      b.addEventListener('click', function () { f0 = o[0]; if (f0) put('gea-fs', String(f0)); else del('gea-fs'); aplicaTexto(f0); [].forEach.call(sg.children, function (c, i) { c.setAttribute('aria-pressed', i === f0 ? 'true' : 'false') }) });
      sg.appendChild(b);
    });
    tr.appendChild(el('div', 'aj-t', '<b>' + L('Tamaño del texto', 'Text size') + '</b>')); tr.appendChild(sg); add(tr);

    var lang = document.querySelector('a.lang-sw[href]');
    if (lang) {
      add(seccion(L('Idioma', 'Language')));
      var lr = el('div', 'aj-r'), la = el('a', 'aj-b aj-l', (EN ? 'Español' : 'English')); la.href = lang.getAttribute('href'); la.hreflang = EN ? 'es' : 'en';
      lr.appendChild(el('div', 'aj-t', '<b>' + (EN ? 'Cambiar a español' : 'Switch to English') + '</b>')); lr.appendChild(la); add(lr);
    }

    var ft = el('div', 'aj-ft'), rs = el('button', 'aj-b aj-rs', L('Restablecer ajustes', 'Reset settings')); rs.type = 'button';
    rs.addEventListener('click', function () {
      ['gea-vol', 'gea-sound', 'gea-fs', 'gea-anim', 'gea-chat-mute'].forEach(del);
      aplicaTexto(0); aplicaAnim(true); chatDisp(); if (window.geaSonidoSet) window.geaSonidoSet(true); abrirNuevo();
    });
    ft.appendChild(rs); ft.appendChild(el('p', '', L('Tus ajustes se guardan solo en este dispositivo.', 'Your settings are saved only on this device.')));
    pn.appendChild(hd); pn.appendChild(bd); pn.appendChild(ft); document.body.appendChild(bg); document.body.appendChild(pn);
    bg.addEventListener('click', cerrar); x.addEventListener('click', cerrar);
    pn.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cerrar(); return }
      if (e.key !== 'Tab') return;
      var f = pn.querySelectorAll('button,a[href],input'), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    });
  }
  function abrirNuevo() { if (pn) { pn.parentNode.removeChild(pn); bg.parentNode.removeChild(bg); pn = bg = null } abrir(true) }
  function abrir(mantener) {
    if (!pn) construir();
    ult = mantener && ult ? ult : document.activeElement;
    bg.hidden = false; pn.hidden = false; void pn.offsetWidth; bg.classList.add('on'); pn.classList.add('on'); d.classList.add('aj-open');
    var x = pn.querySelector('.aj-x'); if (x) x.focus();
    try { window.geaTrack && geaTrack('abrir_ajustes', {}) } catch (e) {}
  }
  function cerrar() {
    if (!pn) return; bg.classList.remove('on'); pn.classList.remove('on'); d.classList.remove('aj-open');
    setTimeout(function () { if (pn) { pn.hidden = true; bg.hidden = true } }, 330);
    if (ult && ult.focus) { try { ult.focus() } catch (e) {} } ult = null;
  }

  /* ---------- botón junto al menú ---------- */
  function boton() {
    var nav = document.querySelector('nav .wrap'); if (!nav || nav.querySelector('.aj-btn')) return;
    btn = el('button', 'share-btn aj-btn', svg('gear', 20)); btn.type = 'button'; btn.setAttribute('data-ajustes', ''); btn.setAttribute('aria-label', L('Configuración', 'Settings')); btn.title = L('Configuración', 'Settings');
    var ref = nav.querySelector('.share-btn'); if (ref) nav.insertBefore(btn, ref); else nav.appendChild(btn);
    btn.addEventListener('click', function () { abrir() });
  }
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-open-ajustes]'); if (a) { e.preventDefault(); abrir() } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boton); else boton();
})();

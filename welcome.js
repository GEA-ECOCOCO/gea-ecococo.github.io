/* Bienvenida sonora de ECOCOCO: sonido de marca (sin voz).
   - Se oye al abrir la app instalada (junto con la pantalla de la G) y, si el navegador lo permite, al entrar al inicio del sitio.
   - Una sola vez por sesión; se puede apagar en el botón del pie de página o en la pantalla de inicio.
   - El sonido se genera en el dispositivo (Web Audio): no pesa y funciona sin conexión. */
(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en', L = function (a, b) { return EN ? b : a };
  var KEY = 'gea-sound', SKEY = 'gea-welcome';
  function get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function put(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
  function sget(k) { try { return sessionStorage.getItem(k) } catch (e) { return null } }
  function sput(k, v) { try { sessionStorage.setItem(k, v) } catch (e) {} }
  function on() { return get(KEY) !== '0' }

  var AC = window.AudioContext || window.webkitAudioContext, TTS = window.speechSynthesis;
  var ctx = null, vozAudio = null, vozTimer = 0, parado = false;

  /* ---------- Sonido de marca futurista (barrido + pulsos de datos + impacto + campanas FM) ---------- */
  function impulso(c, seg) {
    var n = Math.floor(c.sampleRate * seg), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6) }
    return b;
  }

  /* ---------- Sonido de marca: marimba del futuro ---------- */
  function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }
  function bus(c, dest, wet, sec, gain) {
    var m = c.createGain(), s = c.createGain(), h = c.createGain(), r = c.createConvolver();
    m.gain.value = gain; r.buffer = impulso(c, sec); s.gain.value = 0.8; h.gain.value = wet;
    m.connect(s); m.connect(r); r.connect(h); s.connect(dest); h.connect(dest); return m;
  }
  function eg(c, g, t, a, v, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d) }
  function ruido(c, seg) { var b = c.createBuffer(1, Math.floor(c.sampleRate * seg), c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; var s = c.createBufferSource(); s.buffer = b; return s }
  function tono(c, out, tipo, f, t, a, v, d) {
    var o = c.createOscillator(), g = c.createGain(); o.type = tipo; o.frequency.value = f; eg(c, g, t, a, v, d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05); return o;
  }
  function tok(c, out, t, v, f) { /* golpe seco de coco: ruido filtrado + cuerpo que cae de tono */
    var n = ruido(c, 0.1), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 7; eg(c, g, t, 0.002, v, 0.07); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.1);
    var o = c.createOscillator(), g2 = c.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.09);
    eg(c, g2, t, 0.002, v * 1.2, 0.12); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.15);
  }
  function marimba(c, out, f, t, v) { /* barra de marimba: fundamental + armónicos 4x y 10x que mueren rápido */
    tono(c, out, 'sine', f, t, 0.003, v, 1.5); tono(c, out, 'sine', f * 4, t, 0.002, v * 0.3, 0.28); tono(c, out, 'sine', f * 10, t, 0.001, v * 0.08, 0.07);
  }
  function eco(c, src, out, seg, fb, nivel) {
    var d = c.createDelay(1), g = c.createGain(), o = c.createGain(); d.delayTime.value = seg; g.gain.value = fb; o.gain.value = nivel;
    src.connect(d); d.connect(g); g.connect(d); d.connect(o); o.connect(out);
  }
  function pad(c, out, fr, t, a, v, d, corte) {
    fr.forEach(function (f, i) {
      var o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (i % 2 ? 7 : -7);
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(corte, t + a); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.05);
    });
  }

  /* Marimba del futuro: tok-tok de coco + frase de marimba (pentatónica) con eco + pad y brillo digital */
  function sonA(c, dest, t0) {
    var m = bus(c, dest, 0.34, 2.4, 1.2), v = c.createGain(); v.gain.value = 1; v.connect(m); eco(c, v, m, 0.19, 0.34, 0.42);
    tok(c, v, t0, 0.5, 210); tok(c, v, t0 + 0.17, 0.4, 260);
    [[246.94, .45], [329.63, .60], [415.30, .75], [493.88, .90]].forEach(function (x, i) { marimba(c, v, x[0], t0 + x[1], 0.34 - i * 0.02) });
    marimba(c, v, 659.25, t0 + 1.12, 0.42); marimba(c, v, 329.63, t0 + 1.12, 0.26);
    pad(c, m, [164.81, 246.94, 329.63, 415.30], t0 + 0.6, 1.3, 0.035, 3.0, 1400);
    tono(c, m, 'sine', 82.41, t0 + 0.9, 0.5, 0.2, 2.4);
    [[2637.0, 1.35], [3951.07, 1.5], [3322.4, 1.66], [5274.0, 1.85]].forEach(function (x) { tono(c, m, 'sine', x[0], t0 + x[1], 0.004, 0.03, 0.9) });
  }
  window.geaSonidoMarca = sonA;


  /* ---------- Sonido tecnológico (sin marimba): barrido + pulsos de datos + arpegio sintético + campana FM ---------- */
  function blip(c, out, f, t, v, pan) {
    var o = c.createOscillator(), g = c.createGain(), last = out;
    o.type = 'sine'; o.frequency.value = f; eg(c, g, t, 0.002, v, 0.07); o.connect(g);
    if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); p.connect(out) } else g.connect(out);
    o.start(t); o.stop(t + 0.12);
  }
  function secuencia(c, out, notas, t, paso, v, tipo, corte) {
    notas.forEach(function (f, i) {
      var o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), tt = t + i * paso;
      o.type = tipo || 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = corte || 3800; lp.Q.value = 3;
      eg(c, g, tt, 0.004, v * (0.75 + 0.25 * i / Math.max(1, notas.length - 1)), 0.16); o.connect(lp); lp.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.22);
    });
  }
  function barrido(c, out, t, dur, v, de, a) {
    var n = ruido(c, dur + 0.1), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.setValueAtTime(de, t); bp.frequency.exponentialRampToValueAtTime(a, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.92); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + dur + 0.1);
  }
  function campanaFM(c, out, f, t, v, d) {
    var o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f; m.type = 'sine'; m.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + d * 0.7);
    m.connect(mg); mg.connect(o.frequency); eg(c, g, t, 0.003, v, d); o.connect(g); g.connect(out);
    o.start(t); m.start(t); o.stop(t + d + 0.05); m.stop(t + d + 0.05);
  }
  var PENTA = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77, 1318.51, 1661.22];
  /* Inicio: «sistema en línea» (primera apertura de la app o del sitio) */
  function sonT(c, dest, t0) {
    var m = bus(c, dest, 0.3, 2.0, 1.15), v = c.createGain(); v.gain.value = 1; v.connect(m); eco(c, v, m, 0.16, 0.32, 0.38);
    tono(c, m, 'sine', 55, t0, 0.25, 0.22, 0.9);                       /* arranque grave */
    barrido(c, m, t0 + 0.05, 0.95, 0.5, 300, 7000);
    [1760, 2349, 2093, 2794, 3136, 2637, 3520].forEach(function (f, i) { blip(c, v, f, t0 + 0.12 + i * 0.12, 0.12, (i % 2 ? 0.6 : -0.6)) });
    secuencia(c, v, PENTA.concat([1975.53]), t0 + 0.5, 0.085, 0.16, 'triangle', 4200);
    var T = t0 + 1.35;                                                   /* confirmación */
    campanaFM(c, m, 659.25, T, 0.30, 2.0); campanaFM(c, m, 987.77, T + 0.02, 0.22, 2.0); campanaFM(c, m, 1318.51, T + 0.04, 0.2, 1.8);
    pad(c, m, [164.81, 246.94, 329.63, 493.88], T - 0.1, 0.5, 0.03, 2.4, 2600);
    tono(c, m, 'sine', 82.41, T, 0.25, 0.2, 1.8);
    [[3951.07, 0.35], [5274.0, 0.5], [4698.6, 0.65]].forEach(function (x) { blip(c, m, x[0], T + x[1], 0.05, 0) });
  }
  /* Hacia GEA Consultora: «conectando sistemas» (más rápido y ascendente) */
  function sonCons(c, dest, t0) {
    var m = bus(c, dest, 0.28, 1.8, 1.15), v = c.createGain(); v.gain.value = 1; v.connect(m); eco(c, v, m, 0.14, 0.3, 0.36);
    tono(c, m, 'sine', 65.41, t0, 0.18, 0.2, 0.7);
    barrido(c, m, t0, 0.62, 0.45, 400, 8000);
    [2093, 2637, 3136, 2349, 3520, 3136, 4186].forEach(function (f, i) { blip(c, v, f, t0 + 0.06 + i * 0.07, 0.11, (i % 2 ? 0.7 : -0.7)) });
    secuencia(c, v, PENTA, t0 + 0.2, 0.062, 0.15, 'triangle', 4600);
    var T = t0 + 0.78;
    campanaFM(c, m, 880, T, 0.28, 1.6); campanaFM(c, m, 1318.51, T + 0.02, 0.2, 1.5); campanaFM(c, m, 1975.53, T + 0.04, 0.14, 1.3);
    pad(c, m, [220, 329.63, 440, 659.25], T - 0.1, 0.35, 0.026, 1.7, 3000);
    [[4186, 0.25], [5587.7, 0.4]].forEach(function (x) { blip(c, m, x[0], T + x[1], 0.045, 0) });
  }
  window.geaSonidoTech = sonT; window.geaSonidoConsultora = sonCons;
  var QUE = 'T';
  var SONS = { T: sonT, C: sonCons, M: sonA };

  /* ---------- Voz femenina, lenta y cálida ---------- */
  var TXT = EN ? 'Welcome to... Jea... Eco Coco.' : 'Bienvenido a... Jea... Eco Coco.';
  function base() {
    var s = document.querySelector('script[src*="welcome.js"]');
    try { return new URL('audio/', s ? s.src : location.href).href } catch (e) { return 'audio/' }
  }
  function mejorVoz() {
    var vs = (TTS && TTS.getVoices && TTS.getVoices() || []).filter(function (v) { return (v.lang || '').toLowerCase().indexOf(EN ? 'en' : 'es') === 0 });
    if (!vs.length) return null;
    var pre = EN ? ['en-us', 'en-gb', 'en'] : ['es-gt', 'es-mx', 'es-us', 'es-419', 'es-co', 'es-ar', 'es-es', 'es'];
    function sc(v) {
      var n = (v.name || '').toLowerCase(), l = (v.lang || '').toLowerCase().replace('_', '-'), s = 0;
      if (/natural|neural|premium|enhanced|mejorad|wavenet|studio/.test(n)) s += 60;
      if (/online|google|microsoft|siri/.test(n)) s += 20;
      if (/female|mujer|marta|dalia|sabina|paulina|monica|mónica|helena|lucia|lucía|elvira|paloma|salome|salomé|valentina|esperanza|samantha|aria|jenny|zira|allison|ava|susan|karen|serena|catalina|female/.test(n)) s += 45;
      if (/male\b|hombre|jorge|diego|juan|carlos|pablo|raul|raúl|alvaro|álvaro|david|mark|guy|alex|daniel|fred/.test(n) && !/female/.test(n)) s -= 50;
      if (/compact|espeak|robot|novelty|bad news|whisper|zarvox|trinoids|bubbles|boing|cellos|hysterical/.test(n)) s -= 80;
      for (var k = 0; k < pre.length; k++) { if (l === pre[k] || l.indexOf(pre[k] + '-') === 0) { s += (pre.length - k) * 4; break } }
      return s;
    }
    vs.sort(function (a, b) { return sc(b) - sc(a) }); return vs[0];
  }
  function vozDispositivo() {
    if (!TTS || parado) return;
    function hablar() {
      if (parado) return;
      var u = new SpeechSynthesisUtterance(TXT), v = mejorVoz();
      u.lang = v ? v.lang : (EN ? 'en-US' : 'es-MX'); if (v) u.voice = v;
      u.rate = 0.8; u.pitch = 1.06; u.volume = 0.95;
      try { TTS.cancel(); TTS.speak(u) } catch (e) {}
    }
    if (TTS.getVoices && TTS.getVoices().length) hablar();
    else { var t = setTimeout(hablar, 700); try { TTS.addEventListener('voiceschanged', function f() { clearTimeout(t); TTS.removeEventListener('voiceschanged', f); hablar() }) } catch (e) {} }
  }
  function voz() {
    if (parado) return;
    var u = base() + 'bienvenida-' + (EN ? 'en' : 'es') + '.mp3';
    fetch(u, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) throw 0;
      if (parado) return;
      vozAudio = new Audio(u); vozAudio.volume = 0.95;
      return vozAudio.play();
    }).catch(vozDispositivo);
  }

  /* ---------- Orquestación ---------- */
  function parar() {
    parado = true; clearTimeout(vozTimer);
    try { if (vozAudio) vozAudio.pause() } catch (e) {}
    try { if (TTS) TTS.cancel() } catch (e) {}
    try { if (ctx && ctx.state === 'running') ctx.suspend() } catch (e) {}
  }
  function tocar(vozEn) {
    if (!ctx || parado) return;
    var t0 = ctx.currentTime + 0.05;
    try { SONS[QUE](ctx, ctx.destination, t0) } catch (e) {}
    try { window.geaTrack && geaTrack('sonido_bienvenida', {}) } catch (e) {}
  }
  function iniciar(esperaChime, vozEn, ventana) {
    if (!AC || !on()) return;
    try { ctx = new AC() } catch (e) { return }
    var hecho = false;
    function go() { if (hecho) return; hecho = true; ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.removeEventListener(ev, gesto, true) }); tocar(vozEn) }
    var limite = Date.now() + ventana * 1000;
    function gesto() { if (Date.now() > limite) return; var p = ctx.resume && ctx.resume(); (p && p.then ? p : Promise.resolve()).then(function () { if (ctx.state === 'running') go() }) }
    setTimeout(function () {
      if (parado) return;
      try { if (ctx.state === 'suspended' && ctx.resume) ctx.resume() } catch (e) {}
      /* resume() sin permiso del navegador se queda pendiente: se revisa el estado y, si sigue en pausa, se espera el primer toque */
      setTimeout(function () {
        if (parado || hecho) return;
        if (ctx.state === 'running') go();
        else ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, gesto, true) });
      }, 150);
    }, esperaChime * 1000);
    setTimeout(function () { ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.removeEventListener(ev, gesto, true) }) }, (esperaChime + ventana) * 1000);
  }

  var splash = document.documentElement.classList.contains('splash-on') && document.querySelector('.splash');
  var inicio = !!document.getElementById('lema');
  if (splash) {
    iniciar(0.15, 1.9, 3.4);
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sp-snd';
    function pintaSp() { var s = on(); b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/>' + (s ? '<path d="M15.5 9a4.2 4.2 0 010 6M18.2 6.5a7.8 7.8 0 010 11"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>') + '</svg>'; b.setAttribute('aria-label', s ? L('Silenciar la bienvenida', 'Mute the welcome sound') : L('Activar la bienvenida', 'Turn on the welcome sound')) }
    pintaSp();
    b.addEventListener('click', function () { var s = on(); put(KEY, s ? '0' : '1'); if (s) parar(); else { parado = false; try { if (!ctx) ctx = new AC(); ctx.resume && ctx.resume().then(function () { tocar(1.2) }) } catch (e) {} } pintaSp(); pintaPie() });
    splash.appendChild(b);
  } else if (window.geaCambio) {
    /* Cambio de ambiente: hacia Consultora/Tecnología suena tecnológico; de vuelta a ECOCOCO, la marimba de la marca */
    QUE = window.geaCambio[1] === 'carbon' ? 'M' : 'C';
    iniciar(0.2, 0, 3);
  } else if (inicio && !sget(SKEY)) {
    sput(SKEY, '1');
    iniciar(0.6, 2.4, 3);
  }

  /* ---------- Interruptor en el pie de página ---------- */
  var pieBtn = null;
  function pintaPie() { if (pieBtn) pieBtn.setAttribute('aria-pressed', on() ? 'true' : 'false'), pieBtn.lastChild.textContent = ' ' + (on() ? L('Sonido de bienvenida: sí', 'Welcome sound: on') : L('Sonido de bienvenida: no', 'Welcome sound: off')) }
  function pie() {
    var lang = document.querySelector('.pie-lang'); if (!lang || !lang.parentNode) return;
    var p = document.createElement('p'); p.className = 'pie-snd';
    pieBtn = document.createElement('button'); pieBtn.type = 'button'; pieBtn.className = 'pie-sh pie-sn';
    pieBtn.innerHTML = '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.5 9a4.2 4.2 0 010 6M18.2 6.5a7.8 7.8 0 010 11"/></svg><span></span>';
    pieBtn.addEventListener('click', function () {
      var s = on(); put(KEY, s ? '0' : '1'); pintaPie();
      if (s) { parar() } else {
        /* al activarlo, se escucha de inmediato (el toque cuenta como permiso del navegador) */
        parado = false;
        try { if (!ctx) ctx = new AC(); ctx.resume && ctx.resume().then(function () { tocar(1.9) }) } catch (e) {}
      }
    });
    p.appendChild(pieBtn); lang.parentNode.insertBefore(p, lang); pintaPie();
  }
  if (AC) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pie); else pie() }
})();

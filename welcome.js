/* Bienvenida sonora de ECOCOCO: un destello musical de tecnología y naturaleza + voz femenina pausada.
   - Se oye al abrir la app instalada (junto con la pantalla de la G) y, si el navegador lo permite, al entrar al inicio del sitio.
   - Una sola vez por sesión; se puede apagar en el botón del pie de página o en la pantalla de inicio.
   - El sonido se genera en el dispositivo (Web Audio): no pesa y funciona sin conexión.
   - La voz usa audio/bienvenida-es.mp3 (o -en.mp3) si existe; si no, la voz del dispositivo. */
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
  function chime(c, dest, t0) {
    var master = c.createGain(); master.gain.value = 1.5;
    var seco = c.createGain(), humedo = c.createGain(), rev = c.createConvolver();
    rev.buffer = impulso(c, 2.2); seco.gain.value = 0.8; humedo.gain.value = 0.38;
    master.connect(seco); master.connect(rev); rev.connect(humedo); seco.connect(dest); humedo.connect(dest);
    function env(g, t, a, v, dur) {
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    /* 1) Barrido ascendente: energía que se carga (sierra filtrada + aire) */
    var so = c.createOscillator(), sf = c.createBiquadFilter(), sg = c.createGain();
    so.type = 'sawtooth'; so.frequency.setValueAtTime(110, t0); so.frequency.exponentialRampToValueAtTime(880, t0 + 1.0);
    sf.type = 'lowpass'; sf.Q.value = 6; sf.frequency.setValueAtTime(250, t0); sf.frequency.exponentialRampToValueAtTime(7000, t0 + 1.0);
    sg.gain.setValueAtTime(0.0001, t0); sg.gain.exponentialRampToValueAtTime(0.11, t0 + 0.85); sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.12);
    so.connect(sf); sf.connect(sg); sg.connect(master); so.start(t0); so.stop(t0 + 1.2);
    var nb = c.createBuffer(1, Math.floor(c.sampleRate * 1.2), c.sampleRate), nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    var ns = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain();
    ns.buffer = nb; nf.type = 'bandpass'; nf.Q.value = 2.2;
    nf.frequency.setValueAtTime(400, t0); nf.frequency.exponentialRampToValueAtTime(9000, t0 + 1.0);
    ng.gain.setValueAtTime(0.0001, t0); ng.gain.exponentialRampToValueAtTime(0.16, t0 + 0.9); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.15);
    ns.connect(nf); nf.connect(ng); ng.connect(master); ns.start(t0); ns.stop(t0 + 1.2);
    /* 2) Pulsos de datos: microtonos digitales mientras se carga */
    [[1760, .18], [2093, .30], [2637, .42], [2093, .54], [3136, .66], [3520, .78]].forEach(function (x, i) {
      var o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = x[0];
      env(g, t0 + x[1], 0.004, 0.018 + i * 0.002, 0.06); o.connect(g); g.connect(master); o.start(t0 + x[1]); o.stop(t0 + x[1] + 0.08);
    });
    /* 3) Impacto: golpe grave digital que cae de tono */
    var T = t0 + 1.0, bo = c.createOscillator(), bg = c.createGain();
    bo.type = 'sine'; bo.frequency.setValueAtTime(140, T); bo.frequency.exponentialRampToValueAtTime(42, T + 0.7);
    env(bg, T, 0.01, 0.5, 1.0); bo.connect(bg); bg.connect(master); bo.start(T); bo.stop(T + 1.05);
    /* 4) Campanas de cristal FM: acorde lidio que se abre (E–B–F#–E) */
    [[659.25, 0], [987.77, .08], [1479.98, .16], [1318.51, .26], [1975.53, .38]].forEach(function (x, i) {
      var t = T + x[1], f = x[0], o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f; m.type = 'sine'; m.frequency.value = f * 3.5;
      mg.gain.setValueAtTime(f * 1.8, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.9);
      m.connect(mg); mg.connect(o.frequency); env(g, t, 0.006, 0.17 - i * 0.015, 1.7);
      o.connect(g); g.connect(master); o.start(t); m.start(t); o.stop(t + 1.75); m.stop(t + 1.75);
    });
    /* 5) Brillo final: destello agudo tipo circuito */
    [[3951.07, .55], [5274.0, .68]].forEach(function (x) {
      var t = T + x[1], o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = x[0];
      env(g, t, 0.004, 0.03, 0.5); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.55);
    });
  }
  window.geaChime = chime;

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
    try { chime(ctx, ctx.destination, t0) } catch (e) {}
    vozTimer = setTimeout(voz, vozEn * 1000);
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

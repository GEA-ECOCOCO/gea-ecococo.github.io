/* Panel GEA · interfaz. Una sola página: acceso, inicio, pedidos, clientes, inventario y ajustes. */
(function () {
  'use strict';
  var C = window.PanelCore, CFG = window.PANEL_CFG || {};
  var qs = new URLSearchParams(location.search);
  var DEMO = qs.get('demo') === '1' || !CFG.url;
  var S = { chat: [], pensando: false, sim: { cascara: 0, ventas: 0, precio: 0, fijos: 0 }, mode: DEMO ? 'demo' : 'live', token: null, user: null, snap: null, ruta: 'inicio', cargando: false, filtro: 'todos', q: '', qc: '', limite: 40, draft: null, intro: true };
  var SH = null;
  var LS = {
    get: function (k) { try { return localStorage.getItem(k) } catch (e) { return null } },
    set: function (k, v) { try { localStorage.setItem(k, v) } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k) } catch (e) {} }
  };

  /* ---------- utilidades ---------- */
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }
  function num(x) { x = parseFloat(x); return isFinite(x) ? x : 0 }
  function Q(x, d) { d = d === undefined ? 2 : d; return 'Q' + num(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) }
  function K(x) { return num(x).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' kg' }
  function hoy() { return new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10) }
  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fecha(iso) { if (!iso) return ''; var d = new Date(iso + 'T00:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MESES[d.getUTCMonth()] }
  function fechaRel(iso) { var h = hoy(); if (iso === h) return 'hoy'; if (iso === C.addDays(h, 1)) return 'mañana'; if (iso === C.addDays(h, -1)) return 'ayer'; return fecha(iso) }
  function inicial(nombre) { var p = String(nombre).replace(/^(tienda|abarrotes|comercial|mini|súper|super|parrilladas|distribuidora|carnicería)\s+/i, '').trim(); return (p[0] || '?').toUpperCase() }
  function tel(t) { t = String(t || '').replace(/\D/g, ''); return t.length === 8 ? t.slice(0, 4) + '-' + t.slice(4) : t }
  function waNum(t) { t = String(t || '').replace(/\D/g, ''); return t.length === 8 ? '502' + t : t }
  function $(sel, el) { return (el || document).querySelector(sel) }
  function isAdmin() { return S.user && S.user.rol === 'admin' }
  function isConta() { return S.user && S.user.rol === 'contador' }

  var P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    ped: '<path d="M7 4h10a2 2 0 0 1 2 2v14l-3-1.8L13 20l-3-1.8L7 20V6a2 2 0 0 1 0-2z" transform="translate(-1 0)"/><path d="M9 9h6M9 13h6"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.4-3.4 3-5.4 6.2-5.4s5.8 2 6.2 5.4"/><path d="M16 5a3.2 3.2 0 0 1 0 6M18 14.8c2 .6 3.1 2.3 3.4 5.2"/>',
    box: '<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    spark: '<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9z"/><path d="M18.5 15.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.9-1.5-1.3-2.8-1.3-1.6 0-2.7.8-2.7 2 0 2.8 5.6 1.4 5.6 4.2 0 1.2-1.2 2-2.9 2-1.3 0-2.4-.5-3-1.5M12 6.5v1.4M12 16.1v1.4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    wa: '<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 19z"/><path d="M9 8.5c.3 3 2.5 5.4 6 6.5l1.4-1.6-2.2-1-1 .8c-.9-.4-1.7-1.2-2.1-2.1l.8-1-1-2.2z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
    out: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M15 8l4 4-4 4M19 12H9"/>',
    sheet: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
    flame: '<path d="M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>'
  };
  function ic(n, extra) { return '<svg class="i ' + (extra || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + '</svg>' }

  /* ---------- modo demostración (mismas acciones reales, datos ficticios, guardados en este navegador) ---------- */
  var DB = null;
  function demoDb() {
    if (DB) return DB;
    var key = 'gea-panel-demo-' + hoy();
    try { var raw = LS.get(key); if (raw) DB = JSON.parse(raw) } catch (e) {}
    if (!DB) { DB = C.demoDb(hoy()); try { Object.keys(localStorage).filter(function (k) { return k.indexOf('gea-panel-demo-') === 0 }).forEach(function (k) { LS.del(k) }) } catch (e) {} LS.set(key, JSON.stringify(DB)) }
    return DB;
  }
  function demoGuardar() { LS.set('gea-panel-demo-' + hoy(), JSON.stringify(DB)) }
  function demoLlamar(req) {
    if (req.action === 'login') {
      var pin = String(req.pin || '').trim();
      if (pin === '123456') return { ok: true, data: { token: 'demo', user: { nombre: 'Manolo', rol: 'admin' } } };
      if (pin === '111111') return { ok: true, data: { token: 'demo', user: { nombre: 'Wilson', rol: 'vendedor' } } };
      if (pin === '222222') return { ok: true, data: { token: 'demo', user: { nombre: 'Contador', rol: 'contador' } } };
      return { ok: false, error: 'Clave incorrecta. En la demostración usa 123456 (administrador), 111111 (vendedor) o 222222 (contador).', code: 'clave' };
    }
    if (req.action === 'ia.preguntar') return { ok: true, data: { respuesta: 'Esto es una demostración: aquí tu asistente de IA analizaría tus números reales y te respondería con recomendaciones. En tu panel conectado a Google, esta pregunta (“' + req.pregunta + '”) se contestaría con tus datos de ventas, costos e inventario.' } };
    var res = C.handle(demoDb(), req, { user: S.user, today: hoy(), now: hoy() + ' ' + new Date().toTimeString().slice(0, 5), sheetUrl: 'https://docs.google.com/spreadsheets' });
    delete res.ops; demoGuardar();
    return res;
  }

  /* ---------- servidor ---------- */
  /* Ubicación automática: se pide una vez al entrar y se manda junto a cada registro. Si el teléfono la niega, el registro se guarda igual. */
  var GEO = { pos: null, t: 0 };
  function geoPedir() {
    return new Promise(function (ok) {
      if (!navigator.geolocation) return ok(null);
      if (GEO.pos && Date.now() - GEO.t < 120000) return ok(GEO.pos);
      var fin = false, tm = setTimeout(function () { if (!fin) { fin = true; ok(GEO.pos) } }, 5000);
      try {
        navigator.geolocation.getCurrentPosition(function (p) {
          GEO.pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }; GEO.t = Date.now();
          if (!fin) { fin = true; clearTimeout(tm); ok(GEO.pos) }
        }, function () { if (!fin) { fin = true; clearTimeout(tm); ok(GEO.pos) } }, { enableHighAccuracy: true, timeout: 4500, maximumAge: 60000 });
      } catch (e) { if (!fin) { fin = true; clearTimeout(tm); ok(null) } }
    });
  }
  var SIN_GEO = { login: 1, bootstrap: 1, ping: 1, 'ia.preguntar': 1 };
  function api(action, payload) {
    if (!SIN_GEO[action] && S.token) return geoPedir().then(function (g) { return api2(action, payload, g) });
    return api2(action, payload, null);
  }
  function api2(action, payload, geo) {
    var req = Object.assign({ action: action, token: S.token }, payload || {});
    if (geo) req.geo = geo;
    if (S.mode === 'demo') return new Promise(function (ok) { setTimeout(function () { ok(demoLlamar(req)) }, 120) });
    return fetch(CFG.url, { method: 'POST', body: JSON.stringify(req), redirect: 'follow' })
      .then(function (r) { return r.json() })
      .then(function (res) { if (res && res.code === 'auth') { salir(true) } return res })
      .catch(function () { return { ok: false, error: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', code: 'red' } });
  }
  function guardarSesion() { LS.set('gea-panel-s-' + S.mode, JSON.stringify({ token: S.token, user: S.user })) }
  function salir(vencida) {
    LS.del('gea-panel-s-' + S.mode); S.token = null; S.user = null; S.snap = null; S.ruta = 'inicio'; closeSheet(true);
    render(vencida ? 'Tu sesión venció. Entra de nuevo con tu clave.' : '');
  }
  function cargar(conAviso) {
    S.cargando = true; if (!S.snap) render();
    return api('bootstrap').then(function (res) {
      S.cargando = false;
      if (res.ok) { S.snap = res.snapshot; S.user = res.snapshot.user; render() }
      else if (conAviso !== false) { S.errCarga = res.error; render() }
    });
  }
  function aplicar(res) { if (res.ok && res.snapshot) { S.snap = res.snapshot; S.user = res.snapshot.user } }

  /* ---------- aviso ---------- */
  var tt;
  function toast(msg, bien) {
    var t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t) }
    t.textContent = msg; t.className = 'toast' + (bien ? ' bien' : '');
    requestAnimationFrame(function () { t.classList.add('on') }); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on') }, 3200);
  }

  /* ---------- hojas (formularios y detalles) ---------- */
  function openSheet(html) {
    closeSheet(true);
    var bg = document.createElement('div'); bg.className = 'sheet-bg';
    bg.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    document.body.appendChild(bg); document.body.classList.add('lock'); SH = bg;
    requestAnimationFrame(function () { bg.classList.add('on') });
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) closeSheet() });
    return bg.querySelector('.sheet');
  }
  function closeSheet(ya) {
    if (!SH) return; var bg = SH; SH = null; document.body.classList.remove('lock');
    if (ya) { bg.remove(); return }
    bg.classList.remove('on'); setTimeout(function () { bg.remove() }, 220);
  }
  function shHead(titulo, sub) { return '<div class="sh-h"><h2>' + esc(titulo) + (sub ? '<small>' + sub + '</small>' : '') + '</h2><button class="sh-x" data-a="cerrar" aria-label="Cerrar">' + ic('x') + '</button></div>' }
  function setErr(sheet, msg) {
    var e = $('.err', sheet); if (!e) { e = document.createElement('div'); e.className = 'err'; e.setAttribute('role', 'alert'); var b = $('.sh-b', sheet); b.insertBefore(e, b.firstChild) }
    e.textContent = msg; var b2 = $('.sh-b', sheet); if (b2) b2.scrollTop = 0;
  }
  function ocupado(btn, texto) { if (!btn) return function () {}; var t = btn.innerHTML; btn.disabled = true; btn.textContent = texto || 'Guardando…'; return function () { btn.disabled = false; btn.innerHTML = t } }

  /* ---------- estados y textos ---------- */
  function est(p) {
    if (p.estado === 'Cancelado') return { t: 'Cancelado', c: 'can' };
    if (p.estado === 'Pendiente') return { t: 'Por entregar', c: 'pend' };
    return num(p.saldo) > 0.004 ? { t: 'Por cobrar', c: 'cobrar' } : { t: 'Cobrado', c: 'ok' };
  }
  function items(p) { try { return JSON.parse(p.items_json || '[]') } catch (e) { return [] } }
  function cliente(id) { return S.snap.clientes.filter(function (c) { return c.id === id })[0] }
  function msgPedido(p, cli) {
    var l = items(p).map(function (i) { return '• ' + i.cantidad + ' × ' + i.nombre }).join('\n');
    return '*Pedido ' + p.id + '*\nCliente: ' + p.cliente + (cli && cli.zona ? ' (' + cli.zona + ')' : '') + '\n' + l + '\nTotal: ' + Q(p.total) + ' · ' + K(p.kg) +
      '\nEntrega: ' + fecha(p.fecha_entrega) + (p.nota ? '\nNota: ' + p.nota : '') + '\nRegistrado por ' + p.vendedor + ' en el Panel GEA';
  }
  function msgCliente(p, cli) {
    var l = items(p).map(function (i) { return '• ' + i.cantidad + ' × ' + i.nombre }).join('\n');
    var quien = cli && cli.contacto ? cli.contacto.split(' ')[0] : p.cliente;
    if (p.estado === 'Entregado' && num(p.saldo) < 0.005) return 'Hola ' + quien + ', gracias por tu compra. Recibimos tu pago de ' + Q(p.pagado) + ' del pedido ' + p.id + '.\n' + l + '\nGEA Carbón | ECOCOCO';
    return 'Hola ' + quien + ', confirmamos tu pedido ECOCOCO ' + p.id + ':\n' + l + '\nTotal: ' + Q(p.total) + '\nEntrega: ' + fecha(p.fecha_entrega) + '\nGracias por tu preferencia. GEA Carbón | ECOCOCO';
  }
  function waLink(numero, texto) { return 'https://wa.me/' + waNum(numero) + '?text=' + encodeURIComponent(texto) }

  /* ---------- pantallas ---------- */
  function loginHTML(aviso) {
    var demo = S.mode === 'demo';
    return '<div class="login"><div class="tile"><img src="../img/logo-gea-carbon.svg" alt="GEA Carbón"></div>' +
      '<h1>Panel GEA</h1><p>Clientes, pedidos, cobros y bodega de GEA Carbón | ECOCOCO.</p>' +
      (aviso ? '<div class="err" role="alert">' + esc(aviso) + '</div>' : '') +
      '<form id="f-login" autocomplete="off"><label class="fld"><span>Clave de acceso</span><input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="Clave de acceso" autofocus></label>' +
      '<button class="btn" type="submit">Entrar</button></form>' +
      (demo ? '<div class="quick"><small>Demostración con datos ficticios. Elige cómo entrar:</small><button class="btn sec" data-a="demo" data-pin="123456">Entrar como administrador</button><button class="btn sec" data-a="demo" data-pin="111111">Entrar como vendedor</button></div>' : '') +
      '</div>';
  }
  var TITULOS = { asistente: 'Asistente', costos: 'Costos y planes', inicio: 'Inicio', pedidos: 'Pedidos', clientes: 'Clientes', inventario: 'Inventario', ajustes: 'Ajustes', impuestos: 'Impuestos SAT', reportes: 'Reportes para el banco' };
  function tabBtn(r, nombre, icono) { return '<button class="tab" data-a="ir" data-r="' + r + '"' + (S.ruta === r ? ' aria-current="page"' : '') + '>' + ic(icono) + '<span>' + nombre + '</span></button>' }
  function railBtn(r, nombre, icono) { return '<button class="nav" data-a="ir" data-r="' + r + '"' + (S.ruta === r ? ' aria-current="page"' : '') + '>' + ic(icono) + '<span>' + nombre + '</span></button>' }
  function shellConta(inner) {
    var u = S.user, demo = S.mode === 'demo' ? '<div class="demo"><span>Demostración con datos ficticios. No se guarda nada en tu hoja de Google.</span><button data-a="demoreset">Reiniciar demo</button></div>' : '';
    return '<div class="shell" style="display:block"><div><header class="top"><div class="tile"><img src="../img/logo-gea-carbon.svg" alt=""></div><h1>Impuestos SAT<small>' + esc(fecha(hoy())) + '</small></h1><button class="avatar" data-a="salir" aria-label="Cerrar sesión de ' + esc(u.nombre) + '">' + esc(inicial(u.nombre)) + '</button></header>' + demo + '<main class="view" id="vista" style="max-width:760px;margin:0 auto">' + inner + '</main></div></div>';
  }
  function shell(inner) {
    if (isConta()) return shellConta(inner);
    var adm = isAdmin(), u = S.user;
    var demo = S.mode === 'demo' ? '<div class="demo"><span>Demostración con datos ficticios. No se guarda nada en tu hoja de Google.</span><button data-a="demoreset">Reiniciar demo</button></div>' : '';
    return '<div class="shell"><aside class="rail"><div class="brand"><div class="tile"><img src="../img/logo-gea-carbon.svg" alt=""></div><div><b>Panel GEA</b><small>GEA Carbón | ECOCOCO</small></div></div>' +
      railBtn('inicio', 'Inicio', 'home') + railBtn('pedidos', 'Pedidos', 'ped') + railBtn('clientes', 'Clientes', 'users') + (adm ? railBtn('inventario', 'Inventario', 'box') + railBtn('costos', 'Costos', 'coin') + railBtn('asistente', 'Asistente', 'spark') : '') + railBtn('ajustes', 'Ajustes', 'gear') +
      '<button class="btn" data-a="nuevoped">' + ic('plus') + ' Nuevo pedido</button>' +
      '<div class="who"><div class="avatar">' + esc(inicial(u.nombre)) + '</div><div>' + esc(u.nombre) + '<br><small>' + (adm ? 'Administrador' : 'Vendedor') + '</small></div></div></aside>' +
      '<div><header class="top"><div class="tile"><img src="../img/logo-gea-carbon.svg" alt=""></div><h1>' + TITULOS[S.ruta] + '<small>' + esc(fecha(hoy())) + '</small></h1><button class="avatar" data-a="ir" data-r="ajustes" aria-label="Ajustes y cuenta de ' + esc(u.nombre) + '">' + esc(inicial(u.nombre)) + '</button></header>' + demo +
      '<main class="view" id="vista">' + inner + '</main></div>' +
      '<nav class="tabs' + (adm ? ' eight' : '') + '" aria-label="Secciones">' + (adm ? tabBtn('inicio', 'Inicio', 'home') + tabBtn('pedidos', 'Pedidos', 'ped') + tabBtn('clientes', 'Clientes', 'users') + '<button class="fab" data-a="nuevoped" aria-label="Nuevo pedido">' + ic('plus') + '</button>' + tabBtn('inventario', 'Inventario', 'box') + tabBtn('costos', 'Costos', 'coin') + tabBtn('asistente', 'Asistente', 'spark') + tabBtn('ajustes', 'Ajustes', 'gear') : tabBtn('inicio', 'Inicio', 'home') + tabBtn('pedidos', 'Pedidos', 'ped') + '<button class="fab" data-a="nuevoped" aria-label="Nuevo pedido">' + ic('plus') + '</button>' + tabBtn('clientes', 'Clientes', 'users') + tabBtn('ajustes', 'Ajustes', 'gear')) + '</nav></div>';
  }
  function render(aviso) {
    var app = $('#app');
    if (!S.user) { app.innerHTML = loginHTML(aviso); var f = $('#f-login'); if (f) f.addEventListener('submit', entrar); return }
    if (!S.snap) { app.innerHTML = shell(S.errCarga ? '<div class="err">' + esc(S.errCarga) + '</div><button class="btn" data-a="recargar">Reintentar</button>' : '<div class="skel" style="height:260px"></div><div class="skel"></div><div class="skel"></div>'); return }
    if (isConta()) S.ruta = 'impuestos';
    var v = { inicio: vInicio, pedidos: vPedidos, clientes: vClientes, inventario: vInventario, costos: vCostos, asistente: vAsistente, ajustes: vAjustes, impuestos: vImpuestos, reportes: vReportes }[S.ruta] || vInicio;
    var keep = window.scrollY;
    app.innerHTML = shell(v());
    if (S.ruta === 'inicio' && S.intro) { S.intro = false; setTimeout(function () { var h = $('.hero'); if (h) h.classList.remove('go') }, 2200) }
    window.scrollTo(0, keep);
  }

  /* --- inicio --- */
  function hero(stock, comp, min) {
    var size = 25 * Math.max(1, Math.ceil(stock / 1000)), nb = Math.max(0, Math.floor(stock / size)), nc = Math.min(nb, Math.round(comp / size)), nl = nb - nc, total = nb <= 20 ? 20 : 40, b = '';
    for (var i = 0; i < total; i++) b += '<i class="' + (i < nl ? 'l' : i < nb ? 'c' : '') + '" style="--n:' + i + '"></i>';
    var libres = Math.max(0, stock - comp), aviso = '';
    if (comp > stock) aviso = 'Los pedidos pendientes suman ' + K(comp) + ' y en bodega hay ' + K(stock) + '. Faltan ' + K(comp - stock) + ' para cubrirlos.';
    else if (stock <= min) aviso = 'Quedan ' + K(stock) + ', en el mínimo que fijaste (' + K(min) + '). Toca producir.';
    return '<section class="hero' + (S.intro ? ' go' : '') + '" aria-label="Briquetas en bodega"><div class="lab">En bodega</div><div class="big num">' + num(stock).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '<em>kg</em></div>' +
      '<div class="sub">Equivale a ' + (Math.round(stock / 25 * 10) / 10) + ' bultos de 25 kg</div><div class="meter" role="img" aria-label="' + esc(K(libres) + ' libres y ' + K(comp) + ' comprometidos') + '">' + b + '</div>' +
      '<div class="legend"><span>Libres ' + K(libres) + '</span><span class="c">Para pedidos pendientes ' + K(comp) + '</span><span class="e">Cada bloque = ' + size + ' kg</span></div>' +
      (aviso ? '<div class="alerta-stock" role="alert">' + esc(aviso) + '</div>' : '') + '</section>';
  }
  function heroVend(R, libres) {
    return '<section class="hero' + (S.intro ? ' go' : '') + '"><div class="lab">Tu comisión de ' + MESES[parseInt(S.snap.hoy.slice(5, 7), 10) - 1] + '</div><div class="big num">' + Q(R.comisionMes, 0).replace('Q', 'Q ') + '</div>' +
      '<div class="sub">' + Q(R.comisionSemana, 2) + ' en los últimos 7 días · ' + K(R.mes.kg) + ' entregados este mes</div>' +
      '<div class="legend" style="margin-top:14px"><span>Hay ' + K(libres) + ' libres para vender</span></div></section>';
  }
  function figs(R) {
    function f(l, o) { return '<div class="fig"><div class="l">' + l + '</div><div class="v num">' + Q(o.q, 0) + '</div><div class="k num">' + K(o.kg) + '</div></div>' }
    return '<div class="figs">' + f('Hoy', R.hoy) + f('Últimos 7 días', R.semana) + f('Este mes', R.mes) + '</div>';
  }
  function chart(serie) {
    var W = 340, H = 132, pl = 4, pb = 18, max = Math.max.apply(null, serie.map(function (s) { return s.q })) || 1, bw = (W - pl * 2) / serie.length, g = '';
    var top = Math.ceil(max / 500) * 500 || 500, ph = H - pb;
    [0, .5, 1].forEach(function (f) { var y = ph - ph * f; g += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#E4DDCF" stroke-width="1"/>' });
    serie.forEach(function (s, i) {
      var h = Math.max(s.q > 0 ? 3 : 0, s.q / top * ph), x = pl + i * bw + 3, hoyb = i === serie.length - 1;
      g += '<rect x="' + x + '" y="' + (ph - h) + '" width="' + (bw - 6) + '" height="' + h + '" rx="3" fill="' + (hoyb ? '#E85D04' : '#C9B79C') + '"><title>' + fecha(s.fecha) + ': ' + Q(s.q) + '</title></rect>';
      if (i % 3 === 0 || hoyb) g += '<text class="ax" x="' + (x + (bw - 6) / 2) + '" y="' + (H - 3) + '" text-anchor="middle">' + parseInt(s.fecha.slice(8), 10) + '</text>';
    });
    g += '<text class="ax" x="0" y="10">' + Q(top, 0) + '</text>';
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ventas por día, últimos 14 días">' + g + '</svg></div>';
  }
  function pedRow(p, vend) {
    var e = est(p);
    return '<button class="row" data-a="ped" data-id="' + esc(p.id) + '"><span class="bar ' + e.c + '"></span><span><div class="t">' + esc(p.cliente) + '</div><div class="s">' + esc(p.resumen) + '</div><div class="s">' + K(p.kg) + ' · ' + esc(p.estado === 'Entregado' ? 'entregado ' + fechaRel(p.fecha_entrega) : 'para ' + fechaRel(p.fecha_entrega)) + (vend && isAdmin() ? ' · ' + esc(p.vendedor) : '') + '</div></span>' +
      '<span class="r"><b class="num">' + Q(p.total) + '</b><span class="chip c-' + e.c + '">' + e.t + '</span></span></button>';
  }
  function lista(rows, vacioT, vacioS) { return '<div class="list">' + (rows.length ? rows.join('') : '<div class="vacio"><b>' + vacioT + '</b>' + vacioS + '</div>') + '</div>' }
  function porVisitar() {
    var h = Date.parse(hoy() + 'T00:00:00Z'), out = [];
    S.snap.clientes.forEach(function (c) {
      if (c.estado === 'Inactivo') return;
      var st = statsCli(c.id), d = st.ult ? Math.round((h - Date.parse(st.ult + 'T00:00:00Z')) / 86400000) : null;
      if (d === null || d >= 15) out.push({ c: c, d: d });
    });
    out.sort(function (a, b) { if (a.d === null) return 1; if (b.d === null) return -1; return b.d - a.d });
    return out;
  }
  function tarjetaVisitar() {
    var v = porVisitar();
    var rows = v.slice(0, 6).map(function (x) {
      var c = x.c, sub = x.d === null ? 'Aún no te ha comprado' : 'Hace ' + x.d + ' días sin pedir';
      return '<button class="row" data-a="cli" data-id="' + esc(c.id) + '"><span class="ini">' + esc(inicial(c.nombre)) + '</span><span><div class="t">' + esc(c.nombre) + '</div><div class="s">' + sub + (c.zona ? ' · ' + esc(c.zona) : '') + '</div></span><span class="r"><span class="s">Ver y escribir</span></span></button>';
    });
    return '<div class="sec-h"><h2>Clientes por visitar</h2><span>' + (v.length ? v.length + (v.length === 1 ? ' cliente' : ' clientes') : '') + '</span></div>' +
      lista(rows, 'Todos tus clientes están al día', 'Cuando alguien pase 15 días sin pedir, aparece aquí para que lo contactes.');
  }
  function vInicio() {
    var sn = S.snap, R = C.resumen(sn), adm = isAdmin(), art = sn.inventario.filter(function (a) { return a.tipo === 'producto' })[0], stock = art ? art.stock : 0, min = art ? art.stock_min : 0;
    var izq = (adm ? hero(stock, R.comprometidoKg, min) : heroVend(R, Math.max(0, stock - R.comprometidoKg))) + figs(R) +
      (adm ? tarjetaCostos() + tarjetaSAT() + tarjetaBanco() + tarjetaAsistente() : '') +
      '<div class="sec-h"><h2>Ventas de los últimos 14 días</h2><span class="num">' + Q(R.serie.reduce(function (a, s) { return a + s.q }, 0), 0) + '</span></div>' + chart(R.serie);
    var der = '<div class="sec-h" style="margin-top:0"><h2>' + (adm ? 'Por entregar' : 'Mis pedidos por entregar') + '</h2><span>' + R.porEntregar.length + (R.porEntregar.length === 1 ? ' pedido' : ' pedidos') + ' · ' + K(R.comprometidoKg) + '</span></div>' +
      lista(R.porEntregar.slice(0, 5).map(function (p) { return pedRow(p, true) }), 'Todo entregado', 'Cuando se registre un pedido nuevo, aparece aquí.');
    if (adm) {
      der += '<div class="sec-h"><h2>Por cobrar</h2><span class="num">' + Q(R.porCobrar, 2) + '</span></div>' +
        lista(R.porCobrarLista.slice(0, 5).map(function (p) { return pedRow(p, true) }), 'Sin saldos pendientes', 'Todo lo entregado ya está cobrado.');
      var maxq = R.top[0] ? R.top[0].q : 1;
      der += '<div class="sec-h"><h2>Mejores clientes</h2><span>últimos 30 días</span></div><div class="list">' + (R.top.length ? R.top.map(function (c) { return '<div class="hbar"><div><span>' + esc(c.cliente) + '</span><b class="num">' + Q(c.q, 0) + '</b></div><i style="width:' + Math.max(6, c.q / maxq * 100) + '%"></i></div>' }).join('') : '<div class="vacio"><b>Aún no hay ventas</b>Los clientes que más compran aparecen aquí.</div>') + '</div>';
    } else {
      der += tarjetaVisitar() + '<div class="sec-h"><h2>Mis últimos pedidos</h2></div>' + lista(sn.pedidos.slice().reverse().filter(function (p) { return p.estado !== 'Pendiente' }).slice(0, 5).map(function (p) { return pedRow(p) }), 'Todavía no hay pedidos entregados', 'Registra tu primer pedido con el botón naranja.');
    }
    return '<div class="grid2"><div>' + izq + '</div><div>' + der + '</div></div>';
  }

  /* --- pedidos --- */
  function vPedidos() {
    var sn = S.snap, f = S.filtro, q = S.q.toLowerCase();
    var rows = sn.pedidos.slice().reverse().filter(function (p) {
      if (f === 'entregar' && p.estado !== 'Pendiente') return false;
      if (f === 'cobrar' && !(p.estado === 'Entregado' && num(p.saldo) > 0.004)) return false;
      if (f === 'cobrados' && !(p.estado === 'Entregado' && num(p.saldo) <= 0.004)) return false;
      return !q || (p.cliente + ' ' + p.id).toLowerCase().indexOf(q) >= 0;
    });
    var chips = [['todos', 'Todos'], ['entregar', 'Por entregar'], ['cobrar', 'Por cobrar'], ['cobrados', 'Cobrados']].map(function (c) { return '<button data-a="filtro" data-f="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + '</button>' }).join('');
    var vis = rows.slice(0, S.limite);
    return '<div class="search">' + ic('search') + '<input id="q-ped" type="search" placeholder="Buscar por cliente o número" value="' + esc(S.q) + '" aria-label="Buscar pedidos"></div><div class="chips" role="group" aria-label="Filtrar pedidos">' + chips + '</div>' +
      '<div class="list">' + (vis.length ? vis.map(function (p) { return pedRow(p, true) }).join('') + (rows.length > vis.length ? '<button class="more" data-a="mas">Mostrar más (' + (rows.length - vis.length) + ')</button>' : '') : '<div class="vacio"><b>' + (q || f !== 'todos' ? 'Ningún pedido coincide' : 'Aún no hay pedidos') + '</b>' + (q || f !== 'todos' ? 'Cambia el filtro o la búsqueda.' : 'Toca el botón naranja para registrar el primero.') + '</div>') + '</div>';
  }

  /* --- clientes --- */
  function statsCli(id) {
    var o = { n: 0, kg: 0, q: 0, saldo: 0, ult: '' };
    S.snap.pedidos.forEach(function (p) { if (p.cliente_id !== id || p.estado === 'Cancelado') return; o.n++; if (p.estado === 'Entregado') { o.kg += num(p.kg); o.q += num(p.total); o.saldo += num(p.saldo) } if (p.fecha > o.ult) o.ult = p.fecha });
    return o;
  }
  function vClientes() {
    var q = S.qc.toLowerCase(), cs = S.snap.clientes.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre) })
      .filter(function (c) { return !q || (c.nombre + ' ' + c.zona + ' ' + c.contacto).toLowerCase().indexOf(q) >= 0 });
    var rows = cs.map(function (c) {
      var st = statsCli(c.id);
      return '<button class="row" data-a="cli" data-id="' + esc(c.id) + '"><span class="ini">' + esc(inicial(c.nombre)) + '</span><span><div class="t">' + esc(c.nombre) + (c.estado === 'Inactivo' ? ' <span class="chip c-can">Inactivo</span>' : '') + '</div><div class="s">' + esc(c.tipo) + (c.zona ? ' · ' + esc(c.zona) : '') + '</div></span>' +
        '<span class="r"><b class="num">' + (st.q ? Q(st.q, 0) : '—') + '</b><span class="s">' + (st.ult ? 'último ' + fechaRel(st.ult) : 'sin pedidos') + '</span></span></button>';
    });
    return '<div class="search">' + ic('search') + '<input id="q-cli" type="search" placeholder="Buscar cliente, zona o contacto" value="' + esc(S.qc) + '" aria-label="Buscar clientes"></div>' +
      '<div class="btn-row" style="margin-bottom:14px"><button class="btn sec" data-a="nuevocli">' + ic('plus') + ' Nuevo cliente</button></div>' +
      '<div class="list">' + (rows.length ? rows.join('') : '<div class="vacio"><b>' + (q ? 'Ningún cliente coincide' : 'Todavía no hay clientes') + '</b>' + (q ? 'Revisa la búsqueda o crea el cliente.' : 'Agrega tu primera tienda con el botón de arriba.') + '</div>') + '</div>';
  }

  /* --- inventario (solo administrador) --- */
  function vInventario() {
    if (!isAdmin()) return '<div class="vacio"><b>Esta sección es del administrador</b></div>';
    var sn = S.snap, st = sn.inventario;
    var a = st.map(function (x) {
      var tope = Math.max(num(x.stock_min) * 3, 1), pct = Math.max(0, Math.min(100, x.stock / tope * 100)), bajo = x.stock <= num(x.stock_min);
      return '<div class="stock"><div class="h"><b>' + esc(x.nombre) + '</b><span class="num">' + num(x.stock).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '<small>' + esc(x.unidad) + '</small></span></div><div class="gauge"><i class="' + (bajo ? 'bajo' : '') + '" style="width:' + pct + '%"></i></div><small class="m">' + (bajo ? 'En el mínimo o por debajo · ' : 'Mínimo ') + num(x.stock_min) + ' ' + esc(x.unidad) + '</small></div>';
    }).join('');
    var lotes = sn.lotes.slice().reverse().slice(0, 6).map(function (l) {
      return '<div class="mv"><b>' + esc(l.id) + ' · ' + K(l.briquetas_kg) + '</b><span class="q num">' + (l.rendimiento !== '' ? num(l.rendimiento) + ' %' : '') + '</span><small>' + fecha(l.fecha) + ' · ' + K(l.cascara_kg) + ' de cáscara</small><small style="text-align:right">rendimiento</small></div>';
    }).join('');
    var movs = sn.movimientos.slice().reverse().slice(0, 12).map(function (m) {
      var c = num(m.cantidad); return '<div class="mv"><span>' + esc(m.articulo) + '</span><span class="q num ' + (c >= 0 ? 'mas' : 'menos') + '">' + (c > 0 ? '+' : '') + c.toLocaleString('en-US', { maximumFractionDigits: 1 }) + '</span><small>' + fecha(m.fecha) + ' · ' + esc(m.tipo) + (m.motivo ? ' · ' + esc(m.motivo) : '') + '</small><small></small></div>';
    }).join('');
    return '<div class="btn-row two" style="margin-bottom:6px"><button class="btn" data-a="produccion">' + ic('flame') + ' Registrar producción</button><button class="btn sec" data-a="mover">Mover inventario</button></div>' +
      '<div class="sec-h"><h2>Existencias</h2></div><div class="list">' + a + '</div>' +
      '<div class="sec-h"><h2>Producción reciente</h2></div><div class="list">' + (lotes || '<div class="vacio"><b>Aún no hay lotes</b>Registra la primera producción para calcular el rendimiento.</div>') + '</div>' +
      '<div class="sec-h"><h2>Movimientos</h2></div><div class="list">' + (movs || '<div class="vacio"><b>Sin movimientos</b></div>') + '</div>';
  }

  /* --- ajustes --- */
  function vAjustes() {
    var sn = S.snap, adm = isAdmin(), cfg = sn.config, h = '';
    h += '<div class="card"><h3>' + esc(S.user.nombre) + '</h3><div class="kv"><span>Rol</span><b>' + (adm ? 'Administrador' : 'Vendedor') + '</b></div><div class="kv"><span>Comisión</span><b>' + Q(cfg.comision_por_kg) + ' por kg entregado</b></div></div>';
    if (adm) {
      h += '<div class="card"><h3>Precios por producto</h3>' + sn.productos.map(function (p) {
        return '<div style="margin-bottom:12px"><b>' + esc(p.nombre) + '</b><div class="price-grid"><label class="fld"><span>Tienda</span><input inputmode="decimal" data-p="' + p.id + '" data-k="precio_tienda" value="' + p.precio_tienda + '"></label><label class="fld"><span>Mayorista</span><input inputmode="decimal" data-p="' + p.id + '" data-k="precio_mayorista" value="' + p.precio_mayorista + '"></label><label class="fld"><span>Consumidor</span><input inputmode="decimal" data-p="' + p.id + '" data-k="precio_publico" value="' + p.precio_publico + '"></label></div></div>';
      }).join('') + '<button class="btn sm" data-a="guardarprecios">Guardar precios</button></div>' +
        '<div class="card"><h3>Reglas del negocio</h3><label class="fld"><span>Comisión del vendedor por kg (Q)</span><input id="cfg-com" inputmode="decimal" value="' + num(cfg.comision_por_kg) + '"></label><label class="fld"><span>WhatsApp que recibe los pedidos</span><input id="cfg-wa" inputmode="tel" value="' + esc(cfg.whatsapp_admin) + '"><small>Con código de país, por ejemplo 50242794894.</small></label><label class="fld"><span>Pedido mínimo (kg)</span><input id="cfg-min" inputmode="decimal" value="' + num(cfg.pedido_minimo_kg) + '"></label><button class="btn sm" data-a="guardarcfg">Guardar reglas</button></div>' +
        cardVolumen() + cardEquipo() + cardAccesos() +
        '<div class="card"><h3>Tus datos</h3><p style="color:var(--suave);font-size:15px;margin-bottom:12px">Todo se guarda en tu hoja de Google. Ahí puedes ver, filtrar o exportar lo que quieras. Las claves del equipo están en la pestaña Usuarios.</p>' + (sn.sheetUrl ? '<a class="btn sec" href="' + esc(sn.sheetUrl) + '" target="_blank" rel="noopener">' + ic('sheet') + ' Abrir la hoja de Google</a>' : '') + '</div>';
    }
    h += '<div class="btn-row"><button class="btn sec" data-a="salir">' + ic('out') + ' Cerrar sesión</button></div><p style="text-align:center;color:var(--suave);font-size:13px;margin-top:16px">Panel GEA · versión 1</p>';
    return h;
  }


  /* --- control de precios por volumen y equipo (solo administrador) --- */
  var VOLD = { bolsas_mayoreo: 10, precio_bolsa_mayoreo: 15, bolsas_volumen: 100, precio_bolsa_volumen: 14, bultos_volumen: 10, precio_bulto_volumen: 325 };
  function cv(k) { var v = S.snap.config[k]; return v === undefined || v === '' || v === null || !num(v) ? VOLD[k] : num(v) }
  function cardVolumen() {
    return '<div class="card"><h3>Precios por volumen</h3><p style="color:var(--suave);font-size:15px;margin-bottom:12px">Se aplican solos al armar un pedido. Nunca suben el precio que ya tiene el cliente.</p>' +
      '<div class="price-grid"><label class="fld"><span>Bolsa 1 kg · mayorista desde</span><input id="vl-bm" inputmode="numeric" value="' + cv('bolsas_mayoreo') + '"></label><label class="fld"><span>Precio por bolsa (Q)</span><input id="vl-pm" inputmode="decimal" value="' + cv('precio_bolsa_mayoreo') + '"></label></div>' +
      '<div class="price-grid"><label class="fld"><span>Bolsa 1 kg · desde</span><input id="vl-bv" inputmode="numeric" value="' + cv('bolsas_volumen') + '"></label><label class="fld"><span>Precio por bolsa (Q)</span><input id="vl-pv" inputmode="decimal" value="' + cv('precio_bolsa_volumen') + '"></label></div>' +
      '<div class="price-grid"><label class="fld"><span>Bulto 25 kg · desde</span><input id="vl-xb" inputmode="numeric" value="' + cv('bultos_volumen') + '"></label><label class="fld"><span>Precio por bulto (Q)</span><input id="vl-xp" inputmode="decimal" value="' + cv('precio_bulto_volumen') + '"></label></div>' +
      '<button class="btn sm" data-a="guardarvol">Guardar precios por volumen</button></div>';
  }
  function guardarVol(btn) {
    var fin = ocupado(btn);
    api('config.guardar', { valores: { bolsas_mayoreo: $('#vl-bm').value, precio_bolsa_mayoreo: $('#vl-pm').value, bolsas_volumen: $('#vl-bv').value, precio_bolsa_volumen: $('#vl-pv').value, bultos_volumen: $('#vl-xb').value, precio_bulto_volumen: $('#vl-xp').value } }).then(function (res) { fin(); if (!res.ok) return toast(res.error); aplicar(res); render(); toast('Precios por volumen guardados', true) });
  }
  function cardEquipo() {
    var us = S.snap.usuarios || [];
    return '<div class="card"><h3>Equipo y claves</h3><p style="color:var(--suave);font-size:15px;margin-bottom:12px">Quién puede entrar al panel. Cada clave son 6 números y es distinta para cada persona.</p>' +
      us.map(function (u) { return '<button class="row" data-a="usuario" data-n="' + esc(u.nombre) + '"><span class="ini">' + esc(inicial(u.nombre)) + '</span><span><div class="t">' + esc(u.nombre) + '</div><div class="s">' + (u.rol === 'admin' ? 'Administrador' : u.rol === 'contador' ? 'Contador · solo lectura' : 'Vendedor') + '</div></span><span class="r"><span class="chip ' + (u.activo === 'No' ? 'c-can' : 'c-ok') + '">' + (u.activo === 'No' ? 'Desactivado' : 'Activo') + '</span></span></button>' }).join('') +
      '<div class="btn-row" style="margin-top:12px"><button class="btn sm" data-a="usuarionuevo">' + ic('plus') + ' Agregar vendedor</button><button class="btn sm sec" data-a="contadornuevo">' + ic('plus') + ' Agregar contador</button></div></div>';
  }
  function cardAccesos() {
    var ac = S.snap.accesos || []; if (!ac.length && !(S.snap.usuarios || []).some(function (u) { return u.rol === 'contador' })) return '';
    var alerta = ac.filter(function (a) { return /fallido|Bloqueo/.test(a.evento) }).length;
    return '<div class="card"><h3>Bitácora de actividad</h3><p style="color:var(--suave);font-size:15px;margin-bottom:8px">Quién entró y qué hizo, con fecha y hora, incluida tu propia cuenta. Solo se agrega: no hay forma de borrarla desde el panel. Se guarda en la pestaña Accesos de tu hoja de Google, donde el historial de versiones de Google protege contra cambios.</p>' +
      (alerta ? '<div class="note" style="background:#FDE8E4;color:#7A2316">Hay ' + alerta + (alerta === 1 ? ' intento' : ' intentos') + ' de entrada fallidos en los últimos movimientos. Si no fuiste tú, cambia tu clave en Equipo y claves.</div>' : '') +
      (ac.length ? ac.slice(0, 15).map(function (a) { var mal = /fallido|Bloqueo/.test(a.evento); return '<div class="kv"><span' + (mal ? ' style="color:var(--alerta);font-weight:700"' : '') + '>' + esc(a.usuario) + ' · ' + esc(a.evento) + (a.detalle ? '<small style="display:block;color:var(--suave)">' + esc(a.detalle) + '</small>' : '') + '</span><b style="text-align:right">' + esc(fecha(a.fecha)) + '<br>' + esc(a.hora) + '</b></div>' }).join('') : '<div class="vacio"><b>Sin movimientos todavía</b>Aparecerán aquí.</div>') + '</div>';
  }
  function usuarioSheet(nombre, rolNuevo) {
    var u = nombre ? (S.snap.usuarios || []).filter(function (x) { return x.nombre === nombre })[0] : null, nuevo = !u;
    var conta = nuevo ? rolNuevo === 'contador' : u.rol === 'contador';
    openSheet(shHead(nuevo ? (conta ? 'Agregar contador' : 'Agregar vendedor') : u.nombre, nuevo ? (conta ? 'Solo verá y descargará los libros de impuestos' : 'Podrá registrar pedidos y clientes con su clave') : (u.rol === 'admin' ? 'Administrador' : conta ? 'Contador · solo lectura' : 'Vendedor')) + '<div class="sh-b"><input type="hidden" id="un-r" value="' + (conta ? 'contador' : 'vendedor') + '">' +
      (nuevo ? fld('Nombre', 'un-n', '', { ph: 'Ej. Luis Pérez', max: 30 }) : '<input type="hidden" id="un-n" value="' + esc(u.nombre) + '">') +
      fld(nuevo ? (conta ? 'Clave de 10 a 12 números' : 'Clave de 6 números') : 'Clave nueva (déjala vacía para no cambiarla)', 'un-p', '', { mode: 'numeric', max: conta ? 12 : 6, ph: conta ? '0000000000' : '000000' }) + (conta ? '<small style="display:block;margin:-6px 0 12px;color:var(--suave)">Más larga que las demás porque entra una persona externa. La sesión le dura 7 días.</small>' : '') +
      '<div class="btn-row" style="margin:-4px 0 14px"><button type="button" class="btn sec sm" data-a="genpin">Generar una clave al azar</button></div>' +
      (nuevo ? '' : '<div class="fld"><span>Estado</span>' + segHTML('un-a', ['Activo', 'Desactivado'], u.activo === 'No' ? 'Desactivado' : 'Activo') + '<small>Desactivado: ya no puede entrar. Sus pedidos anteriores se conservan.</small></div>') +
      '<p style="color:var(--suave);font-size:14px">Entrégale la clave en persona o por mensaje privado. Nadie más debe verla.</p></div><div class="sh-f"><button class="btn" data-a="guardarusuario">Guardar</button></div>');
  }
  function guardarUsuario(btn) {
    var sh = $('.sheet'), fin = ocupado(btn), est = segVal(sh, 'un-a'), usr = { nombre: val(sh, 'un-n'), pin: val(sh, 'un-p'), rol: val(sh, 'un-r') };
    if (est) usr.activo = est === 'Desactivado' ? 'No' : 'Sí';
    api('usuario.guardar', { usuario: usr }).then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast('Equipo actualizado', true) });
  }

  /* --- costos y contingencia (solo administrador) --- */
  function qk(x) { return x === null || x === undefined ? '—' : 'Q' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
  function tarjetaCostos() {
    var R = C.costos(S.snap), alta = R.alertas.filter(function (a) { return a.nivel === 'alta' }).length;
    return '<button class="row" data-a="ir" data-r="costos" style="margin-bottom:6px"><span class="bar ' + (alta ? 'cobrar' : 'ok') + '"></span><span><div class="t">Costos y planes</div><div class="s">' + (R.costoKg !== null ? 'Cada kg te cuesta ' + qk(R.costoKg) + (R.margenPct !== null ? ' · margen ' + Math.round(R.margenPct * 100) + ' %' : '') : 'Registra tus gastos para calcular el costo por kg') + '</div></span><span class="r">' + (alta ? '<span class="chip c-cobrar">' + alta + (alta === 1 ? ' alerta' : ' alertas') + '</span>' : '<span class="chip c-ok">Al día</span>') + '</span></button>';
  }
  function simHTML(R) {
    var o = C.simular(R, S.sim), mal = o.delta < -0.5, bien = o.delta > 0.5;
    return '<div class="kv"><span>Ventas en 30 días</span><b>' + Q(o.ventas, 0) + '</b></div><div class="kv"><span>Gastos en 30 días</span><b>' + Q(o.gastos, 0) + '</b></div><div class="kv"><span>Utilidad en 30 días</span><b style="color:' + (o.utilidad < 0 ? 'var(--alerta)' : 'var(--bosque)') + '">' + Q(o.utilidad, 0) + '</b></div>' +
      '<div class="kv"><span>Cambio frente a hoy</span><b style="color:' + (mal ? 'var(--alerta)' : bien ? 'var(--bosque)' : 'inherit') + '">' + (o.delta >= 0 ? '+' : '−') + Q(Math.abs(o.delta), 0) + '</b></div>' +
      '<div class="kv"><span>Para no perder necesitarías vender</span><b>' + (o.equilibrioKg === null ? '—' : Math.round(o.equilibrioKg) + ' kg al mes') + '</b></div>';
  }
  function slider(k, label, min, max, step) {
    var v = S.sim[k];
    return '<label class="fld"><span>' + label + ' <b id="sv-' + k + '">' + (v > 0 ? '+' : '') + v + ' %</b></span><input type="range" data-sim="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '" aria-label="' + esc(label) + '"></label>';
  }
  function resumenTexto(R) {
    var L = ['Resumen de costos GEA Carbón (últimos 30 días, ' + fecha(R.hasta) + ')', 'Producción: ' + Math.round(R.kgProd) + ' kg de briquetas', 'Ventas entregadas: ' + Q(R.ventas, 0) + ' (' + Math.round(R.kgVend) + ' kg, precio promedio ' + qk(R.precioProm) + ' por kg)',
      'Gastos: ' + Q(R.gastos.total, 0) + ' (fijos ' + Q(R.gastos.fijo, 0) + ', variables ' + Q(R.gastos.variable, 0) + ')', 'Costo por kg: ' + qk(R.costoKg) + ' · margen por kg: ' + qk(R.margenKg) + (R.margenPct !== null ? ' (' + Math.round(R.margenPct * 100) + ' %)' : ''),
      'Utilidad: ' + Q(R.utilidad, 0) + ' · cobrado: ' + Q(R.cobrado, 0) + ' · por cobrar: ' + Q(R.porCobrar, 0), 'Punto de equilibrio: ' + (R.equilibrioKg === null ? 'sin datos' : Math.round(R.equilibrioKg) + ' kg al mes')];
    if (R.cascaraDias !== null) L.push('Cáscara en bodega: para unos ' + Math.floor(R.cascaraDias) + ' días');
    if (R.inversion > 0) L.push('Inversión en equipo: ' + Q(R.inversion, 0) + ' · recuperado ' + Math.round((R.recuperado || 0) * 100) + ' %');
    L.push('Gastos por categoría: ' + R.porCategoria.map(function (c) { return c.categoria + ' ' + Q(c.q, 0) }).join(', '));
    if (R.alertas.length) L.push('Alertas: ' + R.alertas.map(function (a) { return a.t }).join('; '));
    L.push('', 'Con estos números, ¿qué plan de contingencia y qué estrategias me recomiendas?');
    return L.join('\n');
  }
  function vCostos() {
    if (!isAdmin()) return '<div class="vacio"><b>Esta sección es del administrador</b></div>';
    var R = C.costos(S.snap), h = '', tot = R.gastos.total || 1;
    h += '<section class="hero"><div class="lab">Cada kilo te cuesta</div><div class="big num">' + (R.costoKg === null ? '—' : qk(R.costoKg)) + '</div><div class="sub">' +
      (R.costoKg === null ? 'Registra una producción y tus gastos para calcularlo.' : (R.precioProm !== null ? 'Vendes a ' + qk(R.precioProm) + ' en promedio, ganas ' + qk(R.margenKg) + ' por kg (' + Math.round(R.margenPct * 100) + ' %)' : 'Aún no hay ventas entregadas en 30 días')) + '</div>' +
      '<div class="legend" style="margin-top:14px"><span>Estimado con los últimos 30 días. Mejora con cada gasto que registres.</span></div></section>';
    h += '<div class="figs"><div class="fig"><div class="l">Utilidad</div><div class="v num" style="color:' + (R.utilidad < 0 ? 'var(--alerta)' : 'inherit') + '">' + Q(R.utilidad, 0) + '</div><div class="k num">30 días</div></div><div class="fig"><div class="l">Gastos</div><div class="v num">' + Q(R.gastos.total, 0) + '</div><div class="k num">' + Q(R.gastos.fijo, 0) + ' fijos</div></div><div class="fig"><div class="l">Equilibrio</div><div class="v num">' + (R.equilibrioKg === null ? '—' : Math.round(R.equilibrioKg)) + '</div><div class="k num">kg al mes</div></div></div>';
    h += '<div class="btn-row two" style="margin:6px 0 4px"><button class="btn" data-a="gasto">' + ic('plus') + ' Registrar gasto</button><button class="btn sec" data-a="compartir">Copiar resumen</button></div>';
    h += '<div class="sec-h"><h2>Alertas</h2></div><div class="list">' + (R.alertas.length ? R.alertas.map(function (a) { return '<div class="row" style="cursor:default"><span class="bar ' + (a.nivel === 'alta' ? 'cobrar' : a.nivel === 'media' ? 'pend' : 'ok') + '"></span><span><div class="t">' + esc(a.t) + '</div><div class="s">' + esc(a.d) + '</div></span><span></span></div>' }).join('') : '<div class="vacio"><b>Sin alertas</b>Con los datos registrados, todo está en orden.</div>') + '</div>';
    h += '<div class="sec-h"><h2>En qué se va el dinero</h2><span>30 días</span></div><div class="list">' + (R.porCategoria.length ? R.porCategoria.map(function (c) { return '<div class="hbar"><div><span>' + esc(c.categoria) + ' <small style="color:var(--suave)">· ' + c.tipo.toLowerCase() + '</small></span><b class="num">' + Q(c.q, 0) + ' · ' + Math.round(c.q / tot * 100) + ' %</b></div><i style="width:' + Math.max(4, c.q / (R.porCategoria[0].q || 1) * 100) + '%"></i></div>' }).join('') : '<div class="vacio"><b>Aún no hay gastos</b>Toca "Registrar gasto" para anotar el primero.</div>') + '</div>';
    if (R.inversion > 0) h += '<div class="sec-h"><h2>Inversión en la planta</h2></div><div class="stock"><div class="h"><b>' + Q(R.inversion, 0) + ' invertidos</b><span class="num">' + Math.round((R.recuperado || 0) * 100) + '<small>% recuperado</small></span></div><div class="gauge"><i style="width:' + Math.round((R.recuperado || 0) * 100) + '%"></i></div><small class="m">Faltan ' + Q(R.falta, 0) + ' por recuperar con las utilidades acumuladas.</small></div>';
    h += '<div class="sec-h"><h2>Simulador de contingencia</h2></div><div class="card"><p style="color:var(--suave);font-size:15px;margin-bottom:12px">Mueve las barras para ver qué le pasaría a tu utilidad si cambian las condiciones.</p>' +
      slider('cascara', 'Precio de la cáscara', -50, 100, 5) + slider('ventas', 'Cantidad que vendes', -80, 100, 5) + slider('precio', 'Precio de venta', -30, 30, 5) + slider('fijos', 'Gastos fijos (mano de obra, etc.)', -50, 100, 5) +
      '<div id="simout" style="margin-top:6px">' + simHTML(R) + '</div><div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-a="simrst">Volver a los números reales</button></div></div>';
    var gs = (S.snap.gastos || []).filter(function (g) { return g.estado !== 'Anulado' }).slice().reverse().slice(0, 12);
    h += '<div class="sec-h"><h2>Últimos gastos</h2></div><div class="list">' + (gs.length ? gs.map(function (g) { return '<button class="row" data-a="vergasto" data-id="' + esc(g.id) + '"><span class="bar ' + (g.tipo === 'Inversión' ? 'pend' : 'ok') + '"></span><span><div class="t">' + esc(g.concepto || g.categoria) + '</div><div class="s">' + esc(g.categoria) + ' · ' + esc(fecha(g.fecha)) + '</div></span><span class="r"><b class="num">' + Q(g.monto) + '</b></span></button>' }).join('') : '<div class="vacio"><b>Sin gastos todavía</b></div>') + '</div>';
    return h;
  }
  function gastoSheet() {
    openSheet(shHead('Registrar gasto', 'Cada compra o pago que anotes afina tu costo por kg') + '<div class="sh-b"><label class="fld"><span>Categoría</span><select id="gc">' + C.CATEGORIAS.map(function (c) { return '<option value="' + esc(c[0]) + '" data-t="' + c[1] + '">' + esc(c[0]) + '</option>' }).join('') + '</select></label>' +
      fld('Monto (Q)', 'gm', '', { mode: 'decimal' }) + fld('Concepto', 'gn', '', { ph: 'Ej. 6,200 kg de cáscara, recibo de luz' }) + '<div class="fld" id="gtw"><span>Tipo de gasto</span>' + segHTML('gt', ['Variable', 'Fijo'], 'Variable') + '<small>Variable: sube con lo que produces (cáscara, empaque). Fijo: se paga igual produzcas o no (mano de obra).</small></div>' +
      fld('Proveedor (opcional)', 'gp', '', {}) + '<div class="two-f">' + fld('NIT del proveedor', 'gnit', '', { ph: 'Si te dieron factura' }) + fld('No. de factura o recibo', 'gdoc', '', {}) + '</div><small style="display:block;margin:-6px 0 12px;color:var(--suave)">Guarda la factura o recibo: respalda el gasto ante la SAT.</small>' + fld('Fecha', 'gf', S.snap.hoy, { type: 'date' }) + '</div><div class="sh-f"><button class="btn" data-a="guardargasto">Guardar gasto</button></div>');
  }
  function guardarGasto(btn) {
    var sh = $('.sheet'), fin = ocupado(btn);
    api('gasto.registrar', { categoria: $('#gc', sh).value, monto: val(sh, 'gm'), concepto: val(sh, 'gn'), tipo: segVal(sh, 'gt'), proveedor: val(sh, 'gp'), nit_proveedor: val(sh, 'gnit'), doc_numero: val(sh, 'gdoc'), fecha: val(sh, 'gf') }).then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast('Gasto guardado', true) });
  }
  function verGasto(id) {
    var g = (S.snap.gastos || []).filter(function (x) { return x.id === id })[0]; if (!g) return;
    openSheet(shHead(g.concepto || g.categoria, esc(g.categoria) + ' · ' + esc(fecha(g.fecha))) + '<div class="sh-b"><div class="kv"><span>Monto</span><b class="d" style="font-size:24px">' + Q(g.monto) + '</b></div><div class="kv"><span>Tipo</span><b>' + esc(g.tipo) + '</b></div>' + (g.proveedor ? '<div class="kv"><span>Proveedor</span><b>' + esc(g.proveedor) + (g.nit_proveedor ? ' · NIT ' + esc(g.nit_proveedor) : '') + '</b></div>' : '') + '<div class="kv"><span>Comprobante</span><b>' + (g.doc_numero ? esc(g.doc_numero) : 'Sin comprobante') + '</b></div>' + '<div class="kv"><span>Registró</span><b>' + esc(g.registrado_por) + '</b></div></div><div class="sh-f"><button class="btn danger" data-a="anulargasto" data-id="' + esc(g.id) + '">Anular este gasto</button></div>');
  }
  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto);
    return new Promise(function (ok, no) { var t = document.createElement('textarea'); t.value = texto; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok() } catch (e) { no(e) } t.remove() });
  }

  /* --- asistente con IA (solo administrador) --- */
  function tarjetaAsistente() {
    return '<button class="row" data-a="ir" data-r="asistente" style="margin-bottom:6px"><span class="bar ok"></span><span><div class="t">Pregúntale a tu asistente</div><div class="s">Ventas, ganancias, quién te debe y qué hacer, en lenguaje normal</div></span><span class="r"><span class="chip c-ok">IA</span></span></button>';
  }
  var PREG = [['hoy', 'Ventas de hoy'], ['mes', 'Ventas del mes'], ['ganancia', 'Mi ganancia'], ['debe', 'Quién me debe'], ['bodega', 'Bodega']];
  function respuestaLocal(k) {
    var sn = S.snap, R = C.resumen(sn), K2 = C.costos(sn), art = sn.inventario.filter(function (a) { return a.tipo === 'producto' })[0];
    if (k === 'hoy') return 'Hoy vendiste ' + Q(R.hoy.q) + ' (' + K(R.hoy.kg) + ') y cobraste ' + Q(R.cobradoHoy) + '. Tienes ' + R.porEntregar.length + (R.porEntregar.length === 1 ? ' pedido' : ' pedidos') + ' por entregar (' + K(R.comprometidoKg) + ').';
    if (k === 'mes') return 'En lo que va del mes has entregado ' + Q(R.mes.q) + ' (' + K(R.mes.kg) + ') y has cobrado ' + Q(R.cobradoMes) + '. En los últimos 7 días llevas ' + Q(R.semana.q) + '.';
    if (k === 'ganancia') {
      if (K2.nGastos30 === 0) return 'En 30 días vendiste ' + Q(K2.ventas) + ', pero no hay gastos registrados, así que todavía no puedo calcular tu ganancia. Anota tus gastos en la sección Costos.';
      return 'En los últimos 30 días vendiste ' + Q(K2.ventas) + ' y gastaste ' + Q(K2.gastos.total) + ': tu utilidad es ' + Q(K2.utilidad) + '. ' + (K2.costoKg !== null ? 'Cada kilo te cuesta ' + qk(K2.costoKg) + (K2.margenPct !== null ? ' y ganas un margen de ' + Math.round(K2.margenPct * 100) + ' %.' : '.') : '') + ' Es un estimado: depende de que hayas anotado todos los gastos.';
    }
    if (k === 'debe') {
      if (!R.porCobrarLista.length) return 'Nadie te debe nada ahora mismo. Todo lo entregado está cobrado.';
      return 'Tienes ' + Q(R.porCobrar) + ' por cobrar en ' + R.nPorCobrar + (R.nPorCobrar === 1 ? ' pedido' : ' pedidos') + ':\n' + R.porCobrarLista.slice(0, 6).map(function (p) { return '• ' + p.cliente + ': ' + Q(p.saldo) + ' (entregado ' + fechaRel(p.fecha_entrega) + ')' }).join('\n');
    }
    if (k === 'bodega') {
      var cas = sn.inventario.filter(function (a) { return a.id === 'INV-02' })[0];
      return 'En bodega hay ' + K(art ? art.stock : 0) + ' de briquetas; ' + K(R.comprometidoKg) + ' ya están comprometidos para pedidos pendientes, quedan ' + K(Math.max(0, (art ? art.stock : 0) - R.comprometidoKg)) + ' libres.' + (cas ? ' De cáscara hay ' + K(cas.stock) + (K2.cascaraDias !== null ? ', para unos ' + Math.floor(K2.cascaraDias) + ' días.' : '.') : '');
    }
    return '';
  }
  function contextoIA() {
    var sn = S.snap, R = C.resumen(sn), L = ['Fecha de hoy: ' + sn.hoy, 'Ventas hoy: ' + Q(R.hoy.q) + ' (' + R.hoy.kg + ' kg). Últimos 7 días: ' + Q(R.semana.q) + '. Mes: ' + Q(R.mes.q) + ' (' + R.mes.kg + ' kg). Cobrado hoy: ' + Q(R.cobradoHoy) + ', en el mes: ' + Q(R.cobradoMes) + '.', 'Por cobrar: ' + Q(R.porCobrar) + (R.porCobrarLista.length ? ' → ' + R.porCobrarLista.slice(0, 10).map(function (p) { return p.cliente + ' ' + Q(p.saldo) + ' (entregado ' + p.fecha_entrega + ')' }).join('; ') : ''),
      'Por entregar: ' + R.porEntregar.length + ' pedidos, ' + R.comprometidoKg + ' kg' + (R.porEntregar.length ? ' → ' + R.porEntregar.slice(0, 8).map(function (p) { return p.cliente + ' ' + p.kg + ' kg, total ' + Q(p.total) + ', para ' + p.fecha_entrega }).join('; ') : ''),
      'Mejores clientes (30 días): ' + (R.top.map(function (c) { return c.cliente + ' ' + Q(c.q) }).join('; ') || 'sin datos'),
      'Inventario: ' + sn.inventario.map(function (a) { return a.nombre + ' ' + a.stock + ' ' + a.unidad + ' (mínimo ' + a.stock_min + ')' }).join('; ')];
    L.push(resumenTexto(C.costos(sn)).replace(/\n\n.*$/s, ''));
    var gs = (sn.gastos || []).filter(function (g) { return g.estado !== 'Anulado' }).slice(-15);
    if (gs.length) L.push('Últimos gastos: ' + gs.map(function (g) { return g.fecha + ' ' + g.categoria + ' ' + Q(g.monto) + (g.concepto ? ' (' + g.concepto + ')' : '') }).join('; '));
    return L.join('\n').slice(0, 7000);
  }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') }
  function burbujas() {
    return S.chat.map(function (m) { return '<div class="cb ' + (m.r === 'u' ? 'u' : 'a') + '">' + fmt(m.t) + '</div>' }).join('') + (S.pensando ? '<div class="cb a pens"><i></i><i></i><i></i></div>' : '');
  }
  function vAsistente() {
    if (!isAdmin()) return '<div class="vacio"><b>Esta sección es del administrador</b></div>';
    return '<div class="chat"><div class="cb a">Hola, soy tu asistente de GEA Carbón. Toca una pregunta rápida o escribe la tuya. Mis respuestas salen de los datos que tienes registrados aquí.</div><div id="cbs">' + burbujas() + '</div></div>' +
      '<div class="chips" role="group" aria-label="Preguntas rápidas">' + PREG.map(function (q) { return '<button data-a="pregrapida" data-k="' + q[0] + '">' + q[1] + '</button>' }).join('') + '</div>' +
      '<form id="f-ia" class="ia-in"><input id="ia-q" type="text" placeholder="Ej. ¿Qué hago si sube la cáscara?" autocomplete="off" aria-label="Escribe tu pregunta"><button class="btn" type="submit" aria-label="Enviar">' + ic('spark') + '</button></form>' +
      '<p style="color:var(--suave);font-size:13px;margin:10px 2px">Las preguntas rápidas se responden al instante. Las que escribes las analiza una IA con tus números; puede equivocarse, revisa las cifras importantes en tus pantallas.</p>';
  }
  function chatAdd(r, t) { S.chat.push({ r: r, t: t }); if (S.chat.length > 40) S.chat.shift() }
  function chatPintar() { var c = $('#cbs'); if (c) { c.innerHTML = burbujas(); window.scrollTo(0, document.body.scrollHeight) } }
  function preguntarIA(q) {
    q = (q || '').trim(); if (!q || S.pensando) return;
    chatAdd('u', q); S.pensando = true; chatPintar();
    var hist = S.chat.slice(-9, -1).map(function (m) { return { role: m.r === 'u' ? 'user' : 'assistant', content: m.t } });
    api('ia.preguntar', { pregunta: q, contexto: contextoIA(), historial: hist }).then(function (res) {
      S.pensando = false; chatAdd('a', res.ok ? res.data.respuesta : (res.error || 'No pude responder ahora. Inténtalo de nuevo.')); chatPintar();
    });
  }

  /* ---------- formularios ---------- */
  function fld(label, id, val, o) {
    o = o || {};
    return '<label class="fld"><span>' + label + '</span>' + (o.area ? '<textarea id="' + id + '" rows="2"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + esc(val) + '</textarea>' : '<input id="' + id + '" type="' + (o.type || 'text') + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + ' value="' + esc(val) + '" autocomplete="off">') + (o.hint ? '<small>' + o.hint + '</small>' : '') + '</label>';
  }
  function segHTML(name, opts, val) { return '<div class="seg" role="group" data-seg="' + name + '">' + opts.map(function (o) { return '<button type="button" data-a="seg" data-n="' + name + '" data-v="' + esc(o) + '" aria-pressed="' + (o === val) + '">' + esc(o) + '</button>' }).join('') + '</div>' }
  function segVal(sheet, name) { var b = $('[data-seg="' + name + '"] [aria-pressed="true"]', sheet); return b ? b.getAttribute('data-v') : '' }
  function val(sheet, id) { var e = $('#' + id, sheet); return e ? e.value.trim() : '' }
  function precioDe(p, cli, q) { return C.precioUnit(p, cli ? cli.tipo : 'Tienda', q || 0, S.snap.config) }

  /* nuevo pedido */
  function draftNuevo(cid) { return { cliente_id: cid || '', items: {}, precios: {}, fecha: S.snap.hoy, nota: '', abierto: !cid, q: '' } }
  function totalesDraft() {
    var d = S.draft, cli = cliente(d.cliente_id), kg = 0, tot = 0;
    S.snap.productos.forEach(function (p) {
      var q = num(d.items[p.id]); if (q <= 0) return;
      var pr = isAdmin() && d.precios[p.id] !== undefined && d.precios[p.id] !== '' ? num(d.precios[p.id]) : precioDe(p, cli, q);
      kg += q * num(p.kg); tot += q * pr;
    });
    return { kg: kg, total: tot };
  }
  function opcionesCli(q) {
    q = (q || '').toLowerCase();
    var cs = S.snap.clientes.filter(function (c) { return c.estado !== 'Inactivo' && (!q || (c.nombre + ' ' + c.zona + ' ' + c.contacto).toLowerCase().indexOf(q) >= 0) }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre) }).slice(0, 7);
    return cs.map(function (c) { return '<button type="button" class="opt" data-a="elegircli" data-id="' + esc(c.id) + '"><span><b>' + esc(c.nombre) + '</b><small>' + esc(c.tipo) + (c.zona ? ' · ' + esc(c.zona) : '') + '</small></span></button>' }).join('') +
      '<button type="button" class="opt nuevo" data-a="nuevocli" data-desde="pedido">' + ic('plus') + ' Crear cliente nuevo</button>';
  }
  function nuevoPedidoHTML() {
    var d = S.draft, cli = cliente(d.cliente_id), adm = isAdmin(), t = totalesDraft(), h = '';
    h += shHead('Nuevo pedido', adm ? 'Lo registras tú como administrador' : 'Se enviará a Manolo por WhatsApp');
    h += '<div class="sh-b">';
    if (d.abierto || !cli) h += '<div class="pick"><input id="pq" type="search" placeholder="Buscar cliente por nombre o zona" value="' + esc(d.q) + '" aria-label="Buscar cliente"><div id="opts">' + opcionesCli(d.q) + '</div></div>';
    else h += '<div class="pick"><div class="sel"><span class="ini">' + esc(inicial(cli.nombre)) + '</span><span style="flex:1"><b>' + esc(cli.nombre) + '</b><small>' + esc(cli.tipo) + (cli.zona ? ' · ' + esc(cli.zona) : '') + '</small></span><button type="button" class="btn ghost" data-a="cambiarcli" style="width:auto;padding:0 10px">Cambiar</button></div></div>';
    h += '<div>' + S.snap.productos.map(function (p) {
      var q = num(d.items[p.id]), pr = precioDe(p, cli, q), vol = cli && pr < precioDe(p, cli, 0);
      return '<div class="prod"><span><b>' + esc(p.nombre) + '</b><small>' + (cli ? Q(pr) + ' c/u · ' + esc(cli.tipo) + (vol ? ' · precio por volumen' : '') : 'Elige un cliente para ver el precio') + '</small></span>' +
        '<span class="step"><button type="button" data-a="menos" data-p="' + p.id + '" aria-label="Quitar uno de ' + esc(p.nombre) + '">−</button><input inputmode="numeric" data-q="' + p.id + '" value="' + (q || '') + '" placeholder="0" aria-label="Cantidad de ' + esc(p.nombre) + '"><button type="button" data-a="mas1" data-p="' + p.id + '" aria-label="Agregar uno de ' + esc(p.nombre) + '">+</button></span>' +
        (adm && q > 0 ? '<span class="pr">Precio acordado Q <input inputmode="decimal" data-pr="' + p.id + '" value="' + (d.precios[p.id] !== undefined ? esc(d.precios[p.id]) : '') + '" placeholder="' + pr + '" aria-label="Precio de ' + esc(p.nombre) + '"></span>' : '') + '</div>';
    }).join('') + '</div>';
    h += '<div style="margin-top:14px"><label class="fld"><span>Fecha de entrega</span><input id="pf" type="date" value="' + esc(d.fecha) + '" min="' + esc(S.snap.hoy) + '"></label><div class="chips" style="margin:-4px 0 14px"><button type="button" data-a="fecha" data-d="0" aria-pressed="' + (d.fecha === S.snap.hoy) + '">Hoy</button><button type="button" data-a="fecha" data-d="1" aria-pressed="' + (d.fecha === C.addDays(S.snap.hoy, 1)) + '">Mañana</button><button type="button" data-a="fecha" data-d="2" aria-pressed="' + (d.fecha === C.addDays(S.snap.hoy, 2)) + '">Pasado mañana</button></div></div>';
    h += fld('Nota (opcional)', 'pn', d.nota, { area: 1, ph: 'Ej. dejar con la encargada, pasar después de las 3' });
    h += '<div id="avmin"></div></div>';
    h += '<div class="sh-f"><div class="tot"><span id="tkg">' + K(t.kg) + '</span><b class="d" id="ttot">' + Q(t.total) + '</b></div><button class="btn" data-a="guardarped"' + (cli && t.kg > 0 ? '' : ' disabled') + ' id="bgp">Guardar pedido</button></div>';
    return h;
  }
  function pintarNuevo() { var sh = $('.sheet'); if (!sh) return; var sc = $('.sh-b', sh), y = sc ? sc.scrollTop : 0; sh.innerHTML = '<div class="grab"></div>' + nuevoPedidoHTML(); var s2 = $('.sh-b', sh); if (s2) s2.scrollTop = y; avisoMin() }
  function avisoMin() {
    var t = totalesDraft(), el = $('#avmin'), min = num(S.snap.config.pedido_minimo_kg);
    if (el) el.innerHTML = (t.kg > 0 && t.kg < min) ? '<div class="note">El pedido mínimo es de ' + min + ' kg. Puedes guardarlo igual si Manolo lo aprueba.</div>' : '';
    var k = $('#tkg'), tt = $('#ttot'), b = $('#bgp'); if (k) k.textContent = K(t.kg); if (tt) tt.textContent = Q(t.total); if (b) b.disabled = !(S.draft.cliente_id && t.kg > 0);
  }
  function abrirNuevo(cid) { S.draft = draftNuevo(cid); openSheet(nuevoPedidoHTML()); avisoMin() }
  function guardarPedido(btn) {
    var d = S.draft, sh = $('.sheet'), fin = ocupado(btn), items = [];
    S.snap.productos.forEach(function (p) { var q = num(d.items[p.id]); if (q > 0) { var it = { producto_id: p.id, cantidad: q }; if (isAdmin() && d.precios[p.id] !== undefined && d.precios[p.id] !== '') it.precio = num(d.precios[p.id]); items.push(it) } });
    api('pedido.crear', { cliente_id: d.cliente_id, items: items, nota: d.nota, fecha_entrega: d.fecha }).then(function (res) {
      fin();
      if (!res.ok) return setErr(sh, res.error);
      aplicar(res); render(); S.draft = null;
      var p = res.data.pedido, cli = cliente(p.cliente_id), adm = isAdmin();
      var wa = adm ? (cli && cli.telefono ? waLink(cli.telefono, msgCliente(p, cli)) : '') : waLink(S.snap.config.whatsapp_admin, msgPedido(p, cli));
      var s2 = openSheet(shHead('Pedido registrado') + '<div class="sh-b center"><div class="ok-big">' + ic('check') + '</div><h3 class="d" style="font-size:30px;margin-bottom:4px">' + esc(p.id) + '</h3><p style="color:var(--suave)">' + esc(p.cliente) + ' · ' + esc(p.resumen) + '</p><div class="tot" style="justify-content:center;gap:12px;margin:14px 0"><b class="d">' + Q(p.total) + '</b></div>' +
        (res.data.aviso ? '<div class="note">' + esc(res.data.aviso) + '</div>' : '') +
        (adm ? '' : '<p style="color:var(--suave);font-size:15px">Falta un paso: manda el pedido a Manolo por WhatsApp para que lo vea de inmediato.</p>') + '</div>' +
        '<div class="sh-f">' + (wa ? '<a class="btn ok" href="' + esc(wa) + '" target="_blank" rel="noopener">' + ic('wa') + (adm ? ' Confirmar al cliente por WhatsApp' : ' Enviar a Manolo por WhatsApp') + '</a>' : (adm ? '<div class="note">Este cliente no tiene teléfono guardado.</div>' : '')) + '<button class="btn ghost" data-a="cerrar" style="margin-top:6px">Listo</button></div>');
      toast('Pedido ' + p.id + ' guardado', true);
    });
  }

  /* detalle de pedido */
  function pedidoById(id) { return S.snap.pedidos.filter(function (p) { return p.id === id })[0] }
  function detallePedido(id, confirmar) {
    var p = pedidoById(id); if (!p) return; var cli = cliente(p.cliente_id), e = est(p), adm = isAdmin(), cfg = S.snap.config;
    var cobros = (S.snap.cobros || []).filter(function (c) { return c.pedido_id === p.id });
    var lineas = items(p).map(function (i) { return '<div class="kv"><span>' + esc(i.cantidad) + ' × ' + esc(i.nombre) + '</span><b>' + Q(i.subtotal) + '</b></div>' }).join('');
    var tl = '<li>Registrado ' + esc(fecha(p.fecha)) + (p.hora ? ' · ' + esc(p.hora) : '') + '<small>por ' + esc(p.creado_por) + (p.lugar ? ' · ' + esc(p.lugar) : '') + '</small></li>';
    if (p.estado === 'Entregado') tl += '<li>Entregado ' + esc(fecha(p.fecha_entrega)) + (p.entrega_hora ? ' · ' + esc(p.entrega_hora) : '') + (p.entrega_lugar ? '<small>' + esc(p.entrega_lugar) + '</small>' : '') + '</li>'; else if (p.estado === 'Pendiente') tl += '<li>Entrega prevista ' + esc(fecha(p.fecha_entrega)) + '</li>'; else tl += '<li>Cancelado</li>';
    cobros.forEach(function (c) { tl += '<li>Cobro de ' + Q(c.monto) + ' · ' + esc(c.metodo) + '<small>' + esc(fecha(c.fecha)) + (c.hora ? ' · ' + esc(c.hora) : '') + (c.referencia ? ' · ' + esc(c.referencia) : '') + (c.lugar ? ' · ' + esc(c.lugar) : '') + '</small></li>' });
    var acc = '', pend = p.estado === 'Pendiente';
    if (adm && pend) acc += '<button class="btn ok" data-a="entregar" data-id="' + esc(p.id) + '">Entregar y cobrar</button>';
    if (adm && p.estado === 'Entregado' && num(p.saldo) > 0.004) acc += '<button class="btn" data-a="cobrar" data-id="' + esc(p.id) + '">Registrar cobro · saldo ' + Q(p.saldo) + '</button>';
    if (adm && cli && cli.telefono) acc += '<a class="btn sec" target="_blank" rel="noopener" href="' + esc(waLink(cli.telefono, msgCliente(p, cli))) + '">' + ic('wa') + ' Escribir al cliente</a>';
    if (!adm && pend) acc += '<a class="btn ok" target="_blank" rel="noopener" href="' + esc(waLink(cfg.whatsapp_admin, msgPedido(p, cli))) + '">' + ic('wa') + ' Reenviar a Manolo</a>';
    if (adm && p.estado !== 'Cancelado') acc += felOk(p) ? '<button class="btn sec" data-a="anularfactura" data-id="' + esc(p.id) + '">Quitar factura ' + esc(p.fel_serie || '') + ' ' + esc(p.fel_numero) + '</button>' : '<button class="btn sec" data-a="facturar" data-id="' + esc(p.id) + '">Registrar factura FEL</button>';
    if (pend) acc += confirmar ? '<button class="btn danger" data-a="cancelarok" data-id="' + esc(p.id) + '">Sí, cancelar este pedido</button>' : '<button class="btn danger" data-a="cancelar" data-id="' + esc(p.id) + '">Cancelar pedido</button>';
    openSheet(shHead(p.id, esc(p.cliente) + ' · <span class="chip c-' + e.c + '">' + e.t + '</span>') + '<div class="sh-b">' + lineas +
      '<div class="kv"><span>Total</span><b class="d" style="font-size:24px">' + Q(p.total) + '</b></div>' + (p.estado === 'Entregado' ? '<div class="kv"><span>Pagado</span><b>' + Q(p.pagado) + '</b></div><div class="kv"><span>Saldo</span><b style="color:' + (num(p.saldo) > 0.004 ? 'var(--alerta)' : 'var(--bosque)') + '">' + Q(p.saldo) + '</b></div>' : '') +
      '<div class="kv"><span>Peso</span><b>' + K(p.kg) + '</b></div>' + (adm && p.estado !== 'Cancelado' ? '<div class="kv"><span>Factura FEL</span><b>' + (felOk(p) ? esc((p.fel_serie ? p.fel_serie + ' ' : '') + p.fel_numero) : (p.fel_estado === 'Anulada' ? 'Anulada · falta emitir' : '<span style="color:var(--alerta)">Sin factura</span>')) + '</b></div>' : '') + (adm ? '<div class="kv"><span>Vendedor</span><b>' + esc(p.vendedor) + (num(p.comision) ? ' · comisión ' + Q(p.comision) : '') + '</b></div>' : '') + (p.nota ? '<div class="note" style="margin-top:12px">' + esc(p.nota) + '</div>' : '') +
      '<h3 style="margin:16px 0 4px;font-size:16px">Historial</h3><ul class="tl">' + tl + '</ul></div>' + (acc ? '<div class="sh-f"><div class="btn-row" style="flex-direction:column;gap:8px">' + acc + '</div></div>' : ''));
  }
  var METS = ['Efectivo', 'Transferencia', 'Depósito'];
  function entregarSheet(id, soloCobro) {
    var p = pedidoById(id); if (!p) return; var saldo = soloCobro ? num(p.saldo) : num(p.total);
    openSheet(shHead(soloCobro ? 'Registrar cobro' : 'Entregar pedido', esc(p.cliente) + ' · ' + esc(p.id)) + '<div class="sh-b" data-id="' + esc(p.id) + '" data-solo="' + (soloCobro ? 1 : 0) + '">' +
      '<div class="pill-kpi"><span class="d">' + Q(saldo) + '</span><small>' + (soloCobro ? 'saldo pendiente' : 'total del pedido · se descuentan ' + K(p.kg) + ' de la bodega') + '</small></div>' +
      (soloCobro ? '' : '<div class="seg" data-seg="cobra"><button type="button" data-a="seg" data-n="cobra" data-v="si" aria-pressed="true">Cobrar ahora</button><button type="button" data-a="seg" data-n="cobra" data-v="no" aria-pressed="false">Dejar a crédito</button></div>') +
      '<div id="cobrox">' + segHTML('metodo', METS, 'Efectivo') + fld('Monto cobrado (Q)', 'cm', saldo.toFixed(2), { mode: 'decimal', hint: 'Si pagó solo una parte, baja el monto. El resto queda por cobrar.' }) + fld('Referencia (opcional)', 'cr', '', { ph: 'No. de boleta o transferencia' }) + '</div></div>' +
      '<div class="sh-f"><button class="btn ok" data-a="confirmarentrega">' + (soloCobro ? 'Guardar cobro' : 'Confirmar entrega') + '</button></div>');
  }
  function confirmarEntrega(btn) {
    var sh = $('.sheet'), b = $('.sh-b', sh), id = b.getAttribute('data-id'), solo = b.getAttribute('data-solo') === '1', cobra = solo || segVal(sh, 'cobra') !== 'no', fin = ocupado(btn);
    var cobro = cobra ? { monto: val(sh, 'cm'), metodo: segVal(sh, 'metodo'), referencia: val(sh, 'cr') } : null;
    if (cobra && !(num(cobro.monto) > 0)) { fin(); return setErr(sh, 'Escribe el monto cobrado.') }
    var req = solo ? api('cobro.registrar', { pedido_id: id, monto: cobro.monto, metodo: cobro.metodo, referencia: cobro.referencia }) : api('pedido.entregar', { id: id, cobrar: cobro });
    req.then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast(solo ? 'Cobro guardado' : (cobra ? 'Entregado y cobrado' : 'Entregado, queda por cobrar'), true) });
  }

  /* clientes */
  function clienteSheet(id, desde) {
    var c = id ? cliente(id) : { tipo: 'Tienda', estado: 'Activo' }, adm = isAdmin();
    openSheet(shHead(id ? 'Editar cliente' : 'Nuevo cliente') + '<div class="sh-b" data-id="' + esc(id || '') + '" data-desde="' + (desde || '') + '">' + fld('Nombre del negocio o persona', 'cn', c.nombre || '', { ph: 'Ej. Tienda La Bendición' }) + fld('NIT para la factura', 'cnit', c.nit && c.nit !== 'CF' ? c.nit : '', { ph: 'Sin guiones. Déjalo vacío si es consumidor final (CF)' }) + '<div class="fld"><span>Tipo de precio</span>' + segHTML('tipo', C.TIPOS, c.tipo) + '</div>' +
      '<div class="two-f">' + fld('Contacto', 'cc', c.contacto || '', { ph: 'Quién atiende' }) + fld('Teléfono', 'ct', c.telefono || '', { mode: 'tel', ph: '8 dígitos' }) + '</div>' + fld('Zona o colonia', 'cz', c.zona || '', { ph: 'Ej. Centro, zona 2' }) + fld('Dirección', 'cd', c.direccion || '', { area: 1 }) + fld('Notas', 'cno', c.notas || '', { area: 1, ph: 'Horario, forma de pago, referencias' }) +
      (id && adm ? '<div class="fld"><span>Estado</span>' + segHTML('estado', ['Activo', 'Inactivo'], c.estado || 'Activo') + '</div>' : '') + '</div><div class="sh-f"><button class="btn" data-a="guardarcli">Guardar cliente</button></div>');
  }
  function guardarCliente(btn) {
    var sh = $('.sheet'), b = $('.sh-b', sh), id = b.getAttribute('data-id'), desde = b.getAttribute('data-desde'), fin = ocupado(btn);
    var c = { id: id || undefined, nombre: val(sh, 'cn'), nit: val(sh, 'cnit'), tipo: segVal(sh, 'tipo'), contacto: val(sh, 'cc'), telefono: val(sh, 'ct'), zona: val(sh, 'cz'), direccion: val(sh, 'cd'), notas: val(sh, 'cno'), estado: segVal(sh, 'estado') || undefined };
    api('cliente.guardar', { cliente: c }).then(function (res) {
      fin(); if (!res.ok) return setErr(sh, res.error);
      aplicar(res); render(); toast('Cliente guardado', true);
      if (desde === 'pedido' && S.draft) { var d = S.draft; d.cliente_id = res.data.cliente.id; d.abierto = false; openSheet(nuevoPedidoHTML()); avisoMin() } else closeSheet();
    });
  }
  function detalleCliente(id) {
    var c = cliente(id); if (!c) return; var st = statsCli(id), adm = isAdmin();
    var peds = S.snap.pedidos.filter(function (p) { return p.cliente_id === id }).slice().reverse().slice(0, 6).map(function (p) { return pedRow(p) }).join('');
    openSheet(shHead(c.nombre, esc(c.tipo) + (c.zona ? ' · ' + esc(c.zona) : '')) + '<div class="sh-b"><div class="stats"><div><span class="d num">' + st.n + '</span><small>pedidos</small></div><div><span class="d num">' + Q(st.q, 0) + '</span><small>comprado</small></div><div><span class="d num" style="color:' + (st.saldo > 0.004 ? 'var(--alerta)' : 'inherit') + '">' + Q(st.saldo, 0) + '</span><small>por cobrar</small></div></div>' +
      (c.contacto ? '<div class="kv"><span>Contacto</span><b>' + esc(c.contacto) + '</b></div>' : '') + (c.telefono ? '<div class="kv"><span>Teléfono</span><b>' + esc(tel(c.telefono)) + '</b></div>' : '') + (c.direccion ? '<div class="kv"><span>Dirección</span><b>' + esc(c.direccion) + '</b></div>' : '') + (c.notas ? '<div class="note" style="margin-top:10px">' + esc(c.notas) + '</div>' : '') +
      '<div class="sec-h"><h2>Pedidos recientes</h2></div><div class="list">' + (peds || '<div class="vacio"><b>Aún no tiene pedidos</b></div>') + '</div></div><div class="sh-f"><div class="btn-row two"><button class="btn" data-a="nuevoped" data-id="' + esc(id) + '">Nuevo pedido</button><button class="btn sec" data-a="editcli" data-id="' + esc(id) + '">' + ic('edit') + ' Editar</button></div>' +
      (c.telefono ? '<div class="btn-row" style="margin-top:8px"><a class="btn sec" target="_blank" rel="noopener" href="' + esc('https://wa.me/' + waNum(c.telefono)) + '">' + ic('wa') + ' WhatsApp</a><a class="btn sec" href="tel:' + esc(c.telefono) + '">' + ic('phone') + ' Llamar</a></div>' : '') + '</div>');
  }

  /* inventario */
  function produccionSheet() {
    openSheet(shHead('Registrar producción', 'Se suman briquetas y se descuentan los insumos') + '<div class="sh-b">' + fld('Fecha', 'lf', S.snap.hoy, { type: 'date' }) + '<div class="two-f">' + fld('Briquetas obtenidas (kg)', 'lb', '', { mode: 'decimal' }) + fld('Cáscara usada (kg)', 'lc', '', { mode: 'decimal' }) + '</div>' + fld('Aglutinante usado (kg)', 'la', '', { mode: 'decimal' }) +
      '<div class="note" id="lrend">Escribe los kilos de briquetas y de cáscara para ver el rendimiento.</div>' + fld('Notas', 'ln', '', { area: 1, ph: 'Humedad, horno usado, observaciones' }) + '</div><div class="sh-f"><button class="btn" data-a="guardarprod">Guardar lote</button></div>');
  }
  function guardarProd(btn) {
    var sh = $('.sheet'), fin = ocupado(btn);
    api('produccion.registrar', { fecha: val(sh, 'lf'), briquetas_kg: val(sh, 'lb'), cascara_kg: val(sh, 'lc') || 0, aglutinante_kg: val(sh, 'la') || 0, notas: val(sh, 'ln') }).then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast('Lote guardado, bodega actualizada', true) });
  }
  function moverSheet() {
    var arts = S.snap.inventario;
    openSheet(shHead('Mover inventario') + '<div class="sh-b"><label class="fld"><span>Artículo</span><select id="ma">' + arts.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.nombre) + ' (' + num(a.stock).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' ' + esc(a.unidad) + ')</option>' }).join('') + '</select></label>' +
      '<div class="fld"><span>Tipo de movimiento</span>' + segHTML('mt', ['Entrada', 'Salida', 'Ajuste'], 'Entrada') + '</div>' + fld('Cantidad', 'mc', '', { mode: 'decimal', hint: 'En un ajuste, un número negativo resta.' }) + fld('Motivo', 'mm', '', { ph: 'Ej. compra de cáscara, merma, conteo físico' }) + '</div><div class="sh-f"><button class="btn" data-a="guardarmov">Guardar movimiento</button></div>');
  }
  function guardarMov(btn) {
    var sh = $('.sheet'), fin = ocupado(btn);
    api('inventario.mover', { articulo_id: $('#ma', sh).value, tipo: segVal(sh, 'mt'), cantidad: val(sh, 'mc'), motivo: val(sh, 'mm') }).then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast('Movimiento guardado', true) });
  }

  /* ajustes */
  function guardarPrecios(btn) {
    var fin = ocupado(btn), porProd = {};
    document.querySelectorAll('[data-p][data-k]').forEach(function (i) { var id = i.getAttribute('data-p'); (porProd[id] = porProd[id] || { id: id })[i.getAttribute('data-k')] = i.value.trim() });
    var ids = Object.keys(porProd), ult = null;
    (function sig(i) {
      if (i >= ids.length) { fin(); if (ult && ult.ok) { aplicar(ult); render(); toast('Precios guardados', true) } return }
      api('producto.guardar', porProd[ids[i]]).then(function (res) { if (!res.ok) { fin(); return toast(res.error) } ult = res; sig(i + 1) });
    })(0);
  }
  function guardarCfg(btn) {
    var fin = ocupado(btn);
    api('config.guardar', { valores: { comision_por_kg: $('#cfg-com').value, whatsapp_admin: $('#cfg-wa').value, pedido_minimo_kg: $('#cfg-min').value } }).then(function (res) { fin(); if (!res.ok) return toast(res.error); aplicar(res); render(); toast('Reglas guardadas', true) });
  }

  /* ---------- obligaciones SAT · pequeño contribuyente (solo administrador) ---------- */
  var MES_N = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function felOk(p) { return !!p.fel_numero && p.fel_estado !== 'Anulada' && p.estado !== 'Cancelado' }
  function mesTxt(m) { return MES_N[parseInt(m.slice(5, 7), 10) - 1] }
  function colorNivel(n) { return n === 'ok' ? 'var(--bosque)' : n === 'atencion' ? '#D9A441' : 'var(--alerta)' }
  function tarjetaSAT() {
    var F = S.snap.fiscal;
    if (!F) return '<button class="row" data-a="ir" data-r="impuestos" style="margin-bottom:6px"><span class="bar cobrar"></span><span><div class="t">Impuestos SAT</div><div class="s">Falta actualizar el código de Google (Apps Script)</div></span><span class="r"><span class="chip c-cobrar">!</span></span></button>';
    var msg = F.nivel === 'excedido' ? 'Superaste el tope anual: habla con tu contador' : F.nivel === 'critico' ? 'Estás por llegar al tope anual' : F.nivel === 'atencion' ? 'Ya usaste ' + F.pct + ' % del tope anual' : 'Facturado ' + F.año + ': ' + Q(F.facturado, 0) + ' de ' + Q(F.limite, 0);
    var sf = F.sinFacturar.length;
    return '<button class="row" data-a="ir" data-r="impuestos" style="margin-bottom:6px"><span class="bar ' + (F.nivel === 'ok' ? (sf ? 'pend' : 'ok') : 'cobrar') + '"></span><span><div class="t">Impuestos SAT</div><div class="s">' + esc(msg) + (sf ? ' · ' + sf + ' sin factura' : '') + '</div></span><span class="r">' + (F.nivel !== 'ok' ? '<span class="chip c-cobrar">!</span>' : '') + '</span></button>';
  }
  function vImpuestos() {
    var conta = isConta(), F = S.snap.fiscal; if (!F) return '<div class="card"><h3>Falta un paso en Google</h3><p style="color:var(--suave)">El panel ya trae la sección de impuestos, pero tu código de Apps Script todavía es el anterior. Pega el código nuevo y publica una versión nueva: Implementar → Administrar implementaciones → ✏ → Nueva versión → Implementar. Luego recarga el panel.</p></div>';
    var mesAct = S.snap.hoy.slice(0, 7), M = F.meses.filter(function (m) { return m.mes === mesAct })[0] || { ventas: 0, impuesto: 0, docs: 0 };
    var prev = F.meses.filter(function (m) { return m.mes < mesAct && m.ventas > 0 }).slice(-1)[0];
    var h = '<div class="note"><b>Régimen: Pequeño contribuyente.</b> Esta pantalla te ordena la información para la SAT. No sustituye a tu contador: confirma con la SAT o con él el tope, el porcentaje y las fechas.</div>';
    var alerta = F.nivel === 'excedido' ? 'Ya pasaste el tope anual de ventas facturadas. Consulta a tu contador cómo seguir: puede cambiar tu régimen.' : F.nivel === 'critico' ? 'Te quedan ' + Q(F.restante, 0) + ' para el tope anual. Cada factura nueva te acerca al cambio de régimen.' : F.nivel === 'atencion' ? 'Llevas más del 80 % del tope anual. Con este ritmo cerrarías el año en ' + Q(F.proyeccion, 0) + '.' : '';
    h += '<div class="card"><h3>Tope anual de ventas facturadas ' + F.año + '</h3><div style="height:14px;border-radius:8px;background:var(--ceniza-2);overflow:hidden;margin:6px 0 10px"><div style="height:100%;width:' + Math.min(100, F.pct) + '%;background:' + colorNivel(F.nivel) + '"></div></div>' +
      '<div class="kv"><span>Facturado en el año</span><b>' + Q(F.facturado) + ' · ' + F.pct + ' %</b></div><div class="kv"><span>Tope configurado</span><b>' + Q(F.limite) + '</b></div><div class="kv"><span>Te falta para llegar</span><b>' + Q(F.restante) + '</b></div><div class="kv"><span>Ritmo actual (proyección del año)</span><b style="color:' + (F.proyeccion > F.limite ? 'var(--alerta)' : 'inherit') + '">' + Q(F.proyeccion, 0) + '</b></div>' + (alerta ? '<div class="note" style="margin:12px 0 0;background:#FDE8E4;color:#7A2316">' + esc(alerta) + '</div>' : '') + '</div>';
    h += '<div class="card"><h3>Impuesto estimado (' + F.tasa + ' % de lo facturado)</h3><div class="kv"><span>' + esc(mesTxt(mesAct)) + ' (' + M.docs + (M.docs === 1 ? ' factura' : ' facturas') + ')</span><b>' + Q(M.impuesto) + '</b></div>' + (prev ? '<div class="kv"><span>Último mes cerrado: ' + esc(mesTxt(prev.mes)) + '</span><b>' + Q(prev.impuesto) + '</b></div>' : '') + '<div class="kv"><span>Acumulado del año</span><b>' + Q(F.impuestoAño) + '</b></div><small style="color:var(--suave)">Declara y paga en la SAT el mes siguiente. Confirma con tu contador la fecha límite y el formulario.</small></div>';
    var sf = F.sinFacturar.map(function (id) { return pedidoById(id) }).filter(Boolean);
    if (conta) h += '<div class="card"><div class="kv"><span>Entregado sin factura registrada</span><b>' + F.sinFacturar.length + (F.sinFacturar.length === 1 ? ' pedido' : ' pedidos') + ' · ' + Q(F.sinFacturarQ) + '</b></div></div>'; else h += '<div class="sec-h"><h2>Entregado sin factura</h2><span class="num">' + Q(F.sinFacturarQ) + '</span></div>' + lista(sf.slice(-8).reverse().map(function (p) { return pedRow(p, true) }), 'Todo está facturado', 'Cada pedido entregado tiene su factura registrada.');
    h += '<div class="sec-h"><h2>Mes por mes</h2></div><div class="card"><div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:6px 8px;font-size:14px"><b>Mes</b><b>Facturado</b><b>Impuesto</b><b>Gastos</b>' +
      F.meses.filter(function (m) { return m.mes <= mesAct }).map(function (m) { return '<span>' + esc(mesTxt(m.mes)) + '</span><span class="num">' + Q(m.ventas, 0) + '</span><span class="num">' + Q(m.impuesto, 0) + '</span><span class="num">' + Q(m.compras, 0) + (m.sinDoc ? ' <i title="gastos sin comprobante" style="color:var(--alerta)">·' + m.sinDoc + '</i>' : '') + '</span>' }).join('') + '</div><small style="color:var(--suave);display:block;margin-top:10px">El punto rojo cuenta gastos sin factura o recibo anotado.</small></div>';
    h += '<div class="card"><h3>Libros para tu contador</h3><p style="color:var(--suave);font-size:15px;margin-bottom:12px">Descarga el año en un archivo que abre Excel. Incluye fecha, serie y número de factura, NIT y monto.</p><div class="btn-row"><button class="btn sec" data-a="csv" data-k="ventas">Libro de ventas ' + F.año + '</button><button class="btn sec" data-a="csv" data-k="compras">Libro de compras ' + F.año + '</button></div></div>';
    if (conta) return h + '<div class="btn-row"><button class="btn sec" data-a="salir">' + ic('out') + ' Cerrar sesión</button></div>';
    h += '<div class="card"><h3>Cifras que usa el panel</h3>' + '<label class="fld"><span>Tope anual de ventas facturadas (Q)</span><input id="pc-lim" inputmode="decimal" value="' + F.limite + '"><small>Referencia: 125 salarios mínimos mensuales no agrícolas. Cámbialo cuando la SAT publique el nuevo valor.</small></label><label class="fld"><span>Porcentaje del impuesto (%)</span><input id="pc-tasa" inputmode="decimal" value="' + F.tasa + '"></label><button class="btn sm" data-a="guardarpc">Guardar cifras</button></div>';
    return h;
  }
  function guardarPC(btn) {
    var fin = ocupado(btn);
    api('config.guardar', { valores: { limite_pc: $('#pc-lim').value, tasa_pc: $('#pc-tasa').value } }).then(function (res) { fin(); if (!res.ok) return toast(res.error); aplicar(res); render(); toast('Cifras guardadas', true) });
  }
  function facturarSheet(id) {
    var p = pedidoById(id); if (!p) return; var cli = cliente(p.cliente_id) || {}, nit = cli.nit || 'CF';
    var aviso = nit === 'CF' && num(p.total) > 2500 ? '<div class="note">Este cliente no tiene NIT y la compra pasa de Q2,500. Pídele NIT o CUI antes de facturar (confirma el monto límite con tu contador).</div>' : '';
    openSheet(shHead('Registrar factura FEL', esc(p.cliente) + ' · ' + esc(p.id)) + '<div class="sh-b" data-id="' + esc(p.id) + '">' + aviso + '<div class="pill-kpi"><span class="d">' + Q(p.total) + '</span><small>NIT del cliente: ' + esc(nit) + '</small></div><p style="color:var(--suave);font-size:14px;margin:0 0 12px">Emite la factura en tu agencia virtual de la SAT o con tu certificador FEL y anota aquí sus datos.</p><div class="two-f">' + fld('Serie', 'fs', '', { ph: 'Ej. A1B2C3D4' }) + fld('Número', 'fn', '', { mode: 'numeric', ph: 'Ej. 1234567' }) + '</div>' + fld('Fecha de la factura', 'ff', S.snap.hoy, { type: 'date' }) + '</div><div class="sh-f"><button class="btn" data-a="guardarfactura">Guardar factura</button></div>');
  }
  function guardarFactura(btn) {
    var sh = $('.sheet'), id = $('.sh-b', sh).getAttribute('data-id'), fin = ocupado(btn);
    api('pedido.facturar', { id: id, serie: val(sh, 'fs'), numero: val(sh, 'fn'), fecha: val(sh, 'ff') }).then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast('Factura registrada', true) });
  }
  function csvLibro(k) {
    var F = S.snap.fiscal; if (!F) return;
    if (isConta()) api('acceso.registrar', { evento: 'Descarga libro de ' + k });
    function cel(x) { x = String(x == null ? '' : x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x }
    var filas = k === 'ventas' ? [['Fecha', 'Serie', 'Número', 'NIT', 'Cliente', 'Total (Q)', 'Pedido']].concat(F.ventas.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1 }).map(function (v) { return [v.fecha, v.serie, v.numero, v.nit, v.cliente, v.total.toFixed(2), v.id] }))
      : [['Fecha', 'Documento', 'NIT proveedor', 'Proveedor', 'Concepto', 'Monto (Q)', 'Gasto']].concat(F.compras.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1 }).map(function (v) { return [v.fecha, v.doc, v.nit, v.proveedor, v.concepto, v.monto.toFixed(2), v.id] }));
    var txt = '﻿' + filas.map(function (r) { return r.map(cel).join(',') }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = 'libro-de-' + k + '-' + F.año + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 500); toast('Archivo descargado', true);
  }

  /* ---------- reportes para el banco (solo administrador) ---------- */
  var MES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function mesCorto(m) { return MES_C[parseInt(m.slice(5, 7), 10) - 1] + ' ' + m.slice(2, 4) }
  function repModelo() {
    var Rp = S.snap.reportes; if (!Rp) return null;
    var H = Rp.meses, P = Rp.proyeccion, sum = function (a, k) { return a.reduce(function (t, x) { return t + num(x[k]) }, 0) };
    function fila(l, arr, k, b, tot) { var v = arr.map(function (x) { return num(x[k]) }); if (tot !== false) v.push(sum(arr, k)); return { l: l, v: v, b: !!b } }
    var ch = H.map(function (x) { return mesCorto(x.mes) }).concat(['Total 12 meses']), cp = P.map(function (x) { return mesCorto(x.mes) }).concat(['Total 6 meses']);
    return [
      { t: 'Estado de resultados (estimado, últimos 12 meses)', n: 'Ventas = pedidos entregados. Costo de ventas = materia prima, empaque, combustible y electricidad. El impuesto es el ' + Rp.tasa + ' % de las ventas (pequeño contribuyente).', cols: ch, filas: [
        fila('Ventas', H, 'ventas', true), fila('Costo de ventas', H, 'costoVentas'), fila('Utilidad bruta', H, 'utilBruta', true), fila('Gastos de operación', H, 'gastosOp'), fila('Utilidad operativa', H, 'utilOper', true),
        fila('Impuesto estimado', H, 'impuesto'), fila('Utilidad neta estimada', H, 'utilNeta', true), fila('Kilos vendidos', H, 'kg')] },
      { t: 'Flujo de caja histórico (últimos 12 meses)', n: 'Entradas = cobros registrados. Salidas = gastos pagados. La inversión en equipo se muestra aparte. El acumulado parte de cero en el primer mes; no incluye el saldo de banco.', cols: H.map(function (x) { return mesCorto(x.mes) }).concat(['Total 12 meses']), filas: [
        fila('Cobros recibidos', H, 'cobros', true), fila('Gastos pagados', H, 'salidas'), fila('Inversión en equipo', H, 'inversion'), fila('Flujo neto del mes', H, 'flujo', true), { l: 'Flujo acumulado', v: H.map(function (x) { return num(x.acumulado) }).concat([num(H[H.length - 1].acumulado)]), b: false }] },
      { t: 'Flujo de caja proyectado (próximos 6 meses)', n: 'Proyección con los supuestos de abajo: kilos por mes, precio, costo por kilo, gastos fijos y crecimiento mensual. Supone que se cobra en el mismo mes de la venta.', cols: cp, filas: [
        fila('Kilos', P, 'kg'), fila('Ingresos', P, 'ingresos', true), fila('Costo de ventas', P, 'costoVentas'), fila('Gastos fijos', P, 'fijos'), fila('Impuesto estimado', P, 'impuesto'), fila('Flujo neto del mes', P, 'flujo', true),
        { l: 'Saldo proyectado (con saldo inicial)', v: P.map(function (x) { return num(x.saldo) }).concat([num(P[P.length - 1].saldo)]), b: false }] }
    ];
  }
  function tablaRep(sec) {
    return '<div style="overflow-x:auto;margin:0 -4px"><table style="border-collapse:collapse;font-size:13px;min-width:100%;white-space:nowrap"><thead><tr><th style="text-align:left;padding:6px 8px;position:sticky;left:0;background:var(--card,#fff)"></th>' + sec.cols.map(function (c) { return '<th style="text-align:right;padding:6px 8px">' + esc(c) + '</th>' }).join('') + '</tr></thead><tbody>' +
      sec.filas.map(function (f) { return '<tr style="border-top:1px solid var(--ceniza-2)' + (f.b ? ';font-weight:700' : '') + '"><td style="padding:6px 8px;position:sticky;left:0;background:var(--card,#fff)">' + esc(f.l) + '</td>' + f.v.map(function (v, i) { return '<td class="num" style="text-align:right;padding:6px 8px' + (i === f.v.length - 1 ? ';font-weight:700' : '') + (v < 0 ? ';color:var(--alerta)' : '') + '">' + (f.l === 'Kilos' || f.l === 'Kilos vendidos' ? Math.round(v).toLocaleString('en-US') : Q(v, 0)) + '</td>' }).join('') + '</tr>' }).join('') + '</tbody></table></div>';
  }
  function tarjetaBanco() {
    var ok = !!S.snap.reportes;
    return '<button class="row" data-a="ir" data-r="reportes" style="margin-bottom:6px"><span class="bar ' + (ok ? 'pend' : 'cobrar') + '"></span><span><div class="t">Reportes para el banco</div><div class="s">' + (ok ? 'Estado de resultados y flujo de caja, para tu carpeta de crédito' : 'Falta actualizar el código de Google (Apps Script)') + '</div></span><span class="r">' + (ok ? '' : '<span class="chip c-cobrar">!</span>') + '</span></button>';
  }
  function vReportes() {
    var M = repModelo(); if (!M) return '<div class="card"><h3>Falta un paso en Google</h3><p style="color:var(--suave)">Pega el código nuevo en Apps Script y publica una versión nueva (Implementar → Administrar implementaciones → ✏ → Nueva versión → Implementar). Luego recarga el panel.</p></div>';
    var Rp = S.snap.reportes, h = '<div class="note"><b>Informe de administración, no auditado.</b> Se arma con lo que registras en el panel. Para el banco, normalmente lo firma tu contador: pásale este informe y el acceso de solo lectura.</div>';
    M.forEach(function (s) { h += '<div class="card"><h3>' + esc(s.t) + '</h3><p style="color:var(--suave);font-size:14px;margin-bottom:10px">' + esc(s.n) + '</p>' + tablaRep(s) + '</div>'; });
    var cam = [['proy_saldo_inicial', 'Saldo inicial de caja y banco (Q)'], ['proy_kg_mes', 'Kilos que vendes por mes'], ['proy_precio_kg', 'Precio promedio por kilo (Q)'], ['proy_costo_kg', 'Costo de ventas por kilo (Q)'], ['proy_fijos_mes', 'Gastos fijos por mes (Q)'], ['proy_crec_pct', 'Crecimiento de ventas por mes (%)']];
    h += '<div class="card"><h3>Supuestos de la proyección</h3><p style="color:var(--suave);font-size:14px;margin-bottom:10px">Si dejas un campo vacío, el panel usa el promedio de tus últimos 3 meses (el número gris). Escribe tus metas para proyectar con ellas.</p>' +
      cam.map(function (c) { return '<label class="fld"><span>' + c[1] + '</span><input id="py-' + c[0] + '" inputmode="decimal" value="' + (Rp.propios[c[0]] ? num(Rp.supuestos[c[0]]) : '') + '" placeholder="' + num(Rp.auto[c[0]]) + '"></label>' }).join('') + '<button class="btn sm" data-a="guardarproy">Guardar supuestos</button></div>';
    h += '<div class="card"><h3>Para tu carpeta bancaria</h3><div class="btn-row" style="flex-direction:column;gap:8px"><button class="btn" data-a="repimprimir">Ver e imprimir o guardar en PDF</button><button class="btn sec" data-a="repcsv">Descargar en Excel (CSV)</button></div></div>';
    return h;
  }
  function guardarProy(btn) {
    var fin = ocupado(btn), v = {};
    ['proy_saldo_inicial', 'proy_kg_mes', 'proy_precio_kg', 'proy_costo_kg', 'proy_fijos_mes', 'proy_crec_pct'].forEach(function (k) { v[k] = $('#py-' + k).value });
    api('config.guardar', { valores: v }).then(function (res) { fin(); if (!res.ok) return toast(res.error); aplicar(res); render(); toast('Supuestos guardados', true) });
  }
  function repCSV() {
    var M = repModelo(); if (!M) return;
    function cel(x) { x = String(x == null ? '' : x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x }
    var out = [[S.snap.config.nombre_negocio || 'GEA'], ['Informe de administración, no auditado. Cifras en quetzales. Generado el ' + hoy()], []];
    M.forEach(function (s) { out.push([s.t]); out.push([''].concat(s.cols)); s.filas.forEach(function (f) { out.push([f.l].concat(f.v.map(function (v) { return Math.round(v * 100) / 100 }))) }); out.push([]) });
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + out.map(function (r) { return r.map(cel).join(',') }).join('\r\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'reportes-financieros-' + hoy() + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 500); toast('Archivo descargado', true);
  }
  function repImprimir() {
    var M = repModelo(); if (!M) return;
    var css = 'body{font:12px/1.4 Calibri,Arial,sans-serif;color:#1a1a1a;margin:24px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:22px 0 4px}p{margin:2px 0 8px;color:#555}table{border-collapse:collapse;width:100%;font-size:10.5px}th,td{padding:4px 6px;text-align:right;border-bottom:1px solid #ddd;white-space:nowrap}th:first-child,td:first-child{text-align:left}.b td{font-weight:700}.neg{color:#b00020}.firmas{display:flex;gap:40px;margin-top:50px}.firmas div{flex:1;border-top:1px solid #333;padding-top:4px;text-align:center}.nota{margin-top:18px;font-size:11px;color:#555}button{padding:10px 16px;font-size:14px;margin-bottom:12px}@media print{button{display:none}body{margin:10mm}}@page{size:landscape}';
    var h = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reportes financieros</title><style>' + css + '</style></head><body><button onclick="window.print()">Imprimir o guardar como PDF</button><h1>' + esc(S.snap.config.nombre_negocio || 'GEA') + '</h1><p>Estado de resultados y flujo de caja · al ' + esc(hoy()) + ' · cifras en quetzales (Q)</p>';
    M.forEach(function (s) {
      h += '<h2>' + esc(s.t) + '</h2><p>' + esc(s.n) + '</p><table><thead><tr><th></th>' + s.cols.map(function (c) { return '<th>' + esc(c) + '</th>' }).join('') + '</tr></thead><tbody>' + s.filas.map(function (f) { return '<tr' + (f.b ? ' class="b"' : '') + '><td>' + esc(f.l) + '</td>' + f.v.map(function (v) { return '<td' + (v < 0 ? ' class="neg"' : '') + '>' + (/^Kilos/.test(f.l) ? Math.round(v).toLocaleString('en-US') : Q(v, 0)) + '</td>' }).join('') + '</tr>' }).join('') + '</tbody></table>';
    });
    h += '<p class="nota">Informe de administración preparado con los registros del sistema de la empresa. No es información auditada. Las proyecciones dependen de los supuestos indicados y no garantizan resultados.</p><div class="firmas"><div>Representante legal</div><div>Contador</div></div></body></html>';
    var w = window.open(URL.createObjectURL(new Blob([h], { type: 'text/html;charset=utf-8' })), '_blank');
    if (!w) toast('Tu navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.');
  }

  /* ---------- acceso ---------- */
  function dispositivoTxt() { try { var ua = navigator.userAgent || '', m = ua.match(/\(([^)]*)\)/), nav = /Brave/i.test(ua) ? 'Brave' : /Edg/i.test(ua) ? 'Edge' : /Firefox/i.test(ua) ? 'Firefox' : /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'Navegador'; return nav + ' · ' + (m ? m[1] : ua).replace(/^Linux; /, '').replace(/; wv/, '') } catch (e) { return '' } }
  function entrar(e, pinForzado) {
    if (e && e.preventDefault) e.preventDefault();
    var pin = pinForzado || ($('#pin') ? $('#pin').value : ''), btn = $('#f-login button');
    if (!String(pin).trim()) return render('Escribe tu clave de acceso.');
    var fin = ocupado(btn, 'Entrando…');
    api('login', { pin: pin, dispositivo: dispositivoTxt() }).then(function (res) {
      if (btn) fin();
      if (!res.ok) { render(res.error); return }
      S.token = res.data.token; S.user = res.data.user; S.intro = true; S.snap = null; S.errCarga = ''; guardarSesion(); geoPedir(); cargar();
    });
  }

  /* ---------- eventos ---------- */
  function refocus(id) { var el = $('#' + id); if (el) { el.focus(); var l = el.value.length; try { el.setSelectionRange(l, l) } catch (e) {} } }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el) return;
    var a = el.getAttribute('data-a'), id = el.getAttribute('data-id'), d = S.draft;
    switch (a) {
      case 'ir': S.ruta = el.getAttribute('data-r'); S.limite = 40; render(); window.scrollTo(0, 0); break;
      case 'demo': entrar(null, el.getAttribute('data-pin')); break;
      case 'demoreset': LS.del('gea-panel-demo-' + hoy()); DB = null; S.snap = null; render(); cargar(); toast('Demo reiniciada', true); break;
      case 'recargar': S.errCarga = ''; cargar(); break;
      case 'salir': salir(); break;
      case 'cerrar': closeSheet(); break;
      case 'filtro': S.filtro = el.getAttribute('data-f'); S.limite = 40; render(); break;
      case 'mas': S.limite += 40; render(); break;
      case 'ped': detallePedido(id); break;
      case 'cli': detalleCliente(id); break;
      case 'nuevoped': abrirNuevo(id || ''); break;
      case 'nuevocli': clienteSheet('', el.getAttribute('data-desde')); break;
      case 'editcli': clienteSheet(id); break;
      case 'elegircli': d.cliente_id = id; d.abierto = false; pintarNuevo(); break;
      case 'cambiarcli': d.abierto = true; pintarNuevo(); setTimeout(function () { refocus('pq') }, 30); break;
      case 'menos': case 'mas1': var pid = el.getAttribute('data-p'), q = Math.max(0, num(d.items[pid]) + (a === 'mas1' ? 1 : -1)); d.items[pid] = q; pintarNuevo(); break;
      case 'fecha': d.fecha = C.addDays(S.snap.hoy, num(el.getAttribute('data-d'))); pintarNuevo(); break;
      case 'seg': var sg = el.closest('[data-seg]'); sg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === el ? 'true' : 'false') }); if (el.getAttribute('data-n') === 'cobra') { var cx = $('#cobrox'); if (cx) cx.style.display = el.getAttribute('data-v') === 'no' ? 'none' : '' } break;
      case 'guardarped': guardarPedido(el); break;
      case 'entregar': entregarSheet(id, false); break;
      case 'cobrar': entregarSheet(id, true); break;
      case 'confirmarentrega': confirmarEntrega(el); break;
      case 'cancelar': detallePedido(id, true); break;
      case 'cancelarok': var fin = ocupado(el, 'Cancelando…'); api('pedido.cancelar', { id: id }).then(function (res) { fin(); if (!res.ok) return setErr($('.sheet'), res.error); aplicar(res); closeSheet(); render(); toast('Pedido cancelado', true) }); break;
      case 'guardarcli': guardarCliente(el); break;
      case 'produccion': produccionSheet(); break;
      case 'guardarprod': guardarProd(el); break;
      case 'mover': moverSheet(); break;
      case 'guardarmov': guardarMov(el); break;
      case 'guardarprecios': guardarPrecios(el); break;
      case 'guardarvol': guardarVol(el); break;
      case 'usuario': usuarioSheet(el.getAttribute('data-n')); break;
      case 'usuarionuevo': usuarioSheet(''); break;
      case 'contadornuevo': usuarioSheet('', 'contador'); break;
      case 'guardarusuario': guardarUsuario(el); break;
      case 'genpin': var pe = $('#un-p'), rr = $('#un-r'); if (pe) pe.value = rr && rr.value === 'contador' ? String(1000000000 + Math.floor(Math.random() * 9000000000)) : String(100000 + Math.floor(Math.random() * 900000)); break;
      case 'guardarcfg': guardarCfg(el); break;
      case 'facturar': facturarSheet(id); break;
      case 'guardarfactura': guardarFactura(el); break;
      case 'anularfactura': var f3 = ocupado(el, 'Quitando…'); api('pedido.facturar', { id: id, anular: true }).then(function (res) { f3(); if (!res.ok) return setErr($('.sheet'), res.error); aplicar(res); closeSheet(); render(); toast('Factura quitada del registro', true) }); break;
      case 'csv': csvLibro(el.getAttribute('data-k')); break;
      case 'guardarpc': guardarPC(el); break;
      case 'guardarproy': guardarProy(el); break;
      case 'repcsv': repCSV(); break;
      case 'repimprimir': repImprimir(); break;
      case 'pregrapida': var kk = el.getAttribute('data-k'); chatAdd('u', PREG.filter(function (x) { return x[0] === kk })[0][1]); chatAdd('a', respuestaLocal(kk)); chatPintar(); break;
      case 'gasto': gastoSheet(); break;
      case 'guardargasto': guardarGasto(el); break;
      case 'vergasto': verGasto(id); break;
      case 'anulargasto': var f2 = ocupado(el, 'Anulando…'); api('gasto.anular', { id: id }).then(function (res) { f2(); if (!res.ok) return setErr($('.sheet'), res.error); aplicar(res); closeSheet(); render(); toast('Gasto anulado', true) }); break;
      case 'simrst': S.sim = { cascara: 0, ventas: 0, precio: 0, fijos: 0 }; render(); break;
      case 'compartir': copiar(resumenTexto(C.costos(S.snap))).then(function () { toast('Resumen copiado. Pégalo en tu conversación con Claude.', true) }, function () { toast('No se pudo copiar') }); break;
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target, d = S.draft;
    if (t.id === 'q-ped') { S.q = t.value; S.limite = 40; render(); refocus('q-ped') }
    else if (t.id === 'q-cli') { S.qc = t.value; render(); refocus('q-cli') }
    else if (t.id === 'pq' && d) { d.q = t.value; var o = $('#opts'); if (o) o.innerHTML = opcionesCli(d.q) }
    else if (t.hasAttribute && t.hasAttribute('data-q') && d) { d.items[t.getAttribute('data-q')] = Math.max(0, Math.floor(num(t.value))); avisoMin(); var tg = t.closest('.prod'); if (tg && isAdmin()) { /* campo de precio aparece al soltar */ } }
    else if (t.hasAttribute && t.hasAttribute('data-pr') && d) { d.precios[t.getAttribute('data-pr')] = t.value; avisoMin() }
    else if (t.hasAttribute && t.hasAttribute('data-sim')) { var k = t.getAttribute('data-sim'); S.sim[k] = num(t.value); var sv = $('#sv-' + k); if (sv) sv.textContent = (S.sim[k] > 0 ? '+' : '') + S.sim[k] + ' %'; var so = $('#simout'); if (so) so.innerHTML = simHTML(C.costos(S.snap)) }
    else if (t.id === 'pn' && d) d.nota = t.value;
    else if (t.id === 'pf' && d) { d.fecha = t.value; }
    else if (t.id === 'lb' || t.id === 'lc') { var b = num($('#lb').value), c = num($('#lc').value), r = $('#lrend'); if (r) r.textContent = b > 0 && c > 0 ? 'Rendimiento: ' + (b / c * 100).toFixed(1) + ' % de la cáscara se volvió briqueta.' : 'Escribe los kilos de briquetas y de cáscara para ver el rendimiento.' }
  });
  document.addEventListener('change', function (e) { var t = e.target; if (t.id === 'gc') { var op = t.options[t.selectedIndex], tw = $('#gtw'), tp = op.getAttribute('data-t'); if (tw) { tw.style.display = tp === 'Inversión' ? 'none' : ''; if (tp !== 'Inversión') tw.querySelectorAll('[data-a=seg]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === tp ? 'true' : 'false') }) } } if (t.hasAttribute && t.hasAttribute('data-q') && S.draft) pintarNuevo(); if (t.id === 'pf' && S.draft) pintarNuevo() });
  document.addEventListener('submit', function (e) { if (e.target.id === 'f-ia') { e.preventDefault(); var i = $('#ia-q'); var q = i.value; i.value = ''; preguntarIA(q) } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && SH) closeSheet() });

  /* ---------- arranque ---------- */
  (function boot() {
    var saved = null; try { saved = JSON.parse(LS.get('gea-panel-s-' + S.mode) || 'null') } catch (e) {}
    if (saved && saved.token && saved.user) { S.token = saved.token; S.user = saved.user; render(); cargar() } else render();
    if (S.mode === 'demo' && qs.get('demo') !== '1' && !CFG.url) { /* sin servidor configurado: demostración */ }
  })();
})();

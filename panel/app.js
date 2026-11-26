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
      return { ok: false, error: 'Clave incorrecta. En la demostración usa 123456 (administrador) o 111111 (vendedor).', code: 'clave' };
    }
    if (req.action === 'ia.preguntar') return { ok: true, data: { respuesta: 'Esto es una demostración: aquí tu asistente de IA analizaría tus números reales y te respondería con recomendaciones. En tu panel conectado a Google, esta pregunta (“' + req.pregunta + '”) se contestaría con tus datos de ventas, costos e inventario.' } };
    var res = C.handle(demoDb(), req, { user: S.user, today: hoy(), now: hoy() + ' ' + new Date().toTimeString().slice(0, 5), sheetUrl: 'https://docs.google.com/spreadsheets' });
    delete res.ops; demoGuardar();
    return res;
  }

  /* ---------- servidor ---------- */
  function api(action, payload) {
    var req = Object.assign({ action: action, token: S.token }, payload || {});
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
  var TITULOS = { asistente: 'Asistente', costos: 'Costos y planes', inicio: 'Inicio', pedidos: 'Pedidos', clientes: 'Clientes', inventario: 'Inventario', ajustes: 'Ajustes' };
  function tabBtn(r, nombre, icono) { return '<button class="tab" data-a="ir" data-r="' + r + '"' + (S.ruta === r ? ' aria-current="page"' : '') + '>' + ic(icono) + '<span>' + nombre + '</span></button>' }
  function railBtn(r, nombre, icono) { return '<button class="nav" data-a="ir" data-r="' + r + '"' + (S.ruta === r ? ' aria-current="page"' : '') + '>' + ic(icono) + '<span>' + nombre + '</span></button>' }
  function shell(inner) {
    var adm = isAdmin(), u = S.user;
    var demo = S.mode === 'demo' ? '<div class="demo"><span>Demostración con datos ficticios. No se guarda nada en tu hoja de Google.</span><button data-a="demoreset">Reiniciar demo</button></div>' : '';
    return '<div class="shell"><aside class="rail"><div class="brand"><div class="tile"><img src="../img/logo-gea-carbon.svg" alt=""></div><div><b>Panel GEA</b><small>GEA Carbón | ECOCOCO</small></div></div>' +
      railBtn('inicio', 'Inicio', 'home') + railBtn('pedidos', 'Pedidos', 'ped') + railBtn('clientes', 'Clientes', 'users') + (adm ? railBtn('inventario', 'Inventario', 'box') + railBtn('costos', 'Costos', 'coin') + railBtn('asistente', 'Asistente', 'spark') : '') + railBtn('ajustes', 'Ajustes', 'gear') +
      '<button class="btn" data-a="nuevoped">' + ic('plus') + ' Nuevo pedido</button>' +
      '<div class="who"><div class="avatar">' + esc(inicial(u.nombre)) + '</div><div>' + esc(u.nombre) + '<br><small>' + (adm ? 'Administrador' : 'Vendedor') + '</small></div></div></aside>' +
      '<div><header class="top"><div class="tile"><img src="../img/logo-gea-carbon.svg" alt=""></div><h1>' + TITULOS[S.ruta] + '<small>' + esc(fecha(hoy())) + '</small></h1><button class="avatar" data-a="ir" data-r="ajustes" aria-label="Ajustes y cuenta de ' + esc(u.nombre) + '">' + esc(inicial(u.nombre)) + '</button></header>' + demo +
      '<main class="view" id="vista">' + inner + '</main></div>' +
      '<nav class="tabs' + (adm ? ' seven' : '') + '" aria-label="Secciones">' + (adm ? tabBtn('inicio', 'Inicio', 'home') + tabBtn('pedidos', 'Pedidos', 'ped') + tabBtn('clientes', 'Clientes', 'users') + '<button class="fab" data-a="nuevoped" aria-label="Nuevo pedido">' + ic('plus') + '</button>' + tabBtn('inventario', 'Inventario', 'box') + tabBtn('costos', 'Costos', 'coin') + tabBtn('asistente', 'Asistente', 'spark') : tabBtn('inicio', 'Inicio', 'home') + tabBtn('pedidos', 'Pedidos', 'ped') + '<button class="fab" data-a="nuevoped" aria-label="Nuevo pedido">' + ic('plus') + '</button>' + tabBtn('clientes', 'Clientes', 'users') + tabBtn('ajustes', 'Ajustes', 'gear')) + '</nav></div>';
  }
  function render(aviso) {
    var app = $('#app');
    if (!S.user) { app.innerHTML = loginHTML(aviso); var f = $('#f-login'); if (f) f.addEventListener('submit', entrar); return }
    if (!S.snap) { app.innerHTML = shell(S.errCarga ? '<div class="err">' + esc(S.errCarga) + '</div><button class="btn" data-a="recargar">Reintentar</button>' : '<div class="skel" style="height:260px"></div><div class="skel"></div><div class="skel"></div>'); return }
    var v = { inicio: vInicio, pedidos: vPedidos, clientes: vClientes, inventario: vInventario, costos: vCostos, asistente: vAsistente, ajustes: vAjustes }[S.ruta] || vInicio;
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
      (adm ? tarjetaCostos() + tarjetaAsistente() : '') +
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
        '<div class="card"><h3>Tus datos</h3><p style="color:var(--suave);font-size:15px;margin-bottom:12px">Todo se guarda en tu hoja de Google. Ahí puedes ver, filtrar o exportar lo que quieras. Las claves del equipo están en la pestaña Usuarios.</p>' + (sn.sheetUrl ? '<a class="btn sec" href="' + esc(sn.sheetUrl) + '" target="_blank" rel="noopener">' + ic('sheet') + ' Abrir la hoja de Google</a>' : '') + '</div>';
    }
    h += '<div class="btn-row"><button class="btn sec" data-a="salir">' + ic('out') + ' Cerrar sesión</button></div><p style="text-align:center;color:var(--suave);font-size:13px;margin-top:16px">Panel GEA · versión 1</p>';
    return h;
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
      fld('Proveedor (opcional)', 'gp', '', {}) + fld('Fecha', 'gf', S.snap.hoy, { type: 'date' }) + '</div><div class="sh-f"><button class="btn" data-a="guardargasto">Guardar gasto</button></div>');
  }
  function guardarGasto(btn) {
    var sh = $('.sheet'), fin = ocupado(btn);
    api('gasto.registrar', { categoria: $('#gc', sh).value, monto: val(sh, 'gm'), concepto: val(sh, 'gn'), tipo: segVal(sh, 'gt'), proveedor: val(sh, 'gp'), fecha: val(sh, 'gf') }).then(function (res) { fin(); if (!res.ok) return setErr(sh, res.error); aplicar(res); closeSheet(); render(); toast('Gasto guardado', true) });
  }
  function verGasto(id) {
    var g = (S.snap.gastos || []).filter(function (x) { return x.id === id })[0]; if (!g) return;
    openSheet(shHead(g.concepto || g.categoria, esc(g.categoria) + ' · ' + esc(fecha(g.fecha))) + '<div class="sh-b"><div class="kv"><span>Monto</span><b class="d" style="font-size:24px">' + Q(g.monto) + '</b></div><div class="kv"><span>Tipo</span><b>' + esc(g.tipo) + '</b></div>' + (g.proveedor ? '<div class="kv"><span>Proveedor</span><b>' + esc(g.proveedor) + '</b></div>' : '') + '<div class="kv"><span>Registró</span><b>' + esc(g.registrado_por) + '</b></div></div><div class="sh-f"><button class="btn danger" data-a="anulargasto" data-id="' + esc(g.id) + '">Anular este gasto</button></div>');
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
    var tl = '<li>Registrado ' + esc(fecha(p.fecha)) + '<small>por ' + esc(p.creado_por) + '</small></li>';
    if (p.estado === 'Entregado') tl += '<li>Entregado ' + esc(fecha(p.fecha_entrega)) + '</li>'; else if (p.estado === 'Pendiente') tl += '<li>Entrega prevista ' + esc(fecha(p.fecha_entrega)) + '</li>'; else tl += '<li>Cancelado</li>';
    cobros.forEach(function (c) { tl += '<li>Cobro de ' + Q(c.monto) + ' · ' + esc(c.metodo) + '<small>' + esc(fecha(c.fecha)) + (c.referencia ? ' · ' + esc(c.referencia) : '') + '</small></li>' });
    var acc = '', pend = p.estado === 'Pendiente';
    if (adm && pend) acc += '<button class="btn ok" data-a="entregar" data-id="' + esc(p.id) + '">Entregar y cobrar</button>';
    if (adm && p.estado === 'Entregado' && num(p.saldo) > 0.004) acc += '<button class="btn" data-a="cobrar" data-id="' + esc(p.id) + '">Registrar cobro · saldo ' + Q(p.saldo) + '</button>';
    if (adm && cli && cli.telefono) acc += '<a class="btn sec" target="_blank" rel="noopener" href="' + esc(waLink(cli.telefono, msgCliente(p, cli))) + '">' + ic('wa') + ' Escribir al cliente</a>';
    if (!adm && pend) acc += '<a class="btn ok" target="_blank" rel="noopener" href="' + esc(waLink(cfg.whatsapp_admin, msgPedido(p, cli))) + '">' + ic('wa') + ' Reenviar a Manolo</a>';
    if (pend) acc += confirmar ? '<button class="btn danger" data-a="cancelarok" data-id="' + esc(p.id) + '">Sí, cancelar este pedido</button>' : '<button class="btn danger" data-a="cancelar" data-id="' + esc(p.id) + '">Cancelar pedido</button>';
    openSheet(shHead(p.id, esc(p.cliente) + ' · <span class="chip c-' + e.c + '">' + e.t + '</span>') + '<div class="sh-b">' + lineas +
      '<div class="kv"><span>Total</span><b class="d" style="font-size:24px">' + Q(p.total) + '</b></div>' + (p.estado === 'Entregado' ? '<div class="kv"><span>Pagado</span><b>' + Q(p.pagado) + '</b></div><div class="kv"><span>Saldo</span><b style="color:' + (num(p.saldo) > 0.004 ? 'var(--alerta)' : 'var(--bosque)') + '">' + Q(p.saldo) + '</b></div>' : '') +
      '<div class="kv"><span>Peso</span><b>' + K(p.kg) + '</b></div>' + (adm ? '<div class="kv"><span>Vendedor</span><b>' + esc(p.vendedor) + (num(p.comision) ? ' · comisión ' + Q(p.comision) : '') + '</b></div>' : '') + (p.nota ? '<div class="note" style="margin-top:12px">' + esc(p.nota) + '</div>' : '') +
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
    openSheet(shHead(id ? 'Editar cliente' : 'Nuevo cliente') + '<div class="sh-b" data-id="' + esc(id || '') + '" data-desde="' + (desde || '') + '">' + fld('Nombre del negocio o persona', 'cn', c.nombre || '', { ph: 'Ej. Tienda La Bendición' }) + '<div class="fld"><span>Tipo de precio</span>' + segHTML('tipo', C.TIPOS, c.tipo) + '</div>' +
      '<div class="two-f">' + fld('Contacto', 'cc', c.contacto || '', { ph: 'Quién atiende' }) + fld('Teléfono', 'ct', c.telefono || '', { mode: 'tel', ph: '8 dígitos' }) + '</div>' + fld('Zona o colonia', 'cz', c.zona || '', { ph: 'Ej. Centro, zona 2' }) + fld('Dirección', 'cd', c.direccion || '', { area: 1 }) + fld('Notas', 'cno', c.notas || '', { area: 1, ph: 'Horario, forma de pago, referencias' }) +
      (id && adm ? '<div class="fld"><span>Estado</span>' + segHTML('estado', ['Activo', 'Inactivo'], c.estado || 'Activo') + '</div>' : '') + '</div><div class="sh-f"><button class="btn" data-a="guardarcli">Guardar cliente</button></div>');
  }
  function guardarCliente(btn) {
    var sh = $('.sheet'), b = $('.sh-b', sh), id = b.getAttribute('data-id'), desde = b.getAttribute('data-desde'), fin = ocupado(btn);
    var c = { id: id || undefined, nombre: val(sh, 'cn'), tipo: segVal(sh, 'tipo'), contacto: val(sh, 'cc'), telefono: val(sh, 'ct'), zona: val(sh, 'cz'), direccion: val(sh, 'cd'), notas: val(sh, 'cno'), estado: segVal(sh, 'estado') || undefined };
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

  /* ---------- acceso ---------- */
  function entrar(e, pinForzado) {
    if (e && e.preventDefault) e.preventDefault();
    var pin = pinForzado || ($('#pin') ? $('#pin').value : ''), btn = $('#f-login button');
    if (!String(pin).trim()) return render('Escribe tu clave de acceso.');
    var fin = ocupado(btn, 'Entrando…');
    api('login', { pin: pin }).then(function (res) {
      if (btn) fin();
      if (!res.ok) { render(res.error); return }
      S.token = res.data.token; S.user = res.data.user; S.intro = true; S.snap = null; S.errCarga = ''; guardarSesion(); cargar();
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
      case 'guardarcfg': guardarCfg(el); break;
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

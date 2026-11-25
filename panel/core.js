/* Panel GEA · núcleo de lógica (clientes, pedidos, cobros e inventario).
   Un solo código para tres usos: el servidor de Google (Apps Script), el modo demostración del navegador y las pruebas.
   No toca hojas ni pantalla: recibe tablas en memoria y devuelve el resultado más las operaciones por guardar. */
(function (root) {
  'use strict';

  var SCHEMA = {
    Config: ['clave', 'valor'],
    Productos: ['id', 'nombre', 'kg', 'precio_tienda', 'precio_mayorista', 'precio_publico', 'activo'],
    Clientes: ['id', 'nombre', 'tipo', 'contacto', 'telefono', 'zona', 'direccion', 'notas', 'estado', 'creado', 'creado_por'],
    Pedidos: ['id', 'fecha', 'cliente_id', 'cliente', 'vendedor', 'items_json', 'resumen', 'kg', 'total', 'comision', 'estado', 'fecha_entrega', 'pagado', 'saldo', 'nota', 'creado_por', 'actualizado'],
    Cobros: ['id', 'fecha', 'pedido_id', 'cliente', 'monto', 'metodo', 'referencia', 'registrado_por'],
    Inventario: ['id', 'nombre', 'unidad', 'tipo', 'stock_min', 'activo'],
    Movimientos: ['id', 'fecha', 'articulo_id', 'articulo', 'tipo', 'cantidad', 'motivo', 'referencia', 'registrado_por'],
    Lotes: ['id', 'fecha', 'cascara_kg', 'aglutinante_kg', 'briquetas_kg', 'rendimiento', 'notas', 'registrado_por'],
    Usuarios: ['nombre', 'rol', 'pin', 'activo']
  };
  var TIPOS = ['Tienda', 'Mayorista', 'Consumidor'];
  var METODOS = ['Efectivo', 'Transferencia', 'Depósito'];
  var PRECIO = { Tienda: 'precio_tienda', Mayorista: 'precio_mayorista', Consumidor: 'precio_publico' };
  var ART_PRODUCTO = 'INV-01', ART_CASCARA = 'INV-02', ART_AGLUT = 'INV-03';

  /* ---------- utilidades ---------- */
  function PE(msg, code) { var e = new Error(msg); e.pe = true; e.code = code || 'datos'; return e }
  function n(x) { x = parseFloat(x); return isFinite(x) ? x : 0 }
  function r2(x) { return Math.round((x + 1e-9) * 100) / 100 }
  function s(x) { return x == null ? '' : String(x).trim() }
  function pad(k, w) { var t = String(k); while (t.length < w) t = '0' + t; return t }
  function nextId(rows, prefix, w) {
    var max = 0;
    rows.forEach(function (r) { var id = String(r.id || ''); if (id.indexOf(prefix) === 0) { var k = parseInt(id.slice(prefix.length), 10); if (k > max) max = k } });
    return prefix + pad(max + 1, w);
  }
  function addDays(iso, k) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10) }
  function isDate(x) { return /^\d{4}-\d{2}-\d{2}$/.test(String(x || '')) }
  function find(rows, id) { for (var i = 0; i < rows.length; i++) if (String(rows[i].id) === String(id)) return rows[i]; return null }
  function copy(o) { return JSON.parse(JSON.stringify(o)) }
  function add(db, ops, t, row) { db[t].push(row); ops.push({ t: t, op: 'add', row: copy(row) }); return row }
  function upd(db, ops, t, row, patch, key) {
    Object.keys(patch).forEach(function (k) { row[k] = patch[k] });
    ops.push({ t: t, op: 'set', key: key || 'id', row: copy(row) });
    return row;
  }
  function need(ctx, rol) { if (rol === 'admin' && ctx.user.rol !== 'admin') throw PE('Esta acción es solo para el administrador.', 'permiso') }

  /* ---------- datos iniciales ---------- */
  function defaultDb() {
    var db = {};
    Object.keys(SCHEMA).forEach(function (t) { db[t] = [] });
    db.Config = [
      { clave: 'nombre_negocio', valor: 'GEA Carbón | ECOCOCO' },
      { clave: 'comision_por_kg', valor: 1 },
      { clave: 'whatsapp_admin', valor: '50242794894' },
      { clave: 'pedido_minimo_kg', valor: 20 }
    ];
    db.Productos = [
      { id: 'PRO-01', nombre: 'Bolsa 1 kg', kg: 1, precio_tienda: 15, precio_mayorista: 14, precio_publico: 20, activo: 'Sí' },
      { id: 'PRO-02', nombre: 'Bulto 25 kg', kg: 25, precio_tienda: 375, precio_mayorista: 350, precio_publico: 500, activo: 'Sí' }
    ];
    db.Inventario = [
      { id: ART_PRODUCTO, nombre: 'Briquetas ECOCOCO', unidad: 'kg', tipo: 'producto', stock_min: 200, activo: 'Sí' },
      { id: ART_CASCARA, nombre: 'Cáscara de coco', unidad: 'kg', tipo: 'insumo', stock_min: 300, activo: 'Sí' },
      { id: ART_AGLUT, nombre: 'Aglutinante (fécula o harina de maíz)', unidad: 'kg', tipo: 'insumo', stock_min: 50, activo: 'Sí' },
      { id: 'INV-04', nombre: 'Bolsas de 1 kg', unidad: 'unid', tipo: 'empaque', stock_min: 100, activo: 'Sí' },
      { id: 'INV-05', nombre: 'Sacos para bulto de 25 kg', unidad: 'unid', tipo: 'empaque', stock_min: 20, activo: 'Sí' },
      { id: 'INV-06', nombre: 'Aceite para combustión', unidad: 'gal', tipo: 'insumo', stock_min: 10, activo: 'Sí' }
    ];
    return db;
  }

  function cfgObj(db) {
    var o = {};
    db.Config.forEach(function (r) { var v = r.valor; o[r.clave] = (typeof v === 'string' && v !== '' && isFinite(v) && r.clave !== 'whatsapp_admin') ? parseFloat(v) : v });
    return o;
  }
  function stockMap(db) {
    var m = {};
    db.Movimientos.forEach(function (x) { m[x.articulo_id] = r2((m[x.articulo_id] || 0) + n(x.cantidad)) });
    return m;
  }
  function articuloProducto(db) {
    return find(db.Inventario, ART_PRODUCTO) || db.Inventario.filter(function (a) { return a.tipo === 'producto' })[0] || null;
  }
  function mov(db, ops, ctx, art, tipo, cant, motivo, ref, fecha) {
    return add(db, ops, 'Movimientos', {
      id: nextId(db.Movimientos, 'MOV-', 5), fecha: fecha || ctx.today, articulo_id: art.id, articulo: art.nombre,
      tipo: tipo, cantidad: r2(cant), motivo: motivo || '', referencia: ref || '', registrado_por: ctx.user.nombre
    });
  }

  /* ---------- lo que ve cada usuario ---------- */
  function snapshot(db, ctx) {
    var admin = ctx.user.rol === 'admin', st = stockMap(db);
    var peds = db.Pedidos.filter(function (p) { return admin || p.vendedor === ctx.user.nombre });
    var inv = db.Inventario.filter(function (a) { return a.activo !== 'No' && (admin || a.tipo === 'producto') })
      .map(function (a) { var c = copy(a); c.stock = st[a.id] || 0; return c });
    return copy({
      user: ctx.user, hoy: ctx.today, config: cfgObj(db),
      productos: db.Productos.filter(function (p) { return p.activo !== 'No' }),
      clientes: db.Clientes,
      pedidos: peds.slice(-600),
      cobros: admin ? db.Cobros.slice(-600) : [],
      inventario: inv,
      movimientos: admin ? db.Movimientos.slice(-200) : [],
      lotes: admin ? db.Lotes.slice(-60) : [],
      sheetUrl: admin ? (ctx.sheetUrl || '') : ''
    });
  }

  /* ---------- acciones ---------- */
  var ACCIONES = {};
  var MUTA = {};
  function accion(nombre, muta, fn) { ACCIONES[nombre] = fn; if (muta) MUTA[nombre] = true }

  accion('bootstrap', false, function () { return {} });

  accion('cliente.guardar', true, function (db, req, ctx, ops) {
    var c = req.cliente || {}, nombre = s(c.nombre);
    if (!nombre) throw PE('Escribe el nombre del cliente.');
    var tipo = TIPOS.indexOf(c.tipo) >= 0 ? c.tipo : 'Tienda';
    var tel = s(c.telefono).replace(/[^\d+]/g, '');
    if (tel && tel.replace(/\D/g, '').length < 8) throw PE('El teléfono parece incompleto. Revisa que tenga 8 dígitos.');
    var dup = db.Clientes.filter(function (x) { return x.nombre.toLowerCase() === nombre.toLowerCase() && String(x.id) !== String(c.id || '') })[0];
    if (dup) throw PE('Ya existe un cliente llamado "' + dup.nombre + '". Si es otra tienda, agrega la zona al nombre.');
    var campos = { nombre: nombre, tipo: tipo, contacto: s(c.contacto), telefono: tel, zona: s(c.zona), direccion: s(c.direccion), notas: s(c.notas) };
    if (c.id) {
      var ex = find(db.Clientes, c.id); if (!ex) throw PE('No encontramos ese cliente.', 'no_existe');
      if (ctx.user.rol === 'admin' && c.estado) campos.estado = c.estado === 'Inactivo' ? 'Inactivo' : 'Activo';
      return { cliente: upd(db, ops, 'Clientes', ex, campos) };
    }
    campos.id = nextId(db.Clientes, 'CLI-', 3); campos.estado = 'Activo'; campos.creado = ctx.today; campos.creado_por = ctx.user.nombre;
    return { cliente: add(db, ops, 'Clientes', campos) };
  });

  accion('pedido.crear', true, function (db, req, ctx, ops) {
    var cli = find(db.Clientes, req.cliente_id);
    if (!cli) throw PE('Elige el cliente del pedido.');
    if (cli.estado === 'Inactivo') throw PE('Ese cliente está inactivo. Actívalo antes de hacerle un pedido.');
    var cfg = cfgObj(db), items = [];
    (req.items || []).forEach(function (it) {
      var p = find(db.Productos, it.producto_id), q = Math.floor(n(it.cantidad));
      if (!p || q <= 0) return;
      var precio = n(p[PRECIO[cli.tipo] || 'precio_tienda']);
      if (ctx.user.rol === 'admin' && it.precio !== undefined && it.precio !== null && it.precio !== '' && n(it.precio) >= 0) precio = n(it.precio);
      items.push({ producto_id: p.id, nombre: p.nombre, cantidad: q, kg: n(p.kg), precio: precio, subtotal: r2(precio * q) });
    });
    if (!items.length) throw PE('Agrega al menos un producto con cantidad.');
    var kg = 0, total = 0;
    items.forEach(function (i) { kg += i.kg * i.cantidad; total += i.subtotal });
    kg = r2(kg); total = r2(total);
    var fe = isDate(req.fecha_entrega) ? req.fecha_entrega : ctx.today;
    var vendedor = ctx.user.rol === 'vendedor' ? ctx.user.nombre : (s(req.vendedor) || ctx.user.nombre);
    var comision = ctx.user.rol === 'vendedor' ? r2(kg * n(cfg.comision_por_kg)) : 0;
    var year = ctx.today.slice(0, 4);
    var ped = add(db, ops, 'Pedidos', {
      id: nextId(db.Pedidos, 'PED-' + year + '-', 4), fecha: ctx.today, cliente_id: cli.id, cliente: cli.nombre, vendedor: vendedor,
      items_json: JSON.stringify(items), resumen: items.map(function (i) { return i.cantidad + ' × ' + i.nombre }).join(', '),
      kg: kg, total: total, comision: comision, estado: 'Pendiente', fecha_entrega: fe, pagado: 0, saldo: total,
      nota: s(req.nota), creado_por: ctx.user.nombre, actualizado: ctx.now
    });
    return { pedido: ped, aviso: kg < n(cfg.pedido_minimo_kg) ? 'El pedido mínimo es de ' + cfg.pedido_minimo_kg + ' kg.' : '' };
  });

  function registrarCobro(db, ops, ctx, ped, monto, metodo, ref) {
    monto = r2(n(monto));
    if (monto <= 0) throw PE('Escribe el monto cobrado.');
    if (monto > r2(n(ped.saldo)) + 0.005) throw PE('El cobro es mayor que el saldo (Q' + r2(n(ped.saldo)).toFixed(2) + ').');
    var cob = add(db, ops, 'Cobros', {
      id: nextId(db.Cobros, 'COB-', 5), fecha: ctx.today, pedido_id: ped.id, cliente: ped.cliente, monto: monto,
      metodo: METODOS.indexOf(metodo) >= 0 ? metodo : 'Efectivo', referencia: s(ref), registrado_por: ctx.user.nombre
    });
    var pagado = r2(n(ped.pagado) + monto);
    upd(db, ops, 'Pedidos', ped, { pagado: pagado, saldo: r2(n(ped.total) - pagado), actualizado: ctx.now });
    return cob;
  }

  accion('pedido.entregar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var ped = find(db.Pedidos, req.id);
    if (!ped) throw PE('No encontramos ese pedido.', 'no_existe');
    if (ped.estado !== 'Pendiente') throw PE('Este pedido ya está ' + ped.estado.toLowerCase() + '.');
    var art = articuloProducto(db);
    upd(db, ops, 'Pedidos', ped, { estado: 'Entregado', fecha_entrega: ctx.today, actualizado: ctx.now });
    if (art) mov(db, ops, ctx, art, 'Venta', -n(ped.kg), 'Entrega ' + ped.id + ' · ' + ped.cliente, ped.id);
    var cobro = null;
    if (req.cobrar) {
      var monto = req.cobrar.monto === 'total' || req.cobrar.monto === undefined ? ped.total : req.cobrar.monto;
      cobro = registrarCobro(db, ops, ctx, ped, monto, req.cobrar.metodo, req.cobrar.referencia);
    }
    return { pedido: ped, cobro: cobro };
  });

  accion('cobro.registrar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var ped = find(db.Pedidos, req.pedido_id);
    if (!ped) throw PE('No encontramos ese pedido.', 'no_existe');
    if (ped.estado !== 'Entregado') throw PE('Primero marca el pedido como entregado.');
    return { cobro: registrarCobro(db, ops, ctx, ped, req.monto, req.metodo, req.referencia), pedido: ped };
  });

  accion('pedido.cancelar', true, function (db, req, ctx, ops) {
    var ped = find(db.Pedidos, req.id);
    if (!ped) throw PE('No encontramos ese pedido.', 'no_existe');
    if (ctx.user.rol !== 'admin' && ped.vendedor !== ctx.user.nombre) throw PE('Solo puedes cancelar tus propios pedidos.', 'permiso');
    if (ped.estado !== 'Pendiente') throw PE('Solo se pueden cancelar pedidos que aún no se entregan.');
    var motivo = s(req.motivo);
    upd(db, ops, 'Pedidos', ped, { estado: 'Cancelado', saldo: 0, nota: (ped.nota ? ped.nota + ' · ' : '') + 'Cancelado' + (motivo ? ': ' + motivo : ''), actualizado: ctx.now });
    return { pedido: ped };
  });

  accion('inventario.mover', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var art = find(db.Inventario, req.articulo_id);
    if (!art) throw PE('Elige el artículo.');
    var tipo = req.tipo, q = n(req.cantidad), motivo = s(req.motivo);
    if (['Entrada', 'Salida', 'Ajuste'].indexOf(tipo) < 0) throw PE('Elige si es entrada, salida o ajuste.');
    if (tipo === 'Ajuste') { if (q === 0) throw PE('Escribe cuánto se ajusta (positivo suma, negativo resta).') }
    else if (q <= 0) throw PE('Escribe una cantidad mayor que cero.');
    if (tipo !== 'Entrada' && !motivo) throw PE('Escribe el motivo, para que después se entienda el movimiento.');
    var cant = tipo === 'Entrada' ? q : tipo === 'Salida' ? -q : q;
    return { movimiento: mov(db, ops, ctx, art, tipo, cant, motivo || 'Compra o ingreso', '', isDate(req.fecha) ? req.fecha : null) };
  });

  accion('produccion.registrar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var br = n(req.briquetas_kg), ca = n(req.cascara_kg), ag = n(req.aglutinante_kg);
    if (br <= 0) throw PE('Escribe cuántos kilos de briquetas salieron.');
    if (ca < 0 || ag < 0) throw PE('Los kilos de insumos no pueden ser negativos.');
    var fecha = isDate(req.fecha) ? req.fecha : ctx.today;
    var lote = add(db, ops, 'Lotes', {
      id: nextId(db.Lotes, 'LOT-', 4), fecha: fecha, cascara_kg: ca, aglutinante_kg: ag, briquetas_kg: br,
      rendimiento: ca > 0 ? r2(br / ca * 100) : '', notas: s(req.notas), registrado_por: ctx.user.nombre
    });
    var art = articuloProducto(db), c = find(db.Inventario, ART_CASCARA), a = find(db.Inventario, ART_AGLUT);
    if (art) mov(db, ops, ctx, art, 'Producción', br, 'Lote ' + lote.id, lote.id, fecha);
    if (c && ca > 0) mov(db, ops, ctx, c, 'Producción', -ca, 'Usada en ' + lote.id, lote.id, fecha);
    if (a && ag > 0) mov(db, ops, ctx, a, 'Producción', -ag, 'Usado en ' + lote.id, lote.id, fecha);
    return { lote: lote };
  });

  accion('producto.guardar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var p = find(db.Productos, req.id);
    if (!p) throw PE('No encontramos ese producto.', 'no_existe');
    var patch = {};
    ['precio_tienda', 'precio_mayorista', 'precio_publico'].forEach(function (k) {
      if (req[k] !== undefined && req[k] !== '') { var v = n(req[k]); if (v < 0) throw PE('Los precios no pueden ser negativos.'); patch[k] = r2(v) }
    });
    return { producto: upd(db, ops, 'Productos', p, patch) };
  });

  accion('config.guardar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var permitidas = ['comision_por_kg', 'whatsapp_admin', 'pedido_minimo_kg', 'nombre_negocio'], vals = req.valores || {};
    permitidas.forEach(function (k) {
      if (vals[k] === undefined) return;
      var v = k === 'whatsapp_admin' ? s(vals[k]).replace(/\D/g, '') : (k === 'nombre_negocio' ? s(vals[k]) : n(vals[k]));
      if (k === 'whatsapp_admin' && v && v.length < 8) throw PE('El número de WhatsApp parece incompleto.');
      var row = db.Config.filter(function (r) { return r.clave === k })[0];
      if (row) upd(db, ops, 'Config', row, { valor: v }, 'clave'); else add(db, ops, 'Config', { clave: k, valor: v });
    });
    return {};
  });

  accion('articulo.guardar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var a = find(db.Inventario, req.id);
    if (!a) throw PE('No encontramos ese artículo.', 'no_existe');
    var m = n(req.stock_min); if (m < 0) throw PE('El mínimo no puede ser negativo.');
    return { articulo: upd(db, ops, 'Inventario', a, { stock_min: m }) };
  });

  function handle(db, req, ctx) {
    var fn = ACCIONES[req && req.action];
    if (!fn) return { ok: false, error: 'Acción no válida.', code: 'accion' };
    var ops = [];
    try {
      var data = fn(db, req, ctx, ops);
      return { ok: true, data: data, ops: ops, snapshot: (MUTA[req.action] || req.action === 'bootstrap') ? snapshot(db, ctx) : undefined };
    } catch (e) {
      if (e && e.pe) return { ok: false, error: e.message, code: e.code, ops: [] };
      throw e;
    }
  }

  /* ---------- resumen para tableros (lo usa la pantalla; es puro y se prueba aparte) ---------- */
  function resumen(snap) {
    var hoy = snap.hoy, d7 = addDays(hoy, -6), d30 = addDays(hoy, -29), mes = hoy.slice(0, 7);
    var R = { hoy: { q: 0, kg: 0 }, semana: { q: 0, kg: 0 }, mes: { q: 0, kg: 0 }, porCobrar: 0, nPorCobrar: 0, porEntregar: [], porCobrarLista: [],
      serie: [], top: [], comisionMes: 0, comisionSemana: 0, comprometidoKg: 0, cobradoHoy: 0, cobradoMes: 0 };
    var porDia = {}, porCli = {};
    snap.pedidos.forEach(function (p) {
      if (p.estado === 'Pendiente') { R.porEntregar.push(p); R.comprometidoKg += n(p.kg) }
      if (p.estado !== 'Entregado') return;
      var f = p.fecha_entrega || p.fecha, q = n(p.total), kg = n(p.kg);
      if (n(p.saldo) > 0.004) { R.porCobrar += n(p.saldo); R.nPorCobrar++; R.porCobrarLista.push(p) }
      if (f === hoy) { R.hoy.q += q; R.hoy.kg += kg }
      if (f >= d7 && f <= hoy) { R.semana.q += q; R.semana.kg += kg; R.comisionSemana += n(p.comision) }
      if (f.slice(0, 7) === mes) { R.mes.q += q; R.mes.kg += kg; R.comisionMes += n(p.comision) }
      if (f >= d30 && f <= hoy) { var c = porCli[p.cliente_id] || (porCli[p.cliente_id] = { cliente: p.cliente, q: 0, kg: 0 }); c.q += q; c.kg += kg }
      porDia[f] = (porDia[f] || 0) + q;
    });
    snap.cobros.forEach(function (c) { if (c.fecha === hoy) R.cobradoHoy += n(c.monto); if (String(c.fecha).slice(0, 7) === mes) R.cobradoMes += n(c.monto) });
    for (var i = 13; i >= 0; i--) { var d = addDays(hoy, -i); R.serie.push({ fecha: d, q: r2(porDia[d] || 0) }) }
    R.top = Object.keys(porCli).map(function (k) { return porCli[k] }).sort(function (a, b) { return b.q - a.q }).slice(0, 5);
    R.porEntregar.sort(function (a, b) { return (a.fecha_entrega || '').localeCompare(b.fecha_entrega || '') });
    R.porCobrarLista.sort(function (a, b) { return (a.fecha_entrega || '').localeCompare(b.fecha_entrega || '') });
    ['q', 'kg'].forEach(function (k) { R.hoy[k] = r2(R.hoy[k]); R.semana[k] = r2(R.semana[k]); R.mes[k] = r2(R.mes[k]) });
    R.porCobrar = r2(R.porCobrar); R.comisionMes = r2(R.comisionMes); R.comisionSemana = r2(R.comisionSemana); R.comprometidoKg = r2(R.comprometidoKg);
    R.cobradoHoy = r2(R.cobradoHoy); R.cobradoMes = r2(R.cobradoMes);
    return R;
  }

  /* ---------- datos de demostración (ficticios), construidos con las mismas acciones reales ---------- */
  function demoDb(hoy) {
    var seed = 20261124;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    function pick(a) { return a[Math.floor(rnd() * a.length)] }
    var db = defaultDb(), admin = { nombre: 'Manolo', rol: 'admin' }, vend = { nombre: 'Wilson', rol: 'vendedor' };
    var clientes = [
      ['Tienda La Bendición', 'Tienda', 'Rosa Méndez', '5512-3401', 'Zona 1, Retalhuleu'], ['Abarrotes El Ahorro', 'Tienda', 'Carlos Pérez', '5598-2210', 'Zona 2, Retalhuleu'],
      ['Comercial San Judas', 'Tienda', 'Marta López', '4455-9087', 'Champerico'], ['Tienda Doña Lupe', 'Tienda', 'Guadalupe Ixcol', '5021-7743', 'Zona 4, Retalhuleu'],
      ['Mini Súper Los Pinos', 'Tienda', 'Julio Barrios', '5234-1180', 'San Sebastián'], ['Parrilladas El Fogón', 'Mayorista', 'Hugo Castillo', '4120-3365', 'Zona 3, Retalhuleu'],
      ['Distribuidora Costa Sur', 'Mayorista', 'Ana Girón', '5876-4402', 'Mazatenango'], ['Tienda Santa Elena', 'Tienda', 'Elena Cifuentes', '5340-6618', 'Nuevo San Carlos'],
      ['Abarrotes La Unión', 'Tienda', 'Pedro Tzoc', '4777-2095', 'El Asintal'], ['Súper Tienda Familiar', 'Tienda', 'Sandra Morales', '5199-8830', 'Zona 1, Retalhuleu'],
      ['Carnicería Don Beto', 'Consumidor', 'Alberto Sam', '5455-0127', 'Zona 5, Retalhuleu'], ['Tienda El Progreso', 'Tienda', 'Leonel Orozco', '5612-9954', 'Santa Cruz Muluá']
    ];
    var prod = { ctx: { user: admin, today: addDays(hoy, -34), now: addDays(hoy, -34) + ' 08:00', sheetUrl: '' } };
    function call(user, dia, req) { return handle(db, req, { user: user, today: dia, now: dia + ' 10:00', sheetUrl: '' }) }
    clientes.forEach(function (c) { call(vend, addDays(hoy, -34), { action: 'cliente.guardar', cliente: { nombre: c[0], tipo: c[1], contacto: c[2], telefono: c[3], zona: c[4] } }) });
    var lotes = [[-33, 560, 75, 210], [-29, 540, 70, 202], [-25, 600, 80, 226], [-21, 520, 68, 196], [-17, 580, 76, 218], [-13, 560, 72, 208], [-9, 600, 80, 226], [-5, 540, 70, 204], [-2, 570, 74, 214]];
    var loteIdx = 0;
    call(admin, addDays(hoy, -34), { action: 'inventario.mover', articulo_id: ART_CASCARA, tipo: 'Entrada', cantidad: 6200, motivo: 'Compra de cáscara' });
    call(admin, addDays(hoy, -34), { action: 'inventario.mover', articulo_id: ART_AGLUT, tipo: 'Entrada', cantidad: 760, motivo: 'Compra de aglutinante' });
    call(admin, addDays(hoy, -34), { action: 'inventario.mover', articulo_id: 'INV-04', tipo: 'Entrada', cantidad: 900, motivo: 'Compra de bolsas' });
    call(admin, addDays(hoy, -34), { action: 'inventario.mover', articulo_id: 'INV-05', tipo: 'Entrada', cantidad: 90, motivo: 'Compra de sacos' });
    call(admin, addDays(hoy, -34), { action: 'inventario.mover', articulo_id: 'INV-06', tipo: 'Entrada', cantidad: 40, motivo: 'Aceite reciclado' });
    for (var off = -33; off <= 0; off++) {
      var dia = addDays(hoy, off), L = lotes[loteIdx];
      if (L && L[0] === off) { call(admin, dia, { action: 'produccion.registrar', cascara_kg: L[1], aglutinante_kg: L[2], briquetas_kg: L[3], notas: '' }); loteIdx++ }
      if (off < -28) continue;
      var nPed = rnd() < 0.4 ? 0 : (rnd() < 0.2 ? 2 : 1);
      for (var k = 0; k < nPed; k++) {
        var cli = pick(db.Clientes), esMay = cli.tipo === 'Mayorista', items = [];
        if (esMay) items.push({ producto_id: 'PRO-02', cantidad: 1 + Math.floor(rnd() * 3) });
        else { items.push({ producto_id: 'PRO-01', cantidad: 20 + Math.floor(rnd() * 3) * 5 }); if (rnd() < 0.15) items.push({ producto_id: 'PRO-02', cantidad: 1 }) }
        var r = call(vend, dia, { action: 'pedido.crear', cliente_id: cli.id, items: items, nota: '' });
        if (!r.ok) continue;
        var id = r.data.pedido.id, tarde = off >= -1;
        if (tarde && rnd() < 0.7) continue;                       // quedan pendientes los más recientes
        var e = call(admin, dia, { action: 'pedido.entregar', id: id, cobrar: rnd() < 0.82 ? { monto: 'total', metodo: pick(METODOS) } : null });
      }
    }
    var ped = db.Pedidos.filter(function (p) { return p.estado === 'Entregado' && n(p.saldo) > 0 && n(p.pagado) === 0 })[0];
    if (ped) call(admin, hoy, { action: 'cobro.registrar', pedido_id: ped.id, monto: r2(n(ped.total) / 2), metodo: 'Transferencia', referencia: 'Dep. 48210' });
    return db;
  }

  root.PanelCore = {
    SCHEMA: SCHEMA, TIPOS: TIPOS, METODOS: METODOS, handle: handle, defaultDb: defaultDb, demoDb: demoDb, resumen: resumen,
    stockMap: stockMap, addDays: addDays, cfgObj: cfgObj, ART_PRODUCTO: ART_PRODUCTO, PRECIO: PRECIO
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

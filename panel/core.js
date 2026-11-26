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
    Gastos: ['id', 'fecha', 'categoria', 'concepto', 'monto', 'tipo', 'proveedor', 'estado', 'registrado_por'],
    Usuarios: ['nombre', 'rol', 'pin', 'activo']
  };
  var TIPOS = ['Tienda', 'Mayorista', 'Consumidor'];
  var METODOS = ['Efectivo', 'Transferencia', 'Depósito'];
  var PRECIO = { Tienda: 'precio_tienda', Mayorista: 'precio_mayorista', Consumidor: 'precio_publico' };
  var CATEGORIAS = [['Cáscara de coco', 'Variable'], ['Aglutinante', 'Variable'], ['Empaque (bolsas y sacos)', 'Variable'], ['Aceite y combustible', 'Variable'], ['Electricidad', 'Variable'], ['Transporte y fletes', 'Variable'], ['Mano de obra', 'Fijo'], ['Mantenimiento', 'Fijo'], ['Alquiler y servicios', 'Fijo'], ['Comisiones de venta', 'Variable'], ['Otros gastos', 'Fijo'], ['Inversión en equipo', 'Inversión']];
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
  /* Precio por volumen: mayorista desde 10 bolsas de 1 kg (Q15; tenderos y distribuidores en prueba lo tienen desde la primera por su tipo de cliente), Q14 desde 100 bolsas, y bulto de 25 kg a Q325 desde 10 bultos. Nunca sube el precio del tipo de cliente. */
  var VOL = { bultos: 10, precio_bulto: 325, mayoreo: 10, precio_mayoreo: 15, bolsas: 100, precio_bolsa: 14 };
  function precioUnit(p, tipo, cant, cfg) {
    var base = n(p[PRECIO[tipo] || 'precio_tienda']), pr = base, kg = n(p.kg), q = n(cant); cfg = cfg || {};
    if (kg === 25 && q >= (n(cfg.bultos_volumen) || VOL.bultos)) pr = Math.min(pr, n(cfg.precio_bulto_volumen) || VOL.precio_bulto);
    if (kg === 1 && q >= (n(cfg.bolsas_mayoreo) || VOL.mayoreo)) pr = Math.min(pr, n(cfg.precio_bolsa_mayoreo) || VOL.precio_mayoreo);
    if (kg === 1 && q >= (n(cfg.bolsas_volumen) || VOL.bolsas)) pr = Math.min(pr, n(cfg.precio_bolsa_volumen) || VOL.precio_bolsa);
    return pr;
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
      gastos: admin ? db.Gastos.slice(-500) : [],
      usuarios: admin ? db.Usuarios.map(function (u) { return { nombre: u.nombre, rol: u.rol, activo: u.activo === 'No' ? 'No' : 'Sí' } }) : [],
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
      var precio = precioUnit(p, cli.tipo, q, cfg);
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

  /* Pedido que llega desde la página pública (sin sesión). Solo lo acepta el servidor con usuario interno 'web'. */
  accion('web.pedido', true, function (db, req, ctx, ops) {
    if (!ctx.user || ctx.user.rol !== 'web') throw PE('Acción no válida.', 'accion');
    var w = req.web || {}, nom = s(w.nom).slice(0, 80), tel = s(w.tel).replace(/\D/g, '');
    if (tel.length > 8 && tel.slice(0, 3) === '502') tel = tel.slice(3);
    if (nom.length < 2) throw PE('Falta el nombre.');
    if (!/^[2-7]\d{7}$/.test(tel)) throw PE('El teléfono no es válido.');
    var items = [], avisos = [], maxP = 0;
    db.Productos.forEach(function (p) { maxP = Math.max(maxP, n(p.precio_tienda), n(p.precio_mayorista), n(p.precio_publico)) });
    (Array.isArray(w.items) ? w.items : []).slice(0, 6).forEach(function (it) {
      var kgp = it && it.k === 'k25' ? 25 : (it && it.k === 'k1' ? 1 : 0), q = Math.min(500, Math.floor(n(it && it.c)));
      var p = db.Productos.filter(function (x) { return n(x.kg) === kgp && x.activo !== 'No' })[0];
      if (!kgp || !p || q <= 0) return;
      var lista = precioUnit(p, 'Consumidor', q, cfgObj(db)), visto = n(it.p), precio = lista;
      if (visto > 0 && visto <= maxP * 2) { precio = visto; if (Math.abs(visto - lista) > 0.004) avisos.push(p.nombre + ': la página mostró Q' + visto + ' (lista del panel Q' + lista + ')') }
      items.push({ producto_id: p.id, nombre: p.nombre, cantidad: q, kg: n(p.kg), precio: precio, subtotal: r2(precio * q) });
    });
    if (!items.length) throw PE('El pedido no tiene productos.');
    var kg = 0, total = 0;
    items.forEach(function (i) { kg += i.kg * i.cantidad; total += i.subtotal });
    kg = r2(kg); total = r2(total);
    if (kg > 5000) throw PE('El pedido es demasiado grande para la página. Escríbenos por WhatsApp.');
    var cli = db.Clientes.filter(function (x) { return String(x.telefono || '').replace(/\D/g, '').slice(-8) === tel })[0];
    if (!cli) {
      var nombre = nom;
      if (db.Clientes.some(function (x) { return x.nombre.toLowerCase() === nombre.toLowerCase() })) nombre = nom + ' (' + s(w.mun).slice(0, 40) + ' ' + tel.slice(-4) + ')';
      var dir = [s(w.dir), s(w.zon), s(w.mun), s(w.dep)].filter(Boolean).join(', ').slice(0, 220);
      cli = add(db, ops, 'Clientes', {
        id: nextId(db.Clientes, 'CLI-', 3), nombre: nombre, tipo: 'Consumidor', contacto: '', telefono: tel, zona: s(w.mun).slice(0, 60),
        direccion: dir + (s(w.ref) ? ' · Ref: ' + s(w.ref).slice(0, 120) : ''), notas: (s(w.nit) ? 'NIT: ' + s(w.nit).slice(0, 20) + '. ' : '') + 'Creado desde la página web.',
        estado: 'Activo', creado: ctx.today, creado_por: 'Web'
      });
    }
    var dup = db.Pedidos.filter(function (p) { return p.creado_por === 'Web' && p.cliente_id === cli.id && p.fecha === ctx.today && p.estado === 'Pendiente' && Math.abs(n(p.total) - total) < 0.005 && n(p.kg) === kg })[0];
    if (dup) return { pedido: { id: dup.id }, repetido: true };
    var year = ctx.today.slice(0, 4);
    var ped = add(db, ops, 'Pedidos', {
      id: nextId(db.Pedidos, 'PED-' + year + '-', 4), fecha: ctx.today, cliente_id: cli.id, cliente: cli.nombre, vendedor: 'Web',
      items_json: JSON.stringify(items), resumen: items.map(function (i) { return i.cantidad + ' × ' + i.nombre }).join(', '),
      kg: kg, total: total, comision: 0, estado: 'Pendiente', fecha_entrega: ctx.today, pagado: 0, saldo: total,
      nota: ('Pedido desde la página web. Entrega y pago por coordinar. ' + (s(w.nota) ? 'Nota del cliente: ' + s(w.nota).slice(0, 200) + '. ' : '') + avisos.join('; ')).trim(),
      creado_por: 'Web', actualizado: ctx.now
    });
    return { pedido: { id: ped.id } };
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
    var permitidas = ['comision_por_kg', 'whatsapp_admin', 'pedido_minimo_kg', 'nombre_negocio', 'bolsas_mayoreo', 'precio_bolsa_mayoreo', 'bolsas_volumen', 'precio_bolsa_volumen', 'bultos_volumen', 'precio_bulto_volumen'], vals = req.valores || {};
    permitidas.forEach(function (k) {
      if (vals[k] === undefined) return;
      var v = k === 'whatsapp_admin' ? s(vals[k]).replace(/\D/g, '') : (k === 'nombre_negocio' ? s(vals[k]) : n(vals[k]));
      if (k === 'whatsapp_admin' && v && v.length < 8) throw PE('El número de WhatsApp parece incompleto.');
      var row = db.Config.filter(function (r) { return r.clave === k })[0];
      if (row) upd(db, ops, 'Config', row, { valor: v }, 'clave'); else add(db, ops, 'Config', { clave: k, valor: v });
    });
    return {};
  });

  accion('usuario.guardar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var u = req.usuario || {}, nombre = s(u.nombre).slice(0, 30), pin = s(u.pin), activo = u.activo === 'No' ? 'No' : 'Sí';
    var ex = nombre ? db.Usuarios.filter(function (x) { return x.nombre.toLowerCase() === nombre.toLowerCase() })[0] : null;
    if (!nombre) throw PE('Escribe el nombre de la persona.');
    if (pin && !/^\d{6}$/.test(pin)) throw PE('La clave debe tener exactamente 6 números.');
    if (pin && db.Usuarios.some(function (x) { return String(x.pin) === pin && (!ex || x.nombre !== ex.nombre) })) throw PE('Esa clave ya la usa otra persona. Elige otra.');
    if (!ex) {
      if (!pin) throw PE('Pon una clave de 6 números para la persona nueva.');
      var nuevo = add(db, ops, 'Usuarios', { nombre: nombre, rol: u.rol === 'admin' ? 'admin' : 'vendedor', pin: pin, activo: 'Sí' });
      return { usuario: { nombre: nuevo.nombre, rol: nuevo.rol, activo: nuevo.activo } };
    }
    if (activo === 'No' && ex.nombre === ctx.user.nombre) throw PE('No puedes desactivarte a ti mismo.');
    if (activo === 'No' && ex.rol === 'admin' && db.Usuarios.filter(function (x) { return x.rol === 'admin' && x.activo !== 'No' && x.nombre !== ex.nombre }).length === 0) throw PE('Debe quedar al menos un administrador activo.');
    var patch = { activo: u.activo === undefined ? (ex.activo === 'No' ? 'No' : 'Sí') : activo };
    if (pin) patch.pin = pin;
    upd(db, ops, 'Usuarios', ex, patch, 'nombre');
    return { usuario: { nombre: ex.nombre, rol: ex.rol, activo: ex.activo === 'No' ? 'No' : 'Sí' } };
  });

  accion('articulo.guardar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var a = find(db.Inventario, req.id);
    if (!a) throw PE('No encontramos ese artículo.', 'no_existe');
    var m = n(req.stock_min); if (m < 0) throw PE('El mínimo no puede ser negativo.');
    return { articulo: upd(db, ops, 'Inventario', a, { stock_min: m }) };
  });

  accion('gasto.registrar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var cat = CATEGORIAS.filter(function (c) { return c[0] === req.categoria })[0];
    if (!cat) throw PE('Elige la categoría del gasto.');
    var monto = r2(n(req.monto));
    if (monto <= 0) throw PE('Escribe el monto del gasto.');
    var tipo = ['Fijo', 'Variable', 'Inversión'].indexOf(req.tipo) >= 0 ? req.tipo : cat[1];
    if (cat[1] === 'Inversión') tipo = 'Inversión';
    return { gasto: add(db, ops, 'Gastos', { id: nextId(db.Gastos, 'GAS-', 5), fecha: isDate(req.fecha) ? req.fecha : ctx.today, categoria: cat[0], concepto: s(req.concepto), monto: monto, tipo: tipo, proveedor: s(req.proveedor), estado: 'Activo', registrado_por: ctx.user.nombre }) };
  });

  accion('gasto.anular', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var g = find(db.Gastos, req.id);
    if (!g) throw PE('No encontramos ese gasto.', 'no_existe');
    return { gasto: upd(db, ops, 'Gastos', g, { estado: 'Anulado' }) };
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

  /* ---------- costos y contingencia (puro: lo usa la pantalla y se prueba aparte) ---------- */
  function costos(snap) {
    var hoy = snap.hoy, d30 = addDays(hoy, -29), p30 = addDays(hoy, -59), p30f = addDays(hoy, -30);
    var gs = (snap.gastos || []).filter(function (g) { return g.estado !== 'Anulado' });
    var R = { desde: d30, hasta: hoy, gastos: { total: 0, fijo: 0, variable: 0 }, porCategoria: [], inversion: 0, inversion30: 0, kgProd: 0, kgVend: 0, ventas: 0, costoKg: null, precioProm: null, margenKg: null, margenPct: null, utilidad: 0, equilibrioKg: null, cobrado: 0, flujo: 0, recuperado: null, falta: null, cascaraDias: null, costoKgPrev: null, porCobrar: 0, alertas: [], nGastos30: 0 };
    var cat = {}, gAll = 0, gPrev = 0;
    gs.forEach(function (g) {
      var m = n(g.monto), f = String(g.fecha);
      if (g.tipo === 'Inversión') { R.inversion += m; if (f >= d30 && f <= hoy) R.inversion30 += m; return }
      gAll += m;
      if (f >= p30 && f <= p30f) gPrev += m;
      if (f < d30 || f > hoy) return;
      R.gastos.total += m; R.nGastos30++;
      if (g.tipo === 'Fijo') R.gastos.fijo += m; else R.gastos.variable += m;
      var c = cat[g.categoria] || (cat[g.categoria] = { categoria: g.categoria, tipo: g.tipo, q: 0 }); c.q += m;
    });
    var kgPrev = 0, cascara30 = 0, ventasAll = 0;
    (snap.lotes || []).forEach(function (l) {
      var f = String(l.fecha);
      if (f >= d30 && f <= hoy) { R.kgProd += n(l.briquetas_kg); cascara30 += n(l.cascara_kg) }
      else if (f >= p30 && f <= p30f) kgPrev += n(l.briquetas_kg);
    });
    (snap.pedidos || []).forEach(function (p) {
      if (p.estado !== 'Entregado') return;
      var f = String(p.fecha_entrega || p.fecha); ventasAll += n(p.total);
      if (n(p.saldo) > 0.004) R.porCobrar += n(p.saldo);
      if (f >= d30 && f <= hoy) { R.ventas += n(p.total); R.kgVend += n(p.kg) }
    });
    (snap.cobros || []).forEach(function (c) { var f = String(c.fecha); if (f >= d30 && f <= hoy) R.cobrado += n(c.monto) });
    R.porCategoria = Object.keys(cat).map(function (k) { return cat[k] }).sort(function (a, b) { return b.q - a.q });
    if (R.kgProd > 0) R.costoKg = R.gastos.total / R.kgProd;
    if (kgPrev > 0 && gPrev > 0) R.costoKgPrev = gPrev / kgPrev;
    if (R.kgVend > 0) R.precioProm = R.ventas / R.kgVend;
    if (R.costoKg !== null && R.precioProm !== null) { R.margenKg = R.precioProm - R.costoKg; R.margenPct = R.margenKg / R.precioProm }
    R.utilidad = R.ventas - R.gastos.total;
    if (R.kgProd > 0 && R.precioProm !== null) { var vk = R.gastos.variable / R.kgProd; if (R.precioProm - vk > 0) R.equilibrioKg = R.gastos.fijo / (R.precioProm - vk) }
    R.flujo = R.cobrado - R.gastos.total - R.inversion30;
    if (R.inversion > 0) { var ua = ventasAll - gAll; R.recuperado = Math.max(0, Math.min(1, ua / R.inversion)); R.falta = Math.max(0, R.inversion - ua) }
    var art = (snap.inventario || []).filter(function (a) { return a.id === ART_CASCARA })[0];
    if (art && cascara30 > 0) R.cascaraDias = art.stock / (cascara30 / 30);
    // alertas
    var A = R.alertas;
    if (R.nGastos30 === 0) A.push({ nivel: 'info', t: 'Aún no hay gastos de los últimos 30 días', d: 'Sin gastos registrados el costo por kg no es confiable. Anota cada compra y pago.' });
    if (R.cascaraDias !== null && R.cascaraDias < 10) A.push({ nivel: 'alta', t: 'Cáscara para ' + Math.floor(R.cascaraDias) + ' días', d: 'Al ritmo actual de producción se acaba pronto. Consigue la siguiente compra antes de parar la línea.' });
    else if (R.cascaraDias !== null && R.cascaraDias < 20) A.push({ nivel: 'media', t: 'Cáscara para ' + Math.floor(R.cascaraDias) + ' días', d: 'Conviene programar la próxima compra.' });
    if (R.margenPct !== null && R.margenPct < 0) A.push({ nivel: 'alta', t: 'Vendes por debajo del costo', d: 'El costo por kg supera el precio promedio. Revisa precios o gastos.' });
    else if (R.margenPct !== null && R.margenPct < 0.25) A.push({ nivel: 'media', t: 'Margen bajo (' + Math.round(R.margenPct * 100) + ' %)', d: 'Queda poco colchón ante un aumento de costos.' });
    if (R.costoKg !== null && R.costoKgPrev !== null && R.costoKg > R.costoKgPrev * 1.15) A.push({ nivel: 'media', t: 'El costo por kg subió ' + Math.round((R.costoKg / R.costoKgPrev - 1) * 100) + ' %', d: 'Comparado con los 30 días anteriores. Mira qué categoría creció.' });
    if (R.ventas > 0 && R.porCobrar > R.ventas * 0.4) A.push({ nivel: 'media', t: 'Mucho dinero en la calle', d: 'Tienes por cobrar el ' + Math.round(R.porCobrar / R.ventas * 100) + ' % de lo vendido en 30 días.' });
    if (R.equilibrioKg !== null && R.kgVend < R.equilibrioKg) A.push({ nivel: 'media', t: 'Todavía no alcanzas el punto de equilibrio', d: 'Vendiste ' + Math.round(R.kgVend) + ' kg y necesitas unos ' + Math.round(R.equilibrioKg) + ' kg al mes para cubrir los gastos fijos.' });
    var rank = { alta: 0, media: 1, info: 2 }; A.sort(function (a, b) { return rank[a.nivel] - rank[b.nivel] });
    return R;
  }
  // p: {cascara, ventas, precio, fijos} en porcentaje de cambio (ej. 20 = +20 %)
  function simular(R, p) {
    var v = 1 + n(p.ventas) / 100, pr = 1 + n(p.precio) / 100, fc = 1 + n(p.cascara) / 100, ff = 1 + n(p.fijos) / 100, variable = 0;
    R.porCategoria.forEach(function (c) { if (c.tipo === 'Variable') variable += c.q * v * (c.categoria === 'Cáscara de coco' ? fc : 1) });
    var ventas = R.ventas * v * pr, fijo = R.gastos.fijo * ff, utilidad = ventas - variable - fijo, kgVend = R.kgVend * v, out = { ventas: ventas, gastos: variable + fijo, utilidad: utilidad, delta: utilidad - R.utilidad, margenPct: ventas > 0 ? utilidad / ventas : null, equilibrioKg: null };
    if (R.kgProd > 0 && R.precioProm !== null) { var vk = variable / (R.kgProd * v), pu = R.precioProm * pr; if (pu - vk > 0) out.equilibrioKg = fijo / (pu - vk) }
    return out;
  }

  /* ---------- datos de demostración (ficticios), construidos con las mismas acciones reales ---------- */
  function demoDb(hoy) {
    var seed = 20261124;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    function pick(a) { return a[Math.floor(rnd() * a.length)] }
    var db = defaultDb(), admin = { nombre: 'Manolo', rol: 'admin' }, vend = { nombre: 'Wilson', rol: 'vendedor' };
    db.Usuarios = [{ nombre: 'Manolo', rol: 'admin', pin: '123456', activo: 'Sí' }, { nombre: 'Wilson', rol: 'vendedor', pin: '111111', activo: 'Sí' }];
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
    var gdemo = [[-34, 'Inversión en equipo', 9500, 'Línea inicial: molino, extrusora y mezcladora', 'Taller local'], [-26, 'Cáscara de coco', 1000, 'Compra de cáscara', 'Proveedor Champerico'], [-26, 'Aglutinante', 380, 'Fécula de maíz', 'Mercado'], [-8, 'Cáscara de coco', 860, 'Compra de cáscara', 'Proveedor Champerico'], [-8, 'Aglutinante', 380, 'Fécula de maíz', 'Mercado'], [-20, 'Empaque (bolsas y sacos)', 630, 'Bolsas y sacos', 'Distribuidora'], [-28, 'Mano de obra', 1200, 'Ayudante, quincena', ''], [-14, 'Mano de obra', 1200, 'Ayudante, quincena', ''], [-27, 'Electricidad', 310, 'Recibo de energía', 'Energuate'], [-3, 'Electricidad', 340, 'Recibo de energía', 'Energuate'], [-20, 'Transporte y fletes', 350, 'Flete a Mazatenango', ''], [-12, 'Mantenimiento', 280, 'Soldadura y repuestos', ''], [-15, 'Aceite y combustible', 90, 'Aceite reciclado', '']];
    gdemo.forEach(function (g) { call(admin, addDays(hoy, g[0]), { action: 'gasto.registrar', categoria: g[1], monto: g[2], concepto: g[3], proveedor: g[4] }) });
    var ped = db.Pedidos.filter(function (p) { return p.estado === 'Entregado' && n(p.saldo) > 0 && n(p.pagado) === 0 })[0];
    if (ped) call(admin, hoy, { action: 'cobro.registrar', pedido_id: ped.id, monto: r2(n(ped.total) / 2), metodo: 'Transferencia', referencia: 'Dep. 48210' });
    return db;
  }

  root.PanelCore = {
    SCHEMA: SCHEMA, TIPOS: TIPOS, METODOS: METODOS, handle: handle, defaultDb: defaultDb, demoDb: demoDb, resumen: resumen,
    stockMap: stockMap, precioUnit: precioUnit, addDays: addDays, cfgObj: cfgObj, ART_PRODUCTO: ART_PRODUCTO, PRECIO: PRECIO, CATEGORIAS: CATEGORIAS, costos: costos, simular: simular
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

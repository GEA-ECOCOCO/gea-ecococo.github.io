/* Panel GEA · núcleo de lógica (clientes, pedidos, cobros e inventario).
   Un solo código para tres usos: el servidor de Google (Apps Script), el modo demostración del navegador y las pruebas.
   No toca hojas ni pantalla: recibe tablas en memoria y devuelve el resultado más las operaciones por guardar. */
(function (root) {
  'use strict';

  var SCHEMA = {
    Config: ['clave', 'valor'],
    Productos: ['id', 'nombre', 'kg', 'precio_tienda', 'precio_mayorista', 'precio_publico', 'activo'],
    Clientes: ['id', 'nombre', 'tipo', 'contacto', 'telefono', 'zona', 'direccion', 'notas', 'estado', 'creado', 'creado_por', 'nit'],
    Pedidos: ['id', 'fecha', 'cliente_id', 'cliente', 'vendedor', 'items_json', 'resumen', 'kg', 'total', 'comision', 'estado', 'fecha_entrega', 'pagado', 'saldo', 'nota', 'creado_por', 'actualizado', 'hora', 'lugar', 'entrega_hora', 'entrega_lugar', 'fel_serie', 'fel_numero', 'fel_fecha', 'fel_estado'],
    Cobros: ['id', 'fecha', 'pedido_id', 'cliente', 'monto', 'metodo', 'referencia', 'registrado_por', 'hora', 'lugar'],
    Inventario: ['id', 'nombre', 'unidad', 'tipo', 'stock_min', 'activo'],
    Movimientos: ['id', 'fecha', 'articulo_id', 'articulo', 'tipo', 'cantidad', 'motivo', 'referencia', 'registrado_por', 'hora', 'lugar'],
    Lotes: ['id', 'fecha', 'cascara_kg', 'aglutinante_kg', 'briquetas_kg', 'rendimiento', 'notas', 'registrado_por', 'hora', 'lugar'],
    Gastos: ['id', 'fecha', 'categoria', 'concepto', 'monto', 'tipo', 'proveedor', 'estado', 'registrado_por', 'hora', 'lugar', 'nit_proveedor', 'doc_numero'],
    Usuarios: ['nombre', 'rol', 'pin', 'activo'],
    Accesos: ['fecha', 'hora', 'usuario', 'rol', 'evento', 'detalle']
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
  /* Sello automático de cada registro: hora del servidor (no la del teléfono) y lugar según el GPS del dispositivo. */
  function geoValida(g) {
    if (!g || typeof g !== 'object') return null;
    var la = parseFloat(g.lat), lo = parseFloat(g.lng), ac = parseFloat(g.acc);
    if (!isFinite(la) || !isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
    return { lat: la, lng: lo, acc: isFinite(ac) && ac >= 0 ? Math.round(ac) : null };
  }
  function lugarTxt(ctx, respaldo) {
    var g = ctx.geo;
    if (!g) return respaldo ? 'Sin GPS · ' + respaldo : 'Sin ubicación';
    if (ctx._lug === undefined) {
      var dir = '';
      try { dir = typeof ctx.reverse === 'function' ? s(ctx.reverse(g.lat, g.lng)).slice(0, 140) : '' } catch (e) { dir = '' }
      ctx._lug = (dir ? dir + ' · ' : '') + g.lat.toFixed(5) + ', ' + g.lng.toFixed(5) + (g.acc !== null ? ' (±' + g.acc + ' m)' : '');
    }
    return ctx._lug;
  }
  function sello(ctx, respaldo) { return { hora: String(ctx.now || '').slice(11, 16), lugar: lugarTxt(ctx, respaldo) } }
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
      tipo: tipo, cantidad: r2(cant), motivo: motivo || '', referencia: ref || '', registrado_por: ctx.user.nombre,
      hora: sello(ctx).hora, lugar: sello(ctx).lugar
    });
  }

  /* ---------- obligaciones SAT · pequeño contribuyente ----------
     Referencia (confirmar con SAT o tu contador): régimen de Pequeño Contribuyente, impuesto sobre el total facturado,
     libro de compras y ventas, y tope anual de ventas facturadas. Todo es editable en Ajustes. */
  var PC = { limite: 465381.25, tasa: 5 };
  function nitNorm(x, vacioOk) {
    var v = s(x).toUpperCase().replace(/[\s.\-]/g, '');
    if (!v) return vacioOk ? '' : 'CF';
    if (v === 'CF' || v === 'C/F') return 'CF';
    if (!/^[0-9]{1,12}K?$/.test(v)) throw PE('El NIT solo lleva números y, al final, puede llevar K. Escribe CF si el cliente no da NIT.');
    return v;
  }
  function pcCfg(cfg) { cfg = cfg || {}; return { limite: n(cfg.limite_pc) > 0 ? n(cfg.limite_pc) : PC.limite, tasa: cfg.tasa_pc !== undefined && cfg.tasa_pc !== '' && n(cfg.tasa_pc) >= 0 ? n(cfg.tasa_pc) : PC.tasa } }
  function felOk(p) { return !!(p.fel_numero) && p.fel_estado !== 'Anulada' && p.estado !== 'Cancelado' }
  function fiscal(db, hoy) {
    var cfg = pcCfg(cfgObj(db)), año = hoy.slice(0, 4), ini = año + '-01-01';
    var meses = {}, i; for (i = 1; i <= 12; i++) meses[año + '-' + (i < 10 ? '0' : '') + i] = { mes: año + '-' + (i < 10 ? '0' : '') + i, ventas: 0, docs: 0, impuesto: 0, compras: 0, docsCompra: 0, sinDoc: 0 };
    var cli = {}; db.Clientes.forEach(function (c) { cli[c.id] = c });
    var ventas = [], compras = [], total = 0, sinFacturar = [], sinFacturarQ = 0;
    db.Pedidos.forEach(function (p) {
      if (felOk(p)) {
        var f = String(p.fel_fecha || p.fecha).slice(0, 10); if (f.slice(0, 4) !== año) return;
        var q = n(p.total); total += q; var m = meses[f.slice(0, 7)]; if (m) { m.ventas = r2(m.ventas + q); m.docs++ }
        var c = cli[p.cliente_id] || {}; ventas.push({ id: p.id, fecha: f, serie: s(p.fel_serie), numero: s(p.fel_numero), nit: s(c.nit) || 'CF', cliente: p.cliente, total: r2(q) });
      } else if (p.estado === 'Entregado' && String(p.fecha_entrega || p.fecha).slice(0, 4) === año && p.fel_estado !== 'Anulada') { sinFacturar.push(p.id); sinFacturarQ = r2(sinFacturarQ + n(p.total)) }
    });
    db.Gastos.forEach(function (g) {
      if (g.estado === 'Anulado' || String(g.fecha).slice(0, 4) !== año) return;
      var m = meses[String(g.fecha).slice(0, 7)], q = n(g.monto); if (m) { m.compras = r2(m.compras + q); if (g.doc_numero) m.docsCompra++; else m.sinDoc++ }
      compras.push({ id: g.id, fecha: g.fecha, doc: s(g.doc_numero), nit: s(g.nit_proveedor), proveedor: s(g.proveedor), concepto: s(g.concepto) || g.categoria, monto: r2(q) });
    });
    Object.keys(meses).forEach(function (k) { meses[k].impuesto = r2(meses[k].ventas * cfg.tasa / 100) });
    total = r2(total);
    var pct = cfg.limite ? total / cfg.limite * 100 : 0, nivel = pct >= 100 ? 'excedido' : pct >= 95 ? 'critico' : pct >= 80 ? 'atencion' : 'ok';
    var d0 = new Date(ini + 'T00:00:00Z'), d1 = new Date(hoy + 'T00:00:00Z'), dias = Math.max(1, Math.round((d1 - d0) / 864e5) + 1);
    var proy = r2(total / dias * 365);
    return { año: año, limite: cfg.limite, tasa: cfg.tasa, facturado: total, pct: Math.round(pct * 10) / 10, nivel: nivel, restante: r2(Math.max(0, cfg.limite - total)), proyeccion: proy,
      meses: Object.keys(meses).sort().map(function (k) { return meses[k] }), ventas: ventas, compras: compras, sinFacturar: sinFacturar, sinFacturarQ: sinFacturarQ,
      impuestoAño: r2(total * cfg.tasa / 100) };
  }

  /* ---------- reportes financieros para banco: estado de resultados y flujo de caja ----------
     Se arman con lo que registras en el panel. Son estimaciones de administración, no estados financieros auditados. */
  var PROY = ['proy_saldo_inicial', 'proy_kg_mes', 'proy_precio_kg', 'proy_costo_kg', 'proy_fijos_mes', 'proy_crec_pct', 'bal_efectivo', 'bal_inv_otros', 'bal_deprec', 'bal_deudas', 'bal_proveedores', 'cred_monto', 'cred_tasa', 'cred_plazo'];
  var VENTA_CAT = { 'Comisiones de venta': 1, 'Transporte y fletes': 1 };
  function mesSig(m) { var y = parseInt(m.slice(0, 4), 10), k = parseInt(m.slice(5, 7), 10); k++; if (k > 12) { k = 1; y++ } return y + '-' + (k < 10 ? '0' : '') + k }
  function mesAnt(m, d) { var y = parseInt(m.slice(0, 4), 10), k = parseInt(m.slice(5, 7), 10) - d; while (k < 1) { k += 12; y-- } return y + '-' + (k < 10 ? '0' : '') + k }
  function reportes(db, hoy) {
    var cfgAll = cfgObj(db), pc = pcCfg(cfgAll), mAct = hoy.slice(0, 7), meses = [], i, M = {};
    for (i = 11; i >= 0; i--) meses.push(mesAnt(mAct, i));
    meses.forEach(function (m) { M[m] = { mes: m, ventas: 0, kg: 0, costoVentas: 0, gastosOp: 0, impuesto: 0, cobros: 0, salidas: 0, inversion: 0 } });
    db.Pedidos.forEach(function (p) {
      if (p.estado !== 'Entregado') return;
      var m = String(p.fecha_entrega || p.fecha).slice(0, 7); if (M[m]) { M[m].ventas += n(p.total); M[m].kg += n(p.kg) }
    });
    db.Gastos.forEach(function (g) {
      if (g.estado === 'Anulado') return;
      var m = String(g.fecha).slice(0, 7), x = M[m]; if (!x) return; var q = n(g.monto);
      if (g.tipo === 'Inversión') { x.inversion += q; return }
      x.salidas += q;
      if (g.tipo === 'Variable' && !VENTA_CAT[g.categoria]) x.costoVentas += q; else x.gastosOp += q;
    });
    db.Cobros.forEach(function (c) { var m = String(c.fecha).slice(0, 7); if (M[m]) M[m].cobros += n(c.monto) });
    var acum = 0, hist = meses.map(function (m) {
      var x = M[m]; ['ventas', 'kg', 'costoVentas', 'gastosOp', 'impuesto', 'cobros', 'salidas', 'inversion'].forEach(function (k) { x[k] = r2(x[k]) });
      x.impuesto = r2(x.ventas * pc.tasa / 100); x.utilBruta = r2(x.ventas - x.costoVentas); x.utilOper = r2(x.utilBruta - x.gastosOp); x.utilNeta = r2(x.utilOper - x.impuesto);
      x.flujo = r2(x.cobros - x.salidas - x.inversion); acum = r2(acum + x.flujo); x.acumulado = acum; return x;
    });
    // supuestos de proyección: lo que escribas en Ajustes manda; si está vacío, promedio de los últimos 3 meses con datos
    var ult = hist.slice(-3), kg3 = 0, v3 = 0, cv3 = 0, f3 = 0, nm = 0;
    ult.forEach(function (x) { if (x.ventas > 0 || x.salidas > 0) nm++; kg3 += x.kg; v3 += x.ventas; cv3 += x.costoVentas; f3 += x.gastosOp });
    nm = nm || 1;
    var auto = { proy_kg_mes: r2(kg3 / nm), proy_precio_kg: kg3 > 0 ? r2(v3 / kg3) : 0, proy_costo_kg: kg3 > 0 ? r2(cv3 / kg3) : 0, proy_fijos_mes: r2(f3 / nm), proy_saldo_inicial: 0, proy_crec_pct: 0 };
    var sup = {}, propio = {};
    PROY.forEach(function (k) { var v = cfgAll[k]; var tiene = v !== undefined && v !== '' && v !== null; propio[k] = tiene; sup[k] = tiene ? n(v) : auto[k] });
    var proy = [], saldo = sup.proy_saldo_inicial, kg = sup.proy_kg_mes, mm = mAct;
    for (i = 1; i <= 6; i++) {
      mm = mesSig(mm); if (i > 1) kg = kg * (1 + sup.proy_crec_pct / 100);
      var ing = r2(kg * sup.proy_precio_kg), cv = r2(kg * sup.proy_costo_kg), fj = r2(sup.proy_fijos_mes), imp = r2(ing * pc.tasa / 100), fl = r2(ing - cv - fj - imp);
      saldo = r2(saldo + fl); proy.push({ mes: mm, kg: r2(kg), ingresos: ing, costoVentas: cv, fijos: fj, impuesto: imp, flujo: fl, saldo: saldo });
    }
    // antigüedad de saldos por cobrar
    var ag = { b: [0, 0, 0, 0], nb: [0, 0, 0, 0], total: 0, lista: [] }, d1 = new Date(hoy + 'T00:00:00Z');
    db.Pedidos.forEach(function (p) {
      if (p.estado !== 'Entregado' || n(p.saldo) <= 0.004) return;
      var f = String(p.fecha_entrega || p.fecha).slice(0, 10), dias = Math.max(0, Math.round((d1 - new Date(f + 'T00:00:00Z')) / 864e5)), k = dias <= 15 ? 0 : dias <= 30 ? 1 : dias <= 60 ? 2 : 3;
      ag.b[k] = r2(ag.b[k] + n(p.saldo)); ag.nb[k]++; ag.total = r2(ag.total + n(p.saldo)); ag.lista.push({ id: p.id, cliente: p.cliente, dias: dias, saldo: r2(n(p.saldo)) });
    });
    ag.lista.sort(function (a, b) { return b.dias - a.dias }); ag.lista = ag.lista.slice(0, 10);
    // balance general simplificado
    var stP = stockMap(db), art = articuloProducto(db), kgBod = art ? Math.max(0, n(stP[art.id])) : 0, invFin = r2(kgBod * sup.proy_costo_kg), inversion = 0;
    db.Gastos.forEach(function (g) { if (g.estado !== 'Anulado' && g.tipo === 'Inversión') inversion += n(g.monto) });
    var efectivo = r2(n(cfgAll.bal_efectivo)), invOtros = r2(n(cfgAll.bal_inv_otros)), deprec = r2(n(cfgAll.bal_deprec)), activoFijo = r2(Math.max(0, inversion - deprec));
    var circ = r2(efectivo + ag.total + invFin + invOtros), activo = r2(circ + activoFijo), deudas = r2(n(cfgAll.bal_deudas)), prov = r2(n(cfgAll.bal_proveedores)), pasivo = r2(deudas + prov);
    var bal = { efectivo: efectivo, porCobrar: ag.total, inventarioFinal: invFin, kgBodega: r2(kgBod), inventarioOtros: invOtros, activoCirculante: circ, inversion: r2(inversion), depreciacion: deprec, activoFijo: activoFijo, activo: activo, deudas: deudas, proveedores: prov, pasivo: pasivo, patrimonio: r2(activo - pasivo) };
    // proyección de pago del crédito (cuota nivelada)
    var mo = n(cfgAll.cred_monto), ta = n(cfgAll.cred_tasa), pl = Math.round(n(cfgAll.cred_plazo)), cr = null;
    if (mo > 0 && pl > 0) {
      var rm = ta / 1200, cuota = rm > 0 ? mo * rm / (1 - Math.pow(1 + rm, -pl)) : mo / pl, sal = mo, tabla = [];
      for (i = 1; i <= Math.min(pl, 12); i++) { var it = sal * rm, cp = cuota - it; sal = Math.max(0, sal - cp); tabla.push({ n: i, cuota: r2(cuota), interes: r2(it), capital: r2(cp), saldo: r2(sal) }) }
      var fprom = proy.reduce(function (t, x) { return t + x.flujo }, 0) / (proy.length || 1);
      cr = { monto: r2(mo), tasa: ta, plazo: pl, cuota: r2(cuota), total: r2(cuota * pl), intereses: r2(cuota * pl - mo), flujoProm: r2(fprom), cobertura: cuota > 0 ? r2(fprom / cuota) : 0, tabla: tabla };
    }
    return { hasta: hoy, tasa: pc.tasa, meses: hist, proyeccion: proy, supuestos: sup, propios: propio, auto: auto, antiguedad: ag, balance: bal, credito: cr };
  }

  /* ---------- capacidad de crédito y líneas de financiamiento ----------
     El catálogo sale de información pública (sitios de los bancos, MINECO, BCIE, Superintendencia de Bancos), verificada en CAT_VERIF.
     Los bancos NO publican su criterio de aprobación ni sus tasas: esto mide qué tan lista está la empresa para cada línea y
     cuánto podría pagar; no promete aprobación. Las condiciones cambian, hay que confirmarlas siempre con el banco. */
  var CAT_VERIF = '2026-11-26', TASA_SUP = 14, PLAZO_SUP = 60, PLAZO_TOPE = 84, COB_OBJ = 1.5, USD = 7.8;
  var CAP_NUM = ['cap_cobertura'], CAP_TXT = ['cap_docs', 'cap_garantias', 'cap_bancos', 'cap_rtu'];
  var DOCS = [['dpi', 'DPI vigente del propietario'], ['nit', 'NIT y RTU actualizados en SAT'], ['patente', 'Patente de comercio'], ['recibo', 'Recibo reciente de agua, luz o teléfono'], ['estados_cta', 'Estados de cuenta bancarios de los últimos 3 meses'],
    ['solvencia', 'Solvencia fiscal de la SAT'], ['decl', 'Declaraciones de impuestos al día'], ['ef_firmados', 'Estados financieros firmados por tu contador'], ['flujo3', 'Flujo de caja proyectado a 3 años'],
    ['plan', 'Plan de inversión con cotizaciones del equipo'], ['patrimonial', 'Estado patrimonial e ingresos y egresos'], ['referencias', 'Autorización para consultar referencias crediticias']];
  var GARANTIAS = [['prenda', 'Prenda sobre maquinaria o vehículo'], ['fiador', 'Fiador con propiedad'], ['hipoteca', 'Hipoteca de un inmueble']];
  var BANCOS = [['bac', 'BAC Credomatic'], ['banrural', 'Banrural'], ['bi', 'Banco Industrial'], ['bam', 'BAM'], ['gt', 'G&T Continental'], ['promerica', 'Promerica'], ['chn', 'CHN'], ['coop', 'Cooperativa']];
  var FIN_CAT = [
    { id: 'fit', banco: 'MINECO', bk: 'mineco', producto: 'Fondo de Innovación Tecnológica (FIT)', tipo: 'Fondo público', montoMin: 20000, montoMax: 10000000, plazoMax: null, gracia: null, destinos: ['equipo'], rtu: true, hist: 0, docs: ['dpi', 'patente', 'plan'], garantias: null,
      tasa: 'Preferencial (cifra no publicada)', notas: 'Financia maquinaria y equipo, modernización de procesos, nuevos productos y certificaciones. Pide RTU con al menos un año en la SAT, actividad financiable y una propuesta del proyecto (innovación, resultados esperados y destino del dinero). Plazo, gracia y garantías no están publicados: confirma al 2295-2320.',
      fuente: 'https://agn.gt/como-solicitar-un-credito-del-fit-conozca-los-requisitos/' },
    { id: 'bac-sost', banco: 'BAC Credomatic', bk: 'bac', producto: 'Financiamiento sostenible (economía circular, residuos, eficiencia energética)', tipo: 'Banca privada · verde', montoMin: null, montoMax: null, plazoMax: 84, gracia: 12, destinos: ['equipo'], hist: 12, docs: ['ef_firmados', 'decl', 'plan'], garantias: null,
      tasa: 'Competitiva (cifra no publicada)', notas: 'Financia hasta el 100 % del proyecto, con hasta 7 años de plazo y 12 meses de gracia a capital. Pide buen historial crediticio, documentación legal vigente, estados financieros recientes y comprobante de ingresos o facturación. Una planta que convierte residuo de coco en carbón encaja en economía circular y residuos.',
      fuente: 'https://www.baccredomatic.com/es-gt/pymes/financiamientos-sostenibles' },
    { id: 'bac-micro', banco: 'BAC Credomatic', bk: 'bac', producto: 'Microcrédito', tipo: 'Banca privada', montoMin: 8000, montoMax: 1000000, plazoMax: 60, gracia: null, destinos: ['equipo', 'capital'], hist: 12, docs: ['dpi', 'nit', 'ef_firmados', 'plan'], docsTipicos: true, garantias: null,
      tasa: 'Competitiva (cifra no publicada)', notas: 'De Q8,000 a Q1,000,000 y hasta 60 meses; sirve para inventario, modernizar instalaciones o comprar equipo clave. El banco publica la lista de requisitos en un PDF; los documentos mostrados son los típicos de la banca privada.',
      fuente: 'https://www.baccredomatic.com/es-gt/pymes/microcreditos' },
    { id: 'bac-pre', banco: 'BAC Credomatic', bk: 'bac', producto: 'Crédito preaprobado (capital de trabajo)', tipo: 'Banca privada', montoMin: null, montoMax: Math.round(130000 * USD), plazoMax: 60, gracia: null, destinos: ['capital'], cliente: 'bac', docs: ['dpi'], garantias: null, sinGarantia: true,
      tasa: 'Fija (cifra no publicada)', notas: 'Hasta US$130,000 y 60 meses, para capital de trabajo. Se ofrece a clientes con ingresos depositados en BAC; según la evaluación puede ser sin garantía o con firma solidaria. No sirve para comprar maquinaria.',
      fuente: 'https://www.baccredomatic.com/es-gt/pymes/financiamiento/credito-preaprobado' },
    { id: 'bac-pyme', banco: 'BAC Credomatic', bk: 'bac', producto: 'Crédito PYMES', tipo: 'Banca privada', montoMin: 1000000, montoMax: 7800000, plazoMax: null, gracia: null, destinos: ['equipo', 'capital'], hist: 12, docs: ['dpi', 'nit', 'ef_firmados', 'decl', 'plan'], docsTipicos: true, garantias: null,
      tasa: 'Competitiva (cifra no publicada)', notas: 'Entre Q1,000,000 y Q7,800,000 (US$130,000 a US$1,000,000). Para montos menores el banco ofrece el microcrédito.',
      fuente: 'https://www.baccredomatic.com/es-gt/pymes/landing/requisitos-de-prestamos-pymes' },
    { id: 'gtc', banco: 'G&T Continental', bk: 'gt', producto: 'Crédito GTC Expressarial', tipo: 'Banca privada', montoMin: null, montoMax: 1000000, plazoMax: null, gracia: null, destinos: null, ventasMin: 1000000, ventasSoft: true, hist: 12, docs: ['ef_firmados', 'decl', 'plan'], docsTipicos: true, garantias: null,
      tasa: 'No publicada', notas: 'Hasta Q1,000,000 desembolsados en unos 10 días, para negocios que facturan entre Q1,000,000 y Q50,000,000 al año o tienen hasta 150 empleados. Cuanto mayor el monto, más tarda la aprobación.',
      fuente: 'https://www.prensalibre.com/c-studio/cuando-y-como-solicitar-un-credito-bancario-para-su-negocio/' },
    { id: 'mineco-fid', banco: 'MINECO · cooperativas y fundaciones', bk: 'coop', producto: 'Fideicomiso MIPYME (segundo piso)', tipo: 'Fondo público', montoMin: null, montoMax: 500000, plazoMax: null, gracia: 12, destinos: ['equipo', 'capital'], hist: 0, docs: ['dpi', 'nit', 'plan'], docsTipicos: true, garantias: null,
      tasa: 'No publicada', notas: 'MINECO no presta directo: lo hacen cooperativas, asociaciones, fundaciones y cámaras. Topes por tamaño: micro hasta Q250,000, pequeña hasta Q500,000, mediana hasta Q1,500,000. Cubre maquinaria y equipo; garantía mixta y 12 meses de gracia a capital. Cifras del folleto 2025: confirma que el fondo esté vigente.',
      fuente: 'https://mineco.gob.gt/images/que_hacer/economia/Folleto_MINECO%20Empresarial_2025.pdf' },
    { id: 'chn', banco: 'CHN', bk: 'chn', producto: 'Crédito MIPYME (línea del BCIE)', tipo: 'Banca de desarrollo', montoMin: null, montoMax: null, plazoMax: null, gracia: null, destinos: ['equipo', 'capital'], hist: 12, docs: ['dpi', 'referencias', 'recibo', 'estados_cta', 'patrimonial', 'ef_firmados', 'flujo3', 'plan'], garantias: null,
      tasa: 'Competitiva (cifra no publicada)', notas: 'El BCIE aprobó US$60 millones al CHN para micro, pequeñas y medianas empresas. La guía de requisitos del CHN pide solicitud con carta del destino de los fondos, DPI, estados de cuenta de 3 meses, estado patrimonial, estados financieros certificados por contador y flujo de caja a 3 años (primer año mensual). Esa guía es de 2022: confirma la lista vigente.',
      fuente: 'https://lahora.gt/lh-economia/hloarca/2025/08/20/bcie-aprueba-credito-para-micro-y-pequenas-empresas-en-guatemala-a-traves-del-chn/' },
    { id: 'banrural', banco: 'Banrural', bk: 'banrural', producto: 'Crédito Amigo y líneas MIPYME', tipo: 'Banca de desarrollo', montoMin: null, montoMax: null, plazoMax: null, gracia: null, destinos: null, hist: 0, docs: ['dpi', 'nit', 'recibo', 'plan', 'patente'], docsTipicos: true, garantias: null,
      tasa: 'No publicada', notas: 'Banrural canaliza fondos del BCIE a MIPYMES. Para el Crédito Amigo Microempresario pide DPI, NIT, recibo de servicios y plan de inversión o cotización; si llevas contabilidad, también patente y flujo de fondos. Montos y plazos no están publicados.',
      fuente: 'https://livinginguatemala.com/es/guias/como-conseguir-prestamo-emprendimiento-guatemala/' },
    { id: 'banca', banco: 'Banco Industrial · BAM · Promerica · G&T', bk: 'banca', bks: ['bi', 'bam', 'promerica', 'gt'], producto: 'Crédito empresarial con garantía', tipo: 'Banca privada', montoMin: null, montoMax: null, plazoMax: 120, gracia: null, destinos: ['equipo', 'capital'], hist: 12, docs: ['patente', 'nit', 'dpi', 'ef_firmados', 'decl', 'solvencia', 'plan', 'referencias'], garantias: ['prenda', 'fiador', 'hipoteca'],
      tasa: 'No publicada', notas: 'Estos bancos reciben fondeo de IFC, BID y BCIE para MIPYMES, pero no publican requisitos por producto. Lo habitual: patente, NIT, estados financieros de 1 a 3 años, declaraciones de IVA e ISR, solvencia fiscal, plan de inversión y garantía; plazos de 5 a 10 años con garantía.',
      fuente: 'https://livinginguatemala.com/es/guias/como-conseguir-prestamo-emprendimiento-guatemala/' }
  ];
  function pmt(m, ta, pl) { var rm = ta / 1200; return pl > 0 ? (rm > 0 ? m * rm / (1 - Math.pow(1 + rm, -pl)) : m / pl) : 0 }
  function pv(c, ta, pl) { var rm = ta / 1200; return c <= 0 || pl <= 0 ? 0 : (rm > 0 ? c * (1 - Math.pow(1 + rm, -pl)) / rm : c * pl) }
  function capTxt(k, raw) {
    if (k === 'cap_rtu') return s(raw) === 'Sí' ? 'Sí' : 'No';
    var lista = k === 'cap_docs' ? DOCS : (k === 'cap_garantias' ? GARANTIAS : BANCOS), ids = lista.map(function (x) { return x[0] });
    return s(raw).split(',').map(function (x) { return x.trim() }).filter(function (x, i, a) { return ids.indexOf(x) >= 0 && a.indexOf(x) === i }).join(',');
  }
  function capSim(cap, monto, tasa, plazo) {
    var cuota = pmt(monto, tasa, plazo), fl = cap.datos.flujoLibre, cob = cuota > 0 ? fl / cuota : 0;
    return { cuota: r2(cuota), cobertura: r2(cob), ok: cuota > 0 && cob >= cap.params.cobertura, total: r2(cuota * plazo) };
  }
  function financiamiento(db, hoy, R, F) {
    R = R || reportes(db, hoy); F = F || fiscal(db, hoy);
    var cfg = cfgObj(db), H = R.meses, B = R.balance, AG = R.antiguedad, i;
    var set = function (k) { var o = {}; s(cfg[k]).split(',').forEach(function (x) { if (x) o[x.trim()] = true }); return o };
    var docsOk = set('cap_docs'), garOk = set('cap_garantias'), bcoOk = set('cap_bancos'), rtu = s(cfg.cap_rtu) === 'Sí';
    var ventas12 = 0, bruta12 = 0, meses = 0;
    H.forEach(function (x) { ventas12 += x.ventas; bruta12 += x.utilBruta; if (x.ventas > 0) meses++ });
    ventas12 = r2(ventas12);
    var act = H.filter(function (x) { return x.ventas > 0 || x.salidas > 0 }), ult = act.slice(-3), fh = 0;
    ult.forEach(function (x) { fh += x.cobros - x.salidas - x.impuesto });
    fh = ult.length ? r2(fh / ult.length) : 0;
    var fp = R.proyeccion.reduce(function (t, x) { return t + x.flujo }, 0) / (R.proyeccion.length || 1), usaProy = R.supuestos.proy_kg_mes > 0 && ventas12 > 0;
    var flujoLibre = ventas12 > 0 ? r2(usaProy ? Math.min(fh, fp) : fh) : 0;
    var v3 = H.slice(-3).reduce(function (t, x) { return t + x.ventas }, 0), v3p = H.slice(-6, -3).reduce(function (t, x) { return t + x.ventas }, 0);
    var tasa = n(cfg.cred_tasa) > 0 ? n(cfg.cred_tasa) : TASA_SUP, plazoU = Math.round(n(cfg.cred_plazo)), cobT = n(cfg.cap_cobertura) > 0 ? n(cfg.cap_cobertura) : COB_OBJ;
    var cuotaMax = flujoLibre > 0 ? r2(flujoLibre / cobT) : 0, plazoRef = plazoU > 0 ? plazoU : PLAZO_SUP;
    var cap = { hasta: hoy, verificado: CAT_VERIF,
      datos: { mesesConVentas: meses, ventas12: ventas12, margenBruto: ventas12 > 0 ? r2(bruta12 / ventas12 * 100) : 0, flujoHist: fh, flujoProy: r2(fp), usaProy: usaProy, flujoLibre: flujoLibre, mesesBase: ult.length },
      params: { tasa: tasa, tasaPropia: n(cfg.cred_tasa) > 0, plazo: plazoRef, plazoPropio: plazoU > 0, cobertura: cobT, coberturaPropia: n(cfg.cap_cobertura) > 0 },
      capacidad: { cuotaMax: cuotaMax, montoMax: r2(pv(cuotaMax, tasa, plazoRef)), solicitado: null },
      sel: { docs: Object.keys(docsOk), garantias: Object.keys(garOk), bancos: Object.keys(bcoOk), rtu: rtu } };
    var mo = n(cfg.cred_monto);
    if (mo > 0 && plazoU > 0) { var cs = pmt(mo, tasa, plazoU); cap.capacidad.solicitado = { monto: r2(mo), cuota: r2(cs), cobertura: cs > 0 ? r2(flujoLibre / cs) : 0 } }
    // productos
    var Qf = function (x) { return 'Q' + Math.round(x).toLocaleString('en-US') };
    var docNom = {}; DOCS.forEach(function (d) { docNom[d[0]] = d[1] });
    var prods = FIN_CAT.map(function (e) {
      var plazo = plazoU > 0 ? Math.min(plazoU, e.plazoMax || 999) : Math.min(e.plazoMax || PLAZO_SUP, PLAZO_TOPE);
      var capP = pv(cuotaMax, tasa, plazo), posible = e.montoMax ? Math.min(capP, e.montoMax) : capP; posible = Math.floor(posible / 1000) * 1000;
      var ck = [], faltan = [], graves = [];
      function add(est, txt) { ck.push({ e: est, t: txt }); if (est === 'falta') faltan.push(txt); if (est === 'no') graves.push(txt) }
      if (flujoLibre > 0) add('ok', 'Flujo libre de ' + Qf(flujoLibre) + ' al mes: cuota máxima ' + Qf(cuotaMax)); else add('falta', 'Aún no hay flujo libre positivo para pagar una cuota: registra ventas, cobros y gastos');
      if (e.montoMin && capP < e.montoMin) add('no', 'El monto mínimo es ' + Qf(e.montoMin) + ' y hoy tu capacidad a ' + plazo + ' meses es ' + Qf(capP));
      else if (e.montoMin) add('ok', 'Tu capacidad (' + Qf(capP) + ') alcanza el mínimo de ' + Qf(e.montoMin));
      else if (e.montoMax) add('info', 'Hasta ' + Qf(e.montoMax));
      else add('info', 'Monto no publicado');
      if (e.destinos && e.destinos.indexOf('equipo') < 0) add('no', 'Es para capital de trabajo: no financia maquinaria');
      else if (e.destinos) add('ok', 'Financia maquinaria y equipo');
      else add('info', 'El destino permitido no está publicado');
      if (e.ventasMin) { if (ventas12 >= e.ventasMin) add('ok', 'Ventas de 12 meses sobre ' + Qf(e.ventasMin)); else add(e.ventasSoft ? 'falta' : 'no', 'Pide facturar al menos ' + Qf(e.ventasMin) + ' al año; llevas ' + Qf(ventas12)) }
      if (e.rtu) { if (rtu) add('ok', 'RTU con un año o más'); else add('falta', 'Confirmar RTU con un año o más (en Mis requisitos)') }
      if (e.hist) { if (meses >= e.hist) add('ok', 'Historial de ' + meses + ' meses con ventas'); else add('falta', 'Historial: ' + meses + ' de ' + e.hist + ' meses con ventas') }
      var fd = (e.docs || []).filter(function (d) { return !docsOk[d] });
      if (e.docs && e.docs.length) { if (fd.length) add('falta', 'Documentos por reunir (' + fd.length + '): ' + fd.map(function (d) { return docNom[d] }).join('; ')); else add('ok', 'Documentos listos' + (e.docsTipicos ? ' (los típicos; el banco confirma su lista)' : '')) }
      if (e.garantias) { if (e.garantias.some(function (g) { return garOk[g] })) add('ok', 'Tienes una garantía que ofrecer'); else add('falta', 'Definir una garantía: prenda del equipo, fiador o hipoteca') }
      else add('info', e.sinGarantia ? 'Puede ser sin garantía o con firma solidaria, según evaluación' : 'Garantía no publicada: pregúntala al banco');
      if (e.cliente) { if (bcoOk[e.cliente]) add('ok', 'Tienes cuenta en este banco'); else add('falta', 'Se ofrece a clientes con ingresos depositados en este banco') }
      var estado = graves.length ? 'no' : (faltan.length === 0 ? 'listo' : (faltan.length <= 3 ? 'cercano' : 'preparar'));
      var tieneCta = e.bks ? e.bks.some(function (b) { return bcoOk[b] }) : !!bcoOk[e.bk];
      var rank = ({ listo: 4, cercano: 3, preparar: 2, no: 1 })[estado] * 1000 + (e.destinos && e.destinos.indexOf('equipo') >= 0 ? 100 : 0) + (tieneCta ? 40 : 0) + Math.min(Math.floor(posible / 10000), 39);
      return { id: e.id, banco: e.banco, bk: e.bk, producto: e.producto, tipo: e.tipo, estado: estado, rank: rank, posible: estado === 'no' ? 0 : posible, plazo: plazo, cuota: posible > 0 ? r2(pmt(posible, tasa, plazo)) : 0, montoMin: e.montoMin, montoMax: e.montoMax, plazoMax: e.plazoMax, gracia: e.gracia, tasa: e.tasa, checks: ck, faltan: faltan, graves: graves, notas: e.notas, fuente: e.fuente, tieneCuenta: tieneCta };
    });
    prods.sort(function (a, b) { return b.rank - a.rank });
    cap.productos = prods;
    var vistos = {}; cap.bancos = [];
    prods.forEach(function (p) { if (vistos[p.bk]) { vistos[p.bk].n++; return } p.n = 1; vistos[p.bk] = { banco: p.banco, producto: p.producto, estado: p.estado, posible: p.posible, n: 1, tieneCuenta: p.tieneCuenta }; cap.bancos.push(vistos[p.bk]) });
    // índice de preparación (interno, no es una calificación del banco)
    var fi = F.facturado, sf = F.sinFacturarQ, share = fi + sf > 0 ? fi / (fi + sf) : 0, marg = cap.datos.margenBruto;
    var crec = v3 > 0 && v3 >= v3p ? 7 : 0, mg = Math.min(Math.max(marg, 0) / 30, 1) * 8;
    var dl = DOCS.filter(function (d) { return docsOk[d[0]] }).length, ca = AG.total > 0 ? Math.max(0, 1 - (AG.b[2] + AG.b[3]) / AG.total) : (ventas12 > 0 ? 1 : 0);
    var partes = [
      { k: 'hist', t: 'Historial de ventas', max: 25, pts: 25 * Math.min(meses / 12, 1), msg: meses + ' de 12 meses con ventas', ac: meses >= 12 ? '' : 'Registra cada venta y cada cobro: los bancos piden 12 meses o más de historial.' },
      { k: 'fiscal', t: 'Ventas facturadas (FEL)', max: 20, pts: 20 * share, msg: Math.round(share * 100) + ' % de lo entregado tiene factura', ac: share >= 0.99 ? '' : 'Factura los pedidos entregados' + (F.sinFacturar.length ? ' (' + F.sinFacturar.length + ' sin factura)' : '') + ': lo que no está facturado no cuenta para el banco.' },
      { k: 'flujo', t: 'Flujo y margen', max: 25, pts: (flujoLibre > 0 ? 10 : 0) + mg + crec, msg: flujoLibre > 0 ? 'Flujo libre ' + Qf(flujoLibre) + ' al mes · margen bruto ' + Math.round(marg) + ' %' : 'Sin flujo libre positivo todavía', ac: flujoLibre > 0 ? (marg < 30 ? 'Sube el margen bruto: cuida el costo por kilo y el precio.' : '') : 'Necesitas meses con más cobros que gastos.' },
      { k: 'docs', t: 'Carpeta de documentos', max: 20, pts: 20 * dl / DOCS.length, msg: dl + ' de ' + DOCS.length + ' documentos listos', ac: dl === DOCS.length ? '' : 'Reúne los documentos y márcalos en Mis requisitos.' },
      { k: 'cartera', t: 'Cartera sana', max: 10, pts: 10 * ca, msg: AG.total > 0 ? Qf(AG.b[2] + AG.b[3]) + ' con más de 30 días de ' + Qf(AG.total) + ' por cobrar' : 'Sin saldos por cobrar atrasados', ac: ca >= 0.9 ? '' : 'Cobra los saldos de más de 30 días antes de pedir el crédito.' }
    ];
    var tot = 0; partes.forEach(function (p) { p.pts = r2(p.pts); p.faltan = r2(p.max - p.pts); tot += p.pts });
    cap.indice = { puntos: Math.round(tot), nivel: tot >= 75 ? 'alto' : (tot >= 50 ? 'medio' : 'bajo'), partes: partes };
    cap.acciones = partes.filter(function (p) { return p.ac }).sort(function (a, b) { return b.faltan - a.faltan }).map(function (p) { return { t: p.ac, pts: p.faltan } });
    cap.tope = { limite: F.limite, ritmo: r2(F.proyeccion), pct: F.limite ? r2(F.proyeccion / F.limite * 100) : 0, nivel: F.nivel };
    return cap;
  }

  /* ---------- lo que ve cada usuario ---------- */
  function snapshot(db, ctx) {
    var admin = ctx.user.rol === 'admin', cont = ctx.user.rol === 'contador', st = stockMap(db);
    if (cont) { var cg = cfgObj(db); return copy({ user: ctx.user, hoy: ctx.today, config: { nombre_negocio: cg.nombre_negocio, limite_pc: cg.limite_pc, tasa_pc: cg.tasa_pc }, productos: [], clientes: [], pedidos: [], cobros: [], inventario: [], movimientos: [], lotes: [], gastos: [], usuarios: [], sheetUrl: '', accesos: [], fiscal: fiscal(db, ctx.today) }) }
    var Fi = admin ? fiscal(db, ctx.today) : null, Re = admin ? reportes(db, ctx.today) : null;
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
      sheetUrl: admin ? (ctx.sheetUrl || '') : '',
      fiscal: Fi, reportes: Re, capacidad: admin ? financiamiento(db, ctx.today, Re, Fi) : null,
      accesos: admin ? (db.Accesos || []).slice(-80).reverse() : []
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
    var campos = { nit: nitNorm(c.nit), nombre: nombre, tipo: tipo, contacto: s(c.contacto), telefono: tel, zona: s(c.zona), direccion: s(c.direccion), notas: s(c.notas) };
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
      nota: s(req.nota), creado_por: ctx.user.nombre, actualizado: ctx.now,
      hora: sello(ctx).hora, lugar: sello(ctx).lugar, entrega_hora: '', entrega_lugar: ''
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
      creado_por: 'Web', actualizado: ctx.now,
      hora: sello(ctx).hora, lugar: sello(ctx, [s(w.mun), s(w.dep)].filter(Boolean).join(', ')).lugar, entrega_hora: '', entrega_lugar: ''
    });
    return { pedido: { id: ped.id } };
  });

  function registrarCobro(db, ops, ctx, ped, monto, metodo, ref) {
    monto = r2(n(monto));
    if (monto <= 0) throw PE('Escribe el monto cobrado.');
    if (monto > r2(n(ped.saldo)) + 0.005) throw PE('El cobro es mayor que el saldo (Q' + r2(n(ped.saldo)).toFixed(2) + ').');
    var cob = add(db, ops, 'Cobros', {
      id: nextId(db.Cobros, 'COB-', 5), fecha: ctx.today, pedido_id: ped.id, cliente: ped.cliente, monto: monto,
      metodo: METODOS.indexOf(metodo) >= 0 ? metodo : 'Efectivo', referencia: s(ref), registrado_por: ctx.user.nombre,
      hora: sello(ctx).hora, lugar: sello(ctx).lugar
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
    upd(db, ops, 'Pedidos', ped, { estado: 'Entregado', fecha_entrega: ctx.today, actualizado: ctx.now, entrega_hora: sello(ctx).hora, entrega_lugar: sello(ctx).lugar });
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
      rendimiento: ca > 0 ? r2(br / ca * 100) : '', notas: s(req.notas), registrado_por: ctx.user.nombre,
      hora: sello(ctx).hora, lugar: sello(ctx).lugar
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
    var permitidas = ['comision_por_kg', 'whatsapp_admin', 'pedido_minimo_kg', 'nombre_negocio', 'bolsas_mayoreo', 'precio_bolsa_mayoreo', 'bolsas_volumen', 'precio_bolsa_volumen', 'bultos_volumen', 'precio_bulto_volumen', 'limite_pc', 'tasa_pc'].concat(PROY).concat(CAP_NUM).concat(CAP_TXT), vals = req.valores || {};
    permitidas.forEach(function (k) {
      if (vals[k] === undefined) return;
      var v = CAP_TXT.indexOf(k) >= 0 ? capTxt(k, vals[k]) : (k === 'whatsapp_admin' ? s(vals[k]).replace(/\D/g, '') : (k === 'nombre_negocio' ? s(vals[k]) : ((PROY.indexOf(k) >= 0 || CAP_NUM.indexOf(k) >= 0) && s(vals[k]) === '' ? '' : n(vals[k]))));
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
    var rolDest = ex ? ex.rol : (u.rol === 'admin' ? 'admin' : (u.rol === 'contador' ? 'contador' : 'vendedor'));
    if (pin && rolDest === 'contador' && !/^\d{10,12}$/.test(pin)) throw PE('La clave del contador debe tener de 10 a 12 números (es más larga porque entra una persona externa).');
    if (pin && rolDest !== 'contador' && !/^\d{6}$/.test(pin)) throw PE('La clave debe tener exactamente 6 números.');
    if (pin && db.Usuarios.some(function (x) { return String(x.pin) === pin && (!ex || x.nombre !== ex.nombre) })) throw PE('Esa clave ya la usa otra persona. Elige otra.');
    if (!ex) {
      if (!pin) throw PE('Pon una clave de 6 números para la persona nueva.');
      var nuevo = add(db, ops, 'Usuarios', { nombre: nombre, rol: u.rol === 'admin' ? 'admin' : (u.rol === 'contador' ? 'contador' : 'vendedor'), pin: pin, activo: 'Sí' });
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
    return { gasto: add(db, ops, 'Gastos', { id: nextId(db.Gastos, 'GAS-', 5), fecha: isDate(req.fecha) ? req.fecha : ctx.today, categoria: cat[0], concepto: s(req.concepto), monto: monto, tipo: tipo, proveedor: s(req.proveedor), nit_proveedor: nitNorm(req.nit_proveedor, true), doc_numero: s(req.doc_numero).slice(0, 40), estado: 'Activo', registrado_por: ctx.user.nombre, hora: sello(ctx).hora, lugar: sello(ctx).lugar }) };
  });

  accion('pedido.facturar', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var ped = find(db.Pedidos, req.id);
    if (!ped) throw PE('No encontramos ese pedido.', 'no_existe');
    if (ped.estado === 'Cancelado') throw PE('Un pedido cancelado no se factura.');
    if (req.anular) {
      if (!ped.fel_numero) throw PE('Este pedido no tiene factura registrada.');
      return { pedido: upd(db, ops, 'Pedidos', ped, { fel_estado: 'Anulada', actualizado: ctx.now }) };
    }
    var num_ = s(req.numero).replace(/\s/g, '').slice(0, 40), ser = s(req.serie).replace(/\s/g, '').toUpperCase().slice(0, 20);
    if (!num_) throw PE('Escribe el número de la factura FEL.');
    if (ped.fel_numero && ped.fel_estado !== 'Anulada') throw PE('Este pedido ya tiene la factura ' + ped.fel_serie + ' ' + ped.fel_numero + '.');
    var dup = db.Pedidos.filter(function (x) { return x.id !== ped.id && x.fel_numero && x.fel_estado !== 'Anulada' && String(x.fel_numero) === num_ && String(x.fel_serie || '') === ser })[0];
    if (dup) throw PE('Esa factura ya está en el pedido ' + dup.id + '.');
    var f = isDate(req.fecha) ? req.fecha : ctx.today;
    return { pedido: upd(db, ops, 'Pedidos', ped, { fel_serie: ser, fel_numero: num_, fel_fecha: f, fel_estado: 'Emitida', actualizado: ctx.now }) };
  });

  var EVENTOS_ACCESO = ['Descarga libro de ventas', 'Descarga libro de compras'];
  accion('acceso.registrar', true, function (db, req, ctx, ops) {
    var ev = EVENTOS_ACCESO.indexOf(req.evento) >= 0 ? req.evento : '';
    if (!ev) throw PE('Evento no válido.');
    if (!db.Accesos) db.Accesos = [];
    add(db, ops, 'Accesos', { fecha: ctx.today, hora: sello(ctx).hora, usuario: ctx.user.nombre, rol: ctx.user.rol, evento: ev, detalle: s(req.detalle).slice(0, 80) });
    return {};
  });

  accion('gasto.anular', true, function (db, req, ctx, ops) {
    need(ctx, 'admin');
    var g = find(db.Gastos, req.id);
    if (!g) throw PE('No encontramos ese gasto.', 'no_existe');
    return { gasto: upd(db, ops, 'Gastos', g, { estado: 'Anulado' }) };
  });

  /* Bitácora de actividad: quién hizo qué y cuándo. Solo se agrega; el panel no tiene ninguna acción para borrarla. Nunca guarda claves. */
  var ETIQ = { 'cliente.guardar': 'Guardó cliente', 'pedido.crear': 'Creó pedido', 'pedido.entregar': 'Entregó pedido', 'cobro.registrar': 'Registró cobro', 'pedido.cancelar': 'Canceló pedido',
    'inventario.mover': 'Movió inventario', 'produccion.registrar': 'Registró producción', 'producto.guardar': 'Cambió precios', 'config.guardar': 'Cambió reglas o cifras', 'usuario.guardar': 'Cambió equipo y claves',
    'articulo.guardar': 'Cambió mínimo de inventario', 'gasto.registrar': 'Registró gasto', 'pedido.facturar': 'Factura FEL', 'gasto.anular': 'Anuló gasto' };
  function bitacora(db, ops, ctx, req, data) {
    var d = data || {}, det = '';
    if (req.action === 'config.guardar') det = Object.keys(req.valores || {}).join(', ');
    else if (req.action === 'usuario.guardar') det = (d.usuario && d.usuario.nombre || '') + (d.usuario && d.usuario.activo === 'No' ? ' (desactivado)' : '');
    else if (req.action === 'pedido.facturar') det = (d.pedido && d.pedido.id || '') + (req.anular ? ' · quitó factura' : '');
    else det = (d.pedido && d.pedido.id) || (d.cliente && d.cliente.nombre) || (d.gasto && d.gasto.id) || (d.cobro && d.cobro.pedido_id) || (d.lote && d.lote.id) || (d.producto && d.producto.id) || '';
    if (!db.Accesos) db.Accesos = [];
    add(db, ops, 'Accesos', { fecha: ctx.today, hora: sello(ctx).hora, usuario: ctx.user.nombre, rol: ctx.user.rol, evento: ETIQ[req.action] || req.action, detalle: s(det).slice(0, 80) });
  }
  function handle(db, req, ctx) {
    var fn = ACCIONES[req && req.action];
    if (!fn) return { ok: false, error: 'Acción no válida.', code: 'accion' };
    var ops = [];
    if (ctx.user && ctx.user.rol === 'contador' && req.action !== 'bootstrap' && req.action !== 'acceso.registrar') return { ok: false, error: 'Tu acceso es solo de lectura.', code: 'permiso', ops: [] };
    ctx.geo = geoValida(req && (req.geo || (req.web && req.web.geo)));
    ctx._lug = undefined;
    try {
      var data = fn(db, req, ctx, ops);
      if (MUTA[req.action] && ctx.user && ctx.user.rol !== 'web' && req.action !== 'acceso.registrar') bitacora(db, ops, ctx, req, data);
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
    db.Usuarios = [{ nombre: 'Manolo', rol: 'admin', pin: '123456', activo: 'Sí' }, { nombre: 'Wilson', rol: 'vendedor', pin: '111111', activo: 'Sí' }, { nombre: 'Contador', rol: 'contador', pin: '222222', activo: 'Sí' }];
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
    SCHEMA: SCHEMA, fiscal: fiscal, reportes: reportes, financiamiento: financiamiento, capSim: capSim, FIN_CAT: FIN_CAT, DOCS: DOCS, GARANTIAS: GARANTIAS, BANCOS: BANCOS, nitNorm: nitNorm, TIPOS: TIPOS, METODOS: METODOS, handle: handle, defaultDb: defaultDb, demoDb: demoDb, resumen: resumen,
    stockMap: stockMap, precioUnit: precioUnit, addDays: addDays, cfgObj: cfgObj, ART_PRODUCTO: ART_PRODUCTO, PRECIO: PRECIO, CATEGORIAS: CATEGORIAS, costos: costos, simular: simular
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

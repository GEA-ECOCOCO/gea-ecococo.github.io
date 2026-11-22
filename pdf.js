/* Generador de orden de pedido en PDF, sin librerías ni servidor.
   Corre en el dispositivo del cliente; no se guarda ni se envía nada. */
(function(){
  'use strict';
  var W=612,H=792,M=40;
  // Colores de marca (0-1)
  var C={carbon:[.102,.102,.102],brasa:[.91,.365,.016],crema:[.961,.941,.902],bosque:[.176,.416,.31],coco:[.42,.259,.149],gris:[.35,.32,.28],blanco:[1,1,1]};
  // Anchos Helvetica (1/1000 em) solo para caracteres usados al alinear importes; el resto se estima
  var WD={' ':278,',':278,'.':278,'0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,'8':556,'9':556,'Q':778,'×':584,'x':500,'-':333};
  function tw(s,size,bold){var w=0;for(var i=0;i<s.length;i++){var c=s.charAt(i);w+=(WD[c]!==undefined?WD[c]:(bold?580:540))}return w*size/1000}
  // Codificación WinAnsi: Latin-1 + algunos signos; lo demás se sustituye
  var EXTRA={'–':150,'—':151,'•':149,'×':215,'·':183,'“':147,'”':148,'‘':145,'’':146,'…':133,'€':128};
  function enc(s){
    var o='';
    for(var i=0;i<s.length;i++){
      var ch=s.charAt(i),n=s.charCodeAt(i);
      if(EXTRA[ch]!==undefined)n=EXTRA[ch];
      else if(n>255||n<32)n=63;
      if(ch==='('||ch==='\\'||ch===')')o+='\\'+ch;
      else if(n<32||n>126)o+='\\'+('00'+n.toString(8)).slice(-3);
      else o+=ch;
    }
    return o;
  }
  function col(a){return a[0].toFixed(3)+' '+a[1].toFixed(3)+' '+a[2].toFixed(3)}
  function Doc(){this.s=[]}
  Doc.prototype.rect=function(x,y,w,h,fill){this.s.push(col(fill)+' rg '+x+' '+(H-y-h)+' '+w+' '+h+' re f')};
  Doc.prototype.line=function(x1,y1,x2,y2,c,lw){this.s.push(col(c)+' RG '+(lw||.7)+' w '+x1+' '+(H-y1)+' m '+x2+' '+(H-y2)+' l S')};
  Doc.prototype.text=function(s,x,y,size,o){
    o=o||{};var f=o.bold?'F2':'F1',w=tw(s,size,o.bold);
    if(o.right)x=x-w;else if(o.center)x=x-w/2;
    this.s.push('BT /'+f+' '+size+' Tf '+col(o.color||C.carbon)+' rg '+x.toFixed(2)+' '+(H-y).toFixed(2)+' Td ('+enc(s)+') Tj ET');
  };
  // Parte el texto en líneas que quepan en maxW (estimación conservadora)
  function wrap(s,size,maxW,bold){
    var words=String(s).split(/\s+/),lines=[],cur='';
    words.forEach(function(w){
      var t=cur?cur+' '+w:w;
      if(tw(t,size,bold)<=maxW)cur=t;
      else{if(cur)lines.push(cur);cur=w}
    });
    if(cur)lines.push(cur);
    return lines;
  }
  function build(doc){
    var objs=[],content=doc.s.join('\n');
    function add(s){objs.push(s);return objs.length}
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
    add('<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var out='%PDF-1.4\n',off=[];
    objs.forEach(function(o,i){off.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
    var x=out.length;
    out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
    off.forEach(function(n){out+=('0000000000'+n).slice(-10)+' 00000 n \n'});
    out+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+x+'\n%%EOF';
    // content solo usa caracteres <=255 (enc escapa el resto) => bytes = caracteres
    var u=new Uint8Array(out.length);for(var i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;
    return new Blob([u],{type:'application/pdf'});
  }
  function money(n){
    var p=(Math.round(n*100)/100).toFixed(2).split('.');
    return 'Q'+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+p[1];
  }
  function pad(n){return (n<10?'0':'')+n}

  // d: {en, no, fecha, cli:{nom,tel,dep,mun,zon,dir,ref,nota}, items:[{cod,nom,cant,p}], bulto}
  window.geaOrdenPDF=function(d){
    var L=function(es,en){return d.en?en:es};
    var doc=new Doc(),y;
    // Cabecera
    doc.rect(0,0,W,96,C.carbon);
    doc.rect(0,96,W,4,C.brasa);
    doc.text('GEA CARBÓN',M,46,26,{bold:true,color:C.crema});
    doc.text('ECOCOCO · GEA Grupo Empresarial Armas',M,64,10,{color:[.85,.8,.72]});
    doc.text('Retalhuleu, Guatemala',M,78,10,{color:[.85,.8,.72]});
    doc.text(L('ORDEN DE PEDIDO / COTIZACIÓN','ORDER / QUOTE'),W-M,40,13,{bold:true,color:C.brasa,right:true});
    doc.text(L('N.º ','No. ')+d.no,W-M,58,11,{bold:true,color:C.crema,right:true});
    doc.text(L('Fecha: ','Date: ')+d.fecha,W-M,74,10,{color:[.85,.8,.72],right:true});
    y=126;
    // Datos del cliente
    doc.text(L('DATOS DEL CLIENTE Y ENTREGA','CUSTOMER AND DELIVERY DETAILS'),M,y,10,{bold:true,color:C.bosque});
    doc.line(M,y+6,W-M,y+6,C.bosque,1);y+=24;
    var c=d.cli||{};
    var rows=[[L('Nombre','Name'),c.nom],[L('Teléfono','Phone'),c.tel],
      [L('Departamento / Municipio','Department / Town'),[c.dep,c.mun].filter(Boolean).join(' / ')],
      [L('Colonia, lotificación, sección o zona','Neighborhood, subdivision, section or zone'),c.zon],
      [L('Calle o avenida y N.º de casa o lote','Street or avenue and house or lot no.'),c.dir],
      [L('Referencia','Landmark'),c.ref]];
    if(c.nit)rows.push([L('NIT para factura','Tax ID (NIT) for invoice'),c.nit]);
    if(c.nota)rows.push([L('Notas','Notes'),c.nota]);
    rows.forEach(function(r){
      if(!r[1])return;
      doc.text(r[0],M,y,8.5,{color:C.gris});
      var ls=wrap(r[1],10.5,W-M-210);
      ls.forEach(function(l,i){doc.text(l,210,y+i*13,10.5,{bold:true})});
      y+=Math.max(1,ls.length)*13+5;
    });
    y+=8;
    // Tabla de productos
    var x1=M,x2=M+78,x3=W-M-190,x4=W-M-110,x5=W-M;
    doc.rect(M,y,W-2*M,24,C.carbon);
    doc.text(L('CÓDIGO','CODE'),x1+8,y+16,9,{bold:true,color:C.crema});
    doc.text(L('DESCRIPCIÓN','DESCRIPTION'),x2,y+16,9,{bold:true,color:C.crema});
    doc.text(L('CANT.','QTY'),x3,y+16,9,{bold:true,color:C.crema,right:true});
    doc.text(L('PRECIO UNIT.','UNIT PRICE'),x4,y+16,9,{bold:true,color:C.crema,right:true});
    doc.text(L('SUBTOTAL','SUBTOTAL'),x5-8,y+16,9,{bold:true,color:C.crema,right:true});
    y+=24;
    var total=0;
    d.items.forEach(function(it,i){
      var sub=it.cant*it.p;total+=sub;
      doc.rect(M,y,W-2*M,28,i%2?C.blanco:C.crema);
      doc.text(it.cod||'',x1+8,y+18,9.5,{color:C.gris});
      doc.text(it.nom,x2,y+18,10.5,{bold:true});
      doc.text(String(it.cant),x3,y+18,10.5,{right:true});
      doc.text(money(it.p),x4,y+18,10.5,{right:true});
      doc.text(money(sub),x5-8,y+18,10.5,{bold:true,right:true});
      y+=28;
    });
    doc.line(M,y,W-M,y,C.carbon,1);
    y+=22;
    // Totales
    var tx=W-M-8;
    doc.text(L('Subtotal productos','Products subtotal'),W-M-190,y,10.5,{color:C.gris});
    doc.text(money(total),tx,y,10.5,{right:true});y+=18;
    doc.text(L('Flete / envío','Shipping'),W-M-190,y,10.5,{color:C.gris});
    doc.text(L('Por confirmar','To be confirmed'),tx,y,10.5,{right:true});y+=10;
    doc.rect(W-M-200,y,200,32,C.carbon);
    doc.text(L('TOTAL ESTIMADO','ESTIMATED TOTAL'),W-M-190,y+21,10,{bold:true,color:C.crema});
    doc.text(money(total),tx,y+22,14,{bold:true,color:C.brasa,right:true});
    var fx=d.fx&&d.fx.r?d.fx.r:7.65;
    doc.text(L('Equivalente aprox. en US$','Approx. equivalent in US$'),W-M-190,y+48,9.5,{color:C.gris});
    doc.text('US$'+(Math.round(total/fx*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','),tx,y+48,10.5,{bold:true,right:true});
    y+=74;
    // Condiciones
    doc.text(L('CONDICIONES','TERMS'),M,y,10,{bold:true,color:C.bosque});
    doc.line(M,y+6,W-M,y+6,C.bosque,1);y+=24;
    var T=[L('Precio a consumidor final.','End-consumer price.')];
    if(d.bulto)T.push(L('En bultos de 25 kg hay precio especial según el volumen, que se confirma por WhatsApp.','For 25 kg sacks there is a special volume price, confirmed on WhatsApp.'));
    T.push(L('Tipo de cambio de referencia: Q'+fx.toFixed(2)+' por US$1'+(d.fx&&d.fx.d?' ('+d.fx.d+')':'')+'. El monto en dólares es aproximado; el cobro es en quetzales.','Reference exchange rate: Q'+fx.toFixed(2)+' per US$1'+(d.fx&&d.fx.d?' ('+d.fx.d+')':'')+'. USD amounts are approximate; payment is in quetzales.'));
    T.push(L('El flete, la entrega y la forma de pago se coordinan con GEA Carbón antes de concretar el pedido.','Shipping, delivery and payment are arranged with GEA Carbón before the order is confirmed.'));
    T.push(L('Este documento es una orden de pedido o cotización informativa y no constituye una factura. Los precios y la disponibilidad se confirman al momento del pedido.','This document is an informational order or quote and is not an invoice. Prices and availability are confirmed when the order is placed.'));
    T.forEach(function(t){
      wrap(t,9.5,W-2*M-14).forEach(function(l,i){
        if(i===0)doc.text('•',M+2,y,9.5,{color:C.brasa,bold:true});
        doc.text(l,M+14,y,9.5,{color:C.carbon});y+=13});
      y+=3;
    });
    // Pie
    doc.rect(0,H-70,W,70,C.carbon);
    doc.rect(0,H-70,W,3,C.brasa);
    doc.text(L('Para enviar o confirmar este pedido: WhatsApp +502 4279-4894','To send or confirm this order: WhatsApp +502 4279-4894'),M,H-44,10,{bold:true,color:C.crema});
    doc.text('geaecococo.ventas@gmail.com  ·  gea-ecococo.github.io',M,H-28,9.5,{color:[.85,.8,.72]});
    doc.text('ECOCOCO · GEA Carbón',W-M,H-28,9.5,{color:[.85,.8,.72],right:true});
    return build(doc);
  };

  // Número de orden: ECO-AAAAMMDD-HHMM (fecha y hora local de generación)
  window.geaOrdenNo=function(){
    var n=new Date();
    return 'ECO-'+n.getFullYear()+pad(n.getMonth()+1)+pad(n.getDate())+'-'+pad(n.getHours())+pad(n.getMinutes());
  };
  window.geaOrdenFecha=function(en){
    var n=new Date(),m=en?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return pad(n.getDate())+' '+m[n.getMonth()]+' '+n.getFullYear();
  };

  // Solicitud de factura FEL / proforma. d: {en,no,fecha,emisor:{nom,nit,dir,tel,mail},cli:{tipo,nom,nit,dir,mail,tel,dep,mun,ref,nota},items:[{cod,nom,cant,p}],fx}
  window.geaFacturaPDF=function(d){
    var L=function(es,en){return d.en?en:es};
    var doc=new Doc(),y,e=d.emisor||{},c=d.cli||{};
    doc.rect(0,0,W,96,C.carbon);doc.rect(0,96,W,4,C.brasa);
    doc.text('GEA CARBÓN',M,46,26,{bold:true,color:C.crema});
    doc.text('ECOCOCO · GEA Grupo Empresarial Armas',M,64,10,{color:[.85,.8,.72]});
    doc.text('Retalhuleu, Guatemala',M,78,10,{color:[.85,.8,.72]});
    doc.text(L('SOLICITUD DE FACTURA FEL · PROFORMA','FEL INVOICE REQUEST · PROFORMA'),W-M,40,12,{bold:true,color:C.brasa,right:true});
    doc.text(L('N.º ','No. ')+d.no,W-M,58,11,{bold:true,color:C.crema,right:true});
    doc.text(L('Fecha: ','Date: ')+d.fecha,W-M,74,10,{color:[.85,.8,.72],right:true});
    y=124;
    function sec(t){doc.text(t,M,y,10,{bold:true,color:C.bosque});doc.line(M,y+6,W-M,y+6,C.bosque,1);y+=22}
    function row(k,v){if(!v)return;doc.text(k,M,y,8.5,{color:C.gris});var ls=wrap(v,10.5,W-M-210);ls.forEach(function(l,i){doc.text(l,210,y+i*13,10.5,{bold:true})});y+=Math.max(1,ls.length)*13+5}
    sec(L('EMISOR','ISSUER'));
    row(L('Razón social','Company'),e.nom);row(L('NIT del emisor','Issuer tax ID (NIT)'),e.nit);row(L('Ubicación','Location'),e.dir);
    row(L('Contacto','Contact'),[e.tel,e.mail].filter(Boolean).join('  ·  '));
    y+=8;sec(L('DATOS PARA LA FACTURA (RECEPTOR)','INVOICE DETAILS (RECIPIENT)'));
    row(L('Nombre o razón social','Name or company'),c.nom);
    row(L('NIT del cliente','Customer tax ID (NIT)'),c.tipo==='cf'?L('CF (consumidor final)','CF (end consumer)'):c.nit);
    row(L('Dirección fiscal','Tax address'),c.dir);row(L('Correo para recibir la factura','Email to receive the invoice'),c.mail);
    row(L('Teléfono','Phone'),c.tel);row(L('Entrega (departamento / municipio)','Delivery (department / town)'),[c.dep,c.mun].filter(Boolean).join(' / '));
    row(L('Referencia de pedido o pago','Order or payment reference'),c.ref);row(L('Observaciones','Notes'),c.nota);
    y+=8;
    var x1=M,x2=M+78,x3=W-M-190,x4=W-M-110,x5=W-M;
    doc.rect(M,y,W-2*M,24,C.carbon);
    doc.text(L('CÓDIGO','CODE'),x1+8,y+16,9,{bold:true,color:C.crema});doc.text(L('DESCRIPCIÓN','DESCRIPTION'),x2,y+16,9,{bold:true,color:C.crema});
    doc.text(L('CANT.','QTY'),x3,y+16,9,{bold:true,color:C.crema,right:true});doc.text(L('PRECIO UNIT.','UNIT PRICE'),x4,y+16,9,{bold:true,color:C.crema,right:true});
    doc.text('SUBTOTAL',x5-8,y+16,9,{bold:true,color:C.crema,right:true});y+=24;
    var total=0;
    d.items.forEach(function(it,i){var sub=it.cant*it.p;total+=sub;doc.rect(M,y,W-2*M,28,i%2?C.blanco:C.crema);
      doc.text(it.cod||'',x1+8,y+18,9.5,{color:C.gris});doc.text(it.nom,x2,y+18,10.5,{bold:true});doc.text(String(it.cant),x3,y+18,10.5,{right:true});
      doc.text(money(it.p),x4,y+18,10.5,{right:true});doc.text(money(sub),x5-8,y+18,10.5,{bold:true,right:true});y+=28});
    doc.line(M,y,W-M,y,C.carbon,1);y+=20;
    var tx=W-M-8;
    doc.text(L('Flete / envío','Shipping'),W-M-190,y,10.5,{color:C.gris});doc.text(L('Por confirmar','To be confirmed'),tx,y,10.5,{right:true});y+=10;
    doc.rect(W-M-200,y,200,32,C.carbon);doc.text(L('TOTAL ESTIMADO','ESTIMATED TOTAL'),W-M-190,y+21,10,{bold:true,color:C.crema});
    doc.text(money(total),tx,y+22,14,{bold:true,color:C.brasa,right:true});
    var fx=d.fx&&d.fx.r?d.fx.r:7.65;
    if(d.en){doc.text('Approx. equivalent in US$',W-M-190,y+48,9.5,{color:C.gris});doc.text('US$'+(Math.round(total/fx*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','),tx,y+48,10.5,{bold:true,right:true});y+=18}
    y+=56;sec(L('IMPORTANTE','IMPORTANT'));
    var T=[L('Este documento es una proforma informativa con tus datos fiscales y el detalle del pedido. No es la factura.','This document is an informational proforma with your tax details and the order breakdown. It is not the invoice.'),
      L('La factura electrónica FEL se emite al confirmar el pedido y el pago, y se envía al correo indicado. El desglose de impuestos aparece en la factura.','The FEL electronic invoice is issued once the order and payment are confirmed, and is sent to the email provided. The tax breakdown appears on the invoice.'),
      L('Revisa que tu nombre y NIT coincidan con tu registro tributario: una vez emitida, la factura no puede modificarse.','Check that your name and NIT match your tax registration: once issued, the invoice cannot be edited.'),
      L('Precios en quetzales; el flete, la entrega y la forma de pago se coordinan con GEA Carbón antes de concretar el pedido.','Prices in quetzales; shipping, delivery and payment are arranged with GEA Carbón before the order is final.')];
    if(d.en)T.push('Reference exchange rate: Q'+fx.toFixed(2)+' per US$1'+(d.fx&&d.fx.d?' ('+d.fx.d+')':'')+'. The US$ amount is approximate.');
    T.forEach(function(t){wrap(t,9.5,W-2*M-14).forEach(function(l,i){if(i===0)doc.text('•',M+2,y,9.5,{color:C.brasa,bold:true});doc.text(l,M+14,y,9.5,{color:C.carbon});y+=13});y+=3});
    doc.rect(0,H-70,W,70,C.carbon);doc.rect(0,H-70,W,3,C.brasa);
    doc.text(L('Para enviar esta solicitud: WhatsApp +502 4279-4894','To send this request: WhatsApp +502 4279-4894'),M,H-44,10,{bold:true,color:C.crema});
    doc.text('geaecococo.ventas@gmail.com  ·  gea-ecococo.github.io',M,H-28,9.5,{color:[.85,.8,.72]});
    doc.text('ECOCOCO · GEA Carbón',W-M,H-28,9.5,{color:[.85,.8,.72],right:true});
    return build(doc);
  };
  window.geaFacturaNo=function(){var n=new Date();return 'PF-'+n.getFullYear()+pad(n.getMonth()+1)+pad(n.getDate())+'-'+pad(n.getHours())+pad(n.getMinutes())+pad(n.getSeconds())};
})();

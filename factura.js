/* Solicitud de factura FEL: validación (NIT con dígito verificador), total, proforma en PDF y envío por WhatsApp o correo.
   Todo ocurre en el dispositivo; no se guarda nada en un servidor. */
(function(){
  var EN=document.documentElement.lang==='en',L=function(a,b){return EN?b:a};
  var f=document.getElementById('form-fac');if(!f)return;
  var C=window.GEA_CONFIG||{},P=window.GEA_PRODUCTS||{k1:{p:20,c:'ECO-1KG'},k25:{p:350,c:'ECO-25KG'}};
  var msg=document.getElementById('fac-msg'),ok=document.getElementById('fac-ok');
  var EMISOR={nom:'GEA Grupo Empresarial Armas',nit:C.nit||'70960682',dir:'Retalhuleu, Guatemala',tel:'+502 4279-4894',mail:'geaecococo.ventas@gmail.com'};
  var NOM={k1:[L('Briquetas ECOCOCO, bolsa de 1 kg','ECOCOCO briquettes, 1 kg bag'),1],k25:[L('Briquetas ECOCOCO, bulto de 25 kg','ECOCOCO briquettes, 25 kg sack'),25]};
  function val(n){var e=f.elements[n];return e?(e.type==='checkbox'?e.checked:String(e.value).trim()):''}
  function tipo(){var r=f.querySelector('input[name=tipo]:checked');return r?r.value:'nit'}
  function q(n){return 'Q'+(Math.round(n*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',')}
  /* NIT de Guatemala: cuerpo numérico + dígito verificador (0-9 o K), módulo 11 */
  function nitOk(s){
    s=String(s).toUpperCase().replace(/[\s-]/g,'');
    if(!/^\d{2,11}[\dK]$/.test(s))return false;
    var d=s.slice(0,-1),c=s.slice(-1),sum=0;
    for(var i=0;i<d.length;i++)sum+=parseInt(d.charAt(i),10)*(d.length+1-i);
    var r=(11-sum%11)%11;
    return c===(r===10?'K':String(r));
  }
  function nitFmt(s){s=String(s).toUpperCase().replace(/[\s-]/g,'');return s.length>1?s.slice(0,-1)+'-'+s.slice(-1):s}
  function item(){var k=val('producto')||'k1',n=Math.max(0,parseInt(val('cantidad'),10)||0),p=(P[k]&&P[k].p)||(k==='k25'?350:20);return {k:k,cod:(P[k]&&P[k].c)||(k==='k25'?'ECO-25KG':'ECO-1KG'),nom:NOM[k][0],cant:n,p:k==='k25'?p:p,kg:n*NOM[k][1]}}
  function total(){var it=item(),t=it.cant*it.p,el=document.getElementById('fac-total'),u=document.getElementById('fac-usd');
    if(el)el.textContent=q(t);
    if(u){var fx=C.usdRate||7.65;u.textContent=EN&&t?'≈ US$'+(Math.round(t/fx*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',')+' · Q'+fx.toFixed(2)+'/US$':''}
    var kgEl=document.getElementById('fac-kg');if(kgEl)kgEl.textContent=it.kg?(it.kg+' kg'):''}
  function err(el,t){el.setAttribute('aria-invalid','true');el.classList.add('inv');var s=el.parentNode.querySelector('.e');if(!s){s=document.createElement('span');s.className='e';el.parentNode.appendChild(s)}s.textContent=t}
  function limpia(){f.querySelectorAll('.inv').forEach(function(e){e.classList.remove('inv');e.removeAttribute('aria-invalid')});f.querySelectorAll('.e').forEach(function(e){e.remove()});msg.textContent='';msg.className='fd-msg'}
  function validar(){
    limpia();var bad=null;
    function m(el,t){err(el,t);bad=bad||el}
    if(val('nombre').length<2)m(f.elements.nombre,L('Escribe el nombre o la razón social.','Enter the name or company name.'));
    if(tipo()==='nit'&&!nitOk(val('nit')))m(f.elements.nit,L('Revisa el NIT: debe incluir el dígito verificador (por ejemplo 1234567-8).','Check the NIT: it must include the check digit (for example 1234567-8).'));
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('correo')))m(f.elements.correo,L('Escribe un correo válido, como nombre@dominio.com.','Enter a valid email, like name@domain.com.'));
    var t=val('telefono').replace(/[\s()-]/g,'').replace(/^\+?502/,'');
    if(!/^[2-7]\d{7}$/.test(t))m(f.elements.telefono,L('Escribe un teléfono de 8 dígitos (Guatemala).','Enter an 8-digit phone number (Guatemala).'));
    if(!val('departamento'))m(f.elements.departamento,L('Elige una opción.','Choose an option.'));
    if(val('municipio').length<2)m(f.elements.municipio,L('Escribe este dato.','Please fill in this field.'));
    var n=parseInt(val('cantidad'),10);if(!(n>=1&&n<=99999))m(f.elements.cantidad,L('Escribe una cantidad entre 1 y 99,999.','Enter a quantity between 1 and 99,999.'));
    if(!val('privacidad'))m(f.elements.privacidad,L('Debes aceptar el aviso de privacidad.','You must accept the privacy notice.'));
    return bad;
  }
  function datos(){return {no:window.geaFacturaNo(),fecha:window.geaOrdenFecha(EN),tipo:tipo(),nom:val('nombre'),nit:tipo()==='cf'?'CF':nitFmt(val('nit')),dir:val('direccion'),mail:val('correo'),tel:val('telefono'),dep:val('departamento'),mun:val('municipio'),ref:val('referencia'),nota:val('notas'),it:item()}}
  function texto(d){
    var t=EN?'Hi, I would like to request an FEL invoice.\n':'Hola, quiero solicitar una factura FEL.\n';
    var l=[(EN?'Request: ':'Solicitud: ')+d.no,(EN?'Name: ':'Nombre: ')+d.nom,'NIT: '+(d.tipo==='cf'?(EN?'CF (end consumer)':'CF (consumidor final)'):d.nit)];
    if(d.dir)l.push((EN?'Tax address: ':'Dirección fiscal: ')+d.dir);
    l.push((EN?'Invoice email: ':'Correo para la factura: ')+d.mail,(EN?'Phone: ':'Teléfono: ')+d.tel,(EN?'Delivery: ':'Entrega: ')+d.mun+', '+d.dep,
      (EN?'Order: ':'Pedido: ')+d.it.cant+' × '+d.it.nom+' = '+q(d.it.cant*d.it.p));
    if(d.ref)l.push((EN?'Reference: ':'Referencia: ')+d.ref);
    if(d.nota)l.push((EN?'Notes: ':'Observaciones: ')+d.nota);
    return t+l.join('\n');
  }
  function pdf(d){return window.geaFacturaPDF({en:EN,no:d.no,fecha:d.fecha,emisor:EMISOR,cli:{tipo:d.tipo,nom:d.nom,nit:d.nit,dir:d.dir,mail:d.mail,tel:d.tel,dep:d.dep,mun:d.mun,ref:d.ref,nota:d.nota},items:[{cod:d.it.cod,nom:d.it.nom,cant:d.it.cant,p:d.it.p}],fx:{r:C.usdRate||7.65,d:C.usdDate||''}})}
  function bajar(blob,n){var o=URL.createObjectURL(blob),a=document.createElement('a');a.href=o;a.download=n;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(o)},4000)}
  function track(via,d){try{window.geaTrack&&geaTrack('solicitud_factura',{via:via,tipo:d.tipo})}catch(x){}}
  function fin(d,via){
    var wa='https://wa.me/'+(C.whatsapp||'50242794894')+'?text='+encodeURIComponent(texto(d));
    var mail='mailto:geaecococo.ventas@gmail.com?subject='+encodeURIComponent((EN?'FEL invoice request ':'Solicitud de factura FEL ')+d.no)+'&body='+encodeURIComponent(texto(d));
    f.hidden=true;ok.hidden=false;
    var fn=(EN?'ecococo-invoice-request-':'ecococo-solicitud-factura-')+d.no+'.pdf';
    ok.innerHTML='<h3>'+(via==='pdf'?L('Tu proforma se descargó','Your proforma was downloaded'):L('Tu solicitud está lista','Your request is ready'))+'</h3>'
      +'<p>'+L('Número de solicitud','Request number')+': <strong>'+d.no+'</strong></p>'
      +'<p>'+L('Para que emitamos la factura FEL, envíanos la solicitud. Tus datos no se guardan en este sitio: solo se envían si tú los mandas.','So that we can issue the FEL invoice, send us the request. Your data is not stored on this site: it is only sent if you send it.')+'</p>'
      +'<p><a class="btn wa" target="_blank" rel="noopener" href="'+wa+'" data-via="wa">'+L('Enviar por WhatsApp','Send on WhatsApp')+'</a> '
      +'<a class="btn sec" href="'+mail+'" data-via="mail">'+L('Enviar por correo','Send by email')+'</a> '
      +'<button type="button" class="btn sec" data-pdf>'+L('Descargar proforma otra vez','Download proforma again')+'</button></p>'
      +'<p class="nota-fac">'+L('Si envías por WhatsApp o correo, adjunta la proforma PDF para agilizar el proceso.','If you send by WhatsApp or email, attach the PDF proforma to speed things up.')+'</p>'
      +'<p><button type="button" class="link" data-otra>'+L('Hacer otra solicitud','Make another request')+'</button></p>';
    ok.focus();
    ok.querySelectorAll('[data-via]').forEach(function(a){a.addEventListener('click',function(){track(a.getAttribute('data-via'),d)})});
    ok.querySelector('[data-pdf]').addEventListener('click',function(){bajar(pdf(d),fn);track('pdf',d)});
    ok.querySelector('[data-otra]').addEventListener('click',function(){ok.hidden=true;f.hidden=false;f.scrollIntoView({behavior:'smooth',block:'start'})});
    if(via==='pdf'){bajar(pdf(d),fn);track('pdf',d)}
    else if(via==='wa'){window.open(wa,'_blank','noopener');track('wa',d)}
    else if(via==='mail'){location.href=mail;track('mail',d)}
  }
  function nitUI(){var cf=tipo()==='cf',n=f.elements.nit;n.disabled=cf;n.required=!cf;if(cf){n.value='';n.classList.remove('inv');var s=n.parentNode.querySelector('.e');if(s)s.remove()}n.parentNode.hidden=cf}
  f.querySelectorAll('input[name=tipo]').forEach(function(r){r.addEventListener('change',nitUI)});
  ['producto','cantidad'].forEach(function(n){f.elements[n].addEventListener('input',total);f.elements[n].addEventListener('change',total)});
  f.elements.nit.addEventListener('blur',function(){var v=f.elements.nit.value;if(v&&nitOk(v))f.elements.nit.value=nitFmt(v)});
  var via='pdf';
  f.querySelectorAll('[data-acc]').forEach(function(b){b.addEventListener('click',function(){via=b.getAttribute('data-acc')})});
  f.addEventListener('submit',function(e){
    e.preventDefault();if(val('web'))return;
    var bad=validar();
    if(bad){msg.className='fd-msg bad';msg.textContent=L('Revisa los campos marcados.','Please check the highlighted fields.');bad.focus();return}
    fin(datos(),(e.submitter&&e.submitter.getAttribute('data-acc'))||via);
  });
  nitUI();total();
})();

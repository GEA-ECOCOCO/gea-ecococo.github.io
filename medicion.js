/* Panel de medición: estado de la conexión, informe y registro de pruebas de este dispositivo. */
(function(){
  var C=window.GEA_CONFIG||{},$=function(i){return document.getElementById(i)};
  var NOM={page_view:'Visita de página',click_whatsapp:'Clic en WhatsApp',view_item:'Producto consultado',add_to_cart:'Agregado al carrito',view_cart:'Carrito abierto',generate_lead:'Solicitud (distribuidor / negocio)',download_catalog:'Descarga de catálogo',language_switch:'Cambio de idioma'};
  var KPI=[['page_view','Visitas de página'],['view_item','Productos consultados'],['add_to_cart','Agregados al carrito'],['click_whatsapp','Clics en WhatsApp'],['generate_lead','Solicitudes de negocios'],['download_catalog','Descargas del catálogo']];
  function log(){try{return JSON.parse(localStorage.getItem('gea-med-log'))||[]}catch(e){return []}}
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  /* estado */
  var cons='';try{cons=localStorage.getItem('gea-consent')||''}catch(e){}
  if(C.ga4Id){$('med-ga').innerHTML='<strong class="med-ok">Conectado.</strong> ID de medición: <code>'+esc(C.ga4Id)+'</code>. Los eventos se envían a Google Analytics cuando la persona acepta el aviso.';}
  else{$('med-ga').innerHTML='<strong class="med-no">Sin conectar.</strong> Todavía no hay un ID de Google Analytics en la configuración, así que <u>no se envía ningún dato</u>. Mientras tanto, el registro de pruebas de abajo sí funciona en este dispositivo. Sigue los pasos de «Activación» para encender la medición.';}
  $('med-cons').textContent=C.ga4Id?('Aviso de analítica en este navegador: '+(cons==='granted'?'aceptado':cons==='denied'?'rechazado':'sin responder')+'.'):'';
  /* informe */
  if(C.reportUrl&&/^https:\/\/(lookerstudio|datastudio)\.google\.com\//.test(C.reportUrl)){
    $('med-rep').innerHTML='<div class="med-embed"><iframe src="'+esc(C.reportUrl)+'" title="Informe de medición" loading="lazy" allowfullscreen referrerpolicy="no-referrer"></iframe></div><p class="med-s">Informe de Looker Studio. Solo lo ven las personas con permiso de GEA.</p>';
  }else{
    $('med-rep').innerHTML='<div class="card hov"><p>Aquí se mostrará el informe de visitas, fuentes de tráfico, clics y solicitudes cuando se conecte un informe de Looker Studio. Mientras tanto, consulta los datos directamente en Google Analytics.</p><p style="margin-top:12px"><a class="btn sec" style="margin:0" href="https://analytics.google.com/" target="_blank" rel="noopener">Abrir Google Analytics</a></p></div>';
  }
  /* registro local */
  function pinta(){
    var l=log(),c={};l.forEach(function(x){c[x.n]=(c[x.n]||0)+1});
    var o='';try{o=sessionStorage.getItem('gea-origen')||''}catch(e){}
    $('med-or').innerHTML='Procedencia de esta sesión: <strong>'+esc(o||'directo')+'</strong>. Prueba con <code>?utm_source=tiktok</code> al final de la dirección para ver cómo cambia.';
    $('med-kpi').innerHTML=KPI.map(function(k){return '<div class="med-k"><b>'+(c[k[0]]||0)+'</b><span>'+k[1]+'</span></div>'}).join('');
    var ult=l.slice(-15).reverse();
    $('med-log').innerHTML=ult.length?ult.map(function(x){
      var d=[];if(x.p){if(x.p.producto)d.push(x.p.producto==='k1'?'bolsa 1 kg':x.p.producto==='k25'?'bulto 25 kg':x.p.producto);if(x.p.destino)d.push(x.p.destino);if(x.p.tipo)d.push(x.p.tipo)}
      var h=new Date(x.t),hh=('0'+h.getHours()).slice(-2)+':'+('0'+h.getMinutes()).slice(-2)+':'+('0'+h.getSeconds()).slice(-2);
      return '<li><time>'+hh+'</time> <b>'+esc(NOM[x.n]||x.n)+'</b> <span>'+esc(x.u||'')+(d.length?' · '+esc(d.join(' · ')):'')+' · origen: '+esc(x.o||'')+'</span></li>';
    }).join(''):'<li class="med-s">Todavía no hay eventos. Navega el sitio y regresa.</li>';
  }
  $('med-clear').addEventListener('click',function(){try{localStorage.removeItem('gea-med-log')}catch(e){}pinta()});
  pinta();
})();

/* Formulario de distribuidores: validación, ID de solicitud, envío a servicio externo (si está configurado) y respaldo por WhatsApp. */
(function(){
  var EN=document.documentElement.lang==='en',L=function(a,b){return EN?b:a};
  var f=document.getElementById('form-dist');if(!f)return;
  var C=window.GEA_CONFIG||{},msg=document.getElementById('fd-msg'),ok=document.getElementById('fd-ok');
  var enviando=false;
  function val(n){var e=f.elements[n];return e?(e.type==='checkbox'?e.checked:e.value.trim()):''}
  function err(el,t){el.setAttribute('aria-invalid','true');el.classList.add('inv');var s=el.parentNode.querySelector('.e');if(!s){s=document.createElement('span');s.className='e';el.parentNode.appendChild(s)}s.textContent=t}
  function limpia(){f.querySelectorAll('.inv').forEach(function(e){e.classList.remove('inv');e.removeAttribute('aria-invalid')});f.querySelectorAll('.e').forEach(function(e){e.remove()});msg.textContent='';msg.className='fd-msg'}
  function validar(){
    limpia();var bad=null;
    ['nombre','negocio','municipio','direccion'].forEach(function(n){var el=f.elements[n];if(val(n).length<2){err(el,L('Escribe este dato.','Please fill in this field.'));bad=bad||el}});
    var t=val('telefono').replace(/[\s()-]/g,'').replace(/^\+?502/,'');
    if(!/^[2-7]\d{7}$/.test(t)){err(f.elements.telefono,L('Escribe un teléfono de 8 dígitos (Guatemala).','Enter an 8-digit phone number (Guatemala).'));bad=bad||f.elements.telefono}
    if(val('correo')&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('correo'))){err(f.elements.correo,L('Escribe un correo válido, como nombre@dominio.com.','Enter a valid email, like name@domain.com.'));bad=bad||f.elements.correo}
    ['departamento','tipo','interes','volumen'].forEach(function(n){if(!val(n)){err(f.elements[n],L('Elige una opción.','Choose an option.'));bad=bad||f.elements[n]}});
    if(!val('privacidad')){err(f.elements.privacidad,L('Debes aceptar el aviso de privacidad.','You must accept the privacy notice.'));bad=bad||f.elements.privacidad}
    return bad;
  }
  function id(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return 'GEA-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
  function datos(rid){return {id:rid,fecha:new Date().toISOString(),nombre:val('nombre'),correo:val('correo'),negocio:val('negocio'),telefono:val('telefono'),departamento:val('departamento'),municipio:val('municipio'),direccion:val('direccion'),tipo:val('tipo'),interes:val('interes'),volumen:val('volumen'),comentarios:val('comentarios'),idioma:EN?'en':'es',pagina:location.href}}
  function textoWA(d){
    if(EN)return 'Hi, I would like information about becoming a GEA distributor.\nApplication: '+d.id+'\nName: '+d.nombre+'\nBusiness: '+d.negocio+' ('+d.tipo+')\nPhone: '+d.telefono+'\nLocation: '+d.municipio+', '+d.departamento+'\nInterest: '+d.interes+'\nEstimated volume: '+d.volumen+(d.comentarios?'\nComments: '+d.comentarios:'');
    return 'Hola, deseo información para convertirme en distribuidor GEA.\nSolicitud: '+d.id+'\nNombre: '+d.nombre+'\nNegocio: '+d.negocio+' ('+d.tipo+')\nTeléfono: '+d.telefono+'\nUbicación: '+d.municipio+', '+d.departamento+'\nInterés: '+d.interes+'\nVolumen estimado: '+d.volumen+(d.comentarios?'\nComentarios: '+d.comentarios:'');
  }
  function confirmar(d,registrada){
    var wa='https://wa.me/'+(C.whatsapp||'50242794894')+'?text='+encodeURIComponent(textoWA(d));
    f.hidden=true;ok.hidden=false;
    ok.innerHTML='<h3>'+(registrada?L('¡Solicitud recibida!','Application received!'):L('Tu solicitud está lista','Your application is ready'))+'</h3>'
     +'<p>'+L('Número de solicitud','Application number')+': <strong>'+d.id+'</strong></p>'
     +(registrada?'<p>'+L('Tu solicitud quedó registrada. <strong>Importante: avísanos ahora por WhatsApp con tu número de solicitud</strong> para que nuestro equipo la atienda lo antes posible. También te contactaremos al '+d.telefono+'.','Your application is registered. <strong>Important: let us know now on WhatsApp with your application number</strong> so our team can handle it as soon as possible. We will also contact you at '+d.telefono+'.')+'</p>'
                 :'<p>'+L('Para completar tu solicitud, envíala por WhatsApp con un toque. Así la recibe directamente nuestro equipo comercial.','To complete your application, send it on WhatsApp with one tap. That way our sales team receives it directly.')+'</p>')
     +'<p><a class="btn wa" target="_blank" rel="noopener" href="'+wa+'">'+(registrada?L('Avisar por WhatsApp','Notify us on WhatsApp'):L('Enviar por WhatsApp','Send on WhatsApp'))+'</a></p>'
     +'<p><a class="btn" href="mailto:geaecococo.ventas@gmail.com?subject='+encodeURIComponent(L('Solicitud de distribuidor ','Distributor application ')+d.id)+'&body='+encodeURIComponent(textoWA(d))+'">'+L('O enviar por correo','Or send by email')+'</a></p>';
    ok.focus();
    if(window.geaTrack)geaTrack('generate_lead',{tipo:d.tipo,registrada:!!registrada});
  }
  f.addEventListener('submit',function(e){
    e.preventDefault();if(enviando)return;
    if(val('web')){return}                    /* trampa anti-spam */
    var bad=validar();
    if(bad){msg.className='fd-msg bad';msg.textContent=L('Revisa los campos marcados.','Please check the highlighted fields.');bad.focus();return}
    var d=datos(id());
    if(!C.formEndpoint){confirmar(d,false);return}
    enviando=true;var btn=f.querySelector('button[type=submit]');btn.disabled=true;btn.textContent=L('Enviando…','Sending…');
    var body=Object.assign({acepto:true,subject:L('Solicitud de distribuidor ','Distributor application ')+d.id+' · '+d.negocio},d);
    if(C.formKey)body.access_key=C.formKey;
    var ctl=new AbortController(),to=setTimeout(function(){ctl.abort()},12000);
    fetch(C.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),signal:ctl.signal})
     .then(function(r){clearTimeout(to);if(!r.ok)throw new Error('http '+r.status);confirmar(d,true)})
     .catch(function(){clearTimeout(to);confirmar(d,false)})
     .finally(function(){enviando=false;btn.disabled=false;btn.textContent=L('Enviar solicitud','Submit application')});
  });
})();

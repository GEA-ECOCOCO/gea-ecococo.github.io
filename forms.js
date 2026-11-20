/* Formulario de distribuidores: validación, ID de solicitud, envío a servicio externo (si está configurado) y respaldo por WhatsApp. */
(function(){
  var f=document.getElementById('form-dist');if(!f)return;
  var C=window.GEA_CONFIG||{},msg=document.getElementById('fd-msg'),ok=document.getElementById('fd-ok');
  var enviando=false;
  function val(n){var e=f.elements[n];return e?(e.type==='checkbox'?e.checked:e.value.trim()):''}
  function err(el,t){el.setAttribute('aria-invalid','true');el.classList.add('inv');var s=el.parentNode.querySelector('.e');if(!s){s=document.createElement('span');s.className='e';el.parentNode.appendChild(s)}s.textContent=t}
  function limpia(){f.querySelectorAll('.inv').forEach(function(e){e.classList.remove('inv');e.removeAttribute('aria-invalid')});f.querySelectorAll('.e').forEach(function(e){e.remove()});msg.textContent='';msg.className='fd-msg'}
  function validar(){
    limpia();var bad=null;
    ['nombre','negocio','municipio','direccion'].forEach(function(n){var el=f.elements[n];if(val(n).length<2){err(el,'Escribe este dato.');bad=bad||el}});
    var t=val('telefono').replace(/[\s()-]/g,'').replace(/^\+?502/,'');
    if(!/^[2-7]\d{7}$/.test(t)){err(f.elements.telefono,'Escribe un teléfono de 8 dígitos (Guatemala).');bad=bad||f.elements.telefono}
    ['departamento','tipo','interes','volumen'].forEach(function(n){if(!val(n)){err(f.elements[n],'Elige una opción.');bad=bad||f.elements[n]}});
    if(!val('privacidad')){err(f.elements.privacidad,'Debes aceptar el aviso de privacidad.');bad=bad||f.elements.privacidad}
    return bad;
  }
  function id(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return 'GEA-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
  function datos(rid){return {id:rid,fecha:new Date().toISOString(),nombre:val('nombre'),negocio:val('negocio'),telefono:val('telefono'),departamento:val('departamento'),municipio:val('municipio'),direccion:val('direccion'),tipo:val('tipo'),interes:val('interes'),volumen:val('volumen'),comentarios:val('comentarios'),pagina:location.href}}
  function textoWA(d){
    return 'Hola, deseo información para convertirme en distribuidor GEA.\nSolicitud: '+d.id+'\nNombre: '+d.nombre+'\nNegocio: '+d.negocio+' ('+d.tipo+')\nTeléfono: '+d.telefono+'\nUbicación: '+d.municipio+', '+d.departamento+'\nInterés: '+d.interes+'\nVolumen estimado: '+d.volumen+(d.comentarios?'\nComentarios: '+d.comentarios:'');
  }
  function confirmar(d,registrada){
    var wa='https://wa.me/'+(C.whatsapp||'50242794894')+'?text='+encodeURIComponent(textoWA(d));
    f.hidden=true;ok.hidden=false;
    ok.innerHTML='<h3>'+(registrada?'¡Solicitud recibida!':'Tu solicitud está lista')+'</h3>'
     +'<p>Número de solicitud: <strong>'+d.id+'</strong></p>'
     +(registrada?'<p>Nuestro equipo comercial te contactará al '+d.telefono+'. Si quieres agilizarlo, escríbenos también por WhatsApp.</p>'
                 :'<p>Para completar tu solicitud, envíala por WhatsApp con un toque. Así la recibe directamente nuestro equipo comercial.</p>')
     +'<p><a class="btn wa" target="_blank" rel="noopener" href="'+wa+'">Enviar por WhatsApp</a></p>';
    ok.focus();
    if(window.geaTrack)geaTrack('generate_lead',{tipo:d.tipo,registrada:!!registrada});
  }
  f.addEventListener('submit',function(e){
    e.preventDefault();if(enviando)return;
    if(val('web')){return}                    /* trampa anti-spam */
    var bad=validar();
    if(bad){msg.className='fd-msg bad';msg.textContent='Revisa los campos marcados.';bad.focus();return}
    var d=datos(id());
    if(!C.formEndpoint){confirmar(d,false);return}
    enviando=true;var btn=f.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Enviando…';
    var body=Object.assign({subject:'Solicitud de distribuidor '+d.id+' · '+d.negocio},d);
    if(C.formKey)body.access_key=C.formKey;
    var ctl=new AbortController(),to=setTimeout(function(){ctl.abort()},12000);
    fetch(C.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),signal:ctl.signal})
     .then(function(r){clearTimeout(to);if(!r.ok)throw new Error('http '+r.status);confirmar(d,true)})
     .catch(function(){clearTimeout(to);confirmar(d,false)})
     .finally(function(){enviando=false;btn.disabled=false;btn.textContent='Enviar solicitud'});
  });
})();

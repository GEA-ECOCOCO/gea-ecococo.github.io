/* Analítica con consentimiento. Si no hay ga4Id, no se carga nada ni se muestra ningún aviso. */
(function(){
  var C=window.GEA_CONFIG||{},EN=document.documentElement.lang==='en';
  window.geaTrack=function(){};
  if(!C.ga4Id)return;
  var KEY='gea-consent',st=null;
  try{st=localStorage.getItem(KEY)}catch(e){}
  function cargar(){
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){dataLayer.push(arguments)};
    gtag('js',new Date());gtag('config',C.ga4Id,{anonymize_ip:true});
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(C.ga4Id);document.head.appendChild(s);
    window.geaTrack=function(n,p){try{gtag('event',n,p||{})}catch(e){}};
    document.addEventListener('click',function(e){
      var a=e.target.closest('a[href*="wa.me"]');if(a)geaTrack('click_whatsapp',{pagina:location.pathname,destino:(a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,60)});
      var pdf=e.target.closest('a[href$=".pdf"]');if(pdf)geaTrack('download_catalog',{archivo:pdf.getAttribute('href')});
      var d=e.target.closest('[data-add]');if(d)geaTrack('add_to_cart',{producto:d.getAttribute('data-add')});
    });
  }
  function aviso(){
    var b=document.createElement('div');b.className='consent';b.setAttribute('role','dialog');b.setAttribute('aria-label',EN?'Analytics preferences':'Preferencias de analítica');
    b.innerHTML=EN?'<p>We use anonymous analytics to learn which pages are useful and improve the site. Do you accept? <a href="privacidad.html">More information</a></p><div><button type="button" data-ok>Accept</button><button type="button" data-no>Decline</button></div>':'<p>Usamos analítica anónima para saber qué páginas sirven y mejorar el sitio. ¿La aceptas? <a href="privacidad.html">Más información</a></p><div><button type="button" data-ok>Aceptar</button><button type="button" data-no>Rechazar</button></div>';
    document.body.appendChild(b);
    b.querySelector('[data-ok]').onclick=function(){try{localStorage.setItem(KEY,'granted')}catch(e){}b.remove();cargar()};
    b.querySelector('[data-no]').onclick=function(){try{localStorage.setItem(KEY,'denied')}catch(e){}b.remove()};
  }
  if(st==='granted')cargar();else if(st!=='denied')aviso();
})();

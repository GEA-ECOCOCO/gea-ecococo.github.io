/* Medición del sitio.
   1) Registro local (solo en este dispositivo, sin datos personales) para probar los eventos en medicion.html.
   2) Google Analytics 4: solo si hay ga4Id en config.js Y la persona acepta el aviso. Sin ga4Id no se envía nada. */
(function(){
  var C=window.GEA_CONFIG||{},EN=document.documentElement.lang==='en';
  var LOGK='gea-med-log',ORK='gea-origen',sent=false;
  function lee(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}}
  /* ---- procedencia de la visita (una vez por sesión) ---- */
  function origen(){
    var o=null;try{o=sessionStorage.getItem(ORK)}catch(e){}
    if(o)return o;
    var q=new URLSearchParams(location.search),src=(q.get('utm_source')||'').toLowerCase(),ref='';
    try{ref=document.referrer?new URL(document.referrer).hostname.replace(/^www\./,''):''}catch(e){}
    if(ref===location.hostname)ref='';
    var base=src||ref;
    if(!base)o='directo';
    else if(/tiktok/.test(base))o='tiktok';
    else if(/facebook|fb\.|instagram|l\.facebook|m\.facebook/.test(base))o='facebook/instagram';
    else if(/google|bing|duckduckgo|yahoo/.test(base))o=(q.get('utm_medium')||'').toLowerCase().match(/cpc|ppc|paid/)?'google anuncios':'buscador';
    else if(/whatsapp|wa\.me/.test(base))o='whatsapp';
    else o=base;
    try{sessionStorage.setItem(ORK,o)}catch(e){}
    return o;
  }
  var ORIGEN=origen();
  /* ---- registro de eventos ---- */
  function registra(n,p){
    try{var l=lee(LOGK,[]);l.push({t:Date.now(),n:n,p:p||{},o:ORIGEN,u:location.pathname});if(l.length>200)l=l.slice(-200);localStorage.setItem(LOGK,JSON.stringify(l))}catch(e){}
  }
  window.geaTrack=function(n,p){
    p=Object.assign({origen:ORIGEN,pagina:location.pathname},p||{});
    registra(n,p);
    if(sent&&window.gtag){try{gtag('event',n,p)}catch(e){}}
  };
  /* ---- eventos del sitio ---- */
  document.addEventListener('click',function(e){
    var t=e.target;if(!t.closest)return;
    var a=t.closest('a[href*="wa.me"]');
    if(a&&!e.defaultPrevented){
      var d=a.id==='c-wa'?'carrito':a.id==='calc-wa'?'calculadora':((a.getAttribute('aria-label')||a.textContent||'').trim().slice(0,60)||'enlace');
      if(a.id!=='c-wa')geaTrack('click_whatsapp',{destino:d});
    }
    var pdf=t.closest('a[href$=".pdf"]');if(pdf)geaTrack('download_catalog',{archivo:pdf.getAttribute('href').split('/').pop()});
    var ad=t.closest('[data-add]');if(ad)geaTrack('add_to_cart',{producto:ad.getAttribute('data-add')});
    if(t.closest('a.lang-sw,.pie-lang a'))geaTrack('language_switch',{a:EN?'es':'en'});
    if(t.closest('[data-carrito]'))geaTrack('view_cart');
  });
  /* productos consultados: una vez por sesión y producto, cuando la tarjeta se ve en pantalla */
  if('IntersectionObserver' in window){
    var vistos={};try{vistos=JSON.parse(sessionStorage.getItem('gea-vistos')||'{}')}catch(e){}
    var io=new IntersectionObserver(function(es){es.forEach(function(en){
      if(!en.isIntersecting)return;var k=en.target.getAttribute('data-vp');io.unobserve(en.target);
      if(vistos[k])return;vistos[k]=1;try{sessionStorage.setItem('gea-vistos',JSON.stringify(vistos))}catch(e){}
      geaTrack('view_item',{producto:k});
    })},{threshold:.6});
    document.querySelectorAll('[data-add]').forEach(function(b){
      var card=b.closest('.card,.ccard');if(card&&!card.getAttribute('data-vp')){card.setAttribute('data-vp',b.getAttribute('data-add'));io.observe(card)}
    });
  }
  /* visita de página en el registro local */
  geaTrack('page_view',{titulo:(document.title||'').slice(0,60)});

  /* ---- Google Analytics 4 (con consentimiento) ---- */
  if(!C.ga4Id)return;
  var KEY='gea-consent',st=null;
  try{st=localStorage.getItem(KEY)}catch(e){}
  function cargar(){
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){dataLayer.push(arguments)};
    gtag('js',new Date());gtag('config',C.ga4Id,{anonymize_ip:true,send_page_view:true});
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(C.ga4Id);document.head.appendChild(s);
    sent=true;
    /* reenvía los eventos de esta carga que ocurrieron antes de aceptar el aviso */
    try{lee(LOGK,[]).filter(function(x){return x.t>Date.now()-15000&&x.n!=='page_view'}).forEach(function(x){gtag('event',x.n,x.p)})}catch(e){}
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

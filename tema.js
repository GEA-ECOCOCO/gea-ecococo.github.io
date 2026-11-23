/* Cambio de ambiente: cada sección (carbón, servicios digitales, tecnología) arranca con su propia paleta y emblema.
   Se muestra al llegar desde una sección de otro ambiente (no al recargar ni al moverse dentro del mismo ambiente). */
(function(){try{
  var d=document.documentElement,T=d.getAttribute('data-tema')||'carbon',prev=null;
  try{prev=sessionStorage.getItem('gea-tema')}catch(e){}
  try{sessionStorage.setItem('gea-tema',T)}catch(e){}
  var n=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||{};
  if(n.type==='reload'||prev===T||(T==='carbon'&&prev===null))return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||/splash/.test(d.className))return;
  var es=(d.lang||'es').slice(0,2)!=='en',B=es?'':'../';
  var C={
    carbon:{c:'bt-k',img:'img/logo-gea-carbon.svg',w:56,h:64,l1:'ECOCOCO',l2:es?'Carbón de cáscara de coco':'Coconut shell charcoal',l3:es?'Retalhuleu · Guatemala':'Retalhuleu · Guatemala'},
    consultora:{c:'bt-c',img:'img/logo-gea-consultora.png',w:208,h:80,l1:'',l2:es?'Cargando tu plataforma…':'Loading your platform…',l3:es?'Estrategia · Tecnología · Desarrollo':'Strategy · Technology · Development'},
    tecnologia:{c:'bt-t',img:'',l1:'GEA // '+(es?'TECNOLOGÍA':'TECHNOLOGY'),l2:es?'Iniciando sistema…':'Starting system…',l3:es?'hornos · molino · prensa · planta':'furnaces · mill · press · plant'}
  }[T];
  if(!C)return;
  d.classList.add('bt-on');
  var go=function(){
    if(document.querySelector('.bt'))return;
    var o=document.createElement('div');o.className='bt '+C.c;o.setAttribute('aria-hidden','true');
    o.innerHTML='<div class="bt-in">'+(C.img?'<div class="bt-logo"><img src="'+B+C.img+'" alt="" width="'+C.w+'" height="'+C.h+'"></div>':'')+(C.l1?'<div class="bt-l1">'+C.l1+'</div>':'')+'<div class="bt-l2">'+C.l2+'</div><div class="bt-bar"><i></i></div><div class="bt-l3">'+C.l3+'</div></div>';
    d.appendChild(o);d.classList.remove('bt-on');
    setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},2100);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
  setTimeout(function(){d.classList.remove('bt-on')},3000);
}catch(e){}})();

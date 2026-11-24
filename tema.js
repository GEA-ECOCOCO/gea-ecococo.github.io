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
    tecnologia:{c:'bt-t',img:'',l1:'GEA '+(es?'TECNOLOGÍA':'TECHNOLOGY'),l2:es?'Preparando la planta…':'Preparing the plant…',l3:es?'hornos · molino · prensa · planta':'furnaces · mill · press · plant'}
  }[T];
  if(!C)return;
  d.classList.add('bt-on');
  var go=function(){
    if(document.querySelector('.bt'))return;
    var o=document.createElement('div');o.className='bt '+C.c;o.setAttribute('aria-hidden','true');
    if(T==='consultora'){
      o.className='bt bt-c bt-c2';
      o.innerHTML='<div class="bc-grid"></div><div class="bc-scan"></div><div class="bc-main"><div class="bc-stage"><svg class="bc-r1" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="none" stroke="#4CC3FF" stroke-width="1" stroke-dasharray="2 9" stroke-linecap="round"/></svg><svg class="bc-r2" viewBox="0 0 200 200"><circle cx="100" cy="100" r="82" fill="none" stroke="#9BF8FC" stroke-width="1.4" stroke-dasharray="120 396" stroke-linecap="round"/></svg><svg class="bc-r3" viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="#2585C5" stroke-width="1" pathLength="100" stroke-dasharray="100"/></svg><img class="bc-sh" src="'+B+'img/escudo-gea-consultora.png" alt="" width="68" height="84"></div><div class="bc-name"><b>GEA</b><span>CONSULTORA</span></div><div class="bc-bar"><i></i></div><div class="bc-l2">'+C.l2+'</div><div class="bc-l3">'+C.l3+'</div></div><div class="bc-line"></div>';
      d.appendChild(o);d.classList.remove('bt-on');
      setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},3000);
      return;
    }
    o.innerHTML='<div class="bt-in">'+(C.c==='bt-t'?'<svg class="bt-gear" viewBox="0 0 100 100" fill="none"><g class="g1"><circle cx="50" cy="50" r="38" stroke="#8CCB5E" stroke-width="9" stroke-dasharray="7.5 7.5"/></g><circle class="g2" cx="50" cy="50" r="31" stroke="#C9E6B4" stroke-width="2" pathLength="100"/><path class="lf" d="M50 66c-10-4-13-14-8-26 10 0 18 8 16 20-2 3-5 5-8 6z" fill="#E7B24A"/></svg>':'')+(C.img?'<div class="bt-logo"><img src="'+B+C.img+'" alt="" width="'+C.w+'" height="'+C.h+'"></div>':'')+(C.l1?'<div class="bt-l1">'+C.l1+'</div>':'')+'<div class="bt-l2">'+C.l2+'</div><div class="bt-bar"><i></i></div><div class="bt-l3">'+C.l3+'</div></div>';
    d.appendChild(o);d.classList.remove('bt-on');
    setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},2100);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
  setTimeout(function(){d.classList.remove('bt-on')},3000);
}catch(e){}})();

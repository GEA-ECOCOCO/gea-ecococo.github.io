/* ECOCOCO · Service worker (generado). Páginas: red primero; recursos: caché y actualización en segundo plano. */
const V='ecococo-1795463611';
const PRE=["/", "/bitacora.html", "/como-comprar.html", "/contacto.html", "/descargas.html", "/distribuidores-condiciones.html", "/distribuidores-herramientas.html", "/distribuidores-inscripcion.html", "/distribuidores-mercado.html", "/distribuidores-precios.html", "/distribuidores.html", "/en-accion.html", "/en/bitacora.html", "/en/como-comprar.html", "/en/contacto.html", "/en/descargas.html", "/en/distribuidores-condiciones.html", "/en/distribuidores-herramientas.html", "/en/distribuidores-inscripcion.html", "/en/distribuidores-mercado.html", "/en/distribuidores-precios.html", "/en/distribuidores.html", "/en/en-accion.html", "/en/entregas-devoluciones.html", "/en/factura.html", "/en/impacto-ambiental.html", "/en/index.html", "/en/medicion.html", "/en/noticias.html", "/en/pagos-en-linea.html", "/en/precios.html", "/en/privacidad.html", "/en/proceso.html", "/en/producto.html", "/en/quienes-somos.html", "/en/servicios-digitales.html", "/en/tecnologia-gea.html", "/en/terminos.html", "/en/ventas.html", "/entregas-devoluciones.html", "/factura.html", "/impacto-ambiental.html", "/index.html", "/medicion.html", "/noticias.html", "/pagos-en-linea.html", "/precios.html", "/privacidad.html", "/proceso.html", "/producto.html", "/quienes-somos.html", "/servicios-digitales.html", "/tecnologia-gea.html", "/terminos.html", "/ventas.html"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(r.headers.has('range')||/\.(mp4|webm)$/i.test(u.pathname)||u.pathname==='/sw.js')return;
  if(r.mode==='navigate'){
    const cached=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match(u.pathname.indexOf('/en/')===0?'/en/index.html':'/index.html'));
    const net=fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res});
    /* Arranque rápido: si la red tarda más de 1,2 s se muestra la copia guardada (la red actualiza la caché para la próxima vez) */
    e.respondWith(Promise.race([net.catch(()=>null),new Promise(ok=>setTimeout(()=>cached().then(ok,()=>ok(null)),1200))]).then(x=>x||cached()).then(x=>x||net));
    return;
  }
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});

/* Avisos push: el mensaje se pide al Worker al llegar el aviso (sin carga útil cifrada) */
const PUSH_API='https://ecococo-chat.manolo-esau.workers.dev';
self.addEventListener('push',e=>{
  e.waitUntil((async()=>{
    const en=String(self.navigator.language||'').toLowerCase().indexOf('en')===0;
    let m=null;
    try{
      const sub=await self.registration.pushManager.getSubscription();
      if(sub&&PUSH_API){
        const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sub.endpoint));
        const id=Array.from(new Uint8Array(h)).slice(0,16).map(x=>('0'+x.toString(16)).slice(-2)).join('');
        const r=await fetch(PUSH_API+'/push/msg?e='+id+'&l='+(en?'en':'es'),{cache:'no-store'});
        if(r.ok)m=await r.json();
      }
    }catch(_){}
    if(!m)m=en?{t:'ECOCOCO',b:'See what is new at GEA Carbon | ECOCOCO.',u:'/en/index.html',g:'ecococo'}:{t:'ECOCOCO',b:'Mira las novedades de GEA Carbón | ECOCOCO.',u:'/index.html',g:'ecococo'};
    await self.registration.showNotification(m.t,{body:m.b,icon:'/img/icon-192.png',badge:'/img/favicon-192.png',tag:m.g||'ecococo',data:{u:m.u},lang:en?'en':'es'});
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const u=(e.notification.data&&e.notification.data.u)||'/';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){if('focus' in c&&'navigate' in c){return c.focus().then(()=>c.navigate(u)).catch(()=>self.clients.openWindow(u))}}
    return self.clients.openWindow(u);
  }));
});

/* ECOCOCO · Service worker (generado). Páginas: red primero; recursos: caché y actualización en segundo plano. */
const V='ecococo-1795322607';
const PRE=["/", "/bitacora.html", "/como-comprar.html", "/contacto.html", "/descargas.html", "/distribuidores.html", "/en-accion.html", "/en/bitacora.html", "/en/como-comprar.html", "/en/contacto.html", "/en/descargas.html", "/en/distribuidores.html", "/en/en-accion.html", "/en/entregas-devoluciones.html", "/en/factura.html", "/en/impacto-ambiental.html", "/en/index.html", "/en/medicion.html", "/en/precios.html", "/en/privacidad.html", "/en/proceso.html", "/en/producto.html", "/en/quienes-somos.html", "/en/tecnologia-gea.html", "/en/terminos.html", "/entregas-devoluciones.html", "/factura.html", "/impacto-ambiental.html", "/index.html", "/medicion.html", "/precios.html", "/privacidad.html", "/proceso.html", "/producto.html", "/quienes-somos.html", "/tecnologia-gea.html", "/terminos.html"];
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

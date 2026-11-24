/* GEA Consultora: paquete de servicios (se guarda en el dispositivo), autodiagnóstico y emblema interactivo. */
(function(){
  var EN=document.documentElement.lang==='en',L=function(a,b){return EN?b:a},KEY='gea-pkg';
  function get(){try{var v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function put(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
  function idx(k){var v=get();for(var i=0;i<v.length;i++)if(v[i].k===k)return i;return -1}
  function add(k,t,p,inc){var v=get();if(idx(k)<0){v.push({k:k,t:t,p:p||'',inc:inc||''});put(v)}refresh()}
  function toggle(k,t,p,inc){var v=get(),i=idx(k);if(i<0)v.push({k:k,t:t,p:p||'',inc:inc||''});else v.splice(i,1);put(v);refresh()}
  function fx(){try{var f=window.geaFX&&window.geaFX();if(f&&f.r)return f.r}catch(e){}return Number((window.GEA_CONFIG||{}).usdRate)||7.65}
  function num(n){return n.toLocaleString(EN?'en-US':'es-GT')}
  function money(n){return 'Q'+num(n)}
  function moneyU(n){return 'Q'+num(n)+' (US$'+num(Math.round(n/fx()))+')'}
  function parse(p){return String(p||'').split(',').map(function(x){var m=/^(\d+)([umah])$/.exec(x);return m?{q:+m[1],u:m[2]}:null}).filter(Boolean)}
  var UN={u:['pago único','one-time'],m:['al mes','per month'],a:['al año','per year'],h:['por hora','per hour']};
  function totals(v){
    var cov={},t={u:0,m:0,a:0,h:0};
    v.forEach(function(it){if(it.k==='full'&&it.inc)it.inc.split(' ').forEach(function(x){cov[x]=1})});
    v.forEach(function(it){if(cov[it.k])return;parse(it.p).forEach(function(x){t[x.u]+=x.q})});
    return {t:t,cov:cov};
  }
  function remove(k){var v=get(),i=idx(k);if(i>-1){v.splice(i,1);put(v)}refresh()}
  var memo=null;
  function refresh(){
    var v=get(),n=v.length;
    document.querySelectorAll('.cf-n').forEach(function(b){b.textContent=n;b.hidden=!n});
    document.querySelectorAll('.cs-add').forEach(function(b){
      var on=idx(b.getAttribute('data-k'))>-1;
      b.setAttribute('aria-pressed',on?'true':'false');
      b.textContent=on?L('En tu paquete · quitar','In your package · remove'):L('Agregar a mi paquete','Add to my package');
    });
    var T=totals(v),ul=document.getElementById('pkg-list');
    var tl=[];if(T.t.u)tl.push(L('Pago único: ','One-time: ')+money(T.t.u));if(T.t.m)tl.push(L('Mensual: ','Monthly: ')+money(T.t.m));if(T.t.a)tl.push(L('Anual: ','Yearly: ')+money(T.t.a));if(T.t.h)tl.push(L('Mejoras: ','Improvements: ')+money(T.t.h)+L(' por hora',' per hour'));
    var tlU=[];if(T.t.u)tlU.push(L('Pago único: ','One-time: ')+moneyU(T.t.u));if(T.t.m)tlU.push(L('Mensual: ','Monthly: ')+moneyU(T.t.m));if(T.t.a)tlU.push(L('Anual: ','Yearly: ')+moneyU(T.t.a));
    var tot=document.getElementById('pkg-tot');if(tot){tot.hidden=!tl.length;tot.textContent=tlU.length?L('Total estimado · ','Estimated total · ')+tlU.join(' · '):''}
    if(ul){
      ul.textContent='';
      v.forEach(function(it){var li=document.createElement('li'),s=document.createElement('span'),b=document.createElement('button');
        s.textContent=it.t+(T.cov[it.k]?L(' · incluido en la plataforma completa',' · included in the complete platform'):'');b.type='button';b.textContent='×';b.setAttribute('aria-label',L('Quitar ','Remove ')+it.t);
        b.addEventListener('click',function(){remove(it.k)});li.appendChild(s);li.appendChild(b);ul.appendChild(li)});
      var e=document.getElementById('pkg-empty'),g=document.getElementById('pkg-go'),c=document.getElementById('pkg-clear');
      if(e)e.hidden=!!n;if(g)g.hidden=!n;if(c)c.hidden=!n;
    }
    var ta=document.getElementById('f-com');
    if(ta){
      var pre=L('Me interesa: ','I am interested in: ');
      if(n&&(!ta.value||ta.dataset.pkg==='1')){ta.value=pre+v.map(function(x){return x.t}).join('; ')+(tlU.length?' · '+L('Total estimado: ','Estimated total: ')+tlU.join(' · '):'');ta.dataset.pkg='1'}
      else if(!n&&ta.dataset.pkg==='1'){ta.value='';ta.dataset.pkg=''}
    }
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.cs-add');
    if(b){toggle(b.getAttribute('data-k'),b.getAttribute('data-t'),b.getAttribute('data-p'),b.getAttribute('data-inc'));return}
    var a=e.target.closest&&e.target.closest('[data-addpkg]');
    if(a){add(a.getAttribute('data-addpkg'),a.getAttribute('data-t'),a.getAttribute('data-p'));if(a.tagName==='BUTTON')location.href='servicios-digitales.html#solicitud'}
  });
  var clr=document.getElementById('pkg-clear');if(clr)clr.addEventListener('click',function(){put([]);refresh()});
  var ta=document.getElementById('f-com');if(ta)ta.addEventListener('input',function(){ta.dataset.pkg=''});
  var ok=document.getElementById('fd-ok');
  if(ok&&window.MutationObserver)new MutationObserver(function(){if(!ok.hidden){put([]);refresh()}}).observe(ok,{attributes:true,attributeFilter:['hidden']});

  /* Panel "Mi paquete": el botón flotante abre la lista de servicios elegidos, con total y envío de la solicitud */
  var dr=document.createElement('div');
  dr.innerHTML='<div class="pk-bg" hidden></div><aside class="pk" role="dialog" aria-modal="true" aria-hidden="true" aria-label="'+L('Mi paquete de servicios','My service package')+'"><div class="pk-h"><h2>'+L('Mi paquete','My package')+'</h2><button type="button" class="pk-x" aria-label="'+L('Cerrar','Close')+'">×</button></div><div class="pk-b"></div><div class="pk-f"></div></aside>';
  while(dr.firstChild)document.body.appendChild(dr.firstChild);
  var pbg=document.querySelector('.pk-bg'),pk=document.querySelector('.pk'),pb=pk.querySelector('.pk-b'),pf=pk.querySelector('.pk-f');
  function ptxt(p){return parse(p).map(function(x){return money(x.q)+' (US$'+num(Math.round(x.q/fx()))+') '+UN[x.u][EN?1:0]}).join(' + ')}
  var openSec=-1;
  function catalog(){
    var d=window.GEA_CCAT,C=d?(EN?d.en:d.es):[];if(!C.length)return null;
    var w=document.createElement('div');w.className='pk-cat';
    var h=document.createElement('div');h.className='pk-cat-t';h.textContent=L('Agrega servicios a tu paquete','Add services to your package');w.appendChild(h);
    function row(k,tt,p,inc,dsc){
      var r=document.createElement('div');r.className='pk-it';
      var x=document.createElement('div');x.innerHTML='<b></b><span></span>';x.firstChild.textContent=tt;x.lastChild.textContent=(dsc?dsc+' · ':'')+L('Desde ','From ')+ptxt(p);
      var b=document.createElement('button');b.type='button';b.className='pk-add';var on=idx(k)>-1;b.textContent=on?'✓':'+';b.setAttribute('aria-pressed',on?'true':'false');b.setAttribute('aria-label',(on?L('Quitar ','Remove '):L('Agregar ','Add '))+tt);if(on)b.classList.add('on');
      b.addEventListener('click',function(){toggle(k,tt,p,inc)});r.appendChild(x);r.appendChild(b);return r}
    C.forEach(function(sec,i){
      if(sec.full){var f=document.createElement('div');f.className='pk-full';f.appendChild(row(sec.k,sec.n,sec.p,sec.inc,sec.d));w.appendChild(f);return}
      var dt=document.createElement('details');dt.className='pk-sec';if(openSec===i)dt.open=true;
      var sm=document.createElement('summary');sm.textContent=sec.n;dt.appendChild(sm);
      sec.it.forEach(function(e){dt.appendChild(row(e[0],e[1],e[2],''))});
      dt.addEventListener('toggle',function(){if(dt.open)openSec=i;else if(openSec===i)openSec=-1});w.appendChild(dt)});
    return w}
  function pkRender(){
    var v=get(),T=totals(v);pb.textContent='';pf.textContent='';
    if(!v.length){
      var e=document.createElement('div');e.className='pk-empty';
      e.innerHTML='<p><b>'+L('Aún no has elegido servicios.','You have not picked any services yet.')+'</b></p><p>'+L('Toca + para agregar. Aquí verás el total estimado y podrás enviar tu solicitud.','Tap + to add. Here you will see the estimated total and can send your request.')+'</p>';
      pb.appendChild(e);var c0=catalog();if(c0)pb.appendChild(c0);return}
    var ul=document.createElement('ul');ul.className='pk-list';
    v.forEach(function(it){
      var li=document.createElement('li'),d=document.createElement('div'),b=document.createElement('b'),sm=document.createElement('span'),x=document.createElement('button');
      b.textContent=it.t;
      sm.textContent=T.cov[it.k]?L('Incluido en la plataforma completa','Included in the complete platform'):(ptxt(it.p)||'');
      d.appendChild(b);d.appendChild(sm);
      x.type='button';x.className='pk-rm';x.textContent='×';x.setAttribute('aria-label',L('Quitar ','Remove ')+it.t);
      x.addEventListener('click',function(){remove(it.k)});
      li.appendChild(d);li.appendChild(x);ul.appendChild(li)});
    pb.appendChild(ul);var c1=catalog();if(c1)pb.appendChild(c1);
    var rows=[];if(T.t.u)rows.push([L('Pago único','One-time'),T.t.u]);if(T.t.m)rows.push([L('Cada mes','Monthly'),T.t.m]);if(T.t.a)rows.push([L('Cada año','Yearly'),T.t.a]);if(T.t.h)rows.push([L('Mejoras (por hora)','Improvements (per hour)'),T.t.h]);
    var tb=document.createElement('div');tb.className='pk-tot';tb.setAttribute('data-usd','no');
    tb.innerHTML='<div class="pk-tt">'+L('Total estimado','Estimated total')+'</div>'+rows.map(function(r){return '<div class="pk-r"><span>'+r[0]+'</span><b>'+moneyU(r[1])+'</b></div>'}).join('')+'<p class="pk-n">'+L('Precio de referencia. Se confirma en la conversación según lo que necesites.','Reference price. Confirmed in the conversation according to what you need.')+'</p>';
    pf.appendChild(tb);
    var go=document.createElement('a');go.className='pk-btn';go.href='servicios-digitales.html#solicitud';go.textContent=L('Enviar mi solicitud','Send my request');
    go.addEventListener('click',function(){pkClose()});pf.appendChild(go);
    var pr=document.createElement('div');pr.className='pk-pdf';
    [['pdf',L('Descargar PDF','Download PDF')],['print',L('Imprimir','Print')]].forEach(function(x){var b=document.createElement('button');b.type='button';b.className='pk-b2';b.textContent=x[1];b.addEventListener('click',function(){cotiz(x[0])});pr.appendChild(b)});
    pf.appendChild(pr);
    var cl=document.createElement('button');cl.type='button';cl.className='pk-clr';cl.textContent=L('Vaciar paquete','Clear package');
    cl.addEventListener('click',function(){put([]);refresh()});pf.appendChild(cl);
  }
  function cotiz(mode){
    var v=get(),T=totals(v);if(!v.length||!window.geaCotizacionPDF)return;
    var rows=[];if(T.t.u)rows.push([L('Pago único','One-time'),moneyU(T.t.u)]);if(T.t.m)rows.push([L('Cada mes','Monthly'),moneyU(T.t.m)]);if(T.t.a)rows.push([L('Cada año','Yearly'),moneyU(T.t.a)]);if(T.t.h)rows.push([L('Mejoras (por hora)','Improvements (per hour)'),moneyU(T.t.h)]);
    var no=window.geaCotizacionNo?geaCotizacionNo():'COT',f=null;try{f=window.geaFX&&geaFX()}catch(e){}
    var d={en:EN,no:no,fecha:window.geaOrdenFecha?geaOrdenFecha(EN):'',fx:f,tot:rows,items:v.map(function(it){var c=!!T.cov[it.k];return {t:it.t,inc:c,pr:c?L('Incluido en la plataforma completa','Included in the complete platform'):ptxt(it.p)}})};
    var name=(EN?'gea-consultora-quote-':'cotizacion-gea-consultora-')+no+'.pdf',blob=window.geaCotizacionPDF(d);
    try{window.geaTrack&&geaTrack('cotizacion_pdf',{via:mode,items:v.length})}catch(e){}
    if(mode==='print'&&window.geaPdfImprimir)window.geaPdfImprimir(blob,name);else if(window.geaPdfBajar)window.geaPdfBajar(blob,name);
  }
  function pkOpen(){pkRender();pbg.hidden=false;pk.setAttribute('aria-hidden','false');requestAnimationFrame(function(){pk.classList.add('on')});document.body.classList.add('noscroll')}
  function pkClose(){pk.classList.remove('on');pk.setAttribute('aria-hidden','true');pbg.hidden=true;document.body.classList.remove('noscroll')}
  document.addEventListener('click',function(e){var o=e.target.closest&&e.target.closest('[data-open-pkg]');if(o){e.preventDefault();pkOpen()}});
  pbg.addEventListener('click',pkClose);pk.querySelector('.pk-x').addEventListener('click',pkClose);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pk.classList.contains('on'))pkClose()});
  document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.cf-cot');if(c){e.preventDefault();e.stopPropagation();pkOpen()}},true);
  var _r=refresh;refresh=function(){_r();if(pk.classList.contains('on'))pkRender()};
  refresh();

  /* autodiagnóstico */
  var q=document.querySelectorAll('.dg');
  if(q.length){
    var bar=document.getElementById('dg-bar'),nn=document.getElementById('dg-n'),msg=document.getElementById('dg-msg');
    var calc=function(){
      var n=0;q.forEach(function(c){if(c.checked)n++});
      nn.textContent=n;bar.style.width=(n/q.length*100)+'%';
      msg.textContent=!n?'':n<=3?L('Tu página tiene varias oportunidades de mejora. Una revisión te dice por dónde empezar.','Your website has several opportunities for improvement. A review tells you where to start.')
        :n<=6?L('Vas por buen camino; hay puntos concretos que reforzar.','You are on the right track; there are specific points to strengthen.')
        :L('Buen nivel. Una revisión periódica ayuda a mantenerlo.','Good level. A periodic review helps keep it.');
    };
    q.forEach(function(c){c.addEventListener('change',calc)});calc();
  }

  /* emblema: al enfocar un área se resalta su línea */
  var nodes=document.querySelectorAll('.em-n'),lines=document.querySelectorAll('.em-ln line');
  nodes.forEach(function(n,i){var on=function(){if(lines[i])lines[i].classList.add('on')},off=function(){if(lines[i])lines[i].classList.remove('on')};
    n.addEventListener('mouseenter',on);n.addEventListener('mouseleave',off);n.addEventListener('focus',on);n.addEventListener('blur',off);n.addEventListener('touchstart',on,{passive:true})});
})();

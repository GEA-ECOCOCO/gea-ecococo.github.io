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

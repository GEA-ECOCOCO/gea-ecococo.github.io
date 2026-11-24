/* GEA Consultora: paquete de servicios (se guarda en el dispositivo), autodiagnóstico y emblema interactivo. */
(function(){
  var EN=document.documentElement.lang==='en',L=function(a,b){return EN?b:a},KEY='gea-pkg';
  function get(){try{var v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function put(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
  function idx(k){var v=get();for(var i=0;i<v.length;i++)if(v[i].k===k)return i;return -1}
  function add(k,t){var v=get();if(idx(k)<0){v.push({k:k,t:t});put(v)}refresh()}
  function toggle(k,t){var v=get(),i=idx(k);if(i<0)v.push({k:k,t:t});else v.splice(i,1);put(v);refresh()}
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
    var ul=document.getElementById('pkg-list');
    if(ul){
      ul.textContent='';
      v.forEach(function(it){var li=document.createElement('li'),s=document.createElement('span'),b=document.createElement('button');
        s.textContent=it.t;b.type='button';b.textContent='×';b.setAttribute('aria-label',L('Quitar ','Remove ')+it.t);
        b.addEventListener('click',function(){remove(it.k)});li.appendChild(s);li.appendChild(b);ul.appendChild(li)});
      var e=document.getElementById('pkg-empty'),g=document.getElementById('pkg-go'),c=document.getElementById('pkg-clear');
      if(e)e.hidden=!!n;if(g)g.hidden=!n;if(c)c.hidden=!n;
    }
    var ta=document.getElementById('f-com');
    if(ta){
      var pre=L('Me interesa: ','I am interested in: ');
      if(n&&(!ta.value||ta.dataset.pkg==='1')){ta.value=pre+v.map(function(x){return x.t}).join('; ');ta.dataset.pkg='1'}
      else if(!n&&ta.dataset.pkg==='1'){ta.value='';ta.dataset.pkg=''}
    }
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.cs-add');
    if(b){toggle(b.getAttribute('data-k'),b.getAttribute('data-t'));return}
    var a=e.target.closest&&e.target.closest('[data-addpkg]');
    if(a){add(a.getAttribute('data-addpkg'),a.getAttribute('data-t'));if(a.tagName==='BUTTON')location.href='servicios-digitales.html#solicitud'}
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

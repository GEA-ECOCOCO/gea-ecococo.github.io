/* Asistente ECOCOCO. Solo se muestra si GEA_CONFIG.chatUrl tiene la dirección del Worker. Sin claves aquí. */
(function(){
var C=window.GEA_CONFIG||{};if(!C.chatUrl)return;
var EN=/^en/i.test(document.documentElement.lang||'');
function L(es,en){return EN?en:es}
var KEY='gea-chat',CK='gea-chat-n',MAXQ=10,hist=[],busy=false,open=false,last=0;
try{hist=JSON.parse(sessionStorage.getItem(KEY)||'[]').slice(-14)}catch(e){}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(hist.slice(-14)))}catch(e){}}
function track(n,p){try{window.geaTrack&&window.geaTrack(n,p||{})}catch(e){}}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}

var btn=el('button','chat-float');btn.type='button';btn.setAttribute('aria-label',L('Abrir asistente','Open assistant'));btn.title=L('Asistente ECOCOCO','ECOCOCO assistant');
btn.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 01-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1121 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
var box=el('div','chat-box');box.setAttribute('role','dialog');box.setAttribute('aria-label',L('Asistente ECOCOCO','ECOCOCO assistant'));box.hidden=true;
var hd=el('div','chat-hd');var tt=el('div','chat-tt');tt.appendChild(el('b','',L('Asistente ECOCOCO','ECOCOCO assistant')));tt.appendChild(el('small','',L('Respuestas con IA · no sustituye a un asesor','AI answers · not a substitute for an advisor')));
var x=el('button','chat-x','×');x.type='button';x.setAttribute('aria-label',L('Cerrar','Close'));hd.appendChild(tt);hd.appendChild(x);
var log=el('div','chat-log');log.setAttribute('aria-live','polite');
var sug=el('div','chat-sug');
var fm=el('form','chat-fm');var inp=el('input');inp.type='text';inp.maxLength=500;inp.autocomplete='off';inp.placeholder=L('Escribe tu pregunta…','Type your question…');inp.setAttribute('aria-label',inp.placeholder);
var go=el('button','',L('Enviar','Send'));go.type='submit';fm.appendChild(inp);fm.appendChild(go);
var ft=el('div','chat-ft',L('Las respuestas las genera una IA con los datos de este sitio. Para pedidos y precios finales confirma por WhatsApp. No escribas datos personales sensibles.','Answers are AI-generated from this site\'s data. For orders and final prices confirm via WhatsApp. Do not type sensitive personal data.'));
box.appendChild(hd);box.appendChild(log);box.appendChild(sug);box.appendChild(fm);box.appendChild(ft);
document.body.appendChild(btn);document.body.appendChild(box);

function waLink(){
  var q='';for(var i=hist.length-1;i>=0;i--){if(hist[i].role==='user'){q=hist[i].content;break}}
  var t=L('Hola, vengo del asistente de la página. ','Hello, I come from the website assistant. ')+(q?L('Mi consulta: ','My question: ')+q.slice(0,300):'');
  return 'https://wa.me/'+(C.whatsapp||'50242794894')+'?text='+encodeURIComponent(t);
}
function add(role,text){
  var wa=false;if(role==='assistant'&&/\[\[WA\]\]/.test(text)){wa=true;text=text.replace(/\s*\[\[WA\]\]\s*/g,' ').trim()}
  var m=el('div','chat-m '+(role==='user'?'u':'a'));
  String(text).split(/\n+/).forEach(function(par){if(par.trim())m.appendChild(el('p','',par))});
  if(wa){var a=el('a','chat-wa',L('Continuar por WhatsApp','Continue on WhatsApp'));a.href=waLink();a.target='_blank';a.rel='noopener';a.addEventListener('click',function(){track('click_whatsapp',{destino:'asistente'})});m.appendChild(a)}
  log.appendChild(m);log.scrollTop=log.scrollHeight;return m;
}
function render(){
  log.textContent='';
  if(!hist.length){add('assistant',L('Hola, soy el asistente de ECOCOCO. Puedo ayudarte con precios, presentaciones, pedidos, entregas, pagos y uso del carbón. ¿Qué necesitas?','Hi, I\'m the ECOCOCO assistant. I can help with prices, sizes, orders, delivery, payment and how to use the charcoal. What do you need?'));
    sug.hidden=false}
  else{hist.forEach(function(h){add(h.role,h.content)});sug.hidden=true}
}
[[L('¿Cuánto cuesta?','How much is it?'),L('¿Cuánto cuesta cada presentación?','How much does each size cost?')],
 [L('¿Cómo hago un pedido?','How do I order?'),L('¿Cómo hago un pedido y cuáles son los métodos de pago?','How do I place an order and what payment methods are available?')],
 [L('Quiero distribuir','I want to resell'),L('Quiero ser distribuidor, ¿qué necesito?','I want to become a distributor, what do I need?')],
 [L('Envíos y exportación','Shipping & export'),L('¿Hacen envíos y cotizan exportación?','Do you ship and quote exports?')]].forEach(function(s){
  var b=el('button','',s[0]);b.type='button';b.addEventListener('click',function(){send(s[1])});sug.appendChild(b)});

function send(txt){
  txt=String(txt||'').trim().slice(0,500);if(!txt||busy)return;
  if(Date.now()-last<1200)return;last=Date.now();
  var q=0;try{q=parseInt(sessionStorage.getItem(CK)||'0',10)}catch(e){}
  if(q>=MAXQ){inp.value='';sug.hidden=true;fail('max');return}
  try{sessionStorage.setItem(CK,String(q+1))}catch(e){}
  busy=true;sug.hidden=true;inp.value='';go.disabled=true;
  hist.push({role:'user',content:txt});save();add('user',txt);
  var wait=add('assistant','…');wait.classList.add('wait');
  track('use_chat',{idioma:EN?'en':'es'});
  var ctl=window.AbortController?new AbortController():null;var to=setTimeout(function(){ctl&&ctl.abort()},26000);
  fetch(C.chatUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist.slice(-12),lang:EN?'en':'es'}),signal:ctl?ctl.signal:undefined})
  .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j,s:r.status}})})
  .then(function(o){
    wait.remove();
    if(o.ok&&o.j&&o.j.reply){hist.push({role:'assistant',content:o.j.reply});save();add('assistant',o.j.reply)}
    else{hist.pop();save();fail(o.s===429)}
  }).catch(function(){wait.remove();hist.pop();save();fail(false)})
  .then(function(){clearTimeout(to);busy=false;go.disabled=false;inp.focus()});
}
function fail(rate){
  var m=add('assistant',rate==='max'?L('Llegaste al límite de preguntas de esta sesión. Para seguir, escríbenos por WhatsApp y te atiende una persona.','You reached this session\'s question limit. To continue, message us on WhatsApp and a person will help you.'):rate?L('Estás enviando muchos mensajes. Espera un momento o escríbenos por WhatsApp.','You are sending many messages. Please wait a moment or message us on WhatsApp.'):L('No pude responder en este momento. Escríbenos por WhatsApp y te atendemos.','I couldn\'t answer right now. Message us on WhatsApp and we\'ll help you.'));
  var a=el('a','chat-wa',L('Escribir por WhatsApp','Message on WhatsApp'));a.href=waLink();a.target='_blank';a.rel='noopener';m.appendChild(a);
}
function toggle(v){
  open=v;box.hidden=!v;btn.classList.toggle('on',v);document.body.classList.toggle('chat-open',v);
  if(v){render();track('open_chat');setTimeout(function(){inp.focus()},50)}
}
btn.addEventListener('click',function(){toggle(!open)});
x.addEventListener('click',function(){toggle(false);btn.focus()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open)toggle(false)});
fm.addEventListener('submit',function(e){e.preventDefault();send(inp.value)});
})();

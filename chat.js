/* Asistente ECOCOCO. Con GEA_CONFIG.chatUrl usa IA (Worker); sin él, responde con preguntas frecuentes locales. Sin claves aquí. */
(function(){
var C=window.GEA_CONFIG||{};var AI=!!C.chatUrl;var DB=window.GEA_FAQ;if(!AI&&!DB)return;
var EN=/^en/i.test(document.documentElement.lang||'');
function L(es,en){return EN?en:es}
var KEY='gea-chat',CK='gea-chat-n',MAXQ=20,hist=[],busy=false,open=false,last=0;
try{hist=JSON.parse(sessionStorage.getItem(KEY)||'[]').slice(-14)}catch(e){}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(hist.slice(-14)))}catch(e){}}
function track(n,p){try{window.geaTrack&&window.geaTrack(n,p||{})}catch(e){}}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var ICN={ar:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 mic:'<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3.2"/>',
 vol:'<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.5 9a4.2 4.2 0 010 6M18.2 6.5a7.8 7.8 0 010 11"/>',
 volx:'<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
 pause:'<rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/>',
 play:'<path d="M8.2 5.6v12.8L18.6 12z" fill="currentColor"/>',
 stop:'<rect x="6.2" y="6.2" width="11.6" height="11.6" rx="2.6" fill="currentColor"/>'};
function ic(n,s){return '<svg viewBox="0 0 24 24" width="'+(s||16)+'" height="'+(s||16)+'" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICN[n]+'</svg>'}
function lab(b,n){b.innerHTML=ic(b.getAttribute('data-i'+n))+'<span>'+b.getAttribute('data-t'+n)+'</span>'}

var btn=el('button','chat-float');btn.type='button';btn.setAttribute('aria-label',L('Abrir asistente','Open assistant'));btn.title=L('Asistente ECOCOCO','ECOCOCO assistant');
btn.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14a2 2 0 012 2v9a2 2 0 01-2 2h-8l-4.5 3.6V17H5a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M12 7.2l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="currentColor" stroke="none"/></svg><span class="cf-t"><b>'+L('Asistente IA','AI assistant')+'</b><small>'+L('Pregúntame','Ask me')+'</small></span><i class="cf-ia" aria-hidden="true">'+L('IA','AI')+'</i>';
var box=el('div','chat-box');box.setAttribute('role','dialog');box.setAttribute('aria-label',L('Asistente ECOCOCO','ECOCOCO assistant'));box.hidden=true;
var hd=el('div','chat-hd');var tt=el('div','chat-tt');tt.appendChild(el('b','',L('Asistente ECOCOCO','ECOCOCO assistant')));tt.appendChild(el('small','',AI?L('Respuestas con IA · no sustituye a un asesor','AI answers · not a substitute for an advisor'):L('Respuestas automáticas · un asesor te atiende por WhatsApp','Automatic answers · an advisor helps you on WhatsApp')));
var x=el('button','chat-x','×');x.type='button';x.setAttribute('aria-label',L('Cerrar','Close'));hd.appendChild(tt);
hd.appendChild(x);
var log=el('div','chat-log');log.setAttribute('aria-live','polite');
var sug=el('div','chat-sug');
var fm=el('form','chat-fm');var inp=el('input');inp.type='text';inp.maxLength=500;inp.autocomplete='off';inp.placeholder=L('Escribe tu pregunta…','Type your question…');inp.setAttribute('aria-label',inp.placeholder);
var go=el('button','',L('Enviar','Send'));go.type='submit';fm.appendChild(inp);fm.appendChild(go);
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,TTS=('speechSynthesis' in window&&window.SpeechSynthesisUtterance)?window.speechSynthesis:null;
var speakNext=false,rec=null,listening=false,vTimer=null,spBtn=null;
var vn=el('div','chat-vn');vn.hidden=true;vn.setAttribute('role','status');
function note(t){vn.textContent=t;vn.hidden=!t;clearTimeout(vTimer);if(t)vTimer=setTimeout(function(){vn.hidden=true},5000)}
var muted=false;try{muted=localStorage.getItem('gea-chat-mute')==='1'}catch(e){}
var mu=null;
if(TTS){mu=el('button','chat-mu');mu.type='button';
  var paintMu=function(){mu.innerHTML=ic(muted?'volx':'vol',20);mu.title=muted?L('Voz silenciada: toca para activar','Voice muted: tap to turn on'):L('Voz activada: toca para silenciar','Voice on: tap to mute');mu.setAttribute('aria-label',mu.title);mu.setAttribute('aria-pressed',muted?'true':'false')};
  paintMu();hd.insertBefore(mu,x);
  mu.addEventListener('click',function(){muted=!muted;try{localStorage.setItem('gea-chat-mute',muted?'1':'0')}catch(e){}paintMu();if(muted)stopSpeak();note(muted?L('Voz silenciada. Las respuestas no se leerán solas.','Voice muted. Answers will not be read aloud automatically.'):L('Voz activada: si preguntas por voz, la respuesta se leerá.','Voice on: if you ask by voice, the answer will be read aloud.'))})}
var mic=null;
if(SR){mic=el('button','chat-mic');mic.type='button';mic.setAttribute('aria-label',L('Hablar con el asistente (micrófono)','Speak to the assistant (microphone)'));mic.title=L('Hablar','Speak');
  mic.innerHTML=ic('mic',22);
  fm.insertBefore(mic,go)}
var ft=el('div','chat-ft',AI?L('Las respuestas las genera una IA con los datos de este sitio. Para pedidos y precios finales confirma por WhatsApp. No escribas datos personales sensibles.','Answers are AI-generated from this site\'s data. For orders and final prices confirm via WhatsApp. Do not type sensitive personal data.'):L('Respuestas automáticas con los datos de este sitio. Para pedidos y precios finales confirma por WhatsApp.','Automatic answers based on this site\'s data. For orders and final prices confirm via WhatsApp.'));
if(SR)ft.textContent+=' '+L('Si usas el micrófono, el reconocimiento de voz lo hace tu navegador y no guardamos el audio.','If you use the microphone, voice recognition is done by your browser and we do not store the audio.');
box.appendChild(hd);box.appendChild(log);box.appendChild(sug);box.appendChild(vn);box.appendChild(fm);box.appendChild(ft);
document.body.appendChild(btn);document.body.appendChild(box);
(function(){function mn(){if(btn.classList.contains('mini'))return;btn.classList.add('fading');setTimeout(function(){btn.style.width=btn.offsetWidth+'px';void btn.offsetWidth;btn.classList.add('mini');btn.style.width='';},380)}var t=setTimeout(function(){mn()},8000);function ex(){btn.classList.remove('mini');btn.classList.remove('fading')}btn.addEventListener('mouseenter',ex);btn.addEventListener('focus',ex);btn.addEventListener('mouseleave',function(){clearTimeout(t);t=setTimeout(function(){mn()},3000)});btn.addEventListener('blur',function(){mn()})})();

function ttsText(t){
  t=String(t).replace(/https?:\/\/\S+/g,'').replace(/\bECOCOCO/gi,'Eco Coco').replace(/\bGEA\b/g,'Jea').replace(/\s*\(\s*ECO-\d+KG\s*\)/gi,'').replace(/\bECO-\d+KG\b/gi,'').replace(/US\$\s?(\d[\d.,]*)/g,'$1 '+L('dólares','dollars')).replace(/Q\s?(\d[\d.,]*)/g,'$1 '+L('quetzales','quetzales'))
    .replace(/[→≈·•]/g,' ').replace(/\b1\s?kg\b/gi,L('1 kilo','1 kilogram')).replace(/(\d[\d.,]*)\s?kg\b/gi,'$1 '+L('kilos','kilograms')).replace(/\bkg\b/gi,L('kilo','kilogram')).replace(/\s+/g,' ').trim();
  return t}
function pickVoice(){
  var vs=(TTS.getVoices()||[]).filter(function(v){return(v.lang||'').toLowerCase().indexOf(EN?'en':'es')===0});
  if(!vs.length)return null;
  var pre=EN?['en-us','en-gb','en']:['es-gt','es-mx','es-us','es-419','es-co','es-ar','es-es','es'];
  function sc(v){var n=(v.name||'').toLowerCase(),l=(v.lang||'').toLowerCase().replace('_','-'),s=0;
    if(/natural|neural|premium|enhanced|mejorad|wavenet|studio/.test(n))s+=60;
    if(/online|google|microsoft|siri/.test(n))s+=25;
    if(/compact|espeak|robot|novelty|bad news|whisper|zarvox|trinoids|bubbles|boing|cellos|hysterical/.test(n))s-=80;
    for(var k=0;k<pre.length;k++){if(l===pre[k]||l.indexOf(pre[k]+'-')===0){s+=(pre.length-k)*4;break}}
    if(v.default)s+=3;return s}
  vs.sort(function(a,b){return sc(b)-sc(a)});return vs[0]}
function stopSpeak(){if(TTS){try{TTS.resume();TTS.cancel()}catch(e){}}if(spBtn){spBtn.classList.remove('on');lab(spBtn,1);if(spBtn._pb){spBtn._pb.hidden=true;lab(spBtn._pb,1)}spBtn=null}}
function speak(text,btn){
  if(!TTS)return;var same=btn&&btn===spBtn;stopSpeak();if(same)return;
  var t=ttsText(text);if(!t)return;
  var parts=t.match(/.+?(?:[.!?]+(?=\s|$)|$)/g)||[t],v=pickVoice();
  if(btn){spBtn=btn;btn.classList.add('on');lab(btn,2);if(btn._pb){btn._pb.hidden=false;lab(btn._pb,1)}}
  parts.forEach(function(p,i){
    var u=new SpeechSynthesisUtterance(p.trim());u.lang=v?v.lang:(EN?'en-US':'es-MX');if(v)u.voice=v;u.rate=.97;u.pitch=1;
    if(i===parts.length-1){u.onend=u.onerror=function(){if(spBtn===btn&&btn){btn.classList.remove('on');lab(btn,1);if(btn._pb)btn._pb.hidden=true;spBtn=null}}}
    TTS.speak(u)})}
if(TTS){try{TTS.getVoices();if(TTS.addEventListener)TTS.addEventListener('voiceschanged',function(){})}catch(e){}}
function stopMic(){if(rec){try{rec.stop()}catch(e){}}}
function startMic(){
  if(!SR||busy)return;stopSpeak();
  if(listening){stopMic();return}
  var r=new SR();rec=r;r.lang=EN?'en-US':'es-GT';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  var fin='',ph=inp.placeholder;
  r.onstart=function(){listening=true;mic.classList.add('on');inp.placeholder=L('Escuchando… habla ahora','Listening… speak now');track('use_voz',{idioma:EN?'en':'es'})};
  r.onresult=function(ev){var s='';for(var i=0;i<ev.results.length;i++){s+=ev.results[i][0].transcript;if(ev.results[i].isFinal)fin=s}inp.value=s};
  r.onerror=function(ev){var e=ev&&ev.error;
    if(e==='not-allowed'||e==='service-not-allowed')note(L('Permite el uso del micrófono en tu navegador para hablar con el asistente.','Allow microphone access in your browser to talk to the assistant.'));
    else if(e==='no-speech')note(L('No te escuché. Toca el micrófono e inténtalo de nuevo.','I did not hear you. Tap the microphone and try again.'));
    else if(e==='network')note(L('Sin conexión para el reconocimiento de voz. Puedes escribir tu pregunta.','No connection for voice recognition. You can type your question.'));
    else if(e!=='aborted')note(L('No se pudo usar la voz. Puedes escribir tu pregunta.','Voice could not be used. You can type your question.'))};
  r.onend=function(){listening=false;mic.classList.remove('on');inp.placeholder=ph;rec=null;var t=(fin||inp.value||'').trim();if(t&&fin)send(t,true)};
  try{r.start()}catch(e){listening=false;mic.classList.remove('on')}}
if(mic)mic.addEventListener('click',startMic);
function waLink(){
  var q='';for(var i=hist.length-1;i>=0;i--){if(hist[i].role==='user'){q=hist[i].content;break}}
  var t=L('Hola, vengo del asistente de la página. ','Hello, I come from the website assistant. ')+(q?L('Mi consulta: ','My question: ')+q.slice(0,300):'');
  return 'https://wa.me/'+(C.whatsapp||'50242794894')+'?text='+encodeURIComponent(t);
}
var LINKS={'producto':['producto.html','Ver producto','View product'],'precios':['precios.html','Ver precios y pedir','See prices & order'],'como-comprar':['como-comprar.html','Cómo comprar','How to buy'],'distribuidores':['distribuidores.html','Ser distribuidor','Become a distributor'],'entregas':['entregas-devoluciones.html','Entregas y devoluciones','Delivery & returns'],'proceso':['proceso.html','Cómo lo producimos','How we make it'],'impacto':['impacto-ambiental.html','Impacto ambiental','Environmental impact'],'contacto':['contacto.html','Contacto','Contact'],'medicion':['medicion.html','Medición','Measurement'],'nosotros':['quienes-somos.html','Quiénes somos','About us'],'descargas':['descargas.html','Guías en PDF','PDF guides'],'factura':['factura.html','Solicitar factura FEL','Request FEL invoice'],'ventas':['ventas.html','Ir a ventas','Go to sales'],'servicios':['servicios-digitales.html','Ver servicios digitales','See digital services']};
function linkBtns(keys){var d=el('div','chat-links');keys.slice(0,2).forEach(function(k){var x=LINKS[k];if(!x)return;var a=el('a','chat-ln',null);a.innerHTML=L(x[1],x[2])+ic('ar',15);a.href=x[0];a.addEventListener('click',function(){track('click_chat_link',{destino:k})});d.appendChild(a)});return d.childNodes.length?d:null}
function add(role,text,fk){
  var lk=[];if(role==='assistant'){text=String(text).replace(/\[\[LINK:([a-z-]+)\]\]/g,function(_,k){if(LINKS[k]&&lk.indexOf(k)<0)lk.push(k);return ''});text=text.replace(/\s+$/,'')}
  var inst=false;if(role==='assistant'&&/\[\[INSTALL\]\]/.test(text)){inst=true;text=text.replace(/\s*\[\[INSTALL\]\]\s*/g,' ').trim()}
  var shr=false;if(role==='assistant'&&/\[\[SHARE\]\]/.test(text)){shr=true;text=text.replace(/\s*\[\[SHARE\]\]\s*/g,' ').trim()}
  if(!lk.length&&fk)lk=fk;
  var wa=false;if(role==='assistant'&&/\[\[WA\]\]/.test(text)){wa=true;text=text.replace(/\s*\[\[WA\]\]\s*/g,' ').trim()}
  var m=el('div','chat-m '+(role==='user'?'u':'a'));
  String(text).split(/\n+/).forEach(function(par){if(par.trim())m.appendChild(el('p','',par))});
  if(wa){var a=el('a','chat-wa',L('Continuar por WhatsApp','Continue on WhatsApp'));a.href=waLink();a.target='_blank';a.rel='noopener';a.addEventListener('click',function(){track('click_whatsapp',{destino:'asistente'})});m.appendChild(a)}
  if(lk.length){var lb=linkBtns(lk);if(lb)m.appendChild(lb)}
  if(role==='assistant'&&text!=='…'&&TTS&&!/^\[diagn/.test(text)){
    var sb=el('button','chat-sp');sb.type='button';sb.setAttribute('data-i1','vol');sb.setAttribute('data-t1',L('Escuchar','Listen'));sb.setAttribute('data-i2','stop');sb.setAttribute('data-t2',L('Detener','Stop'));lab(sb,1);
    var pb=el('button','chat-sp chat-pb');pb.type='button';pb.hidden=true;pb.setAttribute('data-i1','pause');pb.setAttribute('data-t1',L('Pausar','Pause'));pb.setAttribute('data-i2','play');pb.setAttribute('data-t2',L('Reanudar','Resume'));lab(pb,1);sb._pb=pb;
    pb.addEventListener('click',function(){try{if(TTS.paused){TTS.resume();lab(pb,1)}else{TTS.pause();lab(pb,2)}}catch(e){}});
    sb.addEventListener('click',function(){track('click_escuchar');speak(text,sb)});
    var sw=el('div','chat-spw');sw.appendChild(sb);sw.appendChild(pb);m.appendChild(sw);
    if(speakNext){speakNext=false;if(!muted)speak(text,sb)}}
  if(shr&&window.GEA_SHARE_APP){var sh=el('button','chat-ln chat-inst',null);sh.innerHTML=L('Compartir la app','Share the app')+ic('ar',15);sh.type='button';sh.addEventListener('click',function(){window.GEA_SHARE_APP()});m.appendChild(sh)}
  if(inst&&!(window.GEA_INSTALL&&GEA_INSTALL.standalone())){var ib=el('button','chat-ln chat-inst',null);ib.innerHTML=L('Instalar la app','Install the app')+ic('ar',15);ib.type='button';var hp=el('p','chat-hp');hp.hidden=true;
    ib.addEventListener('click',function(){track('click_instalar_app',{origen:'asistente'});if(!window.GEA_INSTALL)return;GEA_INSTALL.install(function(r,h){if(r==='manual'){hp.textContent=h;hp.hidden=false}else if(r==='ok'){ib.remove()}})});
    m.appendChild(ib);m.appendChild(hp)}
  log.appendChild(m);log.scrollTop=log.scrollHeight;return m;
}
function render(){
  log.textContent='';
  if(!hist.length){add('assistant',L('Hola, soy tu asesor de ECOCOCO. Cuéntame qué buscas y te oriento: ¿es para tu casa, para un restaurante o para revender?','Hi, I\'m your ECOCOCO advisor. Tell me what you\'re looking for and I\'ll guide you: is it for your home, a restaurant or to resell?'));
    sug.hidden=false}
  else{hist.forEach(function(h){add(h.role,h.content)});sug.hidden=true}
}
[[L('¿Cuánto cuesta?','How much is it?'),L('¿Cuánto cuesta cada presentación?','How much does each size cost?')],
 [L('¿Cómo hago un pedido?','How do I order?'),L('¿Cómo hago un pedido y cuáles son los métodos de pago?','How do I place an order and what payment methods are available?')],
 [L('Quiero distribuir','I want to resell'),L('Quiero ser distribuidor, ¿qué necesito?','I want to become a distributor, what do I need?')],
 [L('Envíos y exportación','Shipping & export'),L('¿Hacen envíos y cotizan exportación?','Do you ship and quote exports?')],
 [L('Instalar la app','Install the app'),L('¿Cómo instalo la app en mi celular?','How do I install the app on my phone?')]].forEach(function(s){
  var b=el('button','',s[0]);b.type='button';b.addEventListener('click',function(){send(s[1])});sug.appendChild(b)});
var vta=el('a','chat-sug-v',null);vta.href='ventas.html';vta.innerHTML=L('Ir a ventas','Go to sales')+ic('ar',14);vta.addEventListener('click',function(){track('click_chat_link',{destino:'ventas'})});sug.appendChild(vta);

function norm(x){return String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ')}
function local(txt){
  if(!DB)return null;var w=norm(txt).split(/\s+/).filter(Boolean),best=null,bs=0;
  DB.faq.forEach(function(f){var ks=f.k.split(' '),sc=0;w.forEach(function(x){if(x.length>2&&ks.indexOf(x)!==-1)sc++});if(sc>bs){bs=sc;best=f}});
  if(best)return(EN?best.en:best.es)+(best.inst?' [[INSTALL]]':'')+(best.share?' [[SHARE]]':'')+(best.link||[]).map(function(k){return ' [[LINK:'+k+']]'}).join('')+(best.wa?' [[WA]]':'');
  if(w.some(function(x){return DB.greet.k.split(' ').indexOf(x)!==-1})&&w.length<4)return EN?DB.greet.en:DB.greet.es;
  return null}
function done(){busy=false;go.disabled=false;inp.focus()}
function answerLocal(txt,wait){
  var r=local(txt);if(wait)wait.remove();
  if(!r)r=L('No tengo ese dato confirmado. Escríbenos por WhatsApp y una persona te responde. [[WA]]','I don\'t have that confirmed. Message us on WhatsApp and a person will answer. [[WA]]');
  hist.push({role:'assistant',content:r});save();add('assistant',r);done()}
function dbg(m){try{if(location.hash.indexOf('chatdebug')>-1)add('assistant','[diagnóstico] '+m)}catch(e){}}
function send(txt,viaVoice){
  txt=String(txt||'').trim().slice(0,500);if(!txt||busy)return;stopSpeak();speakNext=!!viaVoice&&!!TTS;
  if(Date.now()-last<1200)return;last=Date.now();
  busy=true;sug.hidden=true;inp.value='';go.disabled=true;
  if(AI){var q=0;try{q=parseInt(sessionStorage.getItem(CK)||'0',10)}catch(e){}
    if(q>=MAXQ){busy=false;go.disabled=false;fail('max');return}
    try{sessionStorage.setItem(CK,String(q+1))}catch(e){}}
  hist.push({role:'user',content:txt});save();add('user',txt);
  var wait=add('assistant','…');wait.classList.add('wait');
  track('use_chat',{idioma:EN?'en':'es',modo:AI?'ia':'faq'});
  if(!AI){setTimeout(function(){answerLocal(txt,wait)},450);return}
  var ctl=window.AbortController?new AbortController():null;var to=setTimeout(function(){ctl&&ctl.abort()},26000);
  fetch(C.chatUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist.slice(-12),lang:EN?'en':'es'}),signal:ctl?ctl.signal:undefined})
  .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j,s:r.status}})})
  .then(function(o){
    clearTimeout(to);
    if(o.ok&&o.j&&o.j.reply){var rp=String(o.j.reply).replace(/\*\*/g,'').replace(/^#+\s*/gm,'');wait.remove();hist.push({role:'assistant',content:rp});save();add('assistant',rp);done()}
    else if(o.s===429){wait.remove();hist.pop();save();fail(true);done()}
    else{dbg('HTTP '+o.s+' '+JSON.stringify(o.j));answerLocal(txt,wait)}
  }).catch(function(e){clearTimeout(to);dbg('fetch: '+(e&&e.message||e));answerLocal(txt,wait)});
}
function fail(rate){
  var m=add('assistant',rate==='max'?L('Llegaste al límite de preguntas de esta sesión. Para seguir, escríbenos por WhatsApp y te atiende una persona.','You reached this session\'s question limit. To continue, message us on WhatsApp and a person will help you.'):rate?L('Estás enviando muchos mensajes. Espera un momento o escríbenos por WhatsApp.','You are sending many messages. Please wait a moment or message us on WhatsApp.'):L('No pude responder en este momento. Escríbenos por WhatsApp y te atendemos.','I couldn\'t answer right now. Message us on WhatsApp and we\'ll help you.'));
  var a=el('a','chat-wa',L('Escribir por WhatsApp','Message on WhatsApp'));a.href=waLink();a.target='_blank';a.rel='noopener';m.appendChild(a);
}
function toggle(v){
  if(!v){stopSpeak();stopMic()}
  open=v;box.hidden=!v;btn.classList.toggle('on',v);document.body.classList.toggle('chat-open',v);
  if(v){render();track('open_chat');setTimeout(function(){inp.focus()},50)}
}
btn.addEventListener('click',function(){toggle(!open)});
x.addEventListener('click',function(){toggle(false);btn.focus()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open)toggle(false)});
fm.addEventListener('submit',function(e){e.preventDefault();send(inp.value)});
})();

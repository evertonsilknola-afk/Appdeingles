const $=i=>document.getElementById(i);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='vocabmaster_v2';

// ---------- Armazenamento automático (memória interna do app) ----------
let S={srs:{},score:0,custom:[],cat:'all',idx:0,tab:'cards'};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});

// ---------- Dados ----------
const TY={w:'word',e:'expression',v:'verbs'};
const vocab=V.map((r,i)=>({id:i+1,en:r[0],pt:r[1],type:TY[r[2]],note:r[3]||''}));
const IC=IQ.map((r,i)=>({id:'i'+(i+1),en:r[1],pt:r[3],subtext:r[2],note:'PT: '+r[4],type:'interview',priority:!!r[0],ptq:r[2],pta:r[4]}));
const allVocab=()=>vocab.concat(S.custom);
const TL={word:'Palavra',expression:'Expressão',verbs:'Verbo'};

function speak(t){
  try{const s=window.speechSynthesis;if(!s)return;s.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.9;s.speak(u)}catch(e){}
}
function totals(){$('total').textContent=allVocab().length+' palavras + '+IC.length+' perguntas'}

// ---------- Navegação ----------
const TABS=[['cards','layers','Cards'],['interview','user-check','Entrevista'],['quiz','brain-circuit','Quiz'],['builder','wrench','Frases'],['add','plus-circle','Novo'],['dictionary','list','Lista'],['grammar','sparkles','Dicas']];
$('nav').innerHTML=TABS.map(([t,i,l])=>`<button data-tab="${t}" id="tab-${t}" class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-slate-400"><i data-lucide="${i}" class="w-5 h-5"></i>${l}</button>`).join('');
function switchTab(t){
  TABS.forEach(([k])=>{$('view-'+k).classList.toggle('hidden',k!==t);const b=$('tab-'+k);b.classList.toggle('text-indigo-400',k===t);b.classList.toggle('text-slate-400',k!==t)});
  S.tab=t;save();window.scrollTo(0,0);
  if(t==='interview')renderInterview(imode);
  if(t==='quiz')startQuiz();
  if(t==='builder')initBuilder();
  if(t==='dictionary')renderDict();
  icons();
}
const icons=()=>{try{lucide.createIcons()}catch(e){}};

// ---------- Flashcards ----------
let deck=[],idx=0,flipped=false;
function buildDeck(){
  const v=allVocab(),full=v.concat(IC),now=new Date();
  const m={all:()=>full,due:()=>full.filter(i=>!S.srs[i.id]||new Date(S.srs[i.id].next)<=now),ip:()=>IC.filter(i=>i.priority),ia:()=>IC,verbs:()=>v.filter(i=>i.type==='verbs'),word:()=>v.filter(i=>i.type==='word'),expression:()=>v.filter(i=>i.type==='expression')};
  deck=(m[S.cat]||m.all)().slice();
}
function setFlip(f){flipped=f;$('flip').classList.toggle('on',f)}
function render(){
  setFlip(false);
  if(!deck.length){$('front').textContent='Nenhum item';$('sub').textContent='';$('backt').textContent='Mude o filtro';$('note').textContent='';$('tag').textContent='Aviso';$('prog').textContent='Card 0 de 0';$('badge').textContent='';return}
  if(idx>=deck.length)idx=0;
  const c=deck[idx];
  $('front').textContent=c.en;$('sub').textContent=c.subtext||'';$('backt').textContent=c.pt;$('note').textContent=c.note||'';
  $('tag').textContent=c.type==='interview'?(c.priority?'🎯 Entrevista (Prioritária)':'🎙️ Entrevista'):TL[c.type];
  $('prog').textContent=`Card ${idx+1} de ${deck.length}`;
  const s=S.srs[c.id],b=$('badge');
  if(s){const d=new Date(s.next);b.textContent=d<=new Date()?'Pronta p/ revisão':'Rever: '+d.toLocaleDateString()}else b.textContent='Novo';
}
function go(n){if(!deck.length)return;idx=(idx+n+deck.length)%deck.length;S.idx=idx;save();render()}
function rate(l){
  const c=deck[idx];if(!c)return;const d=new Date(),n=new Date(d);
  if(l==='hard'){n.setMinutes(d.getMinutes()+1);if(!deck.slice(idx+1).some(x=>x.id===c.id))deck.push(c)}
  else n.setDate(d.getDate()+(l==='medium'?1:4));
  S.srs[c.id]={level:l,last:d.toISOString(),next:n.toISOString()};
  save();go(1);
}
function shuffle(){for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}idx=0;S.idx=0;save();render()}

// ---------- Entrevista ----------
let imode=S.imode||'p';
function renderInterview(m){
  imode=m;S.imode=m;save();
  $('ibtn-p').className='flex-1 py-2 rounded-xl text-xs font-semibold '+(m==='p'?'bg-indigo-600 text-white':'bg-slate-700 text-slate-300');
  $('ibtn-a').className='flex-1 py-2 rounded-xl text-xs font-semibold '+(m==='a'?'bg-indigo-600 text-white':'bg-slate-700 text-slate-300');
  $('ilist').innerHTML=IC.filter(q=>m==='a'||q.priority).map((q,i)=>`<div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
  <div class="flex justify-between gap-3 border-b border-slate-700 pb-3"><div><span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${q.priority?'text-amber-400 bg-amber-500/10':'text-slate-400 bg-slate-700/50'}">${q.priority?'★ Prioritária':'Pergunta'}</span><h3 class="text-lg font-bold mt-1">${esc(q.en)}</h3><p class="text-xs text-slate-400">${esc(q.ptq)}</p></div>
  <button data-say="${esc(q.en)}" class="p-2 bg-slate-700 rounded-xl h-fit"><i data-lucide="volume-2" class="w-5 h-5"></i></button></div>
  <div class="bg-slate-900 rounded-xl p-4 space-y-2"><div class="flex justify-between gap-2"><p class="text-sm font-semibold text-indigo-300 leading-relaxed">${esc(q.pt)}</p>
  <button data-say="${esc(q.pt)}" class="p-2 bg-indigo-600 rounded-lg h-fit shrink-0"><i data-lucide="volume-2" class="w-4 h-4"></i></button></div>
  <p class="text-xs text-slate-400 border-t border-slate-800 pt-2">${esc(q.pta)}</p></div></div>`).join('');
  icons();
}

// ---------- Quiz ----------
let qItem=null,qLock=false;
function startQuiz(){
  const v=allVocab();qLock=false;
  $('qscore').textContent='Pontos: '+S.score;$('qfb').textContent='';
  qItem=v[Math.floor(Math.random()*v.length)];$('qprompt').textContent=qItem.en;
  let o=[qItem];
  while(o.length<4){const r=v[Math.floor(Math.random()*v.length)];if(!o.some(x=>x.id===r.id||x.pt===r.pt))o.push(r)}
  o.sort(()=>Math.random()-.5);
  $('qopts').innerHTML=o.map(x=>`<button data-q="${esc(x.id)}" class="w-full text-left p-3.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm">${esc(x.pt)}</button>`).join('');
}
function answer(id,btn){
  if(qLock)return;const fb=$('qfb');
  if(String(qItem.id)===id){qLock=true;S.score+=10;save();$('qscore').textContent='Pontos: '+S.score;btn.className='w-full text-left p-3.5 bg-emerald-600 rounded-xl text-sm';fb.className='text-center text-sm font-semibold h-6 mt-4 text-emerald-400';fb.textContent='✨ Correto! +10';setTimeout(startQuiz,1000)}
  else{btn.className='w-full text-left p-3.5 bg-rose-600 rounded-xl text-sm';fb.className='text-center text-sm font-semibold h-6 mt-4 text-rose-400';fb.textContent='❌ Tente novamente'}
}

// ---------- Construtor de frases ----------
let bEn=[],bPt=[];
const chip=(en,pt,label)=>`<button data-en="${esc(en)}" data-pt="${esc(pt)}" class="px-2.5 py-2 bg-slate-700 text-xs rounded-lg border border-slate-600 active:bg-indigo-600">${esc(label)}</button>`;
function initBuilder(){
  $('bsub').innerHTML=[['I','Eu'],['You','Você'],['He','Ele'],['She','Ela'],['We','Nós'],['They','Eles/Elas']].map(([a,b])=>chip(a,b,`${a} (${b})`)).join('');
  let vb='',wd='';
  allVocab().forEach(i=>{const p=i.pt.split('/')[0].trim(),h=chip(i.en,p,`${i.en} (${p})`);
    if(i.type==='verbs'||i.en.startsWith('To ')||['Will','Must'].includes(i.en))vb+=h;else wd+=h});
  $('bverbs').innerHTML=vb;$('bwords').innerHTML=wd;
  $('bex').innerHTML=[['I am able to work hard.','Eu sou capaz de trabalhar duro.'],['They are ready to go.','Eles estão prontos para ir.'],['He wants to know the rules.','Ele quer saber as regras.'],['You can tell me everything.','Você pode me contar tudo.']].map(([a,b])=>`<button data-en="${esc(a)}" data-pt="${esc(b)}" data-ex="1" class="p-3 bg-slate-900/60 rounded-lg text-left border border-slate-700"><b class="text-indigo-300 block text-sm">${a}</b><span class="text-xs text-slate-400">${b}</span></button>`).join('');
  showB();
}
function showB(){
  const e=$('ben');
  if(!bEn.length){e.textContent='Toque nas palavras abaixo...';e.className='text-xl font-bold text-slate-500 min-h-[32px]';$('bpt').textContent='---'}
  else{e.textContent=bEn.join(' ');e.className='text-xl font-bold text-indigo-300 min-h-[32px]';$('bpt').textContent=bPt.join(' + ')}
}

// ---------- Adicionar / Lista ----------
function addWord(){
  const en=$('a-en').value.trim(),pt=$('a-pt').value.trim(),fb=$('a-fb');
  if(!en||!pt){fb.className='text-center text-xs font-semibold h-4 text-rose-400';fb.textContent='Preencha inglês e português';return}
  S.custom.push({id:'c'+Date.now(),en,pt,type:$('a-type').value,note:$('a-note').value.trim()});save();
  ['a-en','a-pt','a-note'].forEach(i=>$(i).value='');
  fb.className='text-center text-xs font-semibold h-4 text-emerald-400';fb.textContent=`✨ "${en}" salva!`;setTimeout(()=>fb.textContent='',2500);
  totals();buildDeck();
}
function renderDict(){
  const q=$('q').value.toLowerCase();
  $('dict').innerHTML=allVocab().filter(i=>i.en.toLowerCase().includes(q)||i.pt.toLowerCase().includes(q)).map(i=>{
    const s=S.srs[i.id];let st='Novo';if(s){const d=new Date(s.next);st=d<=new Date()?'Pronto':d.toLocaleDateString()}
    const cu=String(i.id).startsWith('c');
    return `<div class="p-3 flex items-center gap-2"><div class="flex-1 min-w-0"><p class="font-bold text-indigo-300">${esc(i.en)} <span class="text-[10px] font-normal text-slate-500">${TL[i.type]} · ${st}</span></p><p class="text-sm text-slate-300">${esc(i.pt)}</p></div>
    ${cu?`<button data-del="${esc(i.id)}" class="p-2 text-rose-400"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`:''}
    <button data-say="${esc(i.en)}" class="p-2 text-slate-400"><i data-lucide="volume-2" class="w-5 h-5"></i></button></div>`}).join('');
  icons();
}

// ---------- Eventos ----------
document.addEventListener('click',e=>{
  const t=e.target,c=s=>t.closest(s);let b;
  if(b=c('[data-tab]'))return switchTab(b.dataset.tab);
  if(b=c('[data-say]'))return speak(b.dataset.say);
  if(b=c('[data-rate]'))return rate(b.dataset.rate);
  if(b=c('[data-imode]'))return renderInterview(b.dataset.imode);
  if(b=c('[data-q]'))return answer(b.dataset.q,b);
  if(b=c('[data-del]')){S.custom=S.custom.filter(x=>String(x.id)!==b.dataset.del);save();totals();buildDeck();return renderDict()}
  if(b=c('[data-en]')){if(b.dataset.ex){bEn=[b.dataset.en];bPt=[b.dataset.pt]}else{bEn.push(b.dataset.en);bPt.push(b.dataset.pt)}return showB()}
  if(c('[data-sayb]'))return bEn.length&&speak(bEn.join(' '));
  if(c('[data-sayc]'))return deck[idx]&&speak(deck[idx].en);
  if(c('#cardbox'))return setFlip(!flipped);
  if(c('#bclear')){bEn=[];bPt=[];return showB()}
  if(c('#a-save'))return addWord();
  if(c('#prev'))return go(-1);
  if(c('#next'))return go(1);
  if(c('#shuf'))return shuffle();
});
$('cat').onchange=e=>{S.cat=e.target.value;S.idx=0;idx=0;save();buildDeck();render()};
$('q').oninput=renderDict;

// ---------- Início ----------
$('cat').value=S.cat;totals();buildDeck();idx=Math.min(S.idx||0,Math.max(deck.length-1,0));render();
switchTab(S.tab||'cards');

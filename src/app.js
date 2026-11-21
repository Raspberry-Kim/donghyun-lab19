/* 동현레: 동현랭으로 내 진영·상대 진영·시작 자금·기술 수준·컴퓨터 실력·지도·시작 유닛 수를 정하고, 1:1 전투를 띄운다. */
(function(){
const $=s=>document.querySelector(s);

/* ---------- 화면 전환과 탭 ---------- */
$('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').setAttribute('aria-pressed',String(dark));};
function showTab(name){
  document.querySelectorAll('.tabs button').forEach(b=>{const on=b.dataset.tab===name;b.classList.toggle('active',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
  document.querySelectorAll('.tab-panel').forEach(p=>p.hidden=p.id!=='tab-'+name);
}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('.brand').onclick=e=>{e.preventDefault();showTab('play');scrollTo({top:0,behavior:'smooth'});};

/* ---------- 동현랭 편집기(동현랭 시리즈와 같은 모양) ---------- */
for(const ex of examples){const o=document.createElement('option');o.value=ex.id;o.textContent=ex.title;$('#example').append(o);}
const DH_TOKEN=/(ㅋㅋ.*$)|(나는 동현이냐\?|동현이구나)|(오겡끼데스까)|(신중동역|신중동|뭉치)|(뿡뿡뿡|뿡뿡|포동이)|(꽥꽥)|(동+현아)|(동+현)|(도오*옹)|(ㅠ+)|(뚱띠|또치)/g;
const DH_CLS=[null,'t-cmt','t-frame','t-halt','t-ctl','t-out','t-in','t-assign','t-var','t-num','t-minus','t-op'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function dhLine(line){let html='',last=0;line.replace(DH_TOKEN,(m,...gr)=>{const idx=gr[gr.length-2];html+=esc(line.slice(last,idx));const k=gr.slice(0,11).findIndex(x=>x!==undefined)+1;html+=`<span class="${DH_CLS[k]}">${esc(m)}</span>`;last=idx+m.length;return m;});return html+esc(line.slice(last));}
const code=$('#code'), area=document.createElement('div'), hl=document.createElement('div');
area.className='code-area'; hl.id='hl'; hl.setAttribute('aria-hidden','true'); code.parentNode.insertBefore(area,code); area.append(hl,code);
function hlSync(){hl.scrollTop=code.scrollTop;hl.scrollLeft=code.scrollLeft;}
function hlMetrics(){const cs=getComputedStyle(code);for(const p of ['paddingTop','paddingRight','paddingBottom','paddingLeft','fontFamily','fontSize','lineHeight','tabSize','letterSpacing'])hl.style[p]=cs[p];}
function highlight(){hlMetrics();hl.innerHTML=code.value.split('\n').map(l=>`<span class="ln">${dhLine(l)||' '}</span>`).join('')+'<span class="ln"> </span>';hlSync();}
code.addEventListener('scroll',()=>{hlSync();$('#lines').scrollTop=code.scrollTop;});addEventListener('resize',highlight);
function codeChanged(e){if(!e?.isComposing)indent();const n=code.value.split('\n').length;$('#line-count').textContent=n+'줄';$('#lines').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');highlight();}
// 동현랭 시리즈 들여쓰기: ㅋㅋ 주석 세 칸, 명령 두 칸, '나는 동현이냐?'·'동현이구나'는 들여 쓰지 않는다
function indent(){
  const text=code.value,lines=text.split('\n'),lead=l=>l.length-l.replace(/^[ \t]+/,'').length;
  const next=lines.map(l=>{const b=l.slice(lead(l));if(!b)return '';if(b.startsWith('ㅋㅋ'))return '   '+b;const s=b.split('~')[0].replace(/ㅋㅋ.*$/,'').trim();return (s==='나는 동현이냐?'||s==='동현이구나'?'':'  ')+b;});
  const {selectionStart:a,selectionEnd:b,selectionDirection:dir,scrollTop:y,scrollLeft:x}=code;
  const moved=p=>{let o=0,n=0;for(let i=0;i<lines.length;i++){const L=lines[i].length;if(p<=o+L){const c=p-o,ol=lead(lines[i]),nl=lead(next[i]);return n+Math.min(next[i].length,c<ol?nl:c-ol+nl);}o+=L+1;n+=next[i].length+1;}return n;};
  const value=next.join('\n'),na=moved(a),nb=moved(b);if(value===text&&na===a&&nb===b)return;if(value!==text)code.value=value;code.setSelectionRange(na,nb,dir);code.scrollTop=y;code.scrollLeft=x;
}
code.addEventListener('compositionend',()=>codeChanged());
// 커서가 들여쓰기 안에 놓이면 들여쓰기 뒤로 옮기고, 들여쓰기 바로 뒤에서 Backspace를 누르면 윗줄과 합친다
function codeLead(){const a=code.selectionStart,v=code.value,ls=v.lastIndexOf('\n',a-1)+1,le=v.indexOf('\n',ls);return {a,ls,lead:/^[ \t]*/.exec(v.slice(ls,le<0?v.length:le))[0].length};}
document.addEventListener('selectionchange',()=>{if(document.activeElement!==code||code.selectionStart!==code.selectionEnd)return;const {a,ls,lead}=codeLead();if(a-ls<lead)code.setSelectionRange(ls+lead,ls+lead);});
code.addEventListener('beforeinput',e=>{
  const {a,ls,lead}=codeLead();
  if(a!==code.selectionEnd)return;
  if(e.inputType==='deleteContentBackward'&&ls>0&&a>ls&&a-ls<=lead){e.preventDefault();code.setRangeText('',ls-1,a,'end');codeChanged();}
});
code.oninput=codeChanged;
code.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();start();}});
function selectExample(){const ex=examples.find(e=>e.id===$('#example').value);code.value=ex.code;$('#example-note').textContent=ex.note;codeChanged();}
$('#example').onchange=selectExample; selectExample();
$('#save').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/plain;charset=utf-8'}));a.download='re.dh';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#open').onchange=async e=>{const f=e.target.files[0];if(!f)return;code.value=(await f.text()).replace(/\r/g,'').replace(/\n$/,'');codeChanged();e.target.value='';};
$('#run').onclick=()=>start();

/* ---------- 출전 규약 ---------- */
const FIELDS=[
  {key:'me',name:'내 진영',min:1,max:5,def:1},
  {key:'foe',name:'상대 진영',min:1,max:5,def:2},
  {key:'cr',name:'시작 자금',min:500,max:10000,def:5000},
  {key:'tech',name:'기술 수준',min:1,max:10,def:10},
  {key:'diff',name:'컴퓨터 실력',min:1,max:3,def:2},
  {key:'map',name:'지도',min:1,max:6,def:1},
  {key:'units',name:'시작 유닛 수',min:0,max:12,def:2}
];
const DEF=Object.fromEntries(FIELDS.map(f=>[f.key,f.def]));
const DEF_TEXT=FIELDS.map(f=>f.def).join(' ');
function parseSortie(out){
  const tok=out.split(/\s+/).filter(Boolean).map(Number);
  if(!tok.length) return {set:{...DEF},note:`출력이 없어 기본값 ${DEF_TEXT}으로 나선다.`};
  if(tok.length!==FIELDS.length) return {err:`정수를 ${tok.length}개 출력했다. 내 진영 · 상대 진영 · 시작 자금 · 기술 수준 · 컴퓨터 실력 · 지도 · 시작 유닛 수, 일곱 개를 차례로 출력하자.`};
  const set={};
  for(let i=0;i<FIELDS.length;i++){const f=FIELDS[i],v=tok[i];
    if(!Number.isInteger(v)||v<f.min||v>f.max) return {err:`${i+1}번째 값 ${f.name} ${v}은 쓸 수 없다. ${f.min}부터 ${f.max}까지만 된다.`};
    set[f.key]=v;}
  return {set};
}
const fac=n=>FACTIONS[n-1], mapName=n=>MAPS[n-1], lvName=n=>LEVELS[n-1];
/* 저장한 전투의 수. 게임 화면이 알려 줄 때마다 적어 두고, 다음에 열 때 이어하기 버튼을 보일지 정한다. */
const SAVE_KEY='donghyunre.saves.v1';
function readSaves(){ try{ const n=parseInt(localStorage.getItem(SAVE_KEY)||'0',10); return n>0?n:0; }catch(e){ return 0; } }
function writeSaves(n){ try{ if(n>0) localStorage.setItem(SAVE_KEY,String(n)); else localStorage.removeItem(SAVE_KEY); }catch(e){} }
function setCard(s){
  $('#set-card').innerHTML=[['내 진영',fac(s.me)],['상대 진영',fac(s.foe)],['시작 자금',s.cr],['기술 수준',s.tech],['컴퓨터 실력',lvName(s.diff)],['지도',s.map+' · '+mapName(s.map)],['시작 유닛',s.units+'기']]
    .map(([a,b])=>`<div><span>${a}</span><strong title="${String(b).replace(/"/g,'&quot;')}">${b}</strong></div>`).join('');
  $('#stamp-map').innerHTML=`${fac(s.me)} 대 ${fac(s.foe)} <span>진영</span>`;$('#stamp-skill').innerHTML=`${mapName(s.map)} <span>지도 ${s.map}</span>`;
  $('#poster-map').textContent=`${fac(s.me)} 대 ${fac(s.foe)} · ${mapName(s.map)}`;
}
function contButton(){ const n=readSaves(), b=$('#poster-cont'); b.hidden=!n; if(n) b.textContent=`이어하기 · 저장한 전투 ${n}개`; }
const result=(t,kind)=>{const r=$('#result');r.textContent=t;r.dataset.kind=kind||'';};
const status=(t,kind)=>{const s=$('#status');s.textContent=t;s.dataset.kind=kind||'';};

/* ---------- 휴대폰·태블릿: 마우스와 키보드가 없는 기기인지 본다(안내 문구에만 쓴다) ---------- */
const TOUCH_ONLY=matchMedia('(pointer:coarse)').matches&&!matchMedia('(any-pointer:fine)').matches;
document.documentElement.classList.toggle('touch-only',TOUCH_ONLY);

/* ---------- 게임 틀 ---------- */
let frame=null, current=null, phase='', statTimer=0;
const screen=$('#screen'), poster=$('#poster'), pill=$('#focus-pill');
function setFocus(on){pill.dataset.on=String(on);pill.textContent=on?'키보드: 게임':'키보드: 코드';}
function launch(s,load){
  stop(true);
  current=s; phase='loading';
  const hash=load?'load=1':FIELDS.map(f=>f.key+'='+s[f.key]).join('&');
  frame=document.createElement('iframe');
  frame.className='game-frame'; frame.title='동현레 게임 화면';
  frame.setAttribute('allow','autoplay; fullscreen');
  frame.src='./re/game.html#'+hash;
  frame.addEventListener('load',()=>giveFocus());
  poster.hidden=true; screen.append(frame);
  ['#stop','#full'].forEach(id=>$(id).disabled=false);
  status('엔진과 원작 자료(약 19MB)를 받는 중');
  /* 출전 버튼이 화면 아래에 있는 좁은 기기에서는 게임 화면을 눈앞으로 가져온다 */
  const r=screen.getBoundingClientRect(); if(r.top<0||r.bottom>innerHeight) screen.scrollIntoView({block:'center',behavior:'auto'});
  clearInterval(statTimer); statTimer=setInterval(statLine,1000);
}
function giveFocus(){ if(!frame)return; try{frame.contentWindow.focus();frame.contentWindow.postMessage({type:'dh-re-cmd',cmd:'focus'},'*');}catch(e){frame.focus();} }
function stop(silent){
  if(isFull()) exitFull();
  clearInterval(statTimer); statTimer=0;
  if(frame){frame.remove();frame=null;}
  phase=''; poster.hidden=false; setFocus(false); contButton();
  ['#stop','#full'].forEach(id=>$(id).disabled=true);
  if(!silent) status('끝냈다 · 다시 출전할 수 있다');
}
/* 전투 중에는 1초마다 게임 화면에 물어 자금·전력·건물·유닛 수를 적는다. 같은 출처의 틀이라 바로 읽을 수 있다. */
function statLine(){
  if(!frame||phase!=='play')return;
  try{
    const re=frame.contentWindow.__re; if(!re||!re.started)return;
    const cr=re.peek(1), bl=re.peek(10), un=re.peek(4)+re.peek(16), pw=re.peek(11), dr=re.peek(12);
    if(cr<0)return;
    status(`자금 ${cr} · 전력 ${pw}/${dr}${dr>pw?' 부족':''} · 건물 ${bl}채 · 유닛 ${un}기`);
  }catch(e){}
}
addEventListener('message',e=>{
  if(!frame||e.source!==frame.contentWindow||!e.data||e.data.type!=='dh-re')return;
  const {ev,data}=e.data;
  if(ev==='progress'){ if(phase==='loading') status(`원작 자료를 받는 중 ${Math.floor(data*100)}%`); }
  else if(ev==='ready'){ writeSaves(data&&data.saves||0); status('전장을 여는 중'); }
  else if(ev==='started'){ phase=current&&current.load?'load':'play'; if(phase==='load') status('저장한 전투를 고르는 중'); }
  else if(ev==='loaded'){ phase='play'; result('저장한 전투를 이어 한다. 진영·지도·자금은 저장할 때 그대로다.'); }
  else if(ev==='focus') setFocus(true);
  else if(ev==='blur') setFocus(false);
  else if(ev==='saved'){ writeSaves(data.saves); result(`전투를 저장했다(저장한 전투 ${data.saves}개).`+(data.kept?' 다음에 이 페이지를 열면 전장 화면에 이어하기 버튼이 나온다.':' 이 브라우저의 보관함을 쓸 수 없어, 페이지를 닫으면 사라진다.')); }
  else if(ev==='win'){ phase='over'; status('이겼다'); result('이겼다. 상대의 건물과 유닛이 하나도 남지 않았다.'); }
  else if(ev==='lose'){ phase='over'; status('졌다'); result('졌다. 내 건물과 유닛이 하나도 남지 않았다. 코드를 고쳐 다시 출전할 수 있다.'); }
  else if(ev==='end'){ if(phase!=='over') status('전투를 마쳤다'); phase='over'; }
  else if(ev==='error'){ phase='over'; status('게임 오류: '+data,'error'); }
});
code.addEventListener('focus',()=>setFocus(false));
$('#stop').onclick=()=>stop(false);
/* 전체 화면: 게임 틀이 아니라 화면 칸 전체를 띄워 '닫기' 버튼을 함께 보인다. */
const fullEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
/* iPhone Safari처럼 요소 전체 화면을 못 쓰는 곳에서는 화면 칸을 창 가득 채운다(유사 전체 화면). */
const canNativeFull=!!((document.fullscreenEnabled||document.webkitFullscreenEnabled)&&(screen.requestFullscreen||screen.webkitRequestFullscreen));
const isPseudo=()=>screen.classList.contains('pseudo-full');
const isFull=()=>fullEl()===screen||isPseudo();
function setPseudo(on){ screen.classList.toggle('pseudo-full',on); document.documentElement.classList.toggle('pseudo-full-on',on); onFull(); }
function exitFull(){ if(isPseudo()) return setPseudo(false); (document.exitFullscreen||document.webkitExitFullscreen||(()=>{})).call(document); }
let hintTimer=0;
function onFull(){ const on=isFull(); $('#exit-full').hidden=!on; $('#full').textContent=on?'전체 화면 닫기':'전체 화면';
  clearTimeout(hintTimer); $('#full-hint').hidden=!on; if(on) hintTimer=setTimeout(()=>$('#full-hint').hidden=true,5000);
  setTimeout(giveFocus,50); }
document.addEventListener('fullscreenchange',onFull); document.addEventListener('webkitfullscreenchange',onFull);
$('#exit-full').onclick=exitFull;
$('#full').onclick=()=>{ if(!frame)return; if(isFull()) return exitFull();
  if(!canNativeFull) return setPseudo(true);
  try{ const r=screen.requestFullscreen?screen.requestFullscreen():screen.webkitRequestFullscreen();
    if(r&&r.catch) r.catch(()=>setPseudo(true)); }catch(e){ setPseudo(true); } };

function start(load){
  if(load){
    result('저장한 전투의 목록이 열린다. 하나를 고르고 Load를 누르자. 이어 하는 전투는 저장할 때의 진영·지도·자금 그대로이고, 지금 코드의 값은 쓰지 않는다.');
    launch({load:true},true); return;
  }
  let out;
  try{ out=Donghyun.run(code.value,{maxSteps:300000}).output; }
  catch(e){ result(`동현랭 오류${e.line?` (${e.line}줄)`:''}: ${e.message}`,'error'); status('동현랭 오류','error'); return; }
  const p=parseSortie(out);
  if(p.err){ result('동현레 규약 오류: '+p.err,'error'); status('규약 오류','error'); return; }
  const s=p.set; setCard(s);
  result((p.note?p.note+' ':'')+`${fac(s.me)} 대 ${fac(s.foe)} · 자금 ${s.cr} · 기술 수준 ${s.tech} · 컴퓨터 실력 ${lvName(s.diff)} · 지도 ${s.map} ${mapName(s.map)} · 시작 유닛 ${s.units}기. 이 설정으로 나선다.`+(TOUCH_ONLY?' 이 기기에는 마우스와 키보드가 없는 것 같다. 손가락으로는 하기 어렵다.':' 게임 화면을 누르면 키보드가 게임으로 간다. 전체 화면으로 하기를 권한다.'));
  launch(s,false);
}
$('#poster-run').onclick=()=>start(false);
$('#poster-cont').onclick=()=>start(true);

/* 첫 화면: 예제 01의 값을 보여 주고, 게임은 출전을 누를 때 불러온다 */
(function preview(){try{const p=parseSortie(Donghyun.run(code.value,{maxSteps:300000}).output);if(p.set)setCard(p.set);}catch(e){setCard(DEF);}contButton();})();
if(typeof window!=='undefined') window.ReLab={parseSortie,FIELDS};
})();

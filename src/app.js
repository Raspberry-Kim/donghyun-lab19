/* 동현레: 동현랭으로 내 진영·상대 진영·시작 자금·기술 수준·컴퓨터 실력·지도·시작 유닛 수를 정하고, 1:1 전투를 띄운다.
   그 뒤에 치트 설정 넷(무적·지도 열기·자금 무제한·즉시 생산)을 0이나 1로 덧붙일 수 있다. 넷은 서로 겹쳐 켤 수 있다. */
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
  {key:'units',name:'시작 유닛 수',min:0,max:12,def:2},
  /* 치트 설정 넷: 0은 끔, 1은 켬. 출력하지 않은 것은 0이다. 엔진에서는 넷이 따로 듣는다 */
  {key:'god',name:'무적',short:'무적',min:0,max:1,def:0,cheat:true},
  {key:'reveal',name:'지도 열기',short:'지도',min:0,max:1,def:0,cheat:true},
  {key:'rich',name:'자금 무제한',short:'자금',min:0,max:1,def:0,cheat:true},
  {key:'fast',name:'즉시 생산',short:'생산',min:0,max:1,def:0,cheat:true}
];
const CHEATS=FIELDS.filter(f=>f.cheat), NEED=FIELDS.length-CHEATS.length;
const DEF=Object.fromEntries(FIELDS.map(f=>[f.key,f.def]));
const DEF_TEXT=FIELDS.slice(0,NEED).map(f=>f.def).join(' ');
function parseSortie(out){
  const tok=out.split(/\s+/).filter(Boolean).map(Number);
  if(!tok.length) return {set:{...DEF},note:`출력이 없어 기본값 ${DEF_TEXT}으로 나선다.`};
  if(tok.length<NEED||tok.length>FIELDS.length) return {err:`정수를 ${tok.length}개 출력했다. 내 진영 · 상대 진영 · 시작 자금 · 기술 수준 · 컴퓨터 실력 · 지도 · 시작 유닛 수, 일곱 개를 차례로 출력하자. 치트 설정(무적 · 지도 열기 · 자금 무제한 · 즉시 생산)은 그 뒤에 0이나 1로 넷까지 덧붙인다.`};
  const set={...DEF};
  for(let i=0;i<tok.length;i++){const f=FIELDS[i],v=tok[i];
    if(!Number.isInteger(v)||v<f.min||v>f.max) return {err:f.cheat?`${i+1}번째 값 ${f.name} ${v}은 쓸 수 없다. 0(끔)이나 1(켬)만 된다.`:`${i+1}번째 값 ${f.name} ${v}은 쓸 수 없다. ${f.min}부터 ${f.max}까지만 된다.`};
    set[f.key]=v;}
  return {set};
}
/* 켜 둔 치트의 이름. s는 설정(set)이거나 엔진이 알려 준 비트 묶음(1 무적 · 2 지도 열기 · 4 자금 무제한 · 8 즉시 생산) */
const cheatNames=(s,short)=>CHEATS.filter((f,i)=>typeof s==='number'?(s>>i)&1:s&&s[f.key]===1).map(f=>short?f.short:f.name);
const fac=n=>FACTIONS[n-1], mapName=n=>MAPS[n-1], lvName=n=>LEVELS[n-1];
/* 저장한 전투의 수. 게임 화면이 알려 줄 때마다 적어 두고, 다음에 열 때 이어하기 버튼을 보일지 정한다. */
const SAVE_KEY='donghyunre.saves.v1';
function readSaves(){ try{ const n=parseInt(localStorage.getItem(SAVE_KEY)||'0',10); return n>0?n:0; }catch(e){ return 0; } }
function writeSaves(n){ try{ if(n>0) localStorage.setItem(SAVE_KEY,String(n)); else localStorage.removeItem(SAVE_KEY); }catch(e){} }
function setCard(s){
  const on=cheatNames(s);
  $('#set-card').innerHTML=[['내 진영',fac(s.me)],['상대 진영',fac(s.foe)],['시작 자금',s.cr],['기술 수준',s.tech],['컴퓨터 실력',lvName(s.diff)],['지도',s.map+' · '+mapName(s.map)],['시작 유닛',s.units+'기'],['치트',on.length?on.join(' · '):'모두 끔']]
    .map(([a,b],i)=>`<div${i===7?` class="wide" id="set-cheat" data-on="${on.length}"`:''}><span>${a}</span><strong title="${String(b).replace(/"/g,'&quot;')}">${b}</strong></div>`).join('');
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
/* current = {set, mode, bundle}. mode: '' 코드의 값으로 새 전투 · 'dialog' 게임 안의 불러오기 목록 · 'file' 저장 묶음(bundle)을 바로 불러오기 */
let frame=null, current=null, phase='', statTimer=0;
const screen=$('#screen'), poster=$('#poster'), pill=$('#focus-pill');
function setFocus(on){pill.dataset.on=String(on);pill.textContent=on?'키보드: 게임':'키보드: 페이지';}
const cmd=(name,more)=>{ if(!frame)return; try{frame.contentWindow.postMessage({type:'dh-re-cmd',cmd:name,...more},'*');}catch(e){} };
function launch(s,mode,bundle){
  stop(true);
  current={set:s||null,mode:mode||'',bundle:bundle||null}; phase='loading';
  const hash=mode==='dialog'?'load=1':mode==='file'?'load=file':FIELDS.map(f=>f.key+'='+(s[f.key]??f.def)).join('&');
  frame=document.createElement('iframe');
  frame.className='game-frame'; frame.title='동현레 게임 화면';
  frame.setAttribute('allow','autoplay; fullscreen');
  frame.src='./re/game.html#'+hash;
  frame.addEventListener('load',()=>giveFocus());
  poster.hidden=true; screen.prepend(frame);
  ['#stop','#full','#game-save'].forEach(id=>$(id).disabled=false);
  status('엔진과 원작 자료(약 19MB)를 받는 중');
  /* 출전 버튼이 화면 아래에 있는 좁은 기기에서는 게임 화면을 눈앞으로 가져온다 */
  const r=screen.getBoundingClientRect(); if(r.top<0||r.bottom>innerHeight) screen.scrollIntoView({block:'center',behavior:'auto'});
  clearInterval(statTimer); statTimer=setInterval(statLine,1000);
}
function giveFocus(){ if(!frame||menu)return; try{frame.contentWindow.focus();cmd('focus');}catch(e){frame.focus();} }
function stop(silent){
  if(isFull()) exitFull();
  clearInterval(statTimer); statTimer=0;
  if(snapWait) snapWait(null);
  if(frame){frame.remove();frame=null;}
  phase=''; poster.hidden=false; setFocus(false); contButton();
  ['#stop','#full','#game-save'].forEach(id=>$(id).disabled=true);
  if(!silent) status('끝냈다 · 다시 출전할 수 있다');
}
/* 전투 중에는 1초마다 게임 화면에 물어 자금·전력·건물·유닛 수를 적는다. 같은 출처의 틀이라 바로 읽을 수 있다. */
function statLine(){
  if(!frame||phase!=='play')return;
  try{
    const re=frame.contentWindow.__re; if(!re||!re.started)return;
    const cr=re.peek(1), bl=re.peek(10), un=re.peek(4)+re.peek(16), pw=re.peek(11), dr=re.peek(12);
    if(cr<0)return;
    const ch=cheatNames(Math.max(0,re.peek(18)),true);      // 엔진이 지금 듣고 있는 치트(불러온 전투는 저장할 때의 것)
    status(`자금 ${cr} · 전력 ${pw}/${dr}${dr>pw?' 부족':''} · 건물 ${bl}채 · 유닛 ${un}기`+(ch.length?` · 치트 ${ch.join('·')}`:''));
  }catch(e){}
}
addEventListener('message',e=>{
  if(!frame||e.source!==frame.contentWindow||!e.data||e.data.type!=='dh-re')return;
  const {ev,data}=e.data;
  if(ev==='progress'){ if(phase==='loading') status(`원작 자료를 받는 중 ${Math.floor(data*100)}%`); }
  else if(ev==='ready'){ writeSaves(data&&data.saves||0); status('전장을 여는 중'); }
  else if(ev==='started'){ phase=current.mode?'load':'play'; if(phase==='load') status(current.mode==='file'?'저장한 전투를 여는 중':'저장한 전투를 고르는 중'); }
  else if(ev==='need-load'){ const b=current.bundle&&unpack(current.bundle.data); cmd('load-data',{buf:b?b.buffer:new ArrayBuffer(0)}); }
  else if(ev==='loaded'){ phase='play';
    if(current.mode==='file'){ const u=current.bundle.summary||{}; toast(`저장한 전투를 불러왔다 · ${[u.title,u.date].filter(Boolean).join(' · ')}. 진영·지도·자금·치트 설정은 저장할 때 그대로이고, 편집기의 코드는 그대로다.`,'ok'); }
    else result('저장한 전투를 이어 한다. 진영·지도·자금·치트 설정은 저장할 때 그대로다.'); }
  else if(ev==='loadfail'){ phase='over'; toast('불러오기 실패: 저장한 전투를 엔진이 읽지 못했다. 다른 판에서 만든 것일 수 있다.','error'); }
  else if(ev==='snap'){ if(snapWait) snapWait(data); }
  else if(ev==='focus') setFocus(true);
  else if(ev==='blur') setFocus(false);
  else if(ev==='saved'){ writeSaves(data.saves); result(`전투를 저장했다(저장한 전투 ${data.saves}개).`+(data.kept?' 다음에 이 페이지를 열면 전장 화면에 이어하기 버튼이 나온다.':' 이 브라우저의 보관함을 쓸 수 없어, 페이지를 닫으면 사라진다.')); }
  else if(ev==='win'){ phase='over'; status('이겼다'); result('이겼다. 상대의 건물과 유닛이 하나도 남지 않았다.'); }
  else if(ev==='lose'){ phase='over'; status('졌다'); result('졌다. 내 건물과 유닛이 하나도 남지 않았다. 코드를 고쳐 다시 출전할 수 있다.'); }
  else if(ev==='end'){ if(phase!=='over') status('전투를 마쳤다'); phase='over'; }
  else if(ev==='error'){ phase='over'; status('게임 오류: '+data,'error'); }
});
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
/* 전체 화면의 도구 줄 자리: 원작 화면(16:10)이 가운데에 놓이는 곳을 셈해, 맨 윗줄 Options 탭과 자금 탭 사이의 빈 곳(너비의 25–50%)에 둔다.
   화면 위나 옆에 검은 띠가 넉넉하면 그 띠에 두고, 빈 곳이 좁으면 오른쪽 위에 둔다. */
function placeTools(){
  const t=$('#full-tools'); if(t.hidden)return;
  t.className='full-tools'; t.style.cssText='';
  const W=screen.clientWidth, H=screen.clientHeight, cw=Math.min(W,H*1.6), ch=cw/1.6, cx=(W-cw)/2, cy=(H-ch)/2;
  if(cy>=52){ t.style.top=Math.max(8,cy-44)+'px'; t.style.right=Math.max(8,cx+8)+'px'; return; }
  if(cx>=110){ t.classList.add('column'); return; }
  const row=ch*0.04, tight=row<40; if(tight) t.classList.add('tight');
  if(t.offsetWidth>cw*0.25-8) return;
  t.style.right='auto'; t.style.left=Math.round(cx+cw*0.375-t.offsetWidth/2)+'px'; t.style.top=Math.round(cy+Math.max(1,(row-t.offsetHeight)/2))+'px';
}
addEventListener('resize',()=>placeTools());
function onFull(){ const on=isFull(); $('#full-tools').hidden=!on; if(!on) $('#fs-note').hidden=true; placeTools(); $('#full').textContent=on?'전체 화면 닫기':'전체 화면';
  clearTimeout(hintTimer); $('#full-hint').hidden=!on; if(on) hintTimer=setTimeout(()=>$('#full-hint').hidden=true,5000);
  setTimeout(giveFocus,50); }
document.addEventListener('fullscreenchange',onFull); document.addEventListener('webkitfullscreenchange',onFull);
$('#exit-full').onclick=exitFull;
$('#full').onclick=()=>{ if(!frame)return; if(isFull()) return exitFull();
  if(!canNativeFull) return setPseudo(true);
  try{ const r=screen.requestFullscreen?screen.requestFullscreen():screen.webkitRequestFullscreen();
    if(r&&r.catch) r.catch(()=>setPseudo(true)); }catch(e){ setPseudo(true); } };

/* ---------- 방향키: 키보드가 페이지 쪽에 있어도 전투 중에는 지도를 옮긴다 ----------
   게임 화면이 눈앞에 있고 글자를 적는 칸에 있지 않을 때만 받는다. 받은 키는 게임에 넘기고 키보드도 게임으로 보낸다. */
const ARROW_KEYS=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
function arrowsToGame(e){
  if(!frame||phase!=='play'||menu||e.metaKey||e.ctrlKey||e.altKey) return false;
  const t=e.target; if(t&&(/^(TEXTAREA|INPUT|SELECT)$/.test(t.tagName)||t.isContentEditable)) return false;
  if($('#tab-play').hidden) return false;
  const r=screen.getBoundingClientRect(); return r.bottom>40&&r.top<innerHeight-40;
}
addEventListener('keydown',e=>{ if(!ARROW_KEYS.includes(e.key)||!arrowsToGame(e))return; e.preventDefault(); cmd('arrow',{key:e.key,on:true}); giveFocus(); },true);
addEventListener('keyup',e=>{ if(ARROW_KEYS.includes(e.key)) cmd('arrow',{key:e.key,on:false}); },true);
addEventListener('blur',()=>{ if(document.activeElement!==frame) cmd('arrow',{key:'',on:false}); });

/* ---------- 저장 · 불러오기(동현삼 · 동현전과 같은 규칙): 브라우저 칸 3개 + .dhsave 파일. 저절로 저장하지 않는다 ----------
   메뉴는 화면 가운데 뜨고(전체 화면에서도), 떠 있는 동안 전투는 멎는다. 칸은 이 기기의 이 브라우저에만 남는다.
   저장 묶음에는 엔진이 쓴 저장 파일이 통째로 들어간다. 불러올 때는 게임 틀을 새로 띄우고 그 파일을 바로 읽힌다. */
const SAVE={format:'donghyunre-save-1',slot:'donghyunre.slot.',file:'donghyunre',name:'동현레'};
const SLOTS=3, menuBack=$('#menu-back'), menuEl=$('#menu');
let menu=null, snapWait=null, snap=null, busy=false, noteTimer=0;
const el=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
const clip=(v,n=40)=>String(v??'').slice(0,n);
const eul=n=>(n===2?'를':'을');                // 칸 1을 · 칸 2를 · 칸 3을
const pack=buf=>{const u=new Uint8Array(buf);let t='';for(let i=0;i<u.length;i+=0x8000)t+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(t);};
const unpack=t=>{try{const b=atob(t),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}catch(e){return null;}};
const valid=d=>!!d&&typeof d==='object'&&d.format===SAVE.format&&typeof d.data==='string'&&d.data.length>1000;
/* 결과 알림: 상태 줄과 코드 아래 글에 적고, 전체 화면에서는 화면 아래에 4초 동안 띄운다 */
function toast(text,kind){ status(text,kind==='error'?'error':''); result(text,kind==='error'?'error':''); const n=$('#fs-note'); clearTimeout(noteTimer);
  if(isFull()){ n.textContent=text; n.dataset.kind=kind||''; n.hidden=false; noteTimer=setTimeout(()=>n.hidden=true,4000); } else n.hidden=true; }
const hold=on=>cmd('pause',{on:!!on});
function cannotSave(){ if(!frame) return '아직 전투를 시작하지 않았다. 출전을 누르면 시작한다.'; if(phase==='over') return '전투가 끝났다. 끝난 전투는 저장하지 않는다.'; if(phase!=='play') return '아직 전장이 열리지 않았다. 전장이 열린 뒤에 저장하자.'; return ''; }
/* 게임에 저장 파일을 써 달라고 하고, 받은 것을 묶는다. 게임 안의 메뉴(Options)가 열려 있으면 엔진이 답하지 못한다 */
function snapshot(){ return new Promise((ok,no)=>{
  const t=setTimeout(()=>{ if(snapWait) snapWait(undefined); },6000);
  snapWait=d=>{ clearTimeout(t); snapWait=null;
    if(d===undefined) return no(new Error('게임이 답하지 않는다. 게임 안의 메뉴(Options)가 열려 있으면 닫고 다시 해 보자.'));
    if(!d||!d.ok||!d.buf) return no(new Error('게임이 저장 파일을 쓰지 못했다.'));
    let cr=0,bl=0,un=0,ch=[]; try{ const re=frame.contentWindow.__re; cr=re.peek(1); bl=re.peek(10); un=re.peek(4)+re.peek(16); ch=cheatNames(Math.max(0,re.peek(18)),true); }catch(e){}
    const s=current&&current.set;
    ok({format:SAVE.format,lab:(/v([\d.]+)/.exec($('.edition').textContent)||[])[1]||'',savedAt:new Date().toISOString(),set:s||null,
      summary:{title:s?`${fac(s.me)} 대 ${fac(s.foe)}`:'이어 한 전투',date:s?`지도 ${s.map} ${mapName(s.map)}`:'',line:`자금 ${cr} · 건물 ${bl}채 · 유닛 ${un}기`+(ch.length?` · 치트 ${ch.join('·')}`:'')},data:pack(d.buf)}); };
  cmd('save'); }); }
function readSlot(n){ try{ const t=localStorage.getItem(SAVE.slot+n), d=t?JSON.parse(t):null; return valid(d)?d:null; }catch(e){ return null; } }
function slotNote(d){
  if(!d) return '비어 있음';
  const u=d.summary||{}, t=new Date(d.savedAt), pad=v=>String(v).padStart(2,'0'), when=isNaN(t)?'':` · ${t.getMonth()+1}/${t.getDate()} ${pad(t.getHours())}:${pad(t.getMinutes())} 저장`;
  return [u.title,u.date,u.line].filter(Boolean).map(x=>clip(x)).join(' · ')+when;
}
function saveToSlot(n){
  const d=snap; if(!d)return;
  try{ localStorage.setItem(SAVE.slot+n,JSON.stringify(d)); }catch(e){ return toast('브라우저 칸에 적지 못했다. 파일로 내려받아 저장하자.','error'); }
  toast(`브라우저 칸 ${n}에 저장했다 · ${d.summary.title} · ${d.summary.date}`,'ok'); renderSlotList();
}
function saveToFile(){
  const d=snap; if(!d)return;
  const a=document.createElement('a'), name=`${SAVE.file}-${d.summary.title}-${d.summary.date}`.replace(/[\\/:*?"<>|\s]+/g,'');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'})); a.download=name+'.dhsave'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast(`.dhsave 파일로 내려받았다 · ${d.summary.title} · ${d.summary.date}`,'ok');
}
/* 저장 묶음으로 전투를 연다. 게임 틀을 새로 띄우므로 하던 전투는 사라진다 */
function loadFrom(d){
  if(!valid(d)||!unpack(d.data)) return toast(`불러오기 실패: ${SAVE.name} 저장 파일이 아니다.`,'error');
  if(d.set){ try{ setCard({...DEF,...d.set}); }catch(e){} }
  result('저장한 전투를 여는 중이다.'); launch(d.set||null,'file',d);
}
const playing=()=>!!frame&&(phase==='play'||phase==='load'||phase==='loading');
async function loadFile(input,back){
  const f=input.files[0]; input.value=''; if(!f)return;
  let d=null; try{ if(f.size<=8e6) d=JSON.parse(await f.text()); }catch(e){ d=null; }
  if(!valid(d)) return toast(`불러오기 실패: ${SAVE.name} 저장 파일이 아니다.`+(playing()?' 하던 전투는 그대로 두었다.':''),'error');
  if(!playing()) return loadFrom(d);
  confirmMenu(`${slotNote(d)}\n지금 전투를 두고 이 파일을 불러올까? 저장하지 않은 진행은 사라진다.`,[['불러온다',()=>loadFrom(d)],['그만둔다',back||null]],back||null);
}
/* 메뉴: items = [{label, note, off, fn}] 또는 [label, fn]. 고르면 닫히고 fn을 부른다. Esc와 바깥 누르기는 onCancel(없으면 그냥 닫기) */
function openMenu(title,items,onCancel,text){
  hold(true);
  menu={items:items.map(it=>(Array.isArray(it)?{label:it[0],fn:it[1]}:it)),onCancel};
  const h=el('h4',title); h.id='menu-title'; menuEl.replaceChildren(h);
  if(text){ const q=el('p',text); q.className='menu-text'; menuEl.append(q); }
  menu.items.forEach((it,i)=>{ const b=el('button'); b.type='button'; b.className='mi'; b.dataset.i=i; b.disabled=!!it.off; b.append(el('span',it.label)); if(it.note) b.append(el('small',it.note)); menuEl.append(b); });
  menuBack.hidden=false;
  const first=menuEl.querySelector('.mi:not(:disabled)'); if(first) first.focus({preventScroll:true});
}
/* 닫고 fn을 부른다. fn이 다음 메뉴를 열지 않았을 때만 전투가 이어지고 키보드가 다시 게임에 듣는다(다음 메뉴가 뜨면 계속 멎어 있다) */
function closeMenu(fn){ if(!menu)return; menu=null; menuBack.hidden=true; if(fn) fn(); if(!menu){ hold(false); giveFocus(); } }
function cancelMenu(){ closeMenu(menu&&menu.onCancel); }
function confirmMenu(q,opts,back){ const [title,...rest]=q.split('\n'); openMenu(rest.length?rest.join(' '):title,opts,back,rest.length?title:''); }
menuEl.addEventListener('click',e=>{ const b=e.target.closest('.mi'); if(!b||!menu)return; const it=menu.items[+b.dataset.i]; if(!it||it.off)return; closeMenu(it.fn); });
menuBack.addEventListener('click',e=>{ if(e.target===menuBack) cancelMenu(); });
menuBack.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); return cancelMenu(); }
  const list=[...menuEl.querySelectorAll('.mi:not(:disabled)')], i=list.indexOf(document.activeElement), d=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;
  if(d&&list.length){ e.preventDefault(); list[(i+d+list.length)%list.length].focus(); }
  else if(e.key==='Tab'&&list.length){ e.preventDefault(); list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus(); }      // 메뉴 밖으로 나가지 않는다
});
/* 저장: 먼저 전투를 멈추고 저장 파일을 받아 둔 다음, 어디에 둘지 묻는다 */
async function saveMenu(){
  if(menu||busy)return;
  const why=cannotSave(); if(why) return openMenu('지금은 저장할 수 없다',[['돌아가기',null]],null,why);
  busy=true; hold(true); status('전투를 멈추고 저장할 내용을 받는 중');
  try{ snap=await snapshot(); }catch(e){ busy=false; return openMenu('저장하지 못했다',[['돌아가기',null]],null,e.message); }
  busy=false; saveItems();
}
function saveItems(){
  const d0=snap; if(!d0)return; const items=[];
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),fn:()=>(d?confirmMenu(`칸 ${n}에 덮어쓸까?`,[['덮어쓴다',()=>saveToSlot(n)],['그만둔다',saveItems]],saveItems):saveToSlot(n))}); }
  items.push({label:'파일로 내려받기',note:'.dhsave',fn:saveToFile},{label:'칸 지우기',fn:deleteMenu},['돌아가기',null]);
  openMenu('저장',items,null,`${d0.summary.title} · ${d0.summary.date} · ${d0.summary.line}. 칸은 이 기기의 이 브라우저에만 남는다. 다른 기기로 옮기려면 파일로 내려받는다.`);
}
function deleteMenu(){
  const items=[];
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),off:!d,
    fn:()=>confirmMenu(`칸 ${n}${eul(n)} 지울까? 되돌릴 수 없다.`,[['지운다',()=>{ try{localStorage.removeItem(SAVE.slot+n);}catch(e){} toast(`브라우저 칸 ${n}${eul(n)} 지웠다`); renderSlotList(); deleteMenu(); }],['그만둔다',deleteMenu]],deleteMenu)}); }
  items.push(['돌아가기',saveItems]); openMenu('칸 지우기',items,saveItems);
}
function loadMenu(){
  if(menu||busy)return; const items=[], on=playing();
  for(let n=1;n<=SLOTS;n++){ const d=readSlot(n); items.push({label:`브라우저 칸 ${n}`,note:slotNote(d),off:!d,
    fn:()=>(on?confirmMenu(`지금 전투를 두고 칸 ${n}${eul(n)} 불러올까? 저장하지 않은 진행은 사라진다.`,[['불러온다',()=>loadFrom(readSlot(n))],['그만둔다',loadMenu]],loadMenu):loadFrom(readSlot(n)))}); }
  items.push({label:'파일에서 불러오기',note:'.dhsave',fn:()=>$('#load-file').click()},['돌아가기',null]);
  openMenu('불러오기',items,null,'불러오면 저장할 때의 진영·지도·자금·치트 설정 그대로 이어 한다. 편집기의 코드는 바뀌지 않는다.');
}
for(const id of ['#game-save','#fs-save']) $(id).onclick=saveMenu;
for(const id of ['#game-load','#fs-load']) $(id).onclick=loadMenu;
$('#load-file').onchange=e=>loadFile(e.target,loadMenu);
/* 동현랭 코드 칸 아래의 목록: 브라우저 칸 셋과 파일. 하던 전투가 없으면 누르면 바로 열고, 있으면 한 번 묻는다. 지우기는 두 번 눌러야 지운다 */
$('#load-file-setup').onchange=e=>loadFile(e.target,null);
document.querySelector('.load-head label').addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); $('#load-file-setup').click(); } });
function renderSlotList(){
  const box=$('#slot-list'); if(!box)return; box.replaceChildren();
  for(let n=1;n<=SLOTS;n++){
    const d=readSlot(n), b=el('button'), row=el('div'), u=(d&&d.summary)||{}; b.type='button'; b.className='slot-btn'; b.disabled=!d; row.className='slot-row';
    b.append(el('b',`칸 ${n}`),el('span',d?slotNote({...d,summary:{title:u.title,date:u.date}}):slotNote(null))); if(d&&u.line) b.append(el('small',clip(u.line)));
    b.onclick=()=>{ const s=readSlot(n); if(!s) return renderSlotList(); if(!playing()) loadFrom(s); else confirmMenu(`지금 전투를 두고 칸 ${n}${eul(n)} 불러올까? 저장하지 않은 진행은 사라진다.`,[['불러온다',()=>loadFrom(readSlot(n))],['그만둔다',null]]); };
    row.append(b);
    if(d){ const x=el('button','지우기'); x.type='button'; x.className='slot-del'; x.setAttribute('aria-label',`칸 ${n} 지우기`); let t=0;
      x.onclick=()=>{ if(!x.classList.contains('armed')){ x.classList.add('armed'); x.textContent='정말 지운다'; t=setTimeout(()=>{ x.classList.remove('armed'); x.textContent='지우기'; },4000); return; }
        clearTimeout(t); try{localStorage.removeItem(SAVE.slot+n);}catch(e){} renderSlotList(); status(`브라우저 칸 ${n}${eul(n)} 지웠다.`); };
      row.append(x); }
    box.append(row);
  }
}
addEventListener('storage',e=>{ if(!e.key||e.key.startsWith(SAVE.slot)) renderSlotList(); });      // 다른 창에서 저장하거나 지운 것도 따라 보인다
renderSlotList();

function start(load){
  if(load){
    result('저장한 전투의 목록이 열린다. 하나를 고르고 Load를 누르자. 이어 하는 전투는 저장할 때의 진영·지도·자금·치트 설정 그대로이고, 지금 코드의 값은 쓰지 않는다.');
    launch(null,'dialog'); return;
  }
  let out;
  try{ out=Donghyun.run(code.value,{maxSteps:300000}).output; }
  catch(e){ result(`동현랭 오류${e.line?` (${e.line}줄)`:''}: ${e.message}`,'error'); status('동현랭 오류','error'); return; }
  const p=parseSortie(out);
  if(p.err){ result('동현레 규약 오류: '+p.err,'error'); status('규약 오류','error'); return; }
  const s=p.set; setCard(s);
  result((p.note?p.note+' ':'')+`${fac(s.me)} 대 ${fac(s.foe)} · 자금 ${s.cr} · 기술 수준 ${s.tech} · 컴퓨터 실력 ${lvName(s.diff)} · 지도 ${s.map} ${mapName(s.map)} · 시작 유닛 ${s.units}기${cheatNames(s).length?` · 치트 ${cheatNames(s).join(' · ')}`:''}. 이 설정으로 나선다.`+(TOUCH_ONLY?' 이 기기에는 마우스와 키보드가 없는 것 같다. 손가락으로는 하기 어렵다.':' 게임 화면을 누르면 키보드가 게임으로 간다. 전체 화면으로 하기를 권한다.'));
  launch(s,'');
}
$('#poster-run').onclick=()=>start(false);
$('#poster-cont').onclick=()=>start(true);

/* 첫 화면: 예제 01의 값을 보여 주고, 게임은 출전을 누를 때 불러온다 */
(function preview(){try{const p=parseSortie(Donghyun.run(code.value,{maxSteps:300000}).output);if(p.set)setCard(p.set);}catch(e){setCard(DEF);}contButton();})();
if(typeof window!=='undefined') window.ReLab={parseSortie,FIELDS,CHEATS,cheatNames,SAVE,readSlot};
})();

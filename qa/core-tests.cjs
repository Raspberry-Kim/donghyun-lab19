// 동현레 규약 시험: node qa/core-tests.cjs
// 예제 출력, 출전 규약 판정(개수·범위·기본값·치트 설정 넷), 지도 파일, 페이지의 표와 엔진에서 꺼낸 값(engine/tables/tables.json)이 같은지 확인한다.
// 엔진은 qa/engine-tests.cjs가 브라우저에서 따로 본다.
const assert=require('assert'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const D=require('../src/donghyun.js');const {examples,FACTIONS,MAPS,LEVELS}=require('../src/examples.js');
// app.js는 브라우저용이므로 규약 부분(FIELDS·parseSortie)만 꺼내어 쓴다
const app=read('src/app.js');
const part=app.slice(app.indexOf('const FIELDS=['),app.indexOf('const fac='));
const {FIELDS,CHEATS,parseSortie,DEF,cheatNames}=new Function(part+'\nreturn {FIELDS,CHEATS,parseSortie,DEF,cheatNames};')();
let n=0;const check=(name,f)=>{f();n++;console.log('ok',name);};
const run=c=>D.run(c,{maxSteps:300000}).output;
check('규약 일곱 칸과 치트 네 칸, 기본값 1 2 5000 10 2 1 2 0 0 0 0',()=>{assert.deepEqual(FIELDS.map(f=>f.key),['me','foe','cr','tech','diff','map','units','god','reveal','rich','fast']);assert.deepEqual(CHEATS.map(f=>f.key),['god','reveal','rich','fast']);assert.deepEqual(Object.values(DEF),[1,2,5000,10,2,1,2,0,0,0,0]);});
check('출력이 없으면 기본값으로 나선다',()=>{const p=parseSortie('');assert(!p.err);assert.deepEqual(p.set,DEF);assert(p.note);});
check('일곱 개보다 적거나 열한 개보다 많으면 오류',()=>{assert(parseSortie('1 2 5000 10 2 1').err);assert(parseSortie('1 2 5000 10 2 1 2 0 0 0 0 0').err);assert(parseSortie('3').err);});
check('치트 설정: 일곱 개만 내면 넷 모두 0, 덧붙인 만큼만 읽는다',()=>{
  assert.deepEqual(Object.values(parseSortie('1 2 5000 10 2 1 2').set),[1,2,5000,10,2,1,2,0,0,0,0]);
  assert.deepEqual(Object.values(parseSortie('1 2 5000 10 2 1 2 1').set).slice(7),[1,0,0,0]);
  assert.deepEqual(Object.values(parseSortie('1 2 5000 10 2 1 2 0 1').set).slice(7),[0,1,0,0]);
  assert.deepEqual(Object.values(parseSortie('1 2 5000 10 2 1 2 1 0 1').set).slice(7),[1,0,1,0]);
  assert.deepEqual(Object.values(parseSortie('1 2 5000 10 2 1 2 1 1 1 1').set).slice(7),[1,1,1,1]);});
check('치트 설정: 넷은 0이나 1이고 열여섯 조합이 모두 된다',()=>{
  for(let m=0;m<16;m++){const c=[0,1,2,3].map(i=>(m>>i)&1),p=parseSortie('1 2 5000 10 2 1 2 '+c.join(' '));assert(!p.err,m);assert.deepEqual([p.set.god,p.set.reveal,p.set.rich,p.set.fast],c);assert.equal(cheatNames(p.set).length,c.filter(Boolean).length);assert.deepEqual(cheatNames(m),cheatNames(p.set));}
  for(const bad of ['1 2 5000 10 2 1 2 2','1 2 5000 10 2 1 2 0 -1','1 2 5000 10 2 1 2 0 0 5','1 2 5000 10 2 1 2 0 0 0 2'])assert(/0\(끔\)이나 1\(켬\)/.test(parseSortie(bad).err),bad);
  assert.deepEqual(cheatNames({god:1,rich:1}),['무적','자금 무제한']);assert.deepEqual(cheatNames(15,true),['무적','지도','자금','생산']);assert.deepEqual(cheatNames({}),[]);});
check('범위: 진영 1–5, 자금 500–10000, 기술 1–10, 실력 1–3, 지도 1–6, 유닛 0–12',()=>{
  const ok=s=>!parseSortie(s).err;
  assert(ok('1 1 500 1 1 1 0'));assert(ok('5 5 10000 10 3 6 12'));
  for(const bad of ['0 2 5000 10 2 1 2','6 2 5000 10 2 1 2','1 0 5000 10 2 1 2','1 6 5000 10 2 1 2','1 2 499 10 2 1 2','1 2 10001 10 2 1 2','1 2 5000 0 2 1 2','1 2 5000 11 2 1 2','1 2 5000 10 0 1 2','1 2 5000 10 4 1 2','1 2 5000 10 2 0 2','1 2 5000 10 2 7 2','1 2 5000 10 2 1 -1','1 2 5000 10 2 1 13'])assert(!ok(bad),bad);});
check('정수가 아니면 오류',()=>{assert(parseSortie('1 2 5000.5 10 2 1 2').err);});
check('예제 열하나의 출력(01–06은 치트 넷이 0, 07–11은 치트를 켠 예제)',()=>{const want={basic:[1,2,5000,10,2,1,2,0,0,0,0],fire:[4,5,5000,10,2,2,4,0,0,0,0],easy:[2,3,8000,10,1,3,6,0,0,0,0],early:[5,1,3000,2,2,5,4,0,0,0,0],poor:[3,4,2500,10,3,6,0,0,0,0,0],calc:[3,4,6000,5,2,4,3,0,0,0,0],
    god:[1,2,5000,10,2,1,2,1,0,0,0],reveal:[2,1,5000,10,2,2,2,0,1,0,0],rich:[1,2,5000,10,2,1,2,0,0,1,1],godrich:[3,4,5000,10,3,3,4,1,0,1,0],all:[1,2,5000,10,3,1,2,1,1,1,1]};
  assert.equal(examples.length,11);
  for(const e of examples)assert.equal(run(e.code).split(/\s+/).filter(Boolean).length,11,e.id+': 치트 네 줄까지 열한 개를 출력한다');
  for(const e of examples){const p=parseSortie(run(e.code));assert(!p.err,e.id);assert.deepEqual(Object.values(p.set),want[e.id],e.id);}});
check('어느 예제든 도옹ㅠ(0)를 도옹(1)으로 바꾸면 그 치트가 켜진다',()=>{
  for(const e of examples.slice(0,6)){const L=e.code.split('\n'),at=L.map((l,i)=>l==='뿡뿡 도옹ㅠ~뿡뿡뿡'?i:-1).filter(i=>i>=0).slice(-4);assert.equal(at.length,4,e.id);
    for(let k=0;k<4;k++){const M=L.slice();M[at[k]]='뿡뿡 도옹~뿡뿡뿡';const p=parseSortie(run(M.join('\n')));assert(!p.err,e.id);assert.deepEqual([p.set.god,p.set.reveal,p.set.rich,p.set.fast],[0,1,2,3].map(i=>i===k?1:0),e.id+' '+k);}
    const M=L.slice();for(const i of at)M[i]='뿡뿡 도옹~뿡뿡뿡';assert.deepEqual(Object.values(parseSortie(run(M.join('\n'))).set).slice(7),[1,1,1,1],e.id);}});
check('예제 06: 시작 자금 = 기술 수준 × 800 + 2000',()=>{const p=parseSortie(run(examples.find(e=>e.id==='calc').code));assert.equal(p.set.cr,p.set.tech*800+2000);});
check('이름: 진영 다섯, 지도 여섯, 실력 셋',()=>{assert.equal(FACTIONS.length,5);assert.equal(MAPS.length,6);assert.equal(LEVELS.length,3);});
check('시리즈 띠는 22칸이고 지금 여기는 동현레',()=>{const s=read('src/series.html');assert.equal((s.match(/class="series-item/g)||[]).length,22);assert(/is-current" data-series="re"/.test(s));});
// 지도 파일
const maps=new Function('window',read('re/maps.js')+'\nreturn window.DH_MAPS;')({});
const ini=t=>{const o={};let sec='';for(const l of t.split(/\r?\n/)){const m=/^\[(.+)\]$/.exec(l);if(m){sec=m[1];o[sec]=o[sec]||{};}else if(l.includes('=')){const i=l.indexOf('=');o[sec][l.slice(0,i)]=l.slice(i+1);}}return o;};
check('지도 여섯 장: 크기, 시작 자리 두 곳이 대칭(바닷가는 좌우, 나머지는 반 바퀴), 128×128 판 안',()=>{
  const SIZE=[[64,64],[76,60],[72,72],[84,56],[68,68],[76,76]];assert.deepEqual(Object.keys(maps),[1,2,3,4,5,6].map(i=>'DHRE0'+i+'.MPR'));
  SIZE.forEach(([w,h],i)=>{const m=ini(maps['DHRE0'+(i+1)+'.MPR']);const X=+m.Map.X,Y=+m.Map.Y;assert.equal(+m.Map.Width,w);assert.equal(+m.Map.Height,h);assert(X>=1&&Y>=1&&X+w<=127&&Y+h<=127);
    assert.equal(m.Map.Theater,i<4?'TEMPERATE':'SNOW');
    const wp=[+m.Waypoints[0],+m.Waypoints[1]].map(c=>[c%128-X,Math.floor(c/128)-Y]);assert.equal(Object.keys(m.Waypoints).length,2);
    assert.deepEqual(wp[1],[w-1-wp[0][0],i===3?wp[0][1]:h-1-wp[0][1]],'지도 '+(i+1));
    for(const sec of ['TERRAIN','OVERLAY'])if(m[sec])for(const c of Object.keys(m[sec])){const x=c%128-X,y=Math.floor(c/128)-Y;assert(x>=0&&y>=0&&x<w&&y<h,sec+' '+c);}
    assert.equal(maps['DHRE0'+(i+1)+'.MPR'],read('engine/maps/DHRE0'+(i+1)+'.MPR'),'re/maps.js와 engine/maps가 다르다');});});
// 페이지의 표
const page=read('src/index.html'),T=JSON.parse(read('engine/tables/tables.json'));
const INTERNAL=[2,4,5,7,8,9,10,11,12,13],codeLevel=l=>INTERNAL.findIndex(v=>v>=l)+1;
const rowsOf=(html)=>[...html.matchAll(/<tr><td>[^<]* <code>([A-Za-z0-9]+)<\/code><\/td>(.*?)<\/tr>/g)].map(m=>[m[1],[...m[2].matchAll(/<td[^>]*>(.*?)<\/td>/g)].map(x=>x[1])]);
check('페이지의 건물·유닛 표가 엔진에서 꺼낸 값과 같다',()=>{
  const byIni=Object.fromEntries(T.types.map(r=>[r[1],r])),SIDE={491:'연합',532:'소련',1023:'모두'},ARMOR=['없음','나무','경장갑','중장갑','콘크리트'];
  const rows=rowsOf(page).filter(([k])=>byIni[k]);let b=0,u=0;
  for(const [k,c] of rows){const r=byIni[k],[kind,,own,lvl,cost,hp,spd,arm,atk,rof,rng,,pw,dr]=r;
    assert.equal(c[0],SIDE[own],k);
    if(kind===0){b++;assert.equal(+c[1],codeLevel(lvl),k+' 기술');assert.equal(+c[2],cost,k+' 값');assert.equal(c[3],pw?'+'+pw:dr?'−'+dr:'0',k+' 전력');assert.equal(+c[4],hp,k+' 체력');assert.equal(c[5],ARMOR[arm],k);}
    else{u++;assert.equal(+c[2],codeLevel(lvl),k+' 기술');assert.equal(+c[3],cost,k+' 값');assert.equal(+c[4],hp,k+' 체력');assert.equal(c[5],ARMOR[arm],k);assert.equal(+c[6],spd,k+' 속도');if(atk){assert.equal(+c[7],atk,k+' 화력');assert.equal(+c[8],rof,k);assert.equal(c[9],(rng/256).toFixed(1),k);}}}
  const want=T.types.filter(r=>SIDE[r[2]]).length;assert.equal(b+u,want,'표의 줄 수 '+(b+u)+' / '+want);});
check('페이지의 탄두 표가 엔진에서 꺼낸 값과 같다',()=>{const rows=rowsOf(page).filter(([k])=>T.warheads.some(w=>w[1]===k));assert.equal(rows.length,T.warheads.length);
  for(const [k,c] of rows){const w=T.warheads.find(w=>w[1]===k);assert.deepEqual(c.map(Number),[w[2]/1000,w[3]/1000,w[4]/1000,w[5]/1000,w[6]/1000,w[7]],k);}});
check('페이지 맨 위와 COPYING에 EA 문구가 있다',()=>{const s='EA has not endorsed and does not support this product.';assert(page.indexOf(s)>0&&page.indexOf(s)<page.indexOf('<header'));assert(read('COPYING').includes(s));assert(read('README.md').includes(s));});
check('원작 자료는 저장소에 넣지 않는다',()=>{assert(read('.gitignore').split('\n').includes('data/'));for(const d of ['re','src','engine/maps','engine/tables'])for(const f of fs.readdirSync(path.join(ROOT,d)))assert(!/\.(mix|data)$/i.test(f),d+'/'+f);});
check('묶은 index.html에 채우지 못한 자리가 없다',()=>{const h=read('index.html');assert(!/__(SERIES_NAV|BRAND_ICON|MAP_\d)__/.test(h));assert(h.includes('data-series="re"'));assert.equal((h.match(/src="data:image\/png;base64,[^"]+" alt="지도 \d/g)||[]).length,6);});
console.log(n+' passed');

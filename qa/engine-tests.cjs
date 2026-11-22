// 동현레 엔진 시험: node qa/engine-tests.cjs
// 브라우저(Chromium)에서 re/game.html과 index.html을 실제로 띄워 확인한다. index.html은 먼저 node build.cjs로 만든다. 원작 자료가 data/ 폴더에 있어야 한다(README의 ‘내 컴퓨터에서 돌리기’).
// playwright가 필요하다: npm i playwright && npx playwright install chromium
const assert = require('assert'), fs = require('fs'), path = require('path'), http = require('http');
const pw = require(process.env.PLAYWRIGHT || 'playwright');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split(/[?#]/)[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'content-length': fs.statSync(f).size }); fs.createReadStream(f).pipe(r);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0; const ok = (name, extra) => { n++; console.log('ok', name, extra === undefined ? '' : extra); };

(async () => {
  if (!fs.existsSync(path.join(ROOT, 'data/re.data'))) { console.log('data/re.data가 없어 시험을 건너뛴다.'); return; }
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/re/game.html';
  const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const cx = await browser.newContext({ viewport: { width: 960, height: 600 } }); const errors = [];
  const open = async (hash, load) => {
    const p = await cx.newPage();
    p.on('console', (m) => { if (m.type() === 'error' && !/ReadPixels/.test(m.text())) errors.push(m.text().slice(0, 300)); }); p.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
    await p.goto(base + '#' + hash); await p.waitForFunction(() => window.__re && (window.__re.ready || window.__re.error), null, { timeout: 120000 });
    const box = () => p.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
    const move = async (x, y) => { const [l, t, w, h] = await box(); await p.mouse.move(l + x * w / 640, t + y * h / 400, { steps: 4 }); };
    const click = async (x, y) => { await move(x, y); await sleep(150); await p.mouse.down(); await sleep(120); await p.mouse.up(); await sleep(150); };
    const peek = (k) => p.evaluate((k) => window.__re.peek(k), k);
    const st = () => p.evaluate(() => ({ error: window.__re.error, events: window.__re.events.map((e) => e[0]), result: window.__re.result, saves: window.__re.saves, idb: window.__re.idb }));
    const until = async (f, ms, what) => { const t = Date.now(); for (;;) { if (await f()) return; if (Date.now() - t > ms) throw new Error('기다리다 그만둠: ' + what); await sleep(250); } };
    if (!load) await until(async () => (await peek(0)) > 30 || !!(await st()).error, 60000, '첫 틀');
    assert.equal((await st()).error, null);
    return { p, move, click, peek, st, until };
  };
  const BIAS = (p, h) => p.evaluate((h) => [0, 1, 2, 3, 4, 5, 6].map((k) => Module._dh_house_bias(h, k)), h);

  // 1. 메뉴 없이 바로 전투가 시작되고 코드의 값이 듣는다
  let g = await open('me=1&foe=2&cr=5000&tech=10&diff=2&map=1&units=0'); await g.move(300, 200);
  assert.equal(await g.peek(5), 5); assert.equal(await g.peek(2), 2); assert.equal(await g.peek(100), 3); assert.equal(await g.peek(1), 5000); assert.equal(await g.peek(6), 10); assert.equal(await g.peek(9), 64064);
  ok('메뉴 없이 1:1 전투가 시작된다(러시아 대 영국, 자금 5000, 기술 10, 지도 64×64)');
  const rows = []; for (let h = 1; h <= 5; h++) rows.push(await BIAS(g.p, h));
  assert.deepEqual(rows, [[1000, 1000, 1000, 1000, 1000, 900, 1000], [1000, 1000, 1000, 909, 1000, 1000, 1000], [1000, 1100, 1000, 1000, 1000, 1000, 1000], [1100, 1000, 1000, 1000, 1000, 1000, 1000], [1000, 1000, 1000, 1000, 909, 1000, 1000]]);
  ok('다섯 진영의 배율 표가 원작 규칙 그대로다');
  // 2. 포인터가 화면 밖이면 지도가 밀리지 않는다
  const v0 = await g.peek(14); await g.p.mouse.move(2, 2); await g.p.evaluate(() => Module._dh_mouse(0)); await sleep(1500); assert.equal(await g.peek(14), v0);
  ok('포인터가 게임 화면을 떠나 있으면 지도가 밀리지 않는다');
  // 2-1. 방향키를 누르고 있으면 지도가 60밀리초에 한 칸씩 움직인다(0.6초에 열 칸 안팎, 지도 끝에서는 멈춘다)
  await g.move(300, 200); await g.p.evaluate(() => { Module._dh_mouse(1); document.querySelector('canvas').focus(); });
  const X = async () => Math.floor((await g.peek(14)) / 1000); const x0 = await X();
  await g.p.keyboard.down('ArrowLeft'); await sleep(600); await g.p.keyboard.up('ArrowLeft'); await sleep(300); const x1 = await X();
  assert(x0 - x1 >= 4 && x0 - x1 <= 13, '왼쪽 ' + x0 + '→' + x1); await sleep(600); assert.equal(await X(), x1, '키를 떼면 멈춘다');
  await g.p.keyboard.down('ArrowRight'); await sleep(600); await g.p.keyboard.up('ArrowRight'); await sleep(300); const x2 = await X();
  assert(x2 - x1 >= 4 && x2 - x1 <= 13, '오른쪽 ' + x1 + '→' + x2); ok('방향키로 지도를 옮긴다', `왼쪽 ${x0 - x1}칸, 오른쪽 ${x2 - x1}칸(0.6초씩)`);
  // 2-2. 엔진의 건물·유닛·탄두 값이 engine/tables/tables.json과 같다(이 페이지의 표가 여기서 나왔다)
  const dump = await g.p.evaluate(() => { const H = Module.HEAPU8; const str = (p) => { let t = ''; while (H[p]) t += String.fromCharCode(H[p++]); return t; };
    const types = []; for (let k = 0; k < 5; k++) for (let i = 0; i < 120; i++) { if (Module._dh_type(k, i, 0) === -2) break; if (Module._dh_type(k, i, 1) < 0) continue; types.push([k, str(Module._dh_type_name(k, i, 0)), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].map((f) => Module._dh_type(k, i, f))]); }
    const warheads = []; for (let i = 0; i < 20; i++) { if (Module._dh_warhead(i, 0) === -2) break; warheads.push([i, str(Module._dh_warhead_name(i)), ...[0, 1, 2, 3, 4, 5].map((f) => Module._dh_warhead(i, f))]); }
    return { types, warheads }; });
  const TBL = path.join(ROOT, 'engine/tables/tables.json'); const kept = JSON.parse(fs.readFileSync(TBL, 'utf8'));
  if (process.env.DUMP) { kept.types = dump.types; kept.warheads = dump.warheads; fs.writeFileSync(TBL, JSON.stringify(kept).replace(/\], \[|\],\[/g, '],\n[') + '\n'); }
  assert.deepEqual(dump.types, kept.types); assert.deepEqual(dump.warheads, kept.warheads); ok('엔진의 건물·유닛·탄두 값이 engine/tables/tables.json과 같다', dump.types.length + '종, 탄두 ' + dump.warheads.length + '종');
  assert.deepEqual(await g.p.evaluate(() => [16, 17, 18, 0, 1, 2, 7, 8, 9].map((k) => Module._dh_rule(k))), [800, 1, 1000, 25, 50, 28, 500, 200, 7]); ok('규칙 값: 건설 빠르기 0.8, 피해 1–1000, 광석 25·보석 50·28묶음, 환불 50%, 수리 20%·7');
  // 3. 건설 차량을 펴고, 발전소를 짓고, 놓는다
  await g.move(300, 200); const mx = await g.peek(300), my = await g.peek(301); assert(mx > 0 && my > 0, '건설 차량이 화면에 없다');
  await g.click(mx, my); await sleep(600); await g.click(mx, my); await g.until(async () => (await g.peek(10)) === 1, 15000, '건설소');
  ok('건설 차량을 펴면 건설소가 선다');
  await sleep(1200); await g.click(532, 204); await g.until(async () => (await g.peek(1)) <= 4730, 60000, '발전소 값'); await sleep(1500);
  assert.equal(await g.peek(1), 4730); ok('러시아의 발전소는 270(원래 300의 0.9배)');
  const bx = await g.peek(302), by = await g.peek(303); await g.click(532, 204); await sleep(500);
  for (const [dx, dy] of [[12, 84], [84, 12], [-60, 12], [12, -60], [84, -36], [108, 36]]) { await g.click(bx + dx, by + dy); await sleep(1500); if ((await g.peek(10)) >= 2) break; }
  assert.equal(await g.peek(10), 2); assert.equal(await g.peek(11), 100); ok('지은 발전소를 놓으면 전력이 100이 된다');
  // 4. 컴퓨터가 스스로 기지를 짓는다
  await g.until(async () => (await g.peek(120)) >= 2 && (await g.peek(110)) < 5000, 60000, '상대 건설'); ok('컴퓨터가 건물을 짓고 돈을 쓴다', (await g.peek(120)) + '채, 자금 ' + (await g.peek(110)));
  // 5. 초당 틀 수
  const f0 = await g.peek(0); await sleep(4000); const fps = ((await g.peek(0)) - f0) / 4; assert(fps > 8, 'fps ' + fps); ok('게임이 흐른다', '초당 ' + fps.toFixed(1) + '틀');
  // 5-1. Space로 메뉴를 열면 전투가 멈추고, Resume Mission으로 돌아온다
  await g.move(300, 200); await g.p.evaluate(() => document.querySelector('canvas').focus()); await g.p.keyboard.press('Space'); await sleep(1500);
  const s1 = await g.peek(0); await sleep(1200); assert.equal(await g.peek(0), s1, 'Space로 메뉴가 열리지 않았다'); await g.click(220, 281); await sleep(1500); assert((await g.peek(0)) > s1, 'Resume Mission'); ok('Space로 메뉴를 열고 Resume Mission으로 돌아온다');
  // 6. 저장
  await g.click(80, 7); await sleep(1200); await g.click(320, 159); await sleep(1200); await g.p.keyboard.type('DH', { delay: 120 }); await sleep(400); await g.click(265, 324);
  await g.until(async () => (await g.st()).saves === 1, 15000, '저장'); assert((await g.st()).events.includes('saved')); ok('Options → Save Mission으로 저장한다(브라우저 보관: ' + (await g.st()).idb + ')');
  await g.p.close();
  // 7. 이어하기
  g = await open('load=1', true); await g.move(300, 200); await sleep(2500); assert.equal((await g.st()).saves, 1); await g.click(320, 103); await sleep(500); await g.click(265, 324);
  await g.until(async () => (await g.st()).events.includes('loaded'), 30000, '불러오기'); await sleep(1500);
  assert.equal(await g.peek(10), 2); assert.equal(await g.peek(2), 2); assert.equal(await g.peek(1), 4730); ok('저장한 전투를 이어 한다(건물 2채, 자금 4730 그대로)');
  await g.p.close();
  // 8. 진영이 코드대로 정해진다
  const HOUSE = [2, 3, 4, 5, 6]; // 엔진 안의 번호: 러시아 2, 영국 3, 우크라이나 4, 독일 5, 프랑스 6
  for (const [me, foe] of [[2, 1], [3, 4], [4, 5], [5, 3]]) {
    g = await open(`me=${me}&foe=${foe}&cr=3000&tech=5&diff=3&map=${me + 1}&units=4`);
    assert.equal(await g.peek(2), HOUSE[me - 1]); assert.equal(await g.peek(100), HOUSE[foe - 1]); assert.equal(await g.peek(1), 3000); assert.equal(await g.peek(6), 5); assert((await g.peek(4)) + (await g.peek(16)) >= 5, '시작 유닛');
    if (me === 2) { // 승리
      await g.p.evaluate(() => Module._dh_test(1)); await g.until(async () => (await g.st()).result === 'win', 60000, '승리 알림');
      for (let i = 0; i < 40 && !(await g.st()).events.includes('end'); i++) { await g.click(320, 200); await sleep(1000); }
      assert((await g.st()).events.includes('end')); assert.equal(await g.p.evaluate(() => document.querySelector('#cTitle').textContent), '이겼다'); ok('상대가 무너지면 이겼다고 알린다');
    }
    if (me === 3) { // 패배
      await g.p.evaluate(() => Module._dh_test(2)); await g.until(async () => (await g.st()).result === 'lose', 60000, '패배 알림');
      for (let i = 0; i < 40 && !(await g.st()).events.includes('end'); i++) { await g.click(320, 200); await sleep(1000); }
      assert((await g.st()).events.includes('end')); assert.equal(await g.p.evaluate(() => document.querySelector('#cTitle').textContent), '졌다'); ok('내 기지가 무너지면 졌다고 알린다');
    }
    await g.p.close();
  }
  ok('진영·자금·기술 수준·시작 유닛이 코드대로다(네 조합)');
  // 9. 지도 여섯 장
  const SIZE = [64064, 76060, 72072, 84056, 68068, 76076];
  for (let m = 1; m <= 6; m++) { g = await open(`me=1&foe=2&cr=5000&tech=10&diff=1&map=${m}&units=0`); assert.equal(await g.peek(9), SIZE[m - 1]); assert.equal(await g.peek(300), 240); assert.equal(await g.peek(301), 208); await g.p.close(); }
  ok('지도 여섯 장이 열리고 건설 차량이 화면 가운데에서 시작한다');
  // 10. 바깥 페이지(index.html): 방향키 넘기기, 저장 칸, 불러오기
  {
    const cx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); const p = await cx2.newPage();
    p.on('console', (m) => { if (m.type() === 'error' && !/ReadPixels/.test(m.text())) errors.push(m.text().slice(0, 300)); }); p.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
    await p.goto(base.replace('/re/game.html', '/index.html'));
    assert.equal(await p.textContent('h1'), '실시간 전장 실험실: 동현레TM'); assert.equal(await p.isDisabled('#game-save'), true);
    const frame = () => p.frames().find((f) => /re\/game\.html/.test(f.url()));
    const wait = async (test, what) => { const t = Date.now(); for (;;) { const f = frame(); if (f && await f.evaluate(test).catch(() => false)) return f; if (Date.now() - t > 150000) throw new Error('기다리다 그만둠: ' + what); await sleep(400); } };
    await p.click('#code'); await p.keyboard.press('Control+Enter'); let f = await wait(() => window.__re && window.__re.started && window.__re.peek(0) > 40, '출전');
    const pos = async () => { const v = await f.evaluate(() => window.__re.peek(14)); return [Math.floor(v / 1000), v % 1000]; };
    const keys = async () => { const out = []; for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) { const a = await pos(); await p.keyboard.down(k); await sleep(600); await p.keyboard.up(k); await sleep(300); const b = await pos(); out.push(Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])); } return out; };
    const box = await p.locator('#screen').boundingBox();
    await p.mouse.click(5, 300); await sleep(200); let k = await keys(); assert(k.every((v) => v >= 4 && v <= 13), '페이지 빈 곳을 누른 뒤 ' + k); const k1 = k.join('·');
    await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7, { steps: 6 }); await p.mouse.move(box.x - 40, box.y + box.height * 0.7, { steps: 6 }); await p.mouse.up(); await sleep(300);
    k = await keys(); assert(k.every((v) => v >= 4 && v <= 13), '끌다가 화면 밖에서 놓은 뒤 ' + k);
    ok('키보드가 페이지에 있어도, 끌다가 화면 밖에서 놓은 뒤에도 방향키가 지도를 옮긴다', `네 방향 ${k1}칸 / ${k.join('·')}칸(0.6초씩)`);
    await p.click('#code'); await sleep(200); const c0 = await pos(); await p.keyboard.down('ArrowRight'); await sleep(500); await p.keyboard.up('ArrowRight'); await sleep(200); assert.deepEqual(await pos(), c0); ok('코드 칸에 커서가 있을 때는 방향키를 게임에 넘기지 않는다');
    const st = () => f.evaluate(() => ({ f: __re.peek(0), cr: __re.peek(1), bl: __re.peek(10), un: __re.peek(4) + __re.peek(16), pos: __re.peek(14) }));
    await p.mouse.click(5, 300); await p.keyboard.down('ArrowRight'); await sleep(500); await p.keyboard.up('ArrowRight'); await sleep(300); const kept2 = await st();
    await p.click('#game-save'); await sleep(900); const a = await st(); await sleep(1200); assert.equal((await st()).f, a.f, '저장 메뉴 동안 전투가 멎지 않았다');
    await p.keyboard.press('Enter'); await sleep(700); const size = await p.evaluate(() => (localStorage.getItem('donghyunre.slot.1') || '').length); assert(size > 100000, '저장 크기 ' + size);
    const pack = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('donghyunre.slot.1')); return [d.format, typeof d.data]; }); assert.deepEqual(pack, ['donghyunre-save-1', 'string']);
    await sleep(700); assert((await st()).f > a.f, '메뉴를 닫은 뒤 전투가 이어지지 않았다'); ok('저장을 누르면 전투가 멎고 브라우저 칸에 적힌다', size + '글자');
    await p.keyboard.down('ArrowLeft'); await sleep(900); await p.keyboard.up('ArrowLeft'); await sleep(300); assert.notEqual((await st()).pos, kept2.pos);
    await p.click('#game-load'); await sleep(300); await p.keyboard.press('Enter'); await sleep(300); await p.keyboard.press('Enter');
    f = await wait(() => window.__re && window.__re.events.some((e) => e[0] === 'loaded'), '칸 불러오기'); await sleep(800); const b = await st();
    assert.deepEqual([b.cr, b.bl, b.un, b.pos], [kept2.cr, kept2.bl, kept2.un, kept2.pos]); ok('칸에서 불러오면 자금·건물·유닛·지도 위치가 저장할 때와 같다', `자금 ${b.cr}, 유닛 ${b.un}, 위치 ${b.pos}`);
    fs.writeFileSync(path.join(require('os').tmpdir(), 'dhre-bad.dhsave'), '{"format":"donghyunre-save-1","data":"abc"}'); await p.setInputFiles('#load-file-setup', path.join(require('os').tmpdir(), 'dhre-bad.dhsave')); await sleep(500);
    assert(/저장 파일이 아니다/.test(await p.textContent('#result'))); assert(!!frame()); ok('깨진 저장 파일은 받지 않고 하던 전투를 그대로 둔다');
    await cx2.close();
  }
  assert.deepEqual(errors, []); ok('콘솔 오류 0');
  await browser.close(); server.close(); console.log(n + ' passed');
})().catch((e) => { console.error('FAIL', e.stack || e); process.exit(1); });

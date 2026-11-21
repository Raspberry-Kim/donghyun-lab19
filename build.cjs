// 동현레 묶기: src의 HTML·CSS·JS를 index.html 한 장으로 합친다(글꼴·아이콘·지도 얼개 그림 내장).
// 게임 화면과 엔진(re/game.html·maps.js·re.js·re.wasm)은 re/ 폴더에 따로 둔다.
// 원작 자료(re.data)는 이 저장소에 넣지 않는다. 자료 전용 저장소에서 받는다(README 참고).
const fs=require('fs'),path=require('path');
const {copyIcons}=require('./icon-files.cjs');
const root=__dirname,out=path.join(root,'dist'),src=n=>fs.readFileSync(path.join(root,'src',n),'utf8');
let css=src('style.css');
for(const name of fs.readdirSync(path.join(root,'fonts')))
  css=css.replaceAll('./fonts/'+name,'data:font/woff2;base64,'+fs.readFileSync(path.join(root,'fonts',name)).toString('base64'));
let html=src('index.html')
  .replace('__SERIES_NAV__',()=>src('series.html'))
  .replace('__BRAND_ICON__',()=>src('brand-icon.txt').trim())
  .replace('<link rel="stylesheet" href="./style.css">',()=>`<style>${css}</style>`)
  .replace('<script src="./app.js"></script>',()=>['donghyun.js','examples.js','app.js'].map(n=>'<script>'+src(n).replaceAll('</script','<\\/script')+'</script>').join('\n'));
for(let n=1;n<=6;n++){
  const png=fs.readFileSync(path.join(root,'src','maps','map0'+n+'.png'));
  html=html.replace('__MAP_'+n+'__',()=>'data:image/png;base64,'+png.toString('base64'));
}
if(html.includes('src="./app.js"'))throw new Error('스크립트를 묶지 못했다');
if(/__[A-Z_0-9]+__/.test(html.replace(/<script>[\s\S]*?<\/script>/g,'')))throw new Error('채우지 못한 자리가 남았다');
for(const f of ['game.html','maps.js','re.js','re.wasm'])
  if(!fs.existsSync(path.join(root,'re',f)))throw new Error('re/'+f+'이 없다');
fs.writeFileSync(path.join(root,'index.html'),html);
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
copyIcons(out);
fs.cpSync(path.join(root,'licenses'),path.join(out,'licenses'),{recursive:true});
fs.cpSync(path.join(root,'re'),path.join(out,'re'),{recursive:true});
console.log(JSON.stringify({bytes:Buffer.byteLength(html)}));

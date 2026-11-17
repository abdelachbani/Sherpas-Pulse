/** Browser integration checks for the real application, independent of Taste's landing-page gate.
 * Usage: node scripts/check-ui.mjs http://127.0.0.1:4173 /tmp/sherpas-ui-check
 * Uses a fresh temporary Chrome profile; never touches the user's browser session.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const out = process.argv[3] || '/tmp/sherpas-ui-check';
const profile = await mkdtemp(join(tmpdir(), 'sherpas-ui-chrome-'));
await mkdir(out, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
process.on('SIGINT', async () => { chrome.kill('SIGTERM'); await rm(profile,{recursive:true,force:true}); process.exit(130); });
process.once('SIGINT', () => { chrome.kill('SIGTERM'); ws?.close(); process.exitCode=130; });
const pause = ms => new Promise(r => setTimeout(r, ms));
let ws; let seq = 0; const pending = new Map(); const exceptions = []; const results = [];
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve: v => { clearTimeout(timer); resolve(v); }, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function settle() {
  for (let i = 0; i < 50; i++) { if (await evaluate('Boolean(document.querySelector("h1"))')) break; await pause(100); }
  await evaluate('document.fonts.ready.then(() => true)'); await pause(600);
}
async function navigate(path) { await call('Page.navigate', { url: base + path }); await pause(150); await settle(); }
async function click(label) {
  return evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if(!b) return false; b.click(); return true; })()`);
}
async function inspect(label, width, screenshot = false) {
  const metrics = await evaluate(`(() => {
    const root = document.querySelector('#app-content');
    const bad = [...document.querySelectorAll('button, a, input')].filter(e => {const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0 && r.height>0 && s.visibility!=='hidden' && !e.closest('.skip-link') && (r.left < -1 || r.right > innerWidth+1);}).map(e=>e.textContent.trim().slice(0,60));
    const heading = document.querySelector('h1')?.textContent;
    const story = document.querySelector('.story-shell');
    const footer = story?.querySelector('footer')?.getBoundingClientRect();
    const pixel = document.createElement('canvas');pixel.width=1;pixel.height=1;
    const ctx=pixel.getContext('2d',{willReadFrequently:true}), colors=new Map();
    const rgb = value => { if(colors.has(value))return colors.get(value);ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);const p=ctx.getImageData(0,0,1,1).data;const result=[p[0],p[1],p[2],p[3]/255];colors.set(value,result);return result; };
    const lum = c => c.slice(0,3).map(n=>n/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4).reduce((a,n,i)=>a+n*[0.2126,0.7152,0.0722][i],0);
    const bg = element => { const chain=[]; for(let e=element;e;e=e.parentElement){ const st=getComputedStyle(e);if(st.backgroundImage!=='none')return null;chain.unshift(rgb(st.backgroundColor)); }let color=[255,255,255];for(const c of chain)color=color.map((v,i)=>c[i]*c[3]+v*(1-c[3]));return color; };
    const contrastFailures=[];
    for(const e of document.querySelectorAll('p, span, h1, h2, h3, label, button, summary, a, legend')) {
      if(![...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim()) || e.closest('[disabled]') || !e.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
      const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;
      const b=bg(e);if(!b)continue; const st=getComputedStyle(e), c=rgb(st.color);if(c[3]<1)continue;
      const l1=lum(c),l2=lum(b),ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
      const large=parseFloat(st.fontSize)>=24 || (parseFloat(st.fontSize)>=18.66 && Number(st.fontWeight)>=700);
      if(ratio<(large?3:4.5)-0.05)contrastFailures.push({text:e.textContent.trim().slice(0,55),ratio:Math.round(ratio*100)/100});
    }
    const smallTargets=[...document.querySelectorAll('button, a[href], summary')].filter(e=>{const r=e.getBoundingClientRect();return !e.closest('[disabled],.skip-link') && e.checkVisibility({opacityProperty:true,visibilityProperty:true}) && r.top>=0 && r.bottom<=innerHeight && (r.width<43.5 || r.height<43.5);}).map(e=>(e.getAttribute('aria-label')||e.textContent).trim().slice(0,50));
    const unlabelledInputs=[...document.querySelectorAll('input:not([type=hidden])')].filter(e=>e.checkVisibility() && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.labels?.length).map(e=>e.type);
    return { heading, width:innerWidth, contrastFailures, smallTargets, unlabelledInputs, overflow:document.documentElement.scrollWidth>innerWidth+1 || (root && root.scrollWidth>root.clientWidth+1), offscreenControls:bad, storyFooterVisible: !footer || (footer.bottom<=innerHeight+1 && footer.top>=0), brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.src), text:document.body.innerText };
  })()`);
  const errors = exceptions.splice(0);
  const pass = Boolean(metrics.heading) && !metrics.overflow && !metrics.offscreenControls.length && metrics.storyFooterVisible && !metrics.brokenImages.length && !metrics.contrastFailures.length && !metrics.smallTargets.length && !metrics.unlabelledInputs.length && !errors.length;
  const { text, ...small } = metrics;
  results.push({ label, width, pass, ...small, errors });
  if (screenshot) { const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(join(out, label.replace(/[^a-z0-9-]/gi,'-') + '-' + width + '.png'), Buffer.from(shot.data,'base64')); }
  if (!pass || process.env.UI_CHECK_VERBOSE) console.log(`${pass ? 'PASS' : 'FAIL'} ${width} ${label}${pass ? '' : ' '+JSON.stringify(small)}`);
  return metrics;
}
try {
  let port;
  for (let i=0;i<100;i++) { try {port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await pause(100);} }
  if (!port) throw new Error('Chrome did not start');
  const tab=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  ws.addEventListener('message', e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);});
  await call('Page.enable');await call('Runtime.enable');
  const cases=['timothy-melanie-weah','daniel-emily-johnson','michael-carter','samantha-lewis'];
  for (const width of (process.env.UI_CHECK_INTERACTIONS_ONLY ? [] : (process.env.UI_CHECK_WIDTHS ? process.env.UI_CHECK_WIDTHS.split(',').map(Number) : [1440,1024,768,390,320]))) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:width>=1024?900:844,deviceScaleFactor:1,mobile:false});
    await navigate('/');await inspect('home',width,true);
    for(const id of cases){
      await navigate('/case/'+id);await inspect(id+'-entry',width,width===390);
      await navigate('/case/'+id+'/stories');
      for(let chapter=0;chapter<6;chapter++){
        const before=await inspect(id+'-chapter-'+(chapter+1),width,width===390 || (width===1440 && id===cases[0]));
        if(chapter===0){
          await evaluate('document.querySelector(".story-card")?.scrollTo(0, 200)');await pause(150);
          const after=await evaluate('document.querySelector("h1")?.textContent');
          results.push({label:id+'-scroll-does-not-navigate',width,pass:after===before.heading});
        }
        if(chapter<5){if(!await click('Next'))throw new Error('Missing Next');await pause(600);}
      }
      for(const route of (id===cases[0]||id===cases[1]?['allocate','sync','action']:['tradeoff','action'])){
        await navigate('/case/'+id+'/'+route);await inspect(id+'-'+route,width,width===390);
      }
    }
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await navigate('/case/timothy-melanie-weah/stories');
  await click('Next'); await pause(600);
  await click('View source'); await pause(400);
  results.push({ label: 'source-dialog-opens-and-focuses', pass: await evaluate(`Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement))`) });
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }); await pause(300);
  results.push({ label: 'source-dialog-escape-and-restore', pass: await evaluate(`!document.querySelector('[role="dialog"]') && document.activeElement?.textContent.includes('View source')`) });
  await click('Terms'); await pause(400);
  results.push({ label: 'terms-dialog-opens-and-focuses', pass: await evaluate(`Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement))`) });
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' }); await evaluate(`new Promise(resolve => { const start = Date.now(); const check = () => !document.querySelector('[role="dialog"]') || Date.now()-start > 2000 ? resolve(true) : setTimeout(check, 50); check(); })`);
  results.push({ label: 'terms-dialog-escape', pass: await evaluate(`!document.querySelector('[role="dialog"]')`) });
  await click('Play');
  results.push({ label: 'autoplay-is-opt-in', pass: await evaluate('[...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Pause" && b.getAttribute("aria-pressed") === "true")') });
  await click('Pause'); await pause(200);
  await call('Page.bringToFront');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' }); await pause(600);
  results.push({ label: 'keyboard-next', pass: await evaluate(`document.querySelector('h1')?.textContent === 'What matters to you'`) });
  await navigate('/case/not-a-case/stories');
  results.push({label:'unknown-case',pass:await evaluate('document.body.innerText.includes("not found") || document.body.innerText.includes("not available")')});
  await writeFile(join(out,'report.json'),JSON.stringify(results,null,2));
  const failed=results.filter(r=>!r.pass);console.log(`APPLICATION QUALITY: ${results.length-failed.length}/${results.length} passed`);
  process.exitCode=failed.length?1:0;
} finally { ws?.close();chrome.kill('SIGTERM');await new Promise(r=>{if(chrome.exitCode!==null)return r();chrome.once('exit',r);setTimeout(r,3000);});await rm(profile,{recursive:true,force:true}); }

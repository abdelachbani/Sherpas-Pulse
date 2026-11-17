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
    const heading = document.querySelector('h1')?.textContent || document.querySelector('[aria-label="Chapter checkpoint"] h2')?.textContent;
    const story = document.querySelector('.story-shell');
    const footer = story?.querySelector('footer')?.getBoundingClientRect();
    const pixel = document.createElement('canvas');pixel.width=1;pixel.height=1;
    const ctx=pixel.getContext('2d',{willReadFrequently:true}), colors=new Map();
    const rgb = value => { if(colors.has(value))return colors.get(value);ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);const p=ctx.getImageData(0,0,1,1).data;const result=[p[0],p[1],p[2],p[3]/255];colors.set(value,result);return result; };
    const lum = c => c.slice(0,3).map(n=>n/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4).reduce((a,n,i)=>a+n*[0.2126,0.7152,0.0722][i],0);
    const bg = element => { const chain=[]; for(let e=element;e;e=e.parentElement){ const st=getComputedStyle(e);if(st.backgroundImage!=='none')return null;chain.unshift(rgb(st.backgroundColor)); }let color=[255,255,255];for(const c of chain)color=color.map((v,i)=>c[i]*c[3]+v*(1-c[3]));return color; };
    const contrastFailures=[];
    for(const e of document.querySelectorAll('p, span, h1, h2, h3, label, button, summary, a, legend')) {
      if(e.closest('.sr-only'))continue;
      if(![...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim()) || e.closest('[disabled]') || !e.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
      const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;
      const b=bg(e);if(!b)continue; const st=getComputedStyle(e), c=rgb(st.color);if(c[3]<1)continue;
      const l1=lum(c),l2=lum(b),ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
      const large=parseFloat(st.fontSize)>=24 || (parseFloat(st.fontSize)>=18.66 && Number(st.fontWeight)>=700);
      if(ratio<(large?3:4.5)-0.05)contrastFailures.push({text:e.textContent.trim().slice(0,55),ratio:Math.round(ratio*100)/100});
    }
    const smallTargets=[...document.querySelectorAll('button, a[href], summary')].filter(e=>{const r=e.getBoundingClientRect();return !e.closest('[disabled],.skip-link,[data-inline-term],.sr-only') && e.checkVisibility({opacityProperty:true,visibilityProperty:true}) && r.top>=0 && r.bottom<=innerHeight && (r.width<43.5 || r.height<43.5);}).map(e=>(e.getAttribute('aria-label')||e.textContent).trim().slice(0,50));
    const unlabelledInputs=[...document.querySelectorAll('input:not([type=hidden])')].filter(e=>e.checkVisibility() && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.labels?.length).map(e=>e.type);
    const card=document.querySelector('.story-card');
    const cardFits=!card || (card.scrollHeight<=card.clientHeight+1 && card.firstElementChild.getBoundingClientRect().bottom<=card.getBoundingClientRect().bottom+1);
    const stageNoScroll=!story || root.scrollHeight<=root.clientHeight+1;
    return { heading, width:innerWidth, cardFits, stageNoScroll, contrastFailures, smallTargets, unlabelledInputs, overflow:document.documentElement.scrollWidth>innerWidth+1 || (root && root.scrollWidth>root.clientWidth+1), offscreenControls:bad, storyFooterVisible: !footer || (footer.bottom<=innerHeight+1 && footer.top>=0), brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.src), text:document.body.innerText };
  })()`);
  const errors = exceptions.splice(0);
  const pass = Boolean(metrics.heading) && metrics.cardFits && metrics.stageNoScroll && !metrics.overflow && !metrics.offscreenControls.length && metrics.storyFooterVisible && !metrics.brokenImages.length && !metrics.contrastFailures.length && !metrics.smallTargets.length && !metrics.unlabelledInputs.length && !errors.length;
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
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__speechCalls=[];window.__questions=[];
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){window.__speechCalls.push(u.text)},cancel(){},get speaking(){return false}}});
    class TestSocket extends EventTarget {
      static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
      constructor(){super();this.readyState=0;this.serial=0;this.reply=null;setTimeout(()=>{if(this.readyState===3)return;this.readyState=1;this.onopen?.({});},10)}
      send(raw){const e=JSON.parse(raw);if(e.type==='conversation.item.create')window.__questions.push(e.item?.content?.[0]?.text);if(e.type==='response.cancel'){const id=this.reply;setTimeout(()=>this.onmessage?.({data:JSON.stringify({type:'response.done',response:{id,status:'cancelled'}})}),5);}if(e.type==='response.create'){const id='ui-response-'+(++this.serial);this.reply=id;this.onmessage?.({data:JSON.stringify({type:'response.created',response:{id}})});setTimeout(()=>{if(this.readyState!==1)return;this.onmessage?.({data:JSON.stringify({type:'response.output_audio_transcript.delta',response_id:id,delta:'Your question has reached the assistant.'})});this.onmessage?.({data:JSON.stringify({type:'response.done',response:{id,status:'completed'}})});},700)}}
      close(){this.readyState=3;this.onclose?.({code:1000,reason:'Test closed'})}
    } window.WebSocket=TestSocket;
  `});
  await call('Page.bringToFront');
  const state=()=>evaluate(`(() => {const s=document.querySelector('.story-shell');return s?{phase:s.dataset.phase,chapter:Number(s.dataset.chapterIndex),index:Number(s.dataset.frameIndex),count:Number(s.dataset.frameCount),progress:Number(document.querySelector('nav [aria-current="step"] [role="progressbar"]')?.getAttribute('aria-valuenow'))}:null})()`);
  const key=async name=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name});await call('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name});await pause(160);};
  const clickAria=async label=>evaluate(`(() => {const b=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)});if(!b)return false;b.click();return true})()`);
  const edge=async right=>{const r=await evaluate(`(()=>{const r=document.querySelector('.story-shell > main').getBoundingClientRect();return {x:${right?'true':'false'}?r.right-4:r.left+4,y:r.top+r.height*.7}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});await pause(170);};
  const cases=['timothy-melanie-weah','daniel-emily-johnson','michael-carter','samantha-lewis'];
  const widths=process.env.UI_CHECK_INTERACTIONS_ONLY?[]:(process.env.UI_CHECK_WIDTHS?process.env.UI_CHECK_WIDTHS.split(',').map(Number):[320,390,430,768,844,1440]);
  for(const width of widths){
    await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?568:width===430?932:width===768?1024:width===844?390:width>=1024?900:844,deviceScaleFactor:1,mobile:false});
    await navigate('/');await inspect('home',width,true);
    results.push({label:'desktop-only-split',width,pass:await evaluate(`Boolean(document.querySelector('button[aria-label="Split Screen"]'))===${width>=1024}`)});
    for(const id of cases){
      await navigate('/case/'+id);await inspect(id+'-entry',width,width===390);
      await navigate('/case/'+id+'/stories');
      let steps=0;
      while(await state()){
        const current=await state();if(++steps>120)throw new Error('Story navigation did not finish');
        if(current.phase==='checkpoint'){
          await pause(160);await inspect(id+'-summary-'+current.chapter,width,width===390);
          const referenceCount=await evaluate(`document.querySelector('[aria-label="Chapter summary"]')?.children.length ?? 0`);
          const p1=(await state()).progress;await pause(120);const after=await state();
          results.push({label:id+'-checkpoint-waits-'+current.chapter,width,pass:after.phase==='checkpoint' && after.chapter===current.chapter && p1===100 && after.progress===100 && referenceCount>0});
          if(!await click('Continue'))throw new Error('Checkpoint needs Continue');await pause(200);
        }else{
          await inspect(id+'-frame-'+current.index,width,width===390 && current.index<2);
          results.push({label:id+'-no-debug-source',width,pass:await evaluate(`!document.body.innerText.includes('View source') && !document.body.innerText.includes('View plan source') && !document.querySelector('.story-shell > footer')`)});
          await edge(true);
        }
      }
      for(const route of (id===cases[0]||id===cases[1]?['allocate','sync','action']:['tradeoff','action'])){await navigate('/case/'+id+'/'+route);await inspect(id+'-'+route,width,width===390);}
    }
  }
  // Actual timing, narration and input behavior at one viewport, using a local test relay.
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await navigate('/case/timothy-melanie-weah/stories');
  const initial=await state();await pause(650);const progressed=await state();
  results.push({label:'continuous-progress',pass:initial.phase==='playing' && progressed.index===initial.index && progressed.progress>initial.progress && progressed.progress<100});
  await clickAria('Pause story');await pause(100);const paused=await state();await pause(400);const still=await state();
  results.push({label:'pause-freezes-progress',pass:paused.progress===still.progress});
  await clickAria('Turn narration on');await pause(100);
  const heard=await evaluate('window.__speechCalls.length');
  await click('Terms');await pause(100);await key('Escape');await pause(100);
  results.push({label:'terms-do-not-repeat-narration',pass:await evaluate(`window.__speechCalls.length===${heard} && ${heard}>0`)});
  await edge(true);const moved=await state();await edge(false);const returned=await state();
  results.push({label:'tap-right-left',pass:moved.index===initial.index+1 && returned.index===initial.index});
  results.push({label:'quick-return-does-not-repeat-narration',pass:await evaluate(`window.__speechCalls.length===${heard}`)});
  await clickAria('Resume story');
  // Let the final scene run on its clock: timers must stop at the checkpoint.
  while((await state()).phase!=='checkpoint'){await key('ArrowRight');}
  await pause(250);const checked=await state();await pause(450);
  results.push({label:'checkpoint-progress-complete-stable',pass:checked.progress===100 && (await state()).phase==='checkpoint'});
  await click('I have a question');
  await evaluate(`(()=>{const input=document.querySelector('input[placeholder="Ask about this chapter"]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'Can you explain this section?');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);await pause(120);
  await click('Ask');await pause(150);
  results.push({label:'question-reaches-existing-assistant-path',pass:await evaluate(`window.__questions.includes('Can you explain this section?')`)});
  await click('Continue');await pause(250);
  const nextStarted=await state();await pause(900);const nextAfterReply=await state();
  results.push({label:'late-reply-does-not-block-next-chapter',pass:nextAfterReply.chapter===nextStarted.chapter && nextAfterReply.progress>nextStarted.progress});
  results.push({label:'continue-starts-next-chapter',pass:(await state()).chapter===1 && (await state()).phase==='playing'});
  await navigate('/case/timothy-melanie-weah');
  await evaluate(`([...document.querySelectorAll('button')].find(b=>b.textContent.includes('Express'))).click()`);await pause(100);await click('Explore your plan');await pause(300);
  const summaryMode=await state();
  const waitStart=Date.now();while((await state())?.phase!=='checkpoint' && Date.now()-waitStart<10000)await pause(100);
  const automaticCheckpoint=await state();
  results.push({label:'express-rhythm-and-automatic-checkpoint',pass:summaryMode.count===6 && automaticCheckpoint?.phase==='checkpoint'});
  const completeSummary=await evaluate(`document.querySelector('[aria-label="Chapter summary"]')?.children.length ?? 0`);
  results.push({label:'express-checkpoint-keeps-full-section-data',pass:completeSummary>=6});
  await pause(8500);const waiting=await state();
  results.push({label:'checkpoint-does-not-advance-with-time',pass:waiting.phase==='checkpoint' && waiting.chapter===automaticCheckpoint.chapter && waiting.progress===100});
  await navigate('/case/not-a-case/stories');
  results.push({label:'unknown-case',pass:await evaluate(`document.body.innerText.includes('not found')`)});
  await writeFile(join(out,'report.json'),JSON.stringify(results,null,2));
  const failed=results.filter(r=>!r.pass);console.log(`APPLICATION QUALITY: ${results.length-failed.length}/${results.length} passed`);
  process.exitCode=failed.length?1:0;
} finally { ws?.close();chrome.kill('SIGTERM');await new Promise(r=>{if(chrome.exitCode!==null)return r();chrome.once('exit',r);setTimeout(r,3000);});await rm(profile,{recursive:true,force:true}); }

/** Browser integration checks for the real application, independent of Taste's landing-page gate.
 * Usage: node scripts/check-ui.mjs http://127.0.0.1:4173 /tmp/sherpas-ui-check
 * Uses a fresh temporary Chrome profile; never touches the user's browser session.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const out = process.argv[3] || join(tmpdir(), 'sherpas-ui-check');
const profile = await mkdtemp(join(tmpdir(), 'sherpas-ui-chrome-'));
await mkdir(out, { recursive: true });
const defaultChrome = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'google-chrome'));
const chrome = spawn(defaultChrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
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
    const clippedBy=cardFits ? undefined : Math.max(card.scrollHeight-card.clientHeight, Math.ceil(card.firstElementChild.getBoundingClientRect().bottom-card.getBoundingClientRect().bottom));
    return { heading, width:innerWidth, cardFits, clippedBy, stageNoScroll, contrastFailures, smallTargets, unlabelledInputs, overflow:document.documentElement.scrollWidth>innerWidth+1 || (root && root.scrollWidth>root.clientWidth+1), offscreenControls:bad, storyFooterVisible: !footer || (footer.bottom<=innerHeight+1 && footer.top>=0), brokenImages:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.src), text:document.body.innerText };
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
    window.__speechCalls=[];window.__questions=[];window.__micRequests=0;
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{window.__micRequests++;throw new DOMException('Denied for UI test','NotAllowedError')}});
    window.__speechOverlap=0;
    const speech = {
      current: null, canceledUtterance: null, timer: 0, paused: false,
      speak(u) {
        if(this.current) window.__speechOverlap++;
        this.current=u; this.canceledUtterance=u.onerror; window.__speechCalls.push(u.text);
        if(!location.search.includes('ui-speech=long')) {
          u.onstart?.(new Event('start'));
          this.timer=setTimeout(()=>{if(!this.paused) this.finish()},2400);
        }
      },
      finish() { const u=this.current; this.current=null; clearTimeout(this.timer); u?.onend?.(new Event('end')); },
      cancel() {
        const onerror=this.current && this.canceledUtterance;
        this.current=null; clearTimeout(this.timer);
        setTimeout(()=>onerror?.({error:'canceled'}),15);
      },
      pause(){this.paused=true}, resume(){this.paused=false}, get speaking(){return Boolean(this.current)},
    };
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:speech});
    class TestSocket extends EventTarget {
      static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
      constructor(){super();this.readyState=0;this.serial=0;this.reply=null;setTimeout(()=>{if(this.readyState===3)return;this.readyState=1;this.onopen?.({});if(location.search.includes('ui-relay=offline'))this.onmessage?.({data:JSON.stringify({type:'error',error:{message:'Simulated relay unavailable'}})});},10)}
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
  const skipIntro=async()=>{if(!await click('Skip introduction'))throw new Error('Wrapped needs Skip introduction');await pause(160);};
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await navigate('/case/timothy-melanie-weah/stories');
  const introAtEntry=await evaluate(`document.querySelector('.story-shell')?.dataset.phase==='intro' && document.querySelector('button[aria-label="Turn narration off"]')?.getAttribute('aria-pressed')==='true' && document.body.innerText.includes('I’m Sherpi')`);
  results.push({label:'sherpi-intro-opens-with-voice-on',pass:introAtEntry});
  await evaluate(`speechSynthesis.finish()`);await pause(1750);
  const automaticStep=await evaluate(`document.querySelector('[data-intro-current="true"]')?.dataset.introControl`);
  results.push({label:'sherpi-moves-to-the-first-control-after-speaking',pass:automaticStep==='playback'});
  const guideOrder=[];
  for(let step=0;step<4;step++){
    if(!await click('Next')) break;
    await pause(170);
    guideOrder.push(await evaluate(`document.querySelector('[data-intro-current="true"]')?.dataset.introControl ?? (document.body.innerText.includes('Start my plan') ? 'start' : null)`));
  }
  results.push({label:'sherpi-intro-points-to-controls-in-order',pass:guideOrder.join(',')==='terms,voice,sherpi,start'});
  const narrationStarted=await evaluate(`window.__speechCalls[0]?.includes('I’m Sherpi') && window.__speechCalls.some(line=>line.includes('Pause anytime')) && window.__speechCalls.at(-1).includes('We’ll start with your financial health')`);
  results.push({label:'sherpi-reads-the-greeting-and-control-explanation',pass:narrationStarted});
  await click('Start my plan');await pause(150);
  results.push({label:'sherpi-intro-start-opens-financial-health',pass:await evaluate(`document.querySelector('.story-shell')?.dataset.phase==='playing' && document.querySelector('h1')?.textContent.includes('Your financial health')`)});
  await navigate('/case/timothy-melanie-weah/stories?ui-speech=long');
  await pause(8000);
  results.push({label:'guide-waits-for-slow-speech-even-without-start-event',pass:await evaluate(`speechSynthesis.speaking && document.querySelector('.sherpi-intro h1')?.textContent.includes('I’m Sherpi')`)});
  await evaluate(`speechSynthesis.finish()`);await pause(850);
  results.push({label:'guide-advances-when-slow-speech-finishes',pass:await evaluate(`document.querySelector('[data-intro-current="true"]')?.dataset.introControl==='playback'`)});
  await skipIntro();await pause(8300);
  results.push({label:'first-financial-scene-waits-for-speech',pass:(await state())?.index===0 && await evaluate(`speechSynthesis.speaking`)});
  await evaluate(`speechSynthesis.finish()`);await pause(900);
  results.push({label:'financial-scenes-resume-when-speech-finishes',pass:(await state())?.index===1});
  const selectChapter=async index=>{await evaluate(`document.querySelectorAll('nav[aria-label="Story steps"] button')[${index}]?.click()`);};
  await selectChapter(1);await pause(180);
  await selectChapter(2);await pause(30);
  await selectChapter(3);await pause(30);
  await selectChapter(0);await pause(230);
  results.push({label:'rapid-chapter-jumps-cancel-previous-speech-and-replay-on-return',pass:await evaluate(`window.__speechOverlap===0 && window.__speechCalls.filter(line=>line.startsWith('Let’s start with your financial health')).length===2 && speechSynthesis.current?.text.startsWith('Let’s start with your financial health')`)});
  await edge(true);await edge(false);
  results.push({label:'moving-between-scenes-stops-speech-without-replaying',pass:(await state())?.index===0 && await evaluate(`!speechSynthesis.speaking && window.__speechCalls.filter(line=>line.startsWith('Let’s start with your financial health')).length===2`)});
  await selectChapter(1);await pause(180);await edge(false);
  results.push({label:'left-at-the-start-of-a-chapter-replays-the-previous-chapter',pass:(await state())?.index===0 && await evaluate(`speechSynthesis.current?.text.startsWith('Let’s start with your financial health')`)});
  await navigate('/');await clickAria('Open demo navigator');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:4,y:110});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:4,y:110});await pause(150);
  results.push({label:'demo-navigator-closes-on-outside-click',pass:await evaluate(`!document.querySelector('[aria-label="Demo Pitch HUD"]')`)});
  await navigate('/case/michael-carter/tradeoff');
  await clickAria('Rate option B 5 out of 5');await pause(150);
  results.push({ label:'tradeoff-rating-reorders-priorities', pass:await evaluate(`document.querySelector('[data-priority-order] > li')?.dataset.option==='B'`) });
  const beforeRouteChange=await evaluate(`(() => { const root=document.querySelector('#app-content'); root.scrollTop=root.scrollHeight; return root.scrollTop })()`);
  await click('Continue to Your Action Plan');await pause(250);
  results.push({ label:'route-transition-starts-at-top', pass:beforeRouteChange>100 && await evaluate(`location.pathname.endsWith('/action') && document.querySelector('#app-content').scrollTop===0`) });
  results.push({label:'action-controls-use-the-pointer-cursor',pass:await evaluate(`getComputedStyle(document.querySelector('main button[aria-pressed]')).cursor==='pointer' && getComputedStyle(document.querySelector('main input[type="checkbox"]')).cursor==='pointer'`)});
  await evaluate(`document.querySelector('main a[href$="/advisor"]')?.click()`);await pause(380);
  results.push({label:'advisor-receives-the-priority-order',pass:await evaluate(`(() => { const text=document.querySelector('[aria-label="Saved priority order"]')?.textContent ?? ''; return text.includes('5/5 (56%)') && text.indexOf('5/5 (56%)') < text.indexOf('4/5 (44%)') })()`)});
  if(!process.env.UI_CHECK_NAVIGATION_ONLY){
  const widths=process.env.UI_CHECK_INTERACTIONS_ONLY?[]:(process.env.UI_CHECK_WIDTHS?process.env.UI_CHECK_WIDTHS.split(',').map(Number):[320,390,430,768,844,1440]);
  for(const width of widths){
    await call('Emulation.setDeviceMetricsOverride',{width,height:width===320?568:width===430?932:width===768?1024:width===844?390:width>=1024?900:844,deviceScaleFactor:1,mobile:false});
    await navigate('/');await inspect('home',width,true);
    for (const [trigger, name] of [['Open demo navigator', 'Demo Pitch HUD'], ['Why Sherpas Pulse?', 'The Friday Decision Matrix']]) {
      await clickAria(trigger);await pause(200);
      const bounds=await evaluate(`(() => { const d=document.querySelector('[aria-label="'+${JSON.stringify(name)}+'"][role="dialog"]'); if(!d)return false; const r=d.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1 && d.contains(document.activeElement) })()`);
      await key('Escape');
      const dismissed=await evaluate(`!document.querySelector('[aria-label="'+${JSON.stringify(name)}+'"][role="dialog"]') || !document.querySelector('[aria-label="'+${JSON.stringify(name)}+'"][role="dialog"]').checkVisibility()`);
      results.push({label:name+'-fits-and-dismisses',width,pass:bounds && dismissed});
    }
    await navigate('/case/'+cases[0]);await click('Scan QR');await pause(230);
    const qrFits=await evaluate(`(() => { const qr=document.querySelector('[aria-label="Scan to open on partner phone"]'); const r=qr?.getBoundingClientRect(); return !!r && qr.contains(document.activeElement) && r.left>=0 && r.right<=innerWidth+1 })()`);
    await key('Escape');
    results.push({label:'partner-qr-opens-and-fits',width,pass:qrFits});
    await navigate('/case/'+cases[0]+'/advisor');await inspect('advisor',width,true);
    await click('Email');
    const cadenceWorks=await evaluate(`(() => { const tab=document.querySelectorAll('[role="tablist"][aria-label="Follow-up touchpoints"] [role="tab"]')[1]; if(!tab)return false; tab.click(); return true })()`);
    await pause(180);
    results.push({label:'advisor-cadence-switches-touchpoint-and-channel',width,pass:cadenceWorks && await evaluate(`document.querySelectorAll('[role="tablist"][aria-label="Follow-up touchpoints"] [role="tab"]')[1]?.getAttribute('aria-selected')==='true' && document.body.innerText.includes('Subject:')`)});
    results.push({label:'clean-responsive-layout',width,pass:await evaluate(`!document.querySelector('button[aria-label="Split Screen"]') && Boolean(document.querySelector('.app-shell'))`)});
    for(const id of cases){
      await navigate('/case/'+id);await inspect(id+'-entry',width,width===390);
      await navigate('/case/'+id+'/stories');
      await inspect(id+'-sherpi-intro',width,width===390 && id===cases[0]);
      await skipIntro();
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
  await clickAria('Turn narration off');await pause(120);
  const beforeMutedNext=await evaluate('window.__speechCalls.length');
  await click('Next');await pause(160);
  results.push({label:'speaker-mutes-the-tour-without-hiding-instructions',pass:await evaluate(`window.__speechCalls.length===${beforeMutedNext} && document.body.innerText.includes('Take your time')`)});
  await skipIntro();
  await clickAria('Pause story');
  for(let index=0;index<3;index++){
    await click('Terms');await pause(120);
    await evaluate(`document.querySelectorAll('[role="dialog"] button:not([aria-label])')[${index}]?.click()`);await pause(160);
    if(index===0){
      await click('Financial Mechanics (Expert)');await pause(130);
      results.push({label:'terms-financial-mechanics-displays-explanation',pass:await evaluate(`(() => { const section=[...document.querySelectorAll('[role="dialog"] span')].find(e=>e.textContent==='Institutional Mechanics:'); return section && section.parentElement.textContent.trim().length>55 })()`)});
    }
    await click('Got it — Resume Plan');await pause(150);
  }
  const simplifyShown=await click('Simplify');await pause(150);
  const simplified=await evaluate(`document.body.innerText.includes('Simplified language is on')`);
  const goInApp=async path=>{await evaluate(`(() => { history.pushState({}, '', ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent('popstate')) })()`);await pause(250);};
  await goInApp('/case/timothy-melanie-weah/action');
  const noticeOutside=await evaluate(`document.querySelector('.calibration-banner')!==null`);
  await goInApp('/case/timothy-melanie-weah/stories');
  const savedVoiceMute=await evaluate(`Boolean(document.querySelector('[aria-label="Turn narration on"]')) && window.__speechCalls.length===${beforeMutedNext}`);
  await skipIntro();
  const standardButton=await click('Use standard language');await pause(160);
  results.push({label:'simplify-stays-in-wrapped-and-can-be-reversed',pass:simplifyShown && simplified && !noticeOutside && standardButton && await evaluate(`!document.querySelector('.calibration-banner')`)});
  await click('Terms');await pause(100);await clickAria('Use simpler language');await key('Escape');
  results.push({label:'simplify-remains-available-from-terms-after-reverting',pass:await evaluate(`document.querySelector('.calibration-banner')?.textContent.includes('Simplified language is on')`)});
  results.push({label:'voice-mute-persists-upon-return',pass:savedVoiceMute});
  await clickAria('Turn narration on');
  await navigate('/case/timothy-melanie-weah/stories?ui-relay=offline');
  await skipIntro();
  const offlineStart=await state();await pause(450);const offlineNext=await state();
  results.push({label:'unavailable-relay-does-not-open-sherpi-or-stop-playback',pass:offlineNext.progress>offlineStart.progress && await evaluate(`!document.querySelector('section[aria-label="Ask Sherpi"]')`)});
  await clickAria('Pause story');await pause(120);
  const pausedVoice=await evaluate('speechSynthesis.paused');
  await clickAria('Resume story');await pause(120);
  results.push({label:'pause-and-play-also-control-narration',pass:pausedVoice && await evaluate('!speechSynthesis.paused')});
  await navigate('/case/timothy-melanie-weah/stories');
  await skipIntro();
  const sherpiButton=await clickAria('Ask Sherpi');await pause(250);
  results.push({label:'sherpi-available-during-playback',pass:sherpiButton && await evaluate(`Boolean(document.querySelector('[aria-label="Ask Sherpi"][aria-expanded="true"]')) && Boolean(document.querySelector('[aria-label="Ask a question about your plan"]'))`)});
  await clickAria('Close voice assistant');await pause(200);
  const initial=await state();await pause(650);const progressed=await state();
  results.push({label:'continuous-progress',pass:initial.phase==='playing' && progressed.index===initial.index && progressed.progress>initial.progress && progressed.progress<100});
  await clickAria('Pause story');await pause(100);const paused=await state();await pause(400);const still=await state();
  results.push({label:'pause-freezes-progress',pass:paused.progress===still.progress});
  const heard=await evaluate('window.__speechCalls.length');
  results.push({label:'narration-introduces-sherpi',pass:await evaluate(`window.__speechCalls[0]?.includes('I’m Sherpi') || window.__speechCalls[0]?.includes('your financial health')`)});
  await click('Terms');await pause(100);await key('Escape');await pause(100);
  results.push({label:'terms-do-not-repeat-narration',pass:await evaluate(`window.__speechCalls.length===${heard} && ${heard}>0`)});
  await edge(true);const moved=await state();await edge(false);const returned=await state();
  results.push({label:'tap-right-left',pass:moved.index===initial.index+1 && returned.index===initial.index});
  results.push({label:'quick-return-does-not-repeat-narration',pass:await evaluate(`window.__speechCalls.length===${heard}`)});
  await clickAria('Resume story');
  // Let the final scene run on its clock: timers must stop at the checkpoint.
  while((await state()).phase!=='checkpoint'){await key('ArrowRight');}
  await pause(250);const checked=await state();await pause(450);
  results.push({label:'sherpi-guides-the-chapter-recap',pass:await evaluate(`Boolean(document.querySelector('[aria-label="Chapter checkpoint"] .sherpi-avatar'))`)});
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
  await skipIntro();
  const summaryMode=await state();
  const waitStart=Date.now();while((await state())?.phase!=='checkpoint' && Date.now()-waitStart<10000)await pause(100);
  const automaticCheckpoint=await state();
  results.push({label:'express-rhythm-and-automatic-checkpoint',pass:summaryMode.count===5 && automaticCheckpoint?.phase==='checkpoint'});
  const completeSummary=await evaluate(`document.querySelector('[aria-label="Chapter summary"]')?.children.length ?? 0`);
  results.push({label:'express-checkpoint-keeps-full-section-data',pass:completeSummary>=6});
  await pause(8500);const waiting=await state();
  results.push({label:'checkpoint-does-not-advance-with-time',pass:waiting.phase==='checkpoint' && waiting.chapter===automaticCheckpoint.chapter && waiting.progress===100});
  await navigate('/case/timothy-melanie-weah/stories');
  await skipIntro();
  const dock=await evaluate(`(() => { const r=document.querySelector('button[aria-label="Ask Sherpi"]').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()`);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...dock});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...dock});await pause(330);
  results.push({label:'sherpi-quick-tap-does-not-request-microphone',pass:await evaluate(`window.__micRequests===0 && Boolean(document.querySelector('section[aria-label="Ask Sherpi"]'))`)});
  await clickAria('Close voice assistant');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...dock});await pause(400);
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...dock});await pause(160);
  results.push({label:'sherpi-hold-requests-microphone-and-shows-denial',pass:await evaluate(`window.__micRequests===1 && document.querySelector('section[aria-label="Ask Sherpi"]')?.textContent.includes('Microphone access blocked')`)});
  await navigate('/case/not-a-case/stories');
  results.push({label:'unknown-case',pass:await evaluate(`document.body.innerText.includes('not found')`)});
  }
  await writeFile(join(out,'report.json'),JSON.stringify(results,null,2));
  const failed=results.filter(r=>!r.pass);console.log(`APPLICATION QUALITY: ${results.length-failed.length}/${results.length} passed`);
  process.exitCode=failed.length?1:0;
} finally { ws?.close();chrome.kill('SIGTERM');await new Promise(r=>{if(chrome.exitCode!==null)return r();chrome.once('exit',r);setTimeout(r,3000);});await rm(profile,{recursive:true,force:true}); }

// Run against an isolated Chrome debugging profile, never a personal browser.
// node deployment/check-landing-browser.mjs http://127.0.0.1:3105 9227
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:3105';
const port = process.argv[3] || '9227';
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method:'PUT'})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id = 0;
const pending = new Map();
const errors = [];
const command = (method,params={})=>new Promise((resolve,reject)=>{
  const requestId=++id;
  pending.set(requestId,{resolve,reject});
  ws.send(JSON.stringify({id:requestId,method,params}));
});
ws.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.id){const entry=pending.get(message.id);pending.delete(message.id);if(message.error)entry?.reject(message.error);else entry?.resolve(message.result);}
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  if(message.method==='Fetch.requestPaused')void command('Fetch.fulfillRequest',{
    requestId:message.params.requestId,responseCode:200,
    responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'}],
    body:Buffer.from(JSON.stringify({data:{id:123,full_name:'کاربر آزمون',avatar:base+'/images/melkino.webp',role_display:'کاربر'}})).toString('base64'),
  });
});
const evaluate=async expression=>(await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async(expression)=>{for(let i=0;i<40;i++){if(await evaluate(`Boolean(${expression})`))return;await pause(250);}throw Error('Browser condition timed out: '+expression);};
try{
  await command('Page.enable');await command('Runtime.enable');
  await command('Fetch.enable',{patterns:[{urlPattern:'*/api/accounts/session/'}]});
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});
  await command('Page.navigate',{url:base});
  await until(`document.querySelector('header a[aria-label="ملکینوی من"] img')?.src===${JSON.stringify(base+'/images/melkino.webp')}`);
  await until(`document.querySelector('[data-feed-index="0"]')`);
  const initial=await evaluate(`document.querySelectorAll('[data-feed-index]').length`);
  for(let i=0;i<10;i++){await evaluate('window.scrollTo(0,document.documentElement.scrollHeight)');await pause(250);}
  assert((await evaluate(`document.querySelectorAll('[data-feed-index]').length`))>initial,'Feed should append cards');
  await evaluate('window.scrollTo(0,0)');await pause(350);
  assert(await evaluate(`!!document.querySelector('[data-feed-index="0"]')`),'First card must remain available after scrolling back');
  assert(await evaluate(`document.querySelector('main').getBoundingClientRect().height>500`),'Landing must keep its content');
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await until(`!!document.querySelector('nav[aria-label="ناوبری پایین صفحه"] img[alt="عکس پروفایل"]')`);
  assert(await evaluate(`document.querySelector('nav[aria-label="ناوبری پایین صفحه"] img').naturalWidth>0`),'Profile image must load on mobile');
  assert.deepEqual(errors,[],'Browser exceptions');
  console.log('PASS: desktop/mobile profile avatar; infinite feed grows and preserves earlier cards; no runtime exceptions');
}finally{ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`);}

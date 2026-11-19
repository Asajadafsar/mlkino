import assert from 'node:assert/strict';
// Use an isolated Chrome debugging profile on 9227, never a personal browser.
const base=process.argv[2]||'http://localhost:3000';
const tab=await(await fetch('http://127.0.0.1:9227/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();const received=[];
const command=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Network.responseReceived'&&m.params.response.url.startsWith(base+'/api/accounts/login/password/'))received.push(m.params)};
const evaluate=async expression=>(await command('Runtime.evaluate',{expression,returnByValue:true})).result.value;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await command('Network.enable');await command('Network.setCookieControls',{enableThirdPartyCookieRestriction:true,disableThirdPartyCookieMetadata:true,disableThirdPartyCookieHeuristics:true});await command('Page.enable');await command('Page.navigate',{url:base+'/login'});
 for(let i=0;i<60;i++){if(await evaluate(`!!document.querySelector('input[autocomplete="current-password"]')`))break;await pause(250)}
 assert(await evaluate(`!!document.querySelector('input[autocomplete="current-password"]')`));
 await evaluate(`document.querySelector('input[autocomplete="tel"]').focus()`);await command('Input.insertText',{text:'000'});
 await evaluate(`document.querySelector('input[autocomplete="current-password"]').focus()`);await command('Input.insertText',{text:'invalid-fixture-only'});
 await evaluate(`document.querySelector('form').noValidate=true;document.querySelector('button[type="submit"]').click()`);
 for(let i=0;i<60&&!received.length;i++)await pause(250);
 assert(received.length,'Login form should use the same-origin API proxy');assert.equal(received[0].response.status,400);
 const body=await command('Network.getResponseBody',{requestId:received[0].requestId});const data=JSON.parse(body.body);
 assert.notEqual(data.error_code,'csrf_failed');
 console.log('Observed browser login URL:',received[0].response.url);
 console.log('PASS: real React login form sends invalid fixture credentials through the proxy and reaches API validation (400), without CSRF failure, with third-party cookies restricted');
}finally{ws.close();await fetch('http://127.0.0.1:9227/json/close/'+tab.id)}

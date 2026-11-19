// Full auth browser QA. Requires the isolated fixture backend/frontend, never production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:3002';
const log=fs.readFileSync('/private/tmp/mlkino-auth-qa-backend.log','utf8');
const root=log.match(/ISOLATED_QA_ROOT=(.+)/)?.[1];assert(root?.includes('mlkino-auth-qa-'));
const tab=await(await fetch('http://127.0.0.1:9227/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const failures=[];const requests=[];
const command=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}
 if(m.method==='Runtime.exceptionThrown')failures.push(m.params.exceptionDetails.text);
 if(m.method==='Network.responseReceived'&&m.params.response.url.startsWith(base+'/api/'))requests.push(m.params.response);
};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const evaluate=async expression=>{
 const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result.value;
};
const until=async(expression,label=expression)=>{for(let i=0;i<80;i++){if(await evaluate(`Boolean(${expression})`))return;await pause(250)}throw Error('Timed out: '+label)};
const fieldCode=name=>`(()=>{const label=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.replace(/\\*/g,'').trim()===${JSON.stringify(name)});return label&&document.getElementById(label.htmlFor)})()`;
async function fill(name,value){await until(fieldCode(name),'field '+name);await evaluate(`(()=>{const input=${fieldCode(name)};input.focus();input.select()})()`);await command('Input.insertText',{text:value})}
async function click(text){const expression=`Array.from(document.querySelectorAll('button,a,[role="tab"]')).find(e=>e.textContent.trim()===${JSON.stringify(text)}&&!e.disabled)`;await until(expression,'button '+text);await evaluate(`${expression}.click()`);await pause(100)}
async function go(path){await command('Page.navigate',{url:base+path});await until(`document.readyState==='complete'`)}
async function api(path,method='GET',body){return evaluate(`(async()=>{const csrf=await(await fetch('/api/accounts/csrf/',{credentials:'include'})).json();const r=await fetch('/api/accounts/'+${JSON.stringify(path)},{method:${JSON.stringify(method)},credentials:'include',headers:{'Content-Type':'application/json','X-CSRFToken':csrf.csrfToken},${body?`body:JSON.stringify(${JSON.stringify(body)}),`:''}});return {status:r.status,body:await r.json()}})()`)}
async function code(){await until(`!!document.querySelector('input[aria-label="رقم ۱ کد تأیید"]')`);await evaluate(`document.querySelector('input[aria-label="رقم ۱ کد تأیید"]').focus()`);await command('Input.insertText',{text:'12345'});await click('تأیید کد')}
const phone='09000111122',firstPassword='Fixture-password-13579',changed='Changed-password-24680',reset='Recovered-password-35791';
try{
 await command('Network.enable');await command('Runtime.enable');await command('Page.enable');
 await command('Network.setCookieControls',{enableThirdPartyCookieRestriction:true,disableThirdPartyCookieMetadata:true,disableThirdPartyCookieHeuristics:true});
 await go('/signup');
 assert.equal(await evaluate(`fetch('/api/accounts/qa-isolated/').then(r=>r.json()).then(d=>d.isolated===true&&d.providers==='fake')`),true,'Isolated backend marker required');
 await fill('نام','آزمون');await fill('نام خانوادگی','مرورگر');await fill('شماره تلفن',phone);await fill('رمز عبور',firstPassword);await fill('تکرار رمز عبور',firstPassword);
 await click('ادامه و دریافت کد تأیید');await code();
 await until(`!!document.querySelector('input[type="file"]')`,'profile completion after OTP');
 await fill('ایمیل','browser@example.test');await fill('کد ملی','1234567891');
 const doc=await command('DOM.getDocument');const input=await command('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type="file"]'});
 await command('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[root+'/avatar.png']});
 await evaluate(`${fieldCode('تاریخ تولد')}.click()`);
 await until(`!!document.querySelector('.rmdp-calendar')`,'birthday calendar');
 await evaluate(`Array.from(document.querySelectorAll('.rmdp-header-values span')).at(-1).click()`);
 await until(`!!document.querySelector('.rmdp-year-picker')`,'year picker');
 await evaluate(`(()=>{const norm=s=>s.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));const years=Array.from(document.querySelectorAll('.rmdp-year-picker .rmdp-day')).filter(e=>e.offsetParent!==null);const current=new Date().getFullYear()-621;const chosen=years.find(e=>Number(norm(e.textContent.trim()))<=current-2);if(!chosen)throw Error('No past fixture year');chosen.click()})()`);
 await pause(100);
 await evaluate(`Array.from(document.querySelectorAll('.rmdp-day-picker .rmdp-day:not(.rmdp-day-hidden)')).find(e=>e.textContent.trim()==='۱۵').click()`);
 await until(`${fieldCode('تاریخ تولد')}.value.length>0`,'birthday value');
 await click('مرحله بعد');await fill('کد پستی','1234567890');
 await evaluate(`document.querySelector('button[aria-label="بررسی کد پستی"]').click()`);
 await until(`${fieldCode('آدرس')}.value.length>5`,'provider address');
 await click('تکمیل ثبت نام');await until(`location.pathname==='/dashboard'`,'signup dashboard');
 let profile=await api('profile/');assert.equal(profile.status,200);assert.equal(profile.body.data.email,'browser@example.test');assert.equal(profile.body.data.national_code_verified,true);assert(profile.body.data.avatar);
 console.log('PASS registration: OTP -> mandatory identity/address/photo -> verified profile -> dashboard');
 await go('/profile');await until(fieldCode('نام'),'profile form');await fill('نام','ویرایش');await click('ذخیره تغییرات');
 await until(`document.body.textContent.includes('اطلاعات پروفایل ذخیره شد.')`,'profile saved');
 profile=await api('profile/');assert.equal(profile.body.data.first_name,'ویرایش');
 assert(await evaluate(`Array.from(document.images).some(i=>i.src.includes('/media/avatars/')&&i.naturalWidth>0)`),'Profile avatar loads');
 console.log('PASS profile: complete fields rendered, avatar loaded, edit persisted');
 await api('logout/','POST',{});await go('/login');await fill('شماره تلفن',phone);await fill('رمز عبور',firstPassword);await click('ورود به حساب');await until(`location.pathname==='/dashboard'`,'password login');
 await api('logout/','POST',{});await go('/login');await click('ورود با کد یکبارمصرف');await fill('شماره تلفن',phone);await click('دریافت کد ورود');await code();await until(`location.pathname==='/dashboard'`,'OTP login');
 console.log('PASS password and OTP login with real isolated HttpOnly sessions');
 await go('/profile?tab=password');await click('ارسال کد تأیید');await fill('کد تأیید','12345');await click('تأیید کد');await fill('رمز جدید',changed);await fill('تکرار رمز جدید',changed);await click('ثبت رمز جدید');await until(`location.pathname==='/login'`,'password change exits session');
 await fill('شماره تلفن',phone);await fill('رمز عبور',changed);await click('ورود به حساب');await until(`location.pathname==='/dashboard'`,'login with changed password');
 console.log('PASS authenticated password change: SMS code required, new password works');
 await api('logout/','POST',{});await go('/change-password');await fill('شماره موبایل',phone);await click('ارسال کد تأیید');await fill('کد تأیید','00000');await click('تأیید کد');
 await until(`document.body.textContent.includes('کد اشتباه')`,'incorrect OTP rejected');assert(!(await evaluate(`Boolean(${fieldCode('رمز جدید')})`)));
 await fill('کد تأیید','12345');await click('تأیید کد');await fill('رمز جدید',reset);await fill('تکرار رمز جدید',reset);await click('ثبت رمز جدید');await until(`document.body.textContent.includes('رمز با موفقیت تغییر کرد')`,'reset success');
 await go('/login');await fill('شماره تلفن',phone);await fill('رمز عبور',reset);await click('ورود به حساب');await until(`location.pathname==='/dashboard'`,'login with reset password');
 console.log('PASS password recovery: wrong OTP blocked, verified reset and subsequent login work');
 assert.deepEqual(failures,[],'Browser runtime exceptions');assert(!requests.some(r=>r.status>=500),'API server errors');
 console.log('PASS full isolated browser auth lifecycle; no production users or providers used');
}catch(error){
 console.error('QA failure:',error.message);
 console.error((await evaluate('document.body.innerText')).slice(-6000));
 throw error;
}finally{ws.close();await fetch('http://127.0.0.1:9227/json/close/'+tab.id)}

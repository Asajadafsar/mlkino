import {apiOrigin} from './Session';
let refresh:Promise<boolean>|null=null;
/** Cookie credentials never leave the configured API origin. Retry expiry once. */
export async function authenticatedFetch(path:string,init:RequestInit={}){
 if(!path.startsWith('/panel/')&&!path.startsWith('/accounts/'))throw Error('مسیر درخواست معتبر نیست.');
 const origin=apiOrigin(),options:RequestInit={...init,credentials:'include',cache:'no-store',signal:init.signal||AbortSignal.timeout(15000)};
 let response=await fetch(origin+path,options);
 if(response.status===401){
  if(!refresh)refresh=fetch(origin+'/accounts/token/refresh/',{method:'POST',credentials:'include',cache:'no-store',signal:AbortSignal.timeout(12000)}).then(r=>r.ok).finally(()=>{refresh=null});
  if(await refresh)response=await fetch(origin+path,options);
 }
 return response;
}

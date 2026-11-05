// Authentication may only return to a local panel route, never another origin.
export function safeAuthDestination(value:string|null|undefined):string {
 if(!value||!value.startsWith('/')||value.startsWith('//'))return '/dashboard'
 if(Array.from(value).some(char=>char==='\\'||char.charCodeAt(0)<=32||char.charCodeAt(0)===127)||/%(?:5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))return '/dashboard'
 try {
  const url=new URL(value,'https://panel.mlkino.com')
  const path=decodeURIComponent(url.pathname)
  if(url.origin!=='https://panel.mlkino.com'||path.startsWith('//')||path.includes('\\')||/^\/(login|signup|change-password)(\/|$)/i.test(path))return '/dashboard'
  return url.pathname+url.search+url.hash
 }catch{return '/dashboard'}
}
export function authDestination(search:string):string{return safeAuthDestination(new URLSearchParams(search).get('next'))}
export function authEntry(path:'/login'|'/signup'|'/change-password',next:string):string{return path+'?'+new URLSearchParams({next:safeAuthDestination(next)}).toString()}

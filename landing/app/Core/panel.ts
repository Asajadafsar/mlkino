/** Panel navigation; authentication cookies remain HttpOnly on the API host. */
function panelOrigin(value:string):string {
 const url=new URL(value)
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('NEXT_PUBLIC_PANEL_URL must be an HTTP(S) origin, without a path or credentials')
 return url.origin
}
export const PANEL_ORIGIN=panelOrigin(process.env.NEXT_PUBLIC_PANEL_URL||(process.env.NODE_ENV==='development'?'http://localhost:3000':'https://panel.mlkino.com'))
export const PANEL_LINKS={
 files:PANEL_ORIGIN+'/files',reminders:PANEL_ORIGIN+'/reminders',dashboard:PANEL_ORIGIN+'/dashboard',login:PANEL_ORIGIN+'/login',signup:PANEL_ORIGIN+'/signup',
 createFile:PANEL_ORIGIN+'/files/create',createRequest:PANEL_ORIGIN+'/requests/create',
 chats:PANEL_ORIGIN+'/chats',tickets:PANEL_ORIGIN+'/tickets',profile:PANEL_ORIGIN+'/profile',
} as const

export function panelSearch(query:string):string{return PANEL_ORIGIN+'/files?'+new URLSearchParams({search:query.trim()}).toString()}

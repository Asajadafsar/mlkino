export function estateDate(value?:string,withTime=false) {
 if(!value||!Number.isFinite(new Date(value).getTime()))return '—'
 let timeZone='Asia/Tehran'
 try{timeZone=JSON.parse(localStorage.getItem('mlkino:date-settings')||'{}').timezone||timeZone}catch{}
 try{
  const parts=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',...(withTime?{hour:'2-digit',minute:'2-digit',hour12:false}:{})}).formatToParts(new Date(value))
  const text=(kind:string)=>parts.find(part=>part.type===kind)?.value||''
  return `${text('year')}/${text('month')}/${text('day')}${withTime?`  ${text('hour')}:${text('minute')}`:''}`
 }catch{return '—'}
}

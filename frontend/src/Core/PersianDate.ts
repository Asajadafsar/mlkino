export const latinDigits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632)))
export function dateZone(){try{return JSON.parse(localStorage.getItem('mlkino:date-settings')||'{}').timezone||'Asia/Tehran'}catch{return 'Asia/Tehran'}}
export function localDateTime(value:string,zone=dateZone()){
 if(!value)return ''
 if(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(value))return value
 const date=new Date(value);if(isNaN(date.getTime()))return ''
 const parts=new Intl.DateTimeFormat('en-CA-u-ca-gregory',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date)
 const get=(key:string)=>parts.find(p=>p.type===key)?.value||''
 return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}
export function dateTimeIso(value:string,zone=dateZone()){
 if(!value)return ''
 const normalized=latinDigits(value),match=normalized.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
 if(!match)return new Date(normalized).toISOString()
 const [,y,m,d,h,min]=match.map(Number),target=Date.UTC(y,m-1,d,h,min)
 let guess=target
 for(let i=0;i<2;i++){const parts=localDateTime(new Date(guess).toISOString(),zone).match(/\d+/g)!.map(Number);const represented=Date.UTC(parts[0],parts[1]-1,parts[2],parts[3],parts[4]);guess-=represented-target}
 return new Date(guess).toISOString()
}

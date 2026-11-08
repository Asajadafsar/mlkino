import {Box,Button,Chip,Stack,Typography} from '@mui/material'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import type {WorkflowRow} from '../../Pages/Workflows/workflowClient'

const dayKey=(value:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))
const datePart=(value:string,options:Intl.DateTimeFormatOptions)=>new Date(value).toLocaleDateString('fa-IR-u-ca-persian',{...options,timeZone:'Asia/Tehran'})
const time=(value:string)=>new Date(value).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tehran'})

export function VisitSlotCalendar({slots,value,onChange}:{slots:WorkflowRow[];value:string|number;onChange:(id:string)=>void}){
 const available=slots.filter(row=>Number(row.available)>0).sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at))
 const selected=available.find(row=>String(row.id)===String(value))
 const activeKey=selected?dayKey(selected.starts_at):available[0]?dayKey(available[0].starts_at):''
 const days=Array.from(new Map(available.map(row=>[dayKey(row.starts_at),row])).entries())
 const daySlots=available.filter(row=>dayKey(row.starts_at)===activeKey)
 if(!available.length)return <Box className="visit-calendar-empty"><EventAvailableRoundedIcon/><Typography fontWeight={800}>زمان آزادی ثبت نشده است</Typography><Typography variant="body2">ابتدا کارشناس باید روز و ساعت‌های قابل رزرو را برای فایل ثبت کند.</Typography></Box>
 return <Box className="visit-calendar"><Box className="visit-calendar-head"><EventAvailableRoundedIcon/><div><Typography fontWeight={900}>تقویم زمان‌های آزاد کارشناس</Typography><Typography variant="caption">فقط زمان‌های فعال و دارای ظرفیت قابل انتخاب‌اند.</Typography></div></Box><Box className="visit-calendar-days">{days.map(([key,row])=><Button key={key} aria-pressed={key===activeKey} onClick={()=>{const first=available.find(slot=>dayKey(slot.starts_at)===key);onChange(first?String(first.id):'')}}><small>{datePart(row.starts_at,{weekday:'short'})}</small><strong>{datePart(row.starts_at,{day:'numeric'})}</strong><span>{datePart(row.starts_at,{month:'short'})}</span></Button>)}</Box><Box className="visit-calendar-times"><Typography fontWeight={800}>ساعت‌های قابل رزرو</Typography><Stack direction="row" gap={1} flexWrap="wrap">{daySlots.map(row=><Chip key={row.id} clickable color={String(value)===String(row.id)?'primary':'default'} variant={String(value)===String(row.id)?'filled':'outlined'} onClick={()=>onChange(String(row.id))} label={`${time(row.starts_at)} تا ${time(row.ends_at)} · ${Number(row.available).toLocaleString('fa-IR')} ظرفیت`}/>)}</Stack></Box></Box>
}

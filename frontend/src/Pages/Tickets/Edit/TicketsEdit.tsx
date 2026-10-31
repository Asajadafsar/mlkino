import {useCallback,useContext,useEffect,useState} from 'react'
import {Alert,Avatar,Box,Button,Chip,CircularProgress,MenuItem,Paper,Stack,TextField,Typography} from '@mui/material'
import {useSelector} from 'react-redux'
import {Link,useParams} from 'react-router-dom'
import {DataProvider} from '../../../Core/DataProvider'
import {selectIsSuperAdmin} from '../../../redux/RoleSlice'
import {CurrentUserContext} from '../../../Core/CurrentUser'
import {formatDate} from '../../../Core/FormatDate'
import {TicketsType,TicketStatus,TICKET_STATUSES} from '../Tickets'
import {TicketReply} from '../TicketReply'
import {TicketAttachment} from '../TicketAttachment'

export function TicketConversation({ticketId,onChanged,assignees=[]}:{ticketId:number|string;onChanged?:()=>void;assignees?:{id:number;first_name:string;last_name:string}[]}){
 const isAdmin=useSelector(selectIsSuperAdmin),{user}=useContext(CurrentUserContext)
 const [ticket,setTicket]=useState<TicketsType|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false),[attempt,setAttempt]=useState(0)
 const load=useCallback(async()=>{const response=await DataProvider.get<TicketsType>(`tickets/${ticketId}/`);return response.data},[ticketId])
 useEffect(()=>{let active=true;setTicket(null);setError('');load().then(data=>{if(active)setTicket(data)}).catch(error=>{if(active)setError(error.message)});return()=>{active=false}},[load,attempt])
 const updated=(data:TicketsType)=>{setTicket(data);onChanged?.()}
 const mutate=async(path:string,data:any)=>{if(saving)return;setSaving(true);setError('');try{const response=await DataProvider.patch<TicketsType>(`tickets/${ticketId}/${path}/`,{data});updated(response.data)}catch(error:any){setError(error.message)}finally{setSaving(false)}}
 if(!ticket)return error?<Alert severity="error" action={<Button onClick={()=>setAttempt(v=>v+1)}>تلاش مجدد</Button>}>{error}</Alert>:<Stack alignItems="center" sx={{p:5}}><CircularProgress aria-label="دریافت تیکت"/></Stack>
 const status=TICKET_STATUSES.find(option=>option.value===ticket.status)
 return <Stack spacing={2}>
  {error&&<Alert severity="error">{error}</Alert>}
  <Paper variant="outlined" sx={{p:2.5,borderRadius:4}}><Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}><Typography fontWeight={900} fontSize={20}>{ticket.subject}</Typography><Chip size="small" color={status?.color} label={status?.label}/></Stack><Typography variant="caption" color="text.secondary" component="div" sx={{mt:1}}>تیکت #{ticket.id} · {ticket.category_display} · {ticket.creator_name} · {formatDate(ticket.created_at)}</Typography><Stack direction={{xs:'column',sm:'row'}} gap={1.5} sx={{mt:2}}>{isAdmin?<><TextField select label="وضعیت رسیدگی" value={ticket.status} disabled={saving} onChange={event=>mutate('status',{status:event.target.value as TicketStatus})} sx={{flex:1}}>{TICKET_STATUSES.map(option=><MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField><TextField select label="مسئول رسیدگی" value={ticket.assigned_to||''} disabled={saving} onChange={e=>mutate('assign',{assigned_to:e.target.value?Number(e.target.value):null})} sx={{flex:1}}><MenuItem value="">بدون مسئول</MenuItem>{(assignees.length?assignees:[{id:user.id,first_name:user.first_name||'من',last_name:user.last_name||''}]).map(person=><MenuItem key={person.id} value={person.id}>{person.first_name} {person.last_name}</MenuItem>)}</TextField></>:<Button variant="outlined" disabled={saving} onClick={()=>mutate('status',{status:ticket.status==='closed'?'open':'closed'})}>{ticket.status==='closed'?'بازگشایی تیکت':'بستن تیکت'}</Button>}</Stack></Paper>
  <Paper variant="outlined" sx={{p:{xs:2,sm:3},borderRadius:4,bgcolor:'#f9fbff'}}><Typography fontWeight={700} sx={{mb:3}}>گفتگو و پاسخ‌ها</Typography><Stack spacing={2.5}>{(ticket.messages||[]).map(message=><Stack key={message.id} direction="row" gap={1} sx={{alignSelf:message.author===user.id?'flex-start':'flex-end',maxWidth:'95%',width:'fit-content'}}><Avatar sx={{width:32,height:32,bgcolor:message.is_internal?'#fff1d6':'#e5eeff',color:'primary.main',fontSize:13}}>{(message.author_name||'م')[0]}</Avatar><Box sx={{p:2,borderRadius:'16px',bgcolor:message.is_internal?'#fff6e5':message.author===user.id?'#eaf2ff':'white',border:'1px solid',borderColor:message.is_internal?'#f4dfb7':'#e0e9f8'}}><Stack direction="row" gap={1} alignItems="center"><Typography variant="caption" fontWeight={700}>{message.author_name||`کاربر ${message.author}`}</Typography>{message.is_internal&&<Chip size="small" label="یادداشت داخلی" color="warning"/>}</Stack><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',my:1.5}}>{message.body}</Typography>{message.attachment&&<TicketAttachment attachment={message.attachment}/>}<Typography variant="caption" color="text.secondary">{formatDate(message.created_at)}</Typography></Box></Stack>)}</Stack>{ticket.status==='closed'?<Alert severity="info" sx={{mt:3}}>برای ارسال پاسخ، تیکت را بازگشایی کنید.</Alert>:<TicketReply key={ticket.id} ticketId={ticket.id} onUpdated={updated}/>}</Paper>
 </Stack>
}
export function TicketsEdit(){const {id}=useParams();return <Stack spacing={2}><Button component={Link} to="/tickets" sx={{alignSelf:'flex-start'}}>بازگشت به تیکت‌ها</Button><TicketConversation ticketId={id!}/></Stack>}

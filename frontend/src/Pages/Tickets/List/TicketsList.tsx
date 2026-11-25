import DatePickerFilter from '../../../Components/Filter/DatePicker'
import {useEffect,useState} from 'react'
import {Alert,Box,Button,Chip,Dialog,DialogContent,DialogTitle,Grid,LinearProgress,MenuItem,Pagination,Paper,Stack,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import {useSelector} from 'react-redux'
import {Link} from 'react-router-dom'
import {selectIsSuperAdmin} from '../../../redux/RoleSlice'
import {DataProvider} from '../../../Core/DataProvider'
import {formatDate} from '../../../Core/FormatDate'
import {ManagementHero} from '../../../Components/ManagementWorkspace/ManagementHero'
import {AuditStats} from '../../../Components/AuditWorkspace/AuditPresentation'
import FileInput from '../../Files/FileInput'
import '../../Files/filesWorkspace.css'
import {TicketsCreate} from '../Create/TicketsCreate'
import {TicketConversation} from '../Edit/TicketsEdit'
import {TicketsType,TICKET_STATUSES,TICKET_CATEGORIES,ticketCreateDefaults,TicketCreateInput} from '../Tickets'

export function TicketsList(){
 const admin=useSelector(selectIsSuperAdmin)
 const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[category,setCategory]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[page,setPage]=useState(1),[attempt,setAttempt]=useState(0)
 const [rows,setRows]=useState<TicketsType[]>([]),[count,setCount]=useState(0),[stats,setStats]=useState<Record<string,number>>({}),[assignees,setAssignees]=useState<any[]>([])
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[open,setOpen]=useState(false),[selected,setSelected]=useState<number|null>(null)
 const [form,setForm]=useState<TicketCreateInput>(ticketCreateDefaults)
 const invalid=!!(start&&end&&start>end)
 const params=new URLSearchParams({search,status,category,start_date:start,end_date:end,page:String(page),page_size:'12'}).toString()
 useEffect(()=>{let active=true;setLoading(true);if(invalid){setRows([]);setCount(0);setLoading(false);return}const timer=setTimeout(()=>{DataProvider.get<any>('tickets/?'+params).then(response=>{if(active){setRows(response.data.results);setCount(response.data.total_results);setStats(response.data.stats||{});setAssignees(response.data.assignees||[]);setError('')}}).catch(error=>{if(active)setError(error.message)}).finally(()=>{if(active)setLoading(false)})},200);return()=>{active=false;clearTimeout(timer)}},[params,attempt,invalid])
 const refresh=()=>setAttempt(v=>v+1)
 const created=()=>{setOpen(false);setForm(ticketCreateDefaults);setPage(1);setSearch('');setStatus('');setCategory('');setStart('');setEnd('');refresh()}
 const chip=(ticket:TicketsType)=>{const option=TICKET_STATUSES.find(item=>item.value===ticket.status);return <Chip size="small" color={option?.color} label={option?.label}/>}
 return <Stack spacing={0} className="management-workspace tickets-workspace">
  <ManagementHero tickets admin={admin} action={!admin?<Button variant="contained" startIcon={<AddRoundedIcon/>} onClick={()=>setOpen(true)}>ثبت تیکت جدید</Button>:undefined}/>
  {error&&<Alert severity="error" action={<Button onClick={refresh}>تلاش مجدد</Button>}>{error}</Alert>}
  <AuditStats items={[{title:'در انتظار بررسی',value:loading||invalid?null:stats.open||0,tone:'blue'},{title:'در حال بررسی',value:loading||invalid?null:stats.in_progress||0,tone:'amber'},{title:'پاسخ داده شده',value:loading||invalid?null:stats.answered||0,tone:'green'},{title:'بسته شده',value:loading||invalid?null:stats.closed||0,tone:'purple'}]}/>
  {invalid&&<Alert severity="warning">تاریخ پایان باید پس از شروع باشد.</Alert>}
  <section className="ticket-filters"><FileInput label="جستجوی تیکت" placeholder="موضوع یا متن تیکت..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/><FileInput select label="دسته‌بندی تیکت" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><MenuItem value="">همه دسته‌ها</MenuItem>{TICKET_CATEGORIES.map(item=><MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</FileInput><FileInput select label="وضعیت" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><MenuItem value="">همه وضعیت‌ها</MenuItem>{TICKET_STATUSES.map(item=><MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</FileInput><div className="ticket-date-field"><DatePickerFilter mode="controlled" item={{label:'از تاریخ'}} value={start} onChange={value=>{setStart(value||'');setPage(1)}}/></div><div className="ticket-date-field"><DatePickerFilter mode="controlled" item={{label:'تا تاریخ'}} value={end} onChange={value=>{setEnd(value||'');setPage(1)}}/></div><div className="ticket-filter-actions"><Button onClick={()=>{setSearch('');setStatus('');setCategory('');setStart('');setEnd('');setPage(1)}}>پاکسازی فیلترها</Button><Button onClick={refresh}>به‌روزرسانی</Button></div></section>
  {loading&&<LinearProgress/>}
  <div className={'ticket-support-layout '+(selected?'has-selection':'')}>{admin?<Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',xl:selected?'minmax(0,1fr) minmax(360px,1fr)':'1fr'},gap:2.5,alignItems:'start'}}><Paper variant="outlined" sx={{borderRadius:4,overflow:'hidden'}}><TableContainer><Table sx={{minWidth:600}}><TableHead sx={{bgcolor:'#f5f8fe'}}><TableRow>{['شماره و موضوع','کاربر','وضعیت','آخرین بروزرسانی','عملیات'].map(label=><TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map(ticket=><TableRow key={ticket.id} hover selected={selected===ticket.id}><TableCell><Typography fontWeight={700} variant="body2">{ticket.subject}</Typography><Typography variant="caption" color="text.secondary">#{ticket.id} · {ticket.category_display}</Typography></TableCell><TableCell>{ticket.creator_name}</TableCell><TableCell>{chip(ticket)}</TableCell><TableCell>{formatDate(ticket.updated_at)}</TableCell><TableCell><Button onClick={()=>setSelected(ticket.id)}>مشاهده و پاسخ</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>{!loading&&!rows.length&&<Typography align="center" sx={{p:5}}>تیکتی با این مشخصات پیدا نشد.</Typography>}</Paper>{selected&&<Stack spacing={1}><Button onClick={()=>setSelected(null)} sx={{alignSelf:'flex-end'}}>بستن جزئیات</Button><TicketConversation ticketId={selected} onChanged={refresh} assignees={assignees}/></Stack>}</Box>:<Grid container spacing={2}>{rows.map(ticket=><Grid item xs={12} md={6} xl={4} key={ticket.id}><Paper variant="outlined" sx={{p:2.5,borderRadius:4,height:'100%'}}><Stack spacing={2}><Stack direction="row" alignItems="center" justifyContent="space-between">{chip(ticket)}<Typography color="text.secondary" variant="caption">#{ticket.id}</Typography></Stack><Typography fontSize={18} fontWeight={800}>{ticket.subject}</Typography><Typography color="text.secondary" variant="body2">{ticket.category_display} · {ticket.messages_count||0} پیام</Typography><Typography color="text.secondary" variant="caption">آخرین تغییر: {formatDate(ticket.updated_at)}</Typography><Button component={Link} to={`/tickets/${ticket.id}`} variant="outlined">مشاهده گفتگو و پیگیری</Button></Stack></Paper></Grid>)}</Grid>}
  {!selected&&<aside className="ticket-support-help"><img src="/assets/support-3d.webp" alt=""/><h2>پشتیبانی در کنار شماست</h2><p>{admin?'برای بررسی پیام‌ها و پاسخ‌گویی، تیکت موردنظر را از جدول انتخاب کنید.':'برای رسیدگی سریع‌تر، موضوع و توضیحات درخواست خود را کامل ثبت کنید.'}</p>{!admin&&<Button variant="contained" onClick={()=>setOpen(true)}>＋ ثبت تیکت جدید</Button>}</aside>}</div>
  {!admin&&!loading&&!rows.length&&<Paper variant="outlined" sx={{p:5,borderRadius:4,textAlign:'center'}}><Box component="img" src="/assets/support-3d.webp" alt="" sx={{width:170,height:140,objectFit:'contain'}}/><Typography fontWeight={700}>تیکتی پیدا نشد.</Typography><Typography color="text.secondary" sx={{mt:1}}>در صورت نیاز، درخواست جدیدی برای پشتیبانی ثبت کنید.</Typography><Button sx={{mt:2}} variant="contained" onClick={()=>setOpen(true)}>ثبت تیکت جدید</Button></Paper>}
  {count>12&&<Pagination color="primary" page={page} count={Math.ceil(count/12)} onChange={(_,value)=>setPage(value)}/>}
  <Dialog PaperProps={{className:"management-form-dialog"}} open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm"><DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center">ثبت درخواست پشتیبانی<Button onClick={()=>setOpen(false)}>بستن</Button></Stack></DialogTitle><DialogContent><TicketsCreate data={form} setData={setForm} onSuccess={created}/></DialogContent></Dialog>
 </Stack>
}

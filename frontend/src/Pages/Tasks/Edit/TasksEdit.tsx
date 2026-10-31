import {useContext,useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {Alert,Button,CircularProgress,MenuItem,Paper,Stack,TextField,Typography} from '@mui/material'
import {PageHero} from '../../../Components/Workspace/PageHero'
import {CurrentUserContext} from '../../../Core/CurrentUser'
import {DataProvider} from '../../../Core/DataProvider'
import {formatDate} from '../../../Core/FormatDate'
import {TasksType,taskStatusOptions} from '../Tasks'
import {TaskComposer} from '../TaskComposer'
export function TasksEdit(){
 const {id}=useParams(),{user}=useContext(CurrentUserContext)
 const [task,setTask]=useState<TasksType|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(false)
 useEffect(()=>{let active=true;setError('');DataProvider.get<TasksType>(`tasks/${id}/`).then(response=>{if(active)setTask(response.data)}).catch(error=>{if(active)setError(error.message||'دریافت تسک انجام نشد')});return()=>{active=false}},[id,attempt])
 const manager=user.role==='superadmin'||(user.role==='agency'&&task?.created_by_id===user.id)
 const changeStatus=async(assignment:number,status:string)=>{setBusy(true);try{await DataProvider.patch(`tasks/assignments/${assignment}/`,{data:{status}});setAttempt(value=>value+1);setMessage('وضعیت دریافت‌کننده به‌روز شد.')}catch(error:any){setError(error.message)}finally{setBusy(false)}}
 if(!task)return error?<Alert severity="error" action={<Button onClick={()=>setAttempt(v=>v+1)}>تلاش مجدد</Button>}>{error}</Alert>:<CircularProgress aria-label="دریافت تسک"/>
 return <Stack spacing={2.5}><PageHero title={task.title} description={`وظیفه شماره ${task.id} · ایجادکننده: ${task.created_by||'—'}`} illustration="/assets/tasks-3d.png" action={<Button component={Link} to="/tasks" variant="outlined">بازگشت به کارها</Button>}/>{error&&<Alert severity="error">{error}</Alert>}{message&&<Alert severity="success">{message}</Alert>}
 <Paper variant="outlined" sx={{p:{xs:2,md:3},borderRadius:4}}>{manager?<TaskComposer key={task.id} initial={task} onSaved={value=>{setTask(value);setMessage('تغییرات ذخیره شد.')}}/>:<Stack spacing={2}><Typography fontWeight={700}>{task.title}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{task.description||'بدون توضیحات'}</Typography><Typography color="text.secondary">سررسید: {task.due_date?new Date(task.due_date+'T12:00:00').toLocaleDateString('fa-IR'):'—'}</Typography></Stack>}</Paper>
 <Paper variant="outlined" sx={{p:3,borderRadius:4}}><Typography fontWeight={700} fontSize={18} sx={{mb:2}}>دریافت‌کنندگان و پیشرفت کار</Typography><Stack spacing={2}>{task.assignments?.map(assignment=><Stack key={assignment.id} direction={{xs:'column',sm:'row'}} justifyContent="space-between" alignItems={{sm:'center'}} gap={2} sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:3}}><Stack><Typography fontWeight={700}>{assignment.full_name}</Typography>{assignment.completed_at&&<Typography variant="caption" color="text.secondary">انجام‌شده در {formatDate(assignment.completed_at)}</Typography>}</Stack><TextField select label="وضعیت" value={assignment.status} onChange={event=>changeStatus(assignment.id,event.target.value)} disabled={busy||(!manager&&assignment.assignee!==user.id)} sx={{minWidth:180}}>{taskStatusOptions.map(option=><MenuItem value={option.value} key={option.value}>{option.label}</MenuItem>)}</TextField></Stack>)}</Stack></Paper>
 </Stack>
}

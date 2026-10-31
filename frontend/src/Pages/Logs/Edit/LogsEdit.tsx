import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {Alert,Button,CircularProgress,Grid,Paper,Stack,Typography} from '@mui/material'
import {PageHero} from '../../../Components/Workspace/PageHero'
import {DataProvider} from '../../../Core/DataProvider'
import {formatDate} from '../../../Core/FormatDate'
import type {LogsType} from '../Logs'
export function LogsEdit(){
 const {id}=useParams(),[log,setLog]=useState<LogsType|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;DataProvider.get<LogsType>(`activity-logs/${id}/`).then(response=>{if(active)setLog(response.data)}).catch(error=>{if(active)setError(error.message)});return()=>{active=false}},[id])
 if(error)return <Alert severity="error">{error}</Alert>
 if(!log)return <CircularProgress/>
 return <Stack spacing={2.5}><PageHero title={`جزئیات رویداد #${log.id}`} description={log.event} illustration="/assets/logs-3d.png" action={<Button component={Link} to="/logs" variant="outlined">بازگشت به گزارش فعالیت‌ها</Button>}/><Paper variant="outlined" sx={{p:3,borderRadius:4}}><Grid container spacing={3}>{[['کاربر',log.actor_name],['کاربر اصلی',log.real_actor_name],['زمان',formatDate(log.created_at)],['نوع درخواست',log.method],['مسیر',log.path],['کد پاسخ',log.status_code],['شناسه درخواست',log.request_id],['آدرس IP',log.ip_address],['مرورگر',log.user_agent],['اطلاعات تکمیلی',JSON.stringify(log.metadata,null,2)]].map(([label,value])=><Grid item xs={12} md={6} key={String(label)}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{overflowWrap:'anywhere',whiteSpace:'pre-wrap',mt:1}}>{value||'—'}</Typography></Grid>)}</Grid></Paper></Stack>
}

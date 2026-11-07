import {useEffect,useMemo,useState} from 'react'
import {Alert,Box,Button,Chip,CircularProgress,FormControlLabel,Grid,Paper,Stack,Switch,TextField,Typography} from '@mui/material'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import api from '../../Core/Request'
import {workflowError} from '../Workflows/workflowClient'

export type ExpertPermissionKey='can_manage_files'|'can_manage_requests'|'can_manage_visits'|'can_manage_contacts'|'can_manage_followups'|'can_manage_finance'|'can_publish'
export type ExpertPermissionsValue=Record<ExpertPermissionKey,boolean>

const permissionItems:Array<{key:ExpertPermissionKey;title:string;description:string}>=[
 {key:'can_manage_files',title:'فایل‌های ملکی',description:'مشاهده، ثبت و ویرایش فایل‌های مجاز دفتر'},
 {key:'can_publish',title:'انتشار فایل',description:'انتشار فایل پذیرفته‌شده در صفحه عمومی ملکینو'},
 {key:'can_manage_requests',title:'درخواست فایل',description:'مشاهده و پاسخ‌دادن به درخواست خریدار یا مستأجر'},
 {key:'can_manage_contacts',title:'اشخاص و مشتریان',description:'مشاهده و ویرایش مالک، موجر، خریدار و مستأجر'},
 {key:'can_manage_visits',title:'بازدیدها',description:'پذیرش، رد و ثبت روند و نتیجه بازدید'},
 {key:'can_manage_followups',title:'پیگیری‌ها',description:'مدیریت پیگیری بعدی و یادداشت نتیجه مشتری'},
 {key:'can_manage_finance',title:'اطلاعات مالی',description:'مشاهده محاسبه سهم و اسناد مالی مجاز دفتر'},
]
const defaults=Object.fromEntries(permissionItems.map(item=>[item.key,true])) as ExpertPermissionsValue

function normalize(value:any):ExpertPermissionsValue{
 const source=value?.permissions||value||{}
 const aliases:Record<ExpertPermissionKey,string[]>={
  can_manage_files:['can_manage_files','files_view','files_create','files_edit'],
  can_publish:['can_publish','files_publish'],
  can_manage_requests:['can_manage_requests','requests_view','requests_create','requests_respond'],
  can_manage_contacts:['can_manage_contacts','contacts_view','contacts_edit'],
  can_manage_visits:['can_manage_visits','visits_view','visits_respond'],
  can_manage_followups:['can_manage_followups','followups_manage'],
  can_manage_finance:['can_manage_finance','finance_view'],
 }
 return Object.fromEntries(Object.entries(aliases).map(([key,names])=>[key,names.every(name=>source[name]!==false)])) as ExpertPermissionsValue
}

export function ExpertPermissions({expertId,readOnly=false}:{expertId:number;readOnly?:boolean}){
 const [value,setValue]=useState<ExpertPermissionsValue>(defaults),[initial,setInitial]=useState<ExpertPermissionsValue>(defaults)
 const [share,setShare]=useState('0'),[initialShare,setInitialShare]=useState('0')
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const changed=useMemo(()=>share!==initialShare||permissionItems.some(item=>value[item.key]!==initial[item.key]),[value,initial,share,initialShare])
 const load=async()=>{setLoading(true);setError('');try{const response=await api.get(`workflows/expert-permissions/${expertId}/`);const next=normalize(response.data.data),nextShare=String(response.data.data?.expert_share_percent||'0');setValue(next);setInitial(next);setShare(nextShare);setInitialShare(nextShare)}catch(e){setError(workflowError(e))}finally{setLoading(false)}}
 useEffect(()=>{if(expertId)void load()},[expertId])
 const save=async()=>{if(!changed||saving)return;if(Number(share)<0||Number(share)>100){setError('سهم کارشناس باید بین صفر تا صد درصد باشد.');return}setSaving(true);setError('');setNotice('');try{const response=await api.patch(`workflows/expert-permissions/${expertId}/`,{permissions:value,expert_share_percent:share});const next=normalize(response.data.data),nextShare=String(response.data.data?.expert_share_percent||share);setValue(next);setInitial(next);setShare(nextShare);setInitialShare(nextShare);setNotice('اختیارات و سهم کمیسیون کارشناس ذخیره شد و از همین لحظه در سرور اعمال می‌شود.')}catch(e){setError(workflowError(e))}finally{setSaving(false)}}
 if(loading)return <Paper variant="outlined" sx={{p:3,borderRadius:3}}><Stack direction="row" gap={1.5} alignItems="center"><CircularProgress size={22}/><Typography>در حال دریافت اختیارات کارشناس…</Typography></Stack></Paper>
 return <Paper variant="outlined" sx={{p:{xs:2,md:3},borderRadius:3,background:'linear-gradient(145deg,#fff,#f7faff)'}}>
  <Stack direction={{xs:'column',sm:'row'}} gap={2} justifyContent="space-between" alignItems={{sm:'center'}} sx={{mb:2}}><Stack direction="row" gap={1.5} alignItems="center"><Box sx={{width:46,height:46,borderRadius:2.5,display:'grid',placeItems:'center',color:'primary.main',bgcolor:'#eaf1ff'}}><AdminPanelSettingsRoundedIcon/></Box><Box><Typography fontWeight={900}>اختیارات این کارشناس</Typography><Typography variant="body2" color="text.secondary">مدیر دفتر تعیین می‌کند این حساب در محدوده همین دفتر چه عملیات‌هایی انجام دهد.</Typography></Box></Stack><Chip color={changed?'warning':'success'} variant="outlined" label={changed?'تغییر ذخیره‌نشده':'همگام با سرور'}/></Stack>
  {error&&<Alert severity="error" action={<Button onClick={load}>تلاش مجدد</Button>} sx={{mb:2}}>{error}</Alert>}{notice&&<Alert severity="success" onClose={()=>setNotice('')} sx={{mb:2}}>{notice}</Alert>}
  <Grid container spacing={1.5}>{permissionItems.map(item=><Grid item xs={12} md={6} key={item.key}><Paper variant="outlined" sx={{p:1.75,borderRadius:2.5,height:'100%'}}><FormControlLabel sx={{m:0,width:'100%',alignItems:'flex-start'}} control={<Switch checked={value[item.key]} disabled={readOnly||saving} onChange={event=>setValue(old=>({...old,[item.key]:event.target.checked}))}/>} label={<Box sx={{pt:.5}}><Typography fontWeight={800}>{item.title}</Typography><Typography variant="caption" color="text.secondary">{item.description}</Typography></Box>}/></Paper></Grid>)}</Grid>
  <Paper variant="outlined" sx={{p:2,mt:2,borderRadius:2.5}}><TextField type="number" label="سهم کارشناس از کمیسیون کل (درصد)" value={share} onChange={e=>setShare(e.target.value)} disabled={readOnly||saving} inputProps={{min:0,max:100,step:.01}} helperText={`سهم دفتر به‌صورت خودکار ${Math.max(0,100-Number(share||0)).toLocaleString('fa-IR')}٪ محاسبه می‌شود.`}/></Paper>
  <Stack direction="row" justifyContent="flex-end" gap={1} sx={{mt:2}}><Button disabled={!changed||saving} onClick={()=>{setValue(initial);setShare(initialShare)}}>لغو تغییرات</Button><Button variant="contained" disabled={!changed||saving||readOnly} onClick={save}>{saving?'در حال ذخیره…':'ذخیره اختیارات'}</Button></Stack>
 </Paper>
}

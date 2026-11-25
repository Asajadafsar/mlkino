import {useCallback,useContext,useEffect,useRef,useState} from 'react'
import {Alert, Box, Button, Chip, CircularProgress, Divider, Grid, ListItemButton, ListItemIcon, Paper, Stack, Switch, Typography} from '@mui/material'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {Link,useNavigate,useSearchParams} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {selectImpersonation} from '../../redux/ImpersonationSlice'
import {CurrentUserContext} from '../../Core/CurrentUser'
import api from '../../Core/Request'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import {formatDate} from '../../Core/FormatDate'
import {useRealtime} from '../../Core/RealtimeContext'
import {AccountHero} from '../../Components/AccountWorkspace/AccountHero'
import {ProfileDetailsForm,ProfileIdentityHero} from './ProfileDetailsForm'
import PasswordOtpFlow from '../Auth/ChangePassword/PasswordOtpFlow'

const sections=[{id:'profile',label:'اطلاعات شخصی',icon:<PersonOutlineRoundedIcon/>},{id:'security',label:'امنیت و ورود',icon:<ShieldOutlinedIcon/>},{id:'notifications',label:'اطلاع‌رسانی‌ها',icon:<NotificationsNoneRoundedIcon/>},{id:'password',label:'تغییر رمز عبور',icon:<LockOutlinedIcon/>},{id:'sessions',label:'دستگاه‌های متصل',icon:<DevicesOutlinedIcon/>},{id:'privacy',label:'حریم خصوصی',icon:<VisibilityOutlinedIcon/>},{id:'activity',label:'سوابق فعالیت',icon:<HistoryRoundedIcon/>}]
const request=async(path:string)=>{const response=await api.get(`${ACCOUNTS_URL}/${path}/`);return response.data.data}
const profileFromPayload=(payload:any)=>payload?.profile||payload?.user||payload
const errorMessage=(error:any,fallback:string)=>error?.response?.data?.message||error?.message||fallback
export default function Profile(){
 const navigate=useNavigate()
 const {user,setUser}=useContext(CurrentUserContext),{session}=useSelector(selectImpersonation),{lastEvent}=useRealtime()
 const userAtLoad=useRef(user)
 const readonly=Boolean(session?.active)
 const [params,setParams]=useSearchParams(),tab=sections.some(section=>section.id===params.get('tab'))?params.get('tab')!:'profile'
 const [profile,setProfile]=useState<any>(user),[initial,setInitial]=useState<any>(user),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const [preferences,setPreferences]=useState<any>(null),[devices,setDevices]=useState<any[]>([]),[notices,setNotices]=useState<any[]>([]),[activities,setActivities]=useState<any[]>([]),[sectionBusy,setSectionBusy]=useState(false)
 const loadSection=useCallback(async()=>{
  if(readonly&&tab!=='profile')return
  setSectionBusy(true);setError('')
  try{
   if(['security','sessions'].includes(tab)){const data=await request('sessions');setDevices(data.results)}
   if(['notifications','privacy'].includes(tab)){setPreferences(await request('preferences'));if(tab==='notifications'){const data=await request('notifications');setNotices(data.results)}}
   if(tab==='activity'){const data=await request('activity');setActivities(data.results)}
  }catch(error:any){setError(error.message||'دریافت اطلاعات انجام نشد.')}finally{setSectionBusy(false)}
 },[readonly,tab])
 useEffect(()=>{let active=true;request('profile').then(payload=>{if(active){const data=profileFromPayload(payload);if(!data||typeof data!=='object'||!data.id)throw Error('پاسخ پروفایل از سرور کامل نیست.');const merged={...userAtLoad.current,...data};setProfile(merged);setInitial(merged);setUser(merged)}}).catch(error=>{if(active)setError(errorMessage(error,'دریافت پروفایل انجام نشد.'))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[setUser])
 useEffect(()=>{loadSection()},[loadSection])
 useEffect(()=>{if(lastEvent?.event==='account.notification'&&tab==='notifications')loadSection()},[lastEvent,tab,loadSection])
 const run=async(action:()=>Promise<void>)=>{setSaving(true);setError('');setMessage('');try{await action()}catch(error:any){setError(error.message||'ذخیره انجام نشد.')}finally{setSaving(false)}}
 const saveProfile=()=>run(async()=>{
  const allowed=['first_name','last_name','email','birth_date','avatar','postal_code','province','city','address']
  const changed=Object.fromEntries(allowed.filter(key=>profile[key]!==initial[key]).map(key=>[key,profile[key]]))
  if(profile.postal_manual)Object.assign(changed,{postal_manual:true,postal_code:profile.postal_code,province:profile.province,city:profile.city,address:profile.address})
  if(!Object.keys(changed).length){setMessage('اطلاعات تغییری نکرده است.');return}
  let data:any=changed,config:any={}
  if(changed.avatar instanceof File){data=new FormData();Object.entries(changed).forEach(([key,value])=>data.append(key,value instanceof File?value:value===null?'':String(value)));config={headers:{'Content-Type':'multipart/form-data'}}}
  const response=await api.patch(`${ACCOUNTS_URL}/profile/`,data,config)
  const updated=profileFromPayload(response.data?.data)
  if(!updated||typeof updated!=='object'||!updated.id)throw Error('پاسخ ذخیره پروفایل از سرور کامل نیست.')
  const merged={...profile,...updated};setProfile(merged);setInitial(merged);setUser(merged);setMessage('اطلاعات پروفایل ذخیره شد.')
 })
 const savePreferences=(group:string)=>run(async()=>{const response=await api.patch(`${ACCOUNTS_URL}/preferences/`,{[group]:preferences[group]});setPreferences(response.data.data);setMessage('تنظیمات شخصی ذخیره شد.')})
 const togglePreference=async(group:string,key:string,value:boolean)=>{
  if(key==='browser'&&value&&typeof Notification!=='undefined'){const permission=await Notification.requestPermission();if(permission!=='granted'){setError('برای اعلان مرورگر، دسترسی را از تنظیمات مرورگر فعال کنید.');return}}
  setPreferences((previous:any)=>({...previous,[group]:{...previous[group],[key]:value}}))
 }
 const revoke=(id?:string)=>run(async()=>{await api.delete(`${ACCOUNTS_URL}/sessions/${id?id+'/':''}`);const data=await request('sessions');setDevices(data.results);setMessage('نشست انتخاب‌شده بسته شد.')})
 const heading=sections.find(section=>section.id===tab)!
 return <Box className="account-workspace profile-workspace"><AccountHero profile/><Box className="account-layout profile-layout" sx={{display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',lg:'minmax(0,1fr) 235px'},gap:2.5,alignItems:'start'}}>
  <Stack className="account-main profile-main" spacing={2.5} sx={{minWidth:0,order:{xs:2,lg:1}}}>
   <div className="profile-identity-strip"><ProfileIdentityHero value={profile} title={profile.full_name||[profile.first_name,profile.last_name].filter(Boolean).join(' ')||'حساب کاربری'} description={({superadmin:'مدیر سیستم',agency:'مدیر دفتر املاک',expert:'کارشناس املاک',user:'کاربر'} as Record<string,string>)[profile.role]||'حساب کاربری'} onChange={!readonly&&tab==='profile'?setProfile:undefined}/><div className="profile-date-stat"><span>تاریخ عضویت</span><strong>{formatDate(profile.date_joined)}</strong></div><div className="profile-date-stat"><span>آخرین به‌روزرسانی</span><strong>{formatDate(profile.profile_updated_at||profile.date_joined)}</strong></div></div>
   {error&&<Alert severity="error" action={<Button onClick={loadSection}>تلاش مجدد</Button>}>{error}</Alert>}{message&&<Alert severity="success" onClose={()=>setMessage('')}>{message}</Alert>}
   {readonly&&<Alert severity="info">در ورود مدیریتی، پروفایل قابل مشاهده است. برای ویرایش از پرونده کاربر و برای تنظیمات امنیتی از نشست اصلی استفاده کنید.</Alert>}
   <Paper className="profile-form-panel" variant="outlined" sx={{borderRadius:4,overflow:'hidden'}}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{p:2.5,borderBottom:'1px solid',borderColor:'divider'}}><Stack direction="row" alignItems="center" gap={1}><Box sx={{display:'flex',p:1,bgcolor:'#edf3ff',color:'primary.main',borderRadius:3}}>{heading.icon}</Box><Typography fontWeight={700} fontSize={18}>{tab==='profile'?'اطلاعات شخصی':heading.label}</Typography></Stack></Stack>
    <Box sx={{p:{xs:2,md:3}}}>
     {(loading||sectionBusy)&&<Stack alignItems="center" sx={{py:3}}><CircularProgress size={26}/></Stack>}
     {tab==='profile'&&!loading&&<Box component="fieldset" disabled={readonly||saving} sx={{border:0,p:0,m:0,minWidth:0}}><ProfileDetailsForm value={profile} onChange={setProfile} mode="self"/><div className="profile-save-actions"><Button variant="contained" disabled={saving||loading||readonly} onClick={saveProfile}>{saving?'در حال ذخیره…':'ذخیره تغییرات'}</Button><Button variant="outlined" disabled={saving||readonly} onClick={()=>setProfile(initial)}>انصراف از تغییرات</Button></div></Box>}
     {tab==='security'&&!sectionBusy&&<Grid container spacing={2}><Grid item xs={12} md={6}><Paper variant="outlined" sx={{p:3,borderRadius:4}}><ShieldOutlinedIcon color="primary"/><Typography fontWeight={700} sx={{mt:1}}>امنیت رمز عبور</Typography><Typography color="text.secondary" sx={{my:1}}>برای حفظ امنیت حساب، رمز خود را فقط از همین بخش تغییر دهید. پس از تغییر رمز، نشست‌های قدیمی بسته می‌شوند.</Typography><Button onClick={()=>setParams({tab:'password'})}>تغییر رمز عبور</Button></Paper></Grid><Grid item xs={12} md={6}><Paper variant="outlined" sx={{p:3,borderRadius:4}}><DevicesOutlinedIcon color="primary"/><Typography fontWeight={700} sx={{mt:1}}>{devices.length.toLocaleString('fa-IR')} نشست فعال</Typography><Typography color="text.secondary" sx={{my:1}}>دستگاه‌های واردشده را بررسی کنید و نشست‌های دیگر را ببندید.</Typography><Button onClick={()=>setParams({tab:'sessions'})}>مدیریت دستگاه‌ها</Button></Paper></Grid></Grid>}
     {tab==='password'&&<Box sx={{maxWidth:560}}><PasswordOtpFlow authenticated phone={user.phone} onComplete={()=>navigate('/login',{replace:true})}/></Box>}
     {tab==='sessions'&&!sectionBusy&&<Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">فقط نشست‌های حساب شما در این بخش نمایش داده می‌شوند.</Typography><Button color="error" disabled={saving||readonly} onClick={()=>revoke()}>بستن نشست‌های دیگر</Button></Stack>{devices.length?devices.map(device=><Paper variant="outlined" key={device.id} sx={{p:2,borderRadius:3}}><Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" gap={2}><Stack direction="row" gap={1.5}><DevicesOutlinedIcon color="primary"/><Box><Typography fontWeight={700}>{/Mobile|Android|iPhone/i.test(device.user_agent)?'تلفن همراه':'رایانه'} · {/Firefox/i.test(device.user_agent)?'Firefox':/Chrome/i.test(device.user_agent)?'Chrome':/Safari/i.test(device.user_agent)?'Safari':'مرورگر'}</Typography><Typography variant="caption" color="text.secondary" sx={{display:'block'}}>آخرین فعالیت: {formatDate(device.last_seen)}</Typography><Typography variant="caption" color="text.secondary" dir="ltr">IP: {device.ip_address||'—'}</Typography></Box></Stack>{device.current?<Chip size="small" label="همین دستگاه" color="success" variant="outlined"/>:<Button color="error" disabled={saving} onClick={()=>revoke(device.id)}>بستن نشست</Button>}</Stack></Paper>):<Alert severity="info">نشست قابل مدیریتی یافت نشد. یک بار دوباره وارد حساب شوید.</Alert>}</Stack>}
     {['notifications','privacy'].includes(tab)&&preferences&&!sectionBusy&&<Stack spacing={2}>{(tab==='notifications'?[['in_app','اطلاع‌رسانی درون پنل','ثبت و نمایش اعلان‌های جدید در حساب'],['ticket_updates','پاسخ‌های تیکت','اعلان پاسخ جدید پشتیبانی'],['task_updates','وظایف جدید','اعلان کارهای اختصاص‌داده‌شده به شما'],['browser','اعلان مرورگر','پس از اجازه مرورگر، اعلان پیام‌ها را در پس‌زمینه دریافت کنید.']]:[['listed_in_contacts','نمایش در فهرست مخاطبان','افراد دیگر بتوانند نام شما را برای شروع گفتگو پیدا کنند.'],['allow_new_conversations','اجازه گفتگوی جدید','گفتگوهای قبلی با غیرفعال‌کردن این گزینه حفظ می‌شوند.']]).map(([key,label,description])=>{const group=tab==='notifications'?'notifications':'privacy';return <Stack key={key} direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{py:1.5,borderBottom:'1px solid',borderColor:'divider'}}><Box><Typography fontWeight={700}>{label}</Typography><Typography variant="caption" color="text.secondary">{description}</Typography></Box><Switch inputProps={{'aria-label':label}} checked={Boolean(preferences[group][key])} disabled={saving||readonly} onChange={(_,checked)=>togglePreference(group,key,checked)}/></Stack>})}<Button variant="contained" onClick={()=>savePreferences(tab==='notifications'?'notifications':'privacy')} disabled={saving||readonly} sx={{alignSelf:'flex-start'}}>ذخیره تنظیمات</Button>{tab==='notifications'&&<><Divider/><Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>آخرین اطلاع‌رسانی‌ها</Typography><Button onClick={()=>run(async()=>{await api.patch(`${ACCOUNTS_URL}/notifications/`,{});loadSection()})} disabled={saving||readonly}>خواندن همه</Button></Stack>{notices.length?notices.map(notice=><Paper key={notice.id} variant="outlined" sx={{p:2,borderRadius:3,bgcolor:notice.read_at?'transparent':'action.hover'}}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{notice.title}</Typography>{!notice.read_at&&<Chip size="small" label="جدید" color="primary"/>}</Stack><Typography variant="body2" color="text.secondary">{notice.body}</Typography><Stack direction="row" justifyContent="space-between"><Typography variant="caption">{formatDate(notice.created_at)}</Typography>{notice.link&&<Button component={Link} to={notice.link} size="small">مشاهده</Button>}</Stack></Paper>):<Typography color="text.secondary">اطلاع‌رسانی جدیدی ندارید.</Typography>}</>}</Stack>}
     {tab==='activity'&&!sectionBusy&&<Stack spacing={1.5}>{activities.length?activities.map(activity=><Stack key={activity.id} direction="row" gap={1.5} alignItems="center" sx={{p:2,border:'1px solid',borderColor:'divider',borderRadius:3}}><HistoryRoundedIcon color="primary"/><Box sx={{flex:1}}><Typography fontWeight={700}>{activity.metadata?.description||activity.description||activity.action_display||activity.event}</Typography><Typography variant="caption" color="text.secondary">{formatDate(activity.created_at)}</Typography></Box><Chip size="small" variant="outlined" color={activity.status_code>=400?'error':'success'} label={activity.status_code>=400?'ناموفق':'موفق'}/></Stack>):<Typography color="text.secondary">فعالیتی ثبت نشده است.</Typography>}</Stack>}
    </Box>
   </Paper>
   {tab==='profile'&&!loading&&<Alert severity={profile.national_code_verified?'success':'info'}>{profile.national_code_verified?'هویت حساب شما تأیید شده است.':'وضعیت تأیید شماره تماس و هویت در فرم بالا نمایش داده می‌شود.'}</Alert>}
  </Stack>
  <Paper className="account-nav profile-nav" variant="outlined" sx={{p:1.5,borderRadius:4,position:{lg:'sticky'},top:105,order:{xs:1,lg:2}}}><Typography fontWeight={700} textAlign="center" sx={{py:2}}>تنظیمات حساب کاربری</Typography><Box sx={{display:{xs:'flex',lg:'block'},overflowX:'auto'}}>{sections.map(section=><ListItemButton key={section.id} disabled={readonly&&section.id!=='profile'} selected={tab===section.id} onClick={()=>{setParams({tab:section.id});setMessage('');setError('')}} sx={{borderRadius:3,mb:1,minWidth:{xs:155,lg:0},'&.Mui-selected':{bgcolor:'primary.main',color:'#fff'}}}><ListItemIcon sx={{minWidth:34,color:tab===section.id?'#fff':'text.secondary'}}>{section.icon}</ListItemIcon><Typography fontSize={13} whiteSpace="nowrap">{section.label}</Typography></ListItemButton>)}</Box></Paper>
 </Box></Box>
}

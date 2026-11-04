import {useContext,useEffect,useState} from 'react'
import {Alert,Box,Button,Dialog,DialogContent,DialogTitle,LinearProgress} from '@mui/material'
import {Link,useNavigate} from 'react-router-dom'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded'
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import {DataProvider} from '../../Core/DataProvider'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import {useRealtime} from '../../Core/RealtimeContext'
import {formatDate} from '../../Core/FormatDate'
import type {AnnouncementType} from '../Announcement/Announcement'
import {PersonalReminders} from './PersonalReminders'
import TodayImportantTasks from './TodayImportantTasks'
import EstateAnalytics from './EstateAnalytics'
import DashboardMap,{CityPoint} from './DashboardMap'
import DashboardSearch,{SearchValues} from './DashboardSearch'
import './dashboard.css'
export interface FilterState {year:number;month:string}
type Counter={total:number;recent:number;previous:number}
type Overview={counts:Record<string,Counter>;points:CityPoint[];matching_files:number;mapped_files:number}
const metrics=[{key:'files',title:'فایل‌های ملکی',link:'/files',icon:<DescriptionOutlinedIcon/>,color:'#6255f5'},{key:'agencies',title:'دفترهای املاک',link:'/users/agencies',icon:<ApartmentRoundedIcon/>,color:'#f46288'},{key:'experts',title:'کارشناسان',link:'/users/expert',icon:<PeopleOutlineRoundedIcon/>,color:'#9354ef'},{key:'requests',title:'درخواست‌ها',link:'/requests',icon:<BusinessCenterOutlinedIcon/>,color:'#287dff'},{key:'followups',title:'پیگیری‌ها',link:'/follow-ups',icon:<NotificationsNoneRoundedIcon/>,color:'#eba22a'},{key:'contracts',title:'قراردادها',link:'/contracts',icon:<AssignmentOutlinedIcon/>,color:'#476bee'}]
export default function DashboardLayout(){
 const {user}=useContext(CurrentUserContext),{settings}=usePanelSettings(),{conversations}=useRealtime(),navigate=useNavigate()
 const manager=user.role==='superadmin'||user.role==='agency',admin=user.role==='superadmin'
 const [overview,setOverview]=useState<Overview|null>(null),[busy,setBusy]=useState(true),[overviewError,setOverviewError]=useState(''),[retry,setRetry]=useState(0)
 const [filters,setFilters]=useState<SearchValues>({propertyType:'',city:'',district:'',priceFrom:'',priceTo:''}),[searchError,setSearchError]=useState('')
 const [dashboard,setDashboard]=useState<{announcements:{results:AnnouncementType[];total_results:number};important_tasks:{total_results:number;completed_count:number;pending_count:number}}|null>(null),[error,setError]=useState(''),[announcementsOpen,setAnnouncementsOpen]=useState(false)
 const key=JSON.stringify(filters)
 useEffect(()=>{let active=true;setBusy(true);const timer=setTimeout(()=>{DataProvider.get<Overview>('dashboard/estate-overview/',JSON.parse(key)).then(r=>{if(active){setOverview(r.data);setOverviewError('')}}).catch(e=>{if(active)setOverviewError(e.response?.data?.message||'دریافت آمار و نقشه انجام نشد.')}).finally(()=>{if(active)setBusy(false)})},250);return()=>{active=false;clearTimeout(timer)}},[key,retry])
 useEffect(()=>{let active=true;DataProvider.get<any>('dashboard/').then(r=>{if(active)setDashboard(r.data)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 const search=(point?:CityPoint)=>{const values:SearchValues={...filters,...(point?{city:point.city,province:point.province}:{})};if(values.priceFrom&&values.priceTo&&Number(values.priceFrom)>Number(values.priceTo)){setSearchError('حداکثر قیمت نباید کمتر از حداقل باشد.');return}setSearchError('');const params=new URLSearchParams(Object.entries(values).filter(([,v])=>!!v));navigate('/files?'+params.toString())}
 const announcements=dashboard?.announcements.results||[]
 return <Box className="dashboard-home">
 <section className="dashboard-welcome" style={{backgroundImage:"linear-gradient(to left,#e9e7ff 0%,rgba(233,231,255,0) 65%),url('/assets/estate-hero-v1.png')"}}><div><h1>👋 سلام {user.first_name||'دوست عزیز'}</h1><p>به پنل {user.role==='agency'?'دفتر املاک':admin?'مدیریت':'کاربری'} {settings.general.shortName} خوش آمدید.</p></div></section>
 <section className={`dashboard-stat-grid${manager?'':' is-personal'}`} aria-label="خلاصه آمار">{metrics.filter(x=>manager||!['agencies','experts'].includes(x.key)).map(item=>{const count=overview?.counts[item.key];const growth=count&&count.previous?Math.round((count.recent-count.previous)/count.previous*100):null;return <Link className="dashboard-stat-card" key={item.key} to={item.key==='agencies'&&!admin?'/profile':item.link} style={{'--stat-color':item.color} as React.CSSProperties}><div className="dashboard-stat-copy"><strong>{count?count.total.toLocaleString('fa-IR'):'—'}</strong><span>{item.title}</span></div><div className="dashboard-stat-icon">{item.icon}</div><small className={growth!==null&&growth<0?'negative':''} title="ثبت جدید ۳۰ روز اخیر در مقایسه با دوره قبل">{growth!==null?<><ArrowUpwardRoundedIcon style={growth<0?{transform:'rotate(180deg)'}:undefined}/>{Math.abs(growth).toLocaleString('fa-IR')}٪ {growth<0?'کاهش':'رشد'}</>:count?`${count.recent.toLocaleString('fa-IR')} ثبت جدید`:'در حال دریافت'}</small></Link>})}</section>
 {overviewError&&<Alert severity="error" action={<Button onClick={()=>setRetry(x=>x+1)}>تلاش مجدد</Button>}>{overviewError}</Alert>}
 <section className="dashboard-property-workspace"><div className="dashboard-card dashboard-search-card"><div className="dashboard-section-heading"><span><SearchRoundedIcon/>جستجوی سریع ملک</span></div><DashboardSearch values={filters} onChange={x=>{setFilters(x);setSearchError('')}} onSearch={()=>search()}/>{searchError&&<Alert severity="error">{searchError}</Alert>}</div><div className="dashboard-card dashboard-map-card"><div className="dashboard-section-heading"><span><ApartmentRoundedIcon/>نمایش روی نقشه</span><span className="dashboard-map-total">{overview?`${overview.matching_files.toLocaleString('fa-IR')} فایل مطابق جستجو`:'دریافت فایل‌ها…'}</span></div>{busy&&<LinearProgress/>}<DashboardMap points={overview?.points||[]} matching={overview?.matching_files||0} mapped={overview?.mapped_files||0} onSelect={p=>search(p)}/></div></section>
 <section className="dashboard-daily-grid"><div className="dashboard-card dashboard-announcements"><div className="dashboard-section-heading"><span><CampaignOutlinedIcon/>اطلاعیه‌ها</span>{announcements.length>0&&<span className="dashboard-count-badge">{dashboard?.announcements.total_results.toLocaleString('fa-IR')}</span>}</div>{error&&<Alert severity="error">{error}</Alert>}<div className="dashboard-announcement-rows">{announcements.slice(0,2).map(row=><button className="dashboard-announcement-row" key={row.id} onClick={()=>setAnnouncementsOpen(true)}><span className="dashboard-announcement-icon"><DescriptionOutlinedIcon/></span><div><strong>{row.title}</strong><p>{row.description}</p><small>{formatDate(row.created_at)}</small></div></button>)}{dashboard&&!announcements.length&&<div className="dashboard-empty-small">اطلاعیه جدیدی منتشر نشده است.</div>}{!dashboard&&!error&&<LinearProgress/>}</div><button className="dashboard-section-footer" onClick={()=>setAnnouncementsOpen(true)}>مشاهده همه اطلاعیه‌ها ←</button></div>
 <div className="dashboard-card dashboard-today"><div className="dashboard-section-heading"><span><TaskAltRoundedIcon/>کارهای مهم امروز</span><span className="dashboard-count-badge">{dashboard?.important_tasks.total_results.toLocaleString('fa-IR')||'—'}</span></div><TodayImportantTasks compact onUpdated={()=>{DataProvider.get<any>('dashboard/').then(r=>setDashboard(r.data)).catch(()=>setError('به‌روزرسانی خلاصه وظایف انجام نشد.'))}}/><Link to="/tasks" className="dashboard-section-footer">مدیریت وظایف ←<small>{dashboard?`${dashboard.important_tasks.completed_count.toLocaleString('fa-IR')} انجام شده`:''}</small></Link></div><div className="dashboard-card dashboard-upcoming"><PersonalReminders compact/></div></section>
 {manager&&<EstateAnalytics admin={admin} embedded/>}
 <section className="dashboard-shortcuts">{settings.features.chats&&<Link to="/chats"><ForumOutlinedIcon/><span>گفتگوهای من</span><strong>{conversations.length.toLocaleString('fa-IR')}</strong><small>{conversations.reduce((s,c)=>s+c.unread_count,0).toLocaleString('fa-IR')} پیام خوانده‌نشده</small></Link>}<Link to="/reminders"><NotificationsNoneRoundedIcon/><span>یادآوری شخصی</span><small>زمان‌بندی و پیگیری کارها</small></Link><Link to="/tasks"><TaskAltRoundedIcon/><span>کارهای امروز</span><small>{dashboard?.important_tasks.pending_count.toLocaleString('fa-IR')||'۰'} کار در انتظار</small></Link></section>
 <Dialog fullWidth maxWidth="md" open={announcementsOpen} onClose={()=>setAnnouncementsOpen(false)}><DialogTitle>اطلاعیه‌های سامانه<Button onClick={()=>setAnnouncementsOpen(false)} sx={{float:'left'}}>بستن</Button></DialogTitle><DialogContent><div className="dashboard-all-announcements">{announcements.map(row=><article key={row.id}><h3>{row.title}</h3><p>{row.description}</p><small>{formatDate(row.created_at)}</small></article>)}{!announcements.length&&<p>اطلاعیه‌ای منتشر نشده است.</p>}</div></DialogContent></Dialog>
 </Box>
}

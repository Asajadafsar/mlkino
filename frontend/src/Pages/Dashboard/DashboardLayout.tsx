import DashboardExplorer from './DashboardExplorer'
import DashboardReporting,{FilteredReportCard} from './DashboardReporting'
import {DashboardRecent,DashboardSnapshot} from './DashboardInsights'
import DashboardReferenceSearch from './DashboardReferenceSearch'
import DashboardFeatured from './DashboardFeatured'
import {FileRecord} from '../Files/filePresentation'
import {SidebarBrandMark} from '../../Components/Drawer/SidebarArtwork'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import {useContext,useEffect,useState} from 'react'
import {Alert,Box,Button} from '@mui/material'
import {Link} from 'react-router-dom'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import {DataProvider} from '../../Core/DataProvider'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import type {SearchValues} from './DashboardSearch'
import {validatePropertySearch} from '../../Components/Estate/AdvancedPropertySearch'
import './dashboard.css'
export interface FilterState {year:number;month:string}
type Overview=DashboardSnapshot
const metrics=[{key:'files',title:'ملک ثبت‌شده',link:'/files',icon:<HomeOutlined/>,color:'#0866ff'},{key:'requests',title:'درخواست جدید',link:'/requests',icon:<AssignmentOutlinedIcon/>,color:'#ef8a35'},{key:'customers',title:'مشتری',link:'/customers',icon:<PeopleOutlineRoundedIcon/>,color:'#25b883'},{key:'contracts',title:'قرارداد',link:'/contracts',icon:<DescriptionOutlinedIcon/>,color:'#6369e9'},{key:'experts',title:'مشاور',link:'/users/expert',icon:<PeopleOutlineRoundedIcon/>,color:'#28b662'},{key:'followups',title:'پیگیری',link:'/follow-ups',icon:<NotificationsNoneRoundedIcon/>,color:'#9857f7'}]
export default function DashboardLayout(){
 const {user}=useContext(CurrentUserContext),{settings}=usePanelSettings()
 const manager=user.role==='superadmin'||user.role==='agency',admin=user.role==='superadmin'
 const [overview,setOverview]=useState<Overview|null>(null),[,setBusy]=useState(true),[overviewError,setOverviewError]=useState(''),[retry,setRetry]=useState(0)
 const [filters,setFilters]=useState<SearchValues>({contractType:'فروش'}),[searchError,setSearchError]=useState(''),[searchRequest,setSearchRequest]=useState(0)
 const [featured,setFeatured]=useState<FileRecord[]>([]),[latestFiles,setLatestFiles]=useState<FileRecord[]>([]),[latestRequests,setLatestRequests]=useState<any[]>([]),[propertyError,setPropertyError]=useState('')
 useEffect(()=>{let active=true;Promise.allSettled([DataProvider.get<{results:FileRecord[]}>('files/',{page_size:100}),DataProvider.get<{results:FileRecord[]}>('files/',{page_size:5}),DataProvider.get<{results:any[]}>('requests/',{page_size:100})]).then(results=>{if(!active)return;const [special,latest,requests]=results;if(special.status==='fulfilled'&&Array.isArray(special.value.data.results))setFeatured(special.value.data.results.filter(file=>!!(file as any).featured||!!(file as any).pinned).slice(0,12));else if(special.status==='rejected')setPropertyError('دریافت املاک ویژه انجام نشد.');if(latest.status==='fulfilled'&&Array.isArray(latest.value.data.results))setLatestFiles(latest.value.data.results);if(requests.status==='fulfilled'&&Array.isArray(requests.value.data.results))setLatestRequests(requests.value.data.results)});return()=>{active=false}},[retry])
 useEffect(()=>{const timer=setInterval(()=>setRetry(x=>x+1),30000);return()=>clearInterval(timer)},[])
 const validation=validatePropertySearch(filters)
 const key=JSON.stringify({presence:'all',detail:'1',map_layers:'files'})
 useEffect(()=>{let active=true;setBusy(true);const timer=setTimeout(()=>{DataProvider.get<Overview>('dashboard/estate-overview/',JSON.parse(key)).then(r=>{if(active){setOverview(r.data);setOverviewError('')}}).catch(e=>{if(active)setOverviewError(e.response?.data?.message||'دریافت آمار انجام نشد.')}).finally(()=>{if(active)setBusy(false)})},250);return()=>{active=false;clearTimeout(timer)}},[key,retry])
 const showResults=()=>{setSearchError(validation);if(!validation)setSearchRequest(value=>value+1)}
 return <Box className="dashboard-home">
 <section className="dashboard-welcome" style={{backgroundImage:"linear-gradient(to left,#102a57 0%,#204a92e8 32%,#336bc550 62%,transparent 85%),url('/assets/estate-hero-v1.webp')"}}><div className="dash-welcome-brand"><SidebarBrandMark/><strong>{settings.general.shortName}</strong><small>مدیریت هوشمند املاک</small></div><div className="dash-welcome-copy"><h1>👋 سلام {user.first_name||'دوست'} عزیز</h1><p>به داشبورد مدیریتی {settings.general.shortName} خوش آمدید</p><small>نمای کلی عملکرد امروز، وضعیت املاک، درخواست‌ها و تیم مشاوران شما</small><div className="dash-welcome-options"><span><CalendarMonthOutlined/>امروز: {new Date().toLocaleDateString('fa-IR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tehran'})}</span><span>بازه عملکرد: ۳۰ روز گذشته</span></div></div><Link className="dash-welcome-total" to="/files"><HomeOutlined/><strong>{overview?.counts.files?.total.toLocaleString('fa-IR')||'—'}</strong><small>ملک در مدیریت</small></Link></section>
 <section className={`dashboard-stat-grid${manager?'':' is-personal'}`} aria-label="خلاصه آمار">{metrics.filter(x=>manager||!['customers','experts'].includes(x.key)).map(item=>{const actualKey=item.key;const title=item.title;const count=overview?.counts[actualKey]||overview?.counts[item.key];const growth=count&&count.previous?Math.round((count.recent-count.previous)/count.previous*100):null;return <Link className="dashboard-stat-card" key={item.key} to={item.key==='agencies'&&!admin?'/profile':item.link} style={{'--stat-color':item.color} as React.CSSProperties}><div className="dashboard-stat-copy"><strong>{count?count.total.toLocaleString('fa-IR'):'—'}</strong><span>{title}</span></div><div className="dashboard-stat-icon">{item.icon}</div><small className={growth!==null&&growth<0?'negative':''} title="ثبت جدید ۳۰ روز اخیر در مقایسه با دوره قبل">{growth!==null?<><ArrowUpwardRoundedIcon style={growth<0?{transform:'rotate(180deg)'}:undefined}/>{Math.abs(growth).toLocaleString('fa-IR')}٪ {growth<0?'کاهش':'رشد'}</>:count?`${count.recent.toLocaleString('fa-IR')} ثبت جدید`:'در حال دریافت'}</small></Link>})}</section>
 {overviewError&&<Alert severity="error" action={<Button onClick={()=>setRetry(x=>x+1)}>تلاش مجدد</Button>}>{overviewError}</Alert>}
 <section className="dashboard-card" aria-label="جستجوی سریع ملک">
  <DashboardReferenceSearch values={filters} onChange={value=>{setFilters(value);setSearchError('')}} onSearch={showResults}/>
  {searchError&&<Alert severity="error">{searchError}</Alert>}
 </section>
 <div className="dash-property-map-row"><DashboardFeatured files={featured} error={propertyError}/>
 <DashboardExplorer compact includeRequests={user.role==='expert'} searchRequest={searchRequest} admin={admin} manager={manager} filters={filters} onChange={setFilters}/></div>
 <DashboardReporting admin={admin}/>
 {!admin&&<DashboardRecent data={overview} files={latestFiles} requests={latestRequests} manager={manager} hideSummary/>}
 <FilteredReportCard title="شاخص فایل‌های ثبت‌شده" kind="market"/>
 </Box>
}

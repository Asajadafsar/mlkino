import {DashboardCharts,DashboardRecent,DashboardSnapshot} from './DashboardInsights'
import {useContext,useEffect,useState} from 'react'
import {Alert,Box,Button,LinearProgress} from '@mui/material'
import {Link,useNavigate} from 'react-router-dom'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded'
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import {DataProvider} from '../../Core/DataProvider'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import DashboardMap,{CityPoint} from './DashboardMap'
import DashboardSearch,{SearchValues} from './DashboardSearch'
import {validatePropertySearch} from '../../Components/Estate/AdvancedPropertySearch'
import './dashboard.css'
export interface FilterState {year:number;month:string}
type Overview=DashboardSnapshot
const metrics=[{key:'files',title:'فایل‌های ملکی',link:'/files',icon:<DescriptionOutlinedIcon/>,color:'#0866ff'},{key:'requests',title:'درخواست‌های ملکی',link:'/requests',icon:<ApartmentRoundedIcon/>,color:'#ff477c'},{key:'experts',title:'کارشناسان',link:'/users/expert',icon:<AssignmentOutlinedIcon/>,color:'#00bdad'},{key:'agencies',title:'دفترهای املاک',link:'/users/agencies',icon:<PeopleOutlineRoundedIcon/>,color:'#943cff'},{key:'contracts',title:'قراردادها',link:'/contracts',icon:<BusinessCenterOutlinedIcon/>,color:'#087aff'},{key:'followups',title:'پیگیری‌ها',link:'/follow-ups',icon:<NotificationsNoneRoundedIcon/>,color:'#ffb000'}]
export default function DashboardLayout(){
 const {user}=useContext(CurrentUserContext),{settings}=usePanelSettings(),navigate=useNavigate()
 const manager=user.role==='superadmin'||user.role==='agency',admin=user.role==='superadmin'
 const [overview,setOverview]=useState<Overview|null>(null),[busy,setBusy]=useState(true),[overviewError,setOverviewError]=useState(''),[retry,setRetry]=useState(0)
 const [filters,setFilters]=useState<SearchValues>({propertyType:'',city:'',district:'',priceFrom:'',priceTo:''}),[searchError,setSearchError]=useState('')
 const [layers,setLayers]=useState(['files','requests','contracts',...(admin?['agencies','experts','users']:manager?['experts']:[])])
 const [presence,setPresence]=useState('all')
 useEffect(()=>{const timer=setInterval(()=>setRetry(x=>x+1),30000);return()=>clearInterval(timer)},[])
 const key=JSON.stringify({...filters,presence,map_layers:layers.join('|')})
 useEffect(()=>{let active=true;setBusy(true);const timer=setTimeout(()=>{DataProvider.get<Overview>('dashboard/estate-overview/',JSON.parse(key)).then(r=>{if(active){setOverview(r.data);setOverviewError('')}}).catch(e=>{if(active)setOverviewError(e.response?.data?.message||'دریافت آمار و نقشه انجام نشد.')}).finally(()=>{if(active)setBusy(false)})},250);return()=>{active=false;clearTimeout(timer)}},[key,retry])
 const search=(point?:CityPoint)=>{if(point?.kind==='contracts'){navigate('/contracts');return}const values:SearchValues={...filters,...(point?{city:point.city,province:point.province}:{})};const validation=validatePropertySearch(values);if(validation){setSearchError(validation);return}setSearchError('');const params=new URLSearchParams(Object.entries({...values,advanced:'1'}).filter(([,v])=>!!v));navigate((point?.kind==='requests'?'/requests?':'/files?')+params.toString())}
 return <Box className="dashboard-home">
 <section className="dashboard-welcome" style={{backgroundImage:"linear-gradient(to left,#07329f 0%,#1656cfed 28%,rgba(37,99,235,.08) 72%),url('/assets/estate-hero-v1.webp')"}}><div><h1>👋 سلام {user.first_name||'دوست عزیز'}</h1><p>به پنل {user.role==='agency'?'دفتر املاک':admin?'مدیریت':'کاربری'} {settings.general.shortName} خوش آمدید.</p></div></section>
 <section className={`dashboard-stat-grid${manager?'':' is-personal'}`} aria-label="خلاصه آمار">{metrics.filter(x=>manager||!['agencies','experts'].includes(x.key)).map(item=>{const actualKey=item.key;const title=item.title;const count=overview?.counts[actualKey]||overview?.counts[item.key];const growth=count&&count.previous?Math.round((count.recent-count.previous)/count.previous*100):null;return <Link className="dashboard-stat-card" key={item.key} to={item.key==='agencies'&&!admin?'/profile':item.link} style={{'--stat-color':item.color} as React.CSSProperties}><div className="dashboard-stat-copy"><strong>{count?count.total.toLocaleString('fa-IR'):'—'}</strong><span>{title}</span></div><div className="dashboard-stat-icon">{item.icon}</div><small className={growth!==null&&growth<0?'negative':''} title="ثبت جدید ۳۰ روز اخیر در مقایسه با دوره قبل">{growth!==null?<><ArrowUpwardRoundedIcon style={growth<0?{transform:'rotate(180deg)'}:undefined}/>{Math.abs(growth).toLocaleString('fa-IR')}٪ {growth<0?'کاهش':'رشد'}</>:count?`${count.recent.toLocaleString('fa-IR')} ثبت جدید`:'در حال دریافت'}</small></Link>})}</section>
 {overviewError&&<Alert severity="error" action={<Button onClick={()=>setRetry(x=>x+1)}>تلاش مجدد</Button>}>{overviewError}</Alert>}
 <section className="dashboard-card dashboard-filter-bar" aria-label="فیلترهای پیشخوان"><DashboardSearch toolbar onApply={()=>setRetry(x=>x+1)} values={filters} onChange={x=>{setFilters(x);setSearchError('')}} onSearch={()=>search()}/><div className="dashboard-period"><span>بازه زمانی آمار</span><strong>{new Date(Date.now()-29*86400000).toLocaleDateString('fa-IR')} ـ {new Date().toLocaleDateString('fa-IR')}</strong></div></section>
 <section className="dashboard-property-workspace">
 <div className="dashboard-search-card"><DashboardSearch count={overview?.matching_files} values={filters} onChange={x=>{setFilters(x);setSearchError('')}} onSearch={()=>search()}/>{searchError&&<Alert severity="error">{searchError}</Alert>}</div>
 <div className="dashboard-card dashboard-map-card" id="dashboard-map"><div className="dashboard-section-heading"><span><DescriptionOutlinedIcon/>نقشه املاک و درخواست‌ها</span><small>{overview?overview.matching_files.toLocaleString('fa-IR')+' فایل':'در حال دریافت…'}</small></div>{busy&&<LinearProgress/>}<div className="dashboard-map-stage"><DashboardMap points={overview?.points||[]} matching={overview?.matching_items??overview?.matching_files??0} mapped={overview?.mapped_items??overview?.mapped_files??0} onSelect={p=>search(p)}/>
 <div className="dashboard-map-layers">{[['files','فایل‌های ملکی'],['requests','درخواست‌ها'],['contracts','قراردادها'],...(admin?[['agencies','دفاتر املاک'],['experts','کارشناسان'],['users','کاربران']]:manager?[['experts','کارشناسان من']]:[])].map(([key,label])=><label key={key}>{key==='agencies'?<ApartmentRoundedIcon/>:key==='users'||key==='experts'?<PeopleOutlineRoundedIcon/>:key==='contracts'?<AssignmentOutlinedIcon/>:<DescriptionOutlinedIcon/>}<span>{label}</span><input type="checkbox" checked={layers.includes(key)} onChange={e=>setLayers(old=>e.target.checked?[...old,key]:old.filter(x=>x!==key))}/></label>)}{manager&&<select aria-label="وضعیت حضور روی نقشه" value={presence} onChange={e=>setPresence(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="online">فقط آنلاین</option><option value="offline">فقط آفلاین</option></select>}</div></div></div>
 </section>
 <DashboardCharts data={overview}/>
 <DashboardRecent data={overview}/>
 </Box>
}

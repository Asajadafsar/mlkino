import {DashboardCharts,DashboardRecent,DashboardSnapshot} from './DashboardInsights'
import {useContext,useEffect,useState} from 'react'
import {Alert,Box,Button,Checkbox,FormControlLabel,LinearProgress,Stack,ToggleButton,ToggleButtonGroup} from '@mui/material'
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
import DashboardResults,{layerLabels} from './DashboardResults'
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
 const [layers,setLayers]=useState<string[]>([])
 const [view,setView]=useState<'map'|'list'>('map'),[demo,setDemo]=useState(false)
 const layerOptions=['files','requests','contracts',...(admin?['agencies','experts','users']:manager?['agencies','experts']:[])]
 const [presence,setPresence]=useState('all')
 useEffect(()=>{const timer=setInterval(()=>setRetry(x=>x+1),30000);return()=>clearInterval(timer)},[])
 const validation=validatePropertySearch(filters)
 const key=JSON.stringify({...filters,...(validation?{priceFrom:'',priceTo:'',areaFrom:'',areaTo:''}:{}),presence,detail:'1',demo:demo?'1':'0',map_layers:layers.join('|')})
 useEffect(()=>{let active=true;setBusy(true);const timer=setTimeout(()=>{DataProvider.get<Overview>('dashboard/estate-overview/',JSON.parse(key)).then(r=>{if(active){setOverview(r.data);setOverviewError('')}}).catch(e=>{if(active)setOverviewError(e.response?.data?.message||'دریافت آمار و نقشه انجام نشد.')}).finally(()=>{if(active)setBusy(false)})},250);return()=>{active=false;clearTimeout(timer)}},[key,retry])
 const showResults=(mode:'map'|'list')=>{
  const error=validatePropertySearch(filters)
  setSearchError(error)
  if(error)return
  setLayers(old=>old.includes('files')?old:[...old,'files'])
  setView(mode)
  requestAnimationFrame(()=>document.getElementById('dashboard-map')?.scrollIntoView?.({behavior:'smooth',block:'start'}))
 }
 const openPoint=(point:CityPoint)=>{
  if(demo)return
  if(point.kind==='contracts'){navigate('/contracts');return}
  if(point.id&&(point.kind==='files'||point.kind==='requests'))navigate('/'+point.kind+'?demo=0&detail='+point.id)
 }
 return <Box className="dashboard-home">
 <section className="dashboard-welcome" style={{backgroundImage:"linear-gradient(to left,#07329f 0%,#1656cfed 28%,rgba(37,99,235,.08) 72%),url('/assets/estate-hero-v1.webp')"}}><div><h1>👋 سلام {user.first_name||'دوست عزیز'}</h1><p>به پنل {user.role==='agency'?'دفتر املاک':admin?'مدیریت':'کاربری'} {settings.general.shortName} خوش آمدید.</p></div></section>
 <section className={`dashboard-stat-grid${manager?'':' is-personal'}`} aria-label="خلاصه آمار">{metrics.filter(x=>manager||!['agencies','experts'].includes(x.key)).map(item=>{const actualKey=item.key;const title=item.title;const count=overview?.counts[actualKey]||overview?.counts[item.key];const growth=count&&count.previous?Math.round((count.recent-count.previous)/count.previous*100):null;return <Link className="dashboard-stat-card" key={item.key} to={item.key==='agencies'&&!admin?'/profile':item.link} style={{'--stat-color':item.color} as React.CSSProperties}><div className="dashboard-stat-copy"><strong>{count?count.total.toLocaleString('fa-IR'):'—'}</strong><span>{title}</span></div><div className="dashboard-stat-icon">{item.icon}</div><small className={growth!==null&&growth<0?'negative':''} title="ثبت جدید ۳۰ روز اخیر در مقایسه با دوره قبل">{growth!==null?<><ArrowUpwardRoundedIcon style={growth<0?{transform:'rotate(180deg)'}:undefined}/>{Math.abs(growth).toLocaleString('fa-IR')}٪ {growth<0?'کاهش':'رشد'}</>:count?`${count.recent.toLocaleString('fa-IR')} ثبت جدید`:'در حال دریافت'}</small></Link>})}</section>
 {overviewError&&<Alert severity="error" action={<Button onClick={()=>setRetry(x=>x+1)}>تلاش مجدد</Button>}>{overviewError}</Alert>}
 <section className="dashboard-card" aria-label="جستجوی سریع ملک">
  <DashboardSearch count={overview?.matching_files} values={filters} onChange={value=>{setFilters(value);setSearchError('')}} onSearch={()=>showResults('list')} onMap={()=>showResults('map')} demo={demo} officeOptions={overview?.offices||[]}/>
  {searchError&&<Alert severity="error">{searchError}</Alert>}
 </section>
 <section className="dashboard-card dashboard-map-card" id="dashboard-map" aria-label="نقشه و فهرست ملکینو">
  <Stack spacing={1.5} sx={{p:2}}>
   <div className="dashboard-section-heading"><span><DescriptionOutlinedIcon/>حضور و پراکندگی کاربران، دفترها و املاک</span></div>
   <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
    <ToggleButtonGroup value={view} exclusive size="small" onChange={(_,next)=>next&&setView(next)}>
     <ToggleButton value="map">نقشه</ToggleButton><ToggleButton value="list">فهرست</ToggleButton>
    </ToggleButtonGroup>
    <FormControlLabel control={<Checkbox checked={demo} onChange={(_,checked)=>{setDemo(checked);setFilters(checked?{province:'قم',city:'قم'}:{});setLayers([])}}/>} label="داده‌های نمونه قم"/>
    <Button component="a" href="#dashboard-map-filters" size="small">فیلتر محدوده</Button>
   </Stack>
   <Box id="dashboard-map-filters">
    <DashboardSearch toolbar values={filters} onChange={setFilters} onApply={()=>setRetry(x=>x+1)} onSearch={()=>setRetry(x=>x+1)} demo={demo}/>
   </Box>
   <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
    {layerOptions.map(key=><FormControlLabel key={key} control={<Checkbox size="small" checked={layers.includes(key)} onChange={(_,checked)=>setLayers(old=>checked?[...old,key]:old.filter(value=>value!==key))}/>} label={layerLabels[key]}/>)}
    {manager&&<select aria-label="وضعیت حضور روی نقشه" value={presence} onChange={e=>setPresence(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="online">فقط آنلاین</option><option value="offline">فقط آفلاین</option></select>}
   </Stack>
  </Stack>
  {busy&&<LinearProgress/>}
  {!layers.length&&<Alert severity="info">برای نمایش روی نقشه یا در فهرست، یک دسته را انتخاب کنید.</Alert>}
  {view==='map'?<DashboardMap points={layers.length?overview?.points||[]:[]} matching={overview?.matching_items||0} mapped={overview?.mapped_items||0} onSelect={openPoint}/>:layers.length>0&&<DashboardResults rows={overview?.rows||[]} demo={demo} total={overview?.matching_items||0}/>}
 </section>
 <DashboardCharts data={overview}/>
 <DashboardRecent data={overview}/>
 </Box>
}

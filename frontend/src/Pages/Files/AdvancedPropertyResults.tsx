import '../../Components/Estate/estate.css'
import {useEffect,useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {Alert,Box,Button,CircularProgress,Pagination} from '@mui/material'
import ViewListOutlined from '@mui/icons-material/ViewListOutlined'
import GridViewOutlined from '@mui/icons-material/GridViewOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import AdvancedPropertySearch,{PropertySearchValues,propertySearchFields,validatePropertySearch} from '../../Components/Estate/AdvancedPropertySearch'
import {EstateProperty} from '../../Components/Estate/EstateProperty'
import type {PropertyType} from '../../Components/PropertyRecordForm'
import {DataProvider} from '../../Core/DataProvider'
import DashboardMap,{CityPoint} from '../Dashboard/DashboardMap'
import '../Dashboard/dashboard.css'
export default function AdvancedPropertyResults(){
 const [query,setQuery]=useSearchParams(),key=query.toString()
 const [values,setValues]=useState<PropertySearchValues>(()=>Object.fromEntries(query)),[view,setView]=useState<'card'|'list'|'map'>('card'),[error,setError]=useState(''),[validation,setValidation]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0)
 const [result,setResult]=useState<{results:PropertyType[];total_results:number}>({results:[],total_results:0}),[points,setPoints]=useState<CityPoint[]>([]),[mapped,setMapped]=useState(0)
 useEffect(()=>{setValues(Object.fromEntries(new URLSearchParams(key)));setValidation('')},[key])
 useEffect(()=>{let active=true;setLoading(true);setError('');const params=Object.fromEntries(new URLSearchParams(key)),mapParams:Record<string,string>={...params,map_layers:'files'};Promise.all([DataProvider.get<typeof result>('files/',params),...(view==='map'?[DataProvider.get<{points:CityPoint[];mapped_files:number}>('dashboard/estate-overview/',mapParams)]:[])]).then(([response,map])=>{if(!active)return;setResult(response.data);if(map){const data=map.data as {points:CityPoint[];mapped_files:number};setPoints(data.points);setMapped(data.mapped_files)}}).catch(e=>{if(active)setError(e.response?.data?.message||e.message||'دریافت نتیجه جستجو انجام نشد.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[key,view,retry])
 const search=()=>{const message=validatePropertySearch(values);setValidation(message);if(message)return false;const next=new URLSearchParams({advanced:'1'});propertySearchFields.forEach(k=>{if(values[k])next.set(k,values[k])});next.set('ordering',query.get('ordering')||'-created_at');setQuery(next);return true}
 const changeQuery=(field:string,value:string)=>{const next=new URLSearchParams(query);next.set(field,value);if(field!=='page')next.delete('page');setQuery(next)}
 return <Box className="estate-page property-search-results"><AdvancedPropertySearch values={values} onChange={setValues} onSearch={search} count={loading?undefined:result.total_results} onMap={()=>{if(search())setView('map')}}/>{validation&&<Alert severity="error">{validation}</Alert>}
 <div className="property-search-results-toolbar"><span className="property-search-count">{loading?'در حال جستجو…':`${result.total_results.toLocaleString('fa-IR')} فایل یافت شد`}</span><label>مرتب‌سازی: <select aria-label="مرتب‌سازی نتایج" value={query.get('ordering')||'-created_at'} onChange={e=>changeQuery('ordering',e.target.value)}><option value="-created_at">جدیدترین</option><option value="created_at">قدیمی‌ترین</option></select></label><div className="property-search-view">{([['list','لیستی',<ViewListOutlined/>],['card','شبکه‌ای',<GridViewOutlined/>],['map','نقشه',<MapOutlined/>]] as const).map(([mode,label,icon])=><button key={mode} type="button" aria-pressed={view===mode} onClick={()=>setView(mode)}>{icon}{label}</button>)}</div></div>
 {error?<Alert severity="error" action={<Button onClick={()=>setRetry(x=>x+1)}>تلاش مجدد</Button>}>{error}</Alert>:loading?<Box display="flex" justifyContent="center" p={5}><CircularProgress/></Box>:view==='map'?<DashboardMap points={points} mapped={mapped} matching={result.total_results} onSelect={point=>{const next=new URLSearchParams(query);next.set('province',point.province);next.set('city',point.city);next.delete('district');next.delete('neighborhood');next.delete('page');setQuery(next);setView('card')}}/>:!result.results.length?<Box textAlign="center" p={5}>موردی با این فیلترها پیدا نشد.</Box>:<><Box className={view==='card'?'estate-grid':''} sx={view==='list'?{display:'grid',gap:1.5}:undefined}>{result.results.map(item=><EstateProperty key={item.id} item={item} mode="file" layout={view} supplementary/>)}</Box><Pagination aria-label="صفحه‌بندی نتایج" sx={{mt:3,display:'flex',justifyContent:'center'}} page={Number(query.get('page'))||1} count={Math.ceil(result.total_results/24)} onChange={(_,page)=>changeQuery('page',String(page))}/></>}
 </Box>
}

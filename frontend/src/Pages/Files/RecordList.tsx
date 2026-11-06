import {useNavigate} from 'react-router-dom'
import {Alert,Box,Button,CircularProgress,Pagination,Stack,Tab,Tabs,Typography} from '@mui/material'
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import {useCallback,useEffect,useRef,useState} from 'react'
import {useQueryParams} from 'use-query-params'
import {EstateHero,EstateStats,EstateToolbar,EstateFilter} from '../../Components/Estate/EstateWorkspace'
import {EstateProperty} from '../../Components/Estate/EstateProperty'
import {DataProvider} from '../../Core/DataProvider'
import {createQueryParam} from '../../Core/QueryParams'
import {PropertyType} from '../../Components/PropertyRecordForm'
import {useViewMode} from '../../Core/useViewMode'
const choices=(items:string[])=>items.map(value=>({label:value,value}))
const filters:EstateFilter[]=[{field:'propertyType',label:'نوع ملک',options:choices(['آپارتمان','ویلایی','زمین','تجاری','سوله','پیش فروش'])},{field:'city',label:'شهر',options:choices(['تهران','مشهد','اصفهان','کرج','شیراز','تبریز','قم'])},{field:'areaFrom',label:'حداقل متراژ',type:'number'},{field:'areaTo',label:'حداکثر متراژ',type:'number'},{field:'priceFrom',label:'حداقل قیمت',type:'number'},{field:'priceTo',label:'حداکثر قیمت',type:'number'},{field:'contractType',label:'نوع معامله',options:choices(['فروش','رهن و اجاره'])},{field:'province',label:'استان'},{field:'district',label:'منطقه'},{field:'neighborhood',label:'محله'}]
export function RecordList({mode,requesterType}:{mode:'file'|'request';requesterType?:'owner'|'customer'}) {
 const navigate=useNavigate(),resource=mode==='file'?'files':'requests'
 const [params,setParams]=useQueryParams(createQueryParam([...filters,{field:'requesterType'}]) as any)
 const [cities,setCities]=useState<string[]>([])
 useEffect(()=>{let active=true;DataProvider.get<{results:{name:string}[]}>('locations/?level=city&all=true').then(response=>{if(active)setCities(Array.from(new Set(response.data.results.map(row=>row.name))))}).catch(()=>{});return()=>{active=false}},[])
 const visibleFilters=filters.map(filter=>filter.field==='city'?{...filter,options:cities.length?choices(cities):undefined}:filter)
 const [view,setView]=useViewMode(resource,mode==='file'?'card':'list')
 const [loading,setLoading]=useState(true),[error,setError]=useState('')
 const [result,setResult]=useState<{results:PropertyType[];total_results:number;stats?:{total:number;active:number;customer:number;owner:number}}>({results:[],total_results:0})
 const requestVersion=useRef(0),key=JSON.stringify({...params,...(requesterType?{requesterType}:{})})
 const load=useCallback(async()=>{const version=++requestVersion.current;setLoading(true);setError('');try{const response=await DataProvider.get<typeof result>(`${resource}/`,JSON.parse(key));if(version===requestVersion.current)setResult(response.data)}catch(e:any){if(version===requestVersion.current)setError(e.message||'دریافت فهرست انجام نشد.')}finally{if(version===requestVersion.current)setLoading(false)}},[resource,key])
 useEffect(()=>{requestVersion.current++;const timer=setTimeout(load,300);return()=>clearTimeout(timer)},[load])
 const change=(field:string,value:string)=>setParams(current=>({...current,[field]:value||undefined,page:1}))
 const stats=result.stats||{total:result.total_results,active:result.results.filter(r=>r.status==='فعال').length,customer:result.total_results,owner:0}
 const toolbar=<EstateToolbar search={params.search||''} onSearch={value=>change('search',value)} view={view} onView={setView} onCreate={()=>navigate(`/${resource}/create`)} createLabel={mode==='request'?'ثبت درخواست':'جدید'} placeholder={mode==='file'?'جستجو در فایل‌ها…':'جستجو در درخواست‌ها…'} quickFilterCount={mode==='request'?0:3} filters={visibleFilters} values={params} onFilter={change}/>
 return <Box className="estate-page"><EstateHero title={mode==='file'?'مدیریت فایل‌های ملکی':'درخواست‌ها'} description={mode==='file'?'ایجاد، مشاهده و مدیریت فایل‌های ملک':'مدیریت و پیگیری درخواست‌های خرید، فروش، رهن و اجاره'}/>
 {mode==='request'&&<EstateStats reverse items={[{label:'کل درخواست‌ها',value:stats.total},{label:'درخواست فعال',value:stats.active},{label:'درخواست مالکین',value:stats.owner},{label:'درخواست مشتریان',value:stats.customer,icon:<PeopleOutlineRoundedIcon/>}]}/>}
 <Box className={mode==='request'?'estate-request-panel':''}>{mode==='request'&&!requesterType&&<Tabs className="estate-tabs" value={params.requesterType||''} onChange={(_,next)=>change('requesterType',next)} variant="fullWidth"><Tab icon={<LayersOutlinedIcon/>} iconPosition="start" label="همه درخواست‌ها" value=""/><Tab icon={<PeopleOutlineRoundedIcon/>} iconPosition="start" label="درخواست مشتریان" value="customer"/><Tab icon={<HomeOutlinedIcon/>} iconPosition="start" label="درخواست مالکین" value="owner"/></Tabs>}{toolbar}
 {error?<Alert severity="error" action={<Button onClick={load}>تلاش مجدد</Button>}>{error}</Alert>:loading?<Stack alignItems="center" p={5}><CircularProgress/></Stack>:!result.results.length?<Typography color="text.secondary" textAlign="center" py={5}>موردی با این جستجو و فیلترها پیدا نشد.</Typography>:<><Box className={view==='card'?'estate-grid':''} sx={view==='list'?{display:'grid',gap:1.5}:undefined}>{result.results.map(item=><EstateProperty key={item.id} item={item} mode={mode} layout={view}/>)}</Box><Pagination sx={{mt:3}} page={Number(params.page)||1} count={Math.ceil(result.total_results/24)} onChange={(_,page)=>setParams(current=>({...current,page}))}/></>}
 </Box></Box>
}

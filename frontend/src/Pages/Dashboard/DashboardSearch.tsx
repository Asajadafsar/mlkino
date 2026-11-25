import {useEffect,useState} from 'react'
import {Autocomplete,Button,TextField,MenuItem} from '@mui/material'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import api from '../../Core/Request'
import AdvancedPropertySearch from '../../Components/Estate/AdvancedPropertySearch'
export type SearchValues=Record<string,string>
const types=[{name:'آپارتمان',icon:<ApartmentRoundedIcon/>},{name:'ویلایی',icon:<HomeOutlinedIcon/>},{name:'تجاری',icon:<BusinessOutlinedIcon/>},{name:'اداری',icon:<BusinessOutlinedIcon/>},{name:'زمین',icon:<LandscapeOutlinedIcon/>}]
function DashboardSearchToolbar({values,onChange,onSearch,toolbar=false,onApply,demo=false}:{values:SearchValues;onChange:(x:SearchValues)=>void;onSearch:()=>void;toolbar?:boolean;onApply?:()=>void;demo?:boolean}){
 const [provinces,setProvinces]=useState<string[]>([])
 useEffect(()=>{const c=new AbortController();api.get('locations/',{params:{level:'province',all:true},signal:c.signal}).then(r=>{if(!c.signal.aborted)setProvinces(r.data.data.results.map((x:any)=>x.name))}).catch(()=>{});return()=>c.abort()},[])
 const [cities,setCities]=useState<string[]>([]),[districts,setDistricts]=useState<string[]>([]),[error,setError]=useState('')
 useEffect(()=>{const c=new AbortController();api.get('locations/',{params:{level:'city',all:true,province:values.province||undefined},signal:c.signal}).then(r=>{if(!c.signal.aborted)setCities(Array.from(new Set(r.data.data.results.map((x:any)=>x.name))) as string[])}).catch(()=>{if(!c.signal.aborted)setError('فهرست شهرها دریافت نشد.')});return()=>c.abort()},[values.province])
 useEffect(()=>{const c=new AbortController();setDistricts([]);if(values.city)api.get('locations/',{params:{level:'district',all:true,city:values.city},signal:c.signal}).then(r=>{if(!c.signal.aborted)setDistricts(r.data.data.results.map((x:any)=>x.name))}).catch(()=>{if(!c.signal.aborted)setError('فهرست مناطق دریافت نشد.')});return()=>c.abort()},[values.city])
 const [neighborhoods,setNeighborhoods]=useState<string[]>([])
 useEffect(()=>{const c=new AbortController();setNeighborhoods([]);if(values.city&&!demo)api.get('locations/',{params:{level:'neighborhood',all:true,province:values.province||undefined,city:values.city,district:values.district||undefined},signal:c.signal}).then(r=>{if(!c.signal.aborted)setNeighborhoods(r.data.data.results.map((x:any)=>x.name))}).catch(()=>{if(!c.signal.aborted)setError('فهرست محله‌ها دریافت نشد.')});return()=>c.abort()},[values.province,values.city,values.district,demo])
 const digits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/[^0-9]/g,'')
 return <form className={toolbar?'dashboard-filter-form':'dashboard-search-form'} onSubmit={e=>{e.preventDefault();onSearch()}}>
 {!toolbar&&<div className="dashboard-search-mode"><span className="active"><SearchRoundedIcon/>جستجوی فرم / لیستی</span><a href="#dashboard-map">مشاهده روی نقشه <LandscapeOutlinedIcon/></a></div>}
 <div className="dashboard-search-grid">
 {!toolbar&&<TextField select size="small" label="نوع ملک" value={values.propertyType||''} onChange={e=>onChange({...values,propertyType:e.target.value})} SelectProps={{native:true}} InputLabelProps={{shrink:true}}><option value="">همه انواع</option>{types.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}</TextField>}
 <Autocomplete options={demo?['قم']:provinces} value={values.province||null} onChange={(_,x)=>onChange({...values,province:x||'',city:'',district:'',neighborhood:'',office:''})} renderInput={p=><TextField {...p} size="small" InputLabelProps={{shrink:true}} label={toolbar?'فیلتر استان':'استان'} placeholder="همه استان‌ها"/>}/>
 <Autocomplete options={demo?['قم']:cities} disabled={!values.province} value={values.city||null} onChange={(_,x)=>onChange({...values,city:x||'',district:'',neighborhood:'',office:''})} renderInput={p=><TextField {...p} size="small" InputLabelProps={{shrink:true}} label={toolbar?'فیلتر شهر':'شهر'} placeholder="همه شهرها"/>}/>
 <Autocomplete options={demo?['منطقه ۳']:districts} value={values.district||null} disabled={!values.city} onChange={(_,x)=>onChange({...values,district:x||'',neighborhood:'',office:''})} renderInput={p=><TextField {...p} size="small" InputLabelProps={{shrink:true}} label={toolbar?'فیلتر منطقه':'منطقه'} placeholder="همه مناطق"/>}/>
 <Autocomplete options={demo?['امام خمینی']:neighborhoods} value={values.neighborhood||null} disabled={!values.city||!values.district} onChange={(_,x)=>onChange({...values,neighborhood:x||'',office:''})} renderInput={p=><TextField {...p} size="small" label="محله" InputLabelProps={{shrink:true}}/>}/>
 {toolbar?<TextField select size="small" InputLabelProps={{shrink:true}} label="فیلتر نوع ملک" value={values.propertyType||''} onChange={e=>onChange({...values,propertyType:e.target.value})}><MenuItem value="">همه انواع</MenuItem>{types.map(t=><MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>)}</TextField>:<><TextField select size="small" label="نوع معامله" value={values.contractType||''} onChange={e=>onChange({...values,contractType:e.target.value})} SelectProps={{native:true}} InputLabelProps={{shrink:true}}><option value="">همه معاملات</option><option value="فروش">فروش</option><option value="رهن و اجاره">رهن و اجاره</option></TextField><TextField size="small" InputLabelProps={{shrink:true}} label="قیمت از (تومان)" value={values.priceFrom||''} onChange={e=>onChange({...values,priceFrom:digits(e.target.value)})} inputProps={{inputMode:'numeric',maxLength:17}}/><TextField size="small" InputLabelProps={{shrink:true}} label="قیمت تا (تومان)" value={values.priceTo||''} onChange={e=>onChange({...values,priceTo:digits(e.target.value)})} inputProps={{inputMode:'numeric',maxLength:17}}/></>}
 </div>{error&&<span className="dashboard-inline-error">{error}</span>}
 {toolbar?<><Button className="dashboard-filter-apply" type="button" variant="contained" endIcon={<FilterAltOutlinedIcon/>} onClick={onApply}>اعمال فیلتر</Button><Button type="button" variant="outlined" aria-label="پاک کردن فیلترهای پیشخوان" onClick={()=>onChange({propertyType:'',city:'',district:'',priceFrom:'',priceTo:''})}>×</Button></>:<Button type="submit" variant="contained" fullWidth endIcon={<SearchRoundedIcon/>}>جستجوی ملک</Button>}
 </form>
}

export default function DashboardSearch(props:Parameters<typeof DashboardSearchToolbar>[0]&{count?:number;onMap?:()=>void;demo?:boolean;officeOptions?:{id:string;name:string}[]}){
 return props.toolbar?<DashboardSearchToolbar {...props}/>:<AdvancedPropertySearch values={props.values} onChange={props.onChange} onSearch={props.onSearch} count={props.count} onMap={props.onMap} demo={props.demo} officeOptions={props.officeOptions}/>
}

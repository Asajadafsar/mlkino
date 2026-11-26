import {useEffect,useState} from 'react'
import {Autocomplete,Button,TextField} from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import RestartAlt from '@mui/icons-material/RestartAlt'
import BookmarkBorder from '@mui/icons-material/BookmarkBorder'
import ExpandMore from '@mui/icons-material/ExpandMore'
import api from '../../Core/Request'
import {BUILD_YEAR_OPTIONS,AD_AMENITIES_OPTIONS,PROPERTY_TYPE_OPTIONS,STATUS_OPTIONS} from '../../Components/PropertyRecordForm/constants'
import type {SearchValues} from './DashboardSearch'
const savedKey='mlkino:dashboard-saved-searches'
export default function DashboardReferenceSearch({values,onChange,onSearch}:{values:SearchValues;onChange:(value:SearchValues)=>void;onSearch:()=>void}){
 const [cities,setCities]=useState<string[]>([]),[districts,setDistricts]=useState<string[]>([]),[saved,setSaved]=useState<SearchValues[]>(()=>{try{const data=JSON.parse(localStorage.getItem(savedKey)||'[]');return Array.isArray(data)?data.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)):[]}catch{return []}}),[showSaved,setShowSaved]=useState(false),[notice,setNotice]=useState('')
 useEffect(()=>{const c=new AbortController();api.get('locations/',{params:{level:'city',all:true},signal:c.signal}).then(r=>{if(!c.signal.aborted)setCities(Array.from(new Set(r.data.data.results.map((row:{name:string})=>row.name))))}).catch(()=>{});return()=>c.abort()},[])
 useEffect(()=>{const c=new AbortController();setDistricts([]);if(values.city)api.get('locations/',{params:{level:'district',city:values.city,all:true},signal:c.signal}).then(r=>{if(!c.signal.aborted)setDistricts(r.data.data.results.map((row:{name:string})=>row.name))}).catch(()=>{});return()=>c.abort()},[values.city])
 const set=(key:string,value:string)=>onChange({...values,[key]:value})
 const digits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/[^0-9]/g,'')
 const select=(key:string,label:string,options:string[])=><TextField select size="small" value={values[key]||''} onChange={e=>set(key,e.target.value)} SelectProps={{native:true}} inputProps={{'aria-label':label}}><option value="">همه</option>{options.map(value=><option key={value}>{value}</option>)}</TextField>
 const range=(prefix:string,label:string)=><div className="dash-range">{['From','To'].map((suffix,index)=><TextField key={suffix} placeholder={index?'تا':'از'} size="small" value={values[prefix+suffix]||''} onChange={e=>set(prefix+suffix,digits(e.target.value))} inputProps={{inputMode:'numeric','aria-label':label+' '+(index?'تا':'از')+(prefix==='price'?' (تومان)':'')}}/>)}</div>
 const toggle=(value:string,checked:boolean)=>{const selected=(values.amenities||'').split('|').filter(Boolean);set('amenities',(checked?Array.from(new Set([...selected,value])):selected.filter(item=>item!==value)).join('|'))}
 return <form className="dash-reference-search" onSubmit={event=>{event.preventDefault();onSearch()}}>
 <header><div><h2><SearchRounded/>جستجوی پیشرفته ملک</h2><p>ملک موردنظر خود را با فیلترهای دقیق پیدا کنید.</p></div><fieldset className="dash-contract-tabs"><legend>نوع معامله:</legend>{[['فروش','خرید و فروش'],['رهن و اجاره','رهن و اجاره'],['پیش‌فروش','پیش‌فروش']].map(([value,label])=><button type="button" key={value} aria-pressed={(values.contractType||'فروش')===value} onClick={()=>set('contractType',value)}>{label}</button>)}</fieldset></header>
 <div className="dash-reference-search-grid">
 <label><span>کد ملک</span><TextField size="small" placeholder="کد ملک را وارد کنید" value={values.recordId||''} onChange={e=>set('recordId',digits(e.target.value))} inputProps={{'aria-label':'کد ملک'}} InputProps={{startAdornment:<SearchRounded/>}}/></label>
 <label><span>نوع ملک</span>{select('propertyType','نوع ملک',PROPERTY_TYPE_OPTIONS)}</label>
 <label><span>شهر</span><Autocomplete options={cities} value={values.city||null} onChange={(_,value)=>onChange({...values,city:value||'',district:''})} renderInput={params=><TextField {...params} size="small" placeholder="همه شهرها" inputProps={{...params.inputProps,'aria-label':'شهر'}}/>}/></label>
 <label><span>منطقه / محله</span><Autocomplete freeSolo options={districts} value={values.district||null} onChange={(_,value)=>set('district',value||'')} onInputChange={(_,value,reason)=>{if(reason==='input')set('district',value)}} renderInput={params=><TextField {...params} size="small" placeholder="همه مناطق" inputProps={{...params.inputProps,'aria-label':'منطقه / محله'}}/>}/></label>
 <label><span>متراژ (متر مربع)</span>{range('area','متراژ')}</label>
 <label><span>قیمت (تومان)</span>{range('price','قیمت')}</label>
 <label><span>تعداد اتاق</span>{select('roomCount','تعداد اتاق',['0','1','2','3','4','5','6'])}</label>
 <label><span>سال ساخت</span>{select('buildYear','سال ساخت',BUILD_YEAR_OPTIONS)}</label>
 <label><span>وضعیت ملک</span>{select('status','وضعیت ملک',STATUS_OPTIONS)}</label>
 <label><span>امکانات</span><Autocomplete multiple options={AD_AMENITIES_OPTIONS.filter(value=>!['آسانسور','انباری','بالکن'].includes(value))} value={(values.amenities||'').split('|').filter(value=>value&&!['آسانسور','انباری','بالکن'].includes(value))} onChange={(_,value)=>set('amenities',[...(values.amenities||'').split('|').filter(item=>['آسانسور','انباری','بالکن'].includes(item)),...value].join('|'))} renderInput={params=><TextField {...params} size="small" placeholder="انتخاب امکانات"/>}/></label>
 <fieldset className="dash-amenities"><legend>امکانات پرکاربرد:</legend>{['آسانسور','انباری','بالکن'].map(value=><label key={value}><input type="checkbox" checked={(values.amenities||'').split('|').includes(value)} onChange={e=>toggle(value,e.target.checked)}/>{value}</label>)}</fieldset>
 </div>
 <footer><div className="dash-saved-search"><Button variant="outlined" startIcon={<BookmarkBorder/>} endIcon={<ExpandMore/>} onClick={()=>setShowSaved(value=>!value)}>ذخیره جستجو</Button>{showSaved&&<div><Button onClick={()=>{const next=[{...values},...saved].slice(0,5);try{localStorage.setItem(savedKey,JSON.stringify(next));setSaved(next);setNotice('جستجو در این مرورگر ذخیره شد.')}catch{setNotice('امکان ذخیره در مرورگر وجود ندارد.')}}}>ذخیره فیلترهای فعلی</Button>{saved.map((value,index)=><Button key={index} onClick={()=>{onChange(value);setShowSaved(false)}}>{value.city||'همه شهرها'} · {value.propertyType||'همه انواع'} · جستجوی {(index+1).toLocaleString('fa-IR')}</Button>)}</div>}</div><span role="status">{notice}</span><Button variant="outlined" startIcon={<RestartAlt/>} onClick={()=>{onChange({});setNotice('')}}>پاک‌سازی فیلترها</Button><Button variant="contained" type="submit" startIcon={<SearchRounded/>}>جستجوی ملک</Button></footer>
 </form>
}

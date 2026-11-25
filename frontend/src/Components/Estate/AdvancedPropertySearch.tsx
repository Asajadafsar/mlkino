import {ReactNode,useEffect,useState} from 'react'
import {Autocomplete,Button,TextField} from '@mui/material'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import SwapHoriz from '@mui/icons-material/SwapHoriz'
import PlaceOutlined from '@mui/icons-material/PlaceOutlined'
import LayersOutlined from '@mui/icons-material/LayersOutlined'
import BedOutlined from '@mui/icons-material/BedOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import SquareFoot from '@mui/icons-material/SquareFoot'
import PersonOutline from '@mui/icons-material/PersonOutline'
import StarOutline from '@mui/icons-material/StarOutline'
import CheckRounded from '@mui/icons-material/CheckRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined'
import MapOutlined from '@mui/icons-material/MapOutlined'
import RestartAlt from '@mui/icons-material/RestartAlt'
import {BUILD_YEAR_OPTIONS,AD_AMENITIES_OPTIONS,STATUS_OPTIONS,PROPERTY_TYPE_OPTIONS} from '../PropertyRecordForm/constants'
import api from '../../Core/Request'
import './advancedPropertySearch.css'
export type PropertySearchValues=Record<string,string>
export const propertySearchFields=['propertyType','contractType','province','city','district','neighborhood','areaFrom','areaTo','priceFrom','priceTo','roomCount','buildYear','floor','status','amenities','creatorRoles','recordId']
export function validatePropertySearch(values:PropertySearchValues){
 for(const [prefix,label] of [['price','قیمت'],['area','متراژ']])if(values[prefix+'From']&&values[prefix+'To']&&Number(values[prefix+'From'])>Number(values[prefix+'To']))return `حداکثر ${label} نباید کمتر از حداقل باشد.`
 return ''
}
export default function AdvancedPropertySearch({values,onChange,onSearch,count,mapHref='#dashboard-map',onMap}:{values:PropertySearchValues;onChange:(v:PropertySearchValues)=>void;onSearch:()=>void;count?:number;mapHref?:string;onMap?:()=>void}){
 const [locations,setLocations]=useState<Record<string,string[]>>({}),[error,setError]=useState('')
 const province=values.province||'',city=values.city||'',district=values.district||''
 useEffect(()=>{const c=new AbortController();setLocations({});setError('');const levels=['province','city',...(city?['district','neighborhood']:[])];Promise.all(levels.map(async level=>{const r=await api.get('locations/',{params:{level,all:province?undefined:true,province:province||undefined,city:city||undefined,...(level==='neighborhood'&&district?{district}: {})},signal:c.signal});return [level,Array.from(new Set(r.data.data.results.map((x:any)=>x.name))) as string[]] as const})).then(rows=>{if(!c.signal.aborted)setLocations(Object.fromEntries(rows))}).catch(()=>{if(!c.signal.aborted)setError('فهرست موقعیت‌ها دریافت نشد؛ دوباره تلاش کنید.')});return()=>c.abort()},[province,city,district])
 const set=(key:string,value:string)=>onChange({...values,[key]:value})
 const digits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/[^0-9]/g,'')
 const tile=(title:string,icon:ReactNode,children:ReactNode,wide=false)=><div className={`property-search-field${wide?' is-wide':''}`}><div className="property-search-label">{icon}<span>{title}</span></div>{children}</div>
 const select=(key:string,label:string,options:string[])=> <TextField select fullWidth size="small" value={values[key]||''} onChange={e=>set(key,e.target.value)} SelectProps={{native:true}} inputProps={{'aria-label':label}}><option value="">همه</option>{options.map(x=><option key={x} value={x}>{/^\d+$/.test(x)?Number(x).toLocaleString('fa-IR',{useGrouping:false}):x}</option>)}</TextField>
 const geo=(key:string,label:string,reset:string[])=> <Autocomplete options={locations[key]||[]} disabled={['district','neighborhood'].includes(key)&&!city} value={values[key]||null} onChange={(_,value)=>onChange({...values,...Object.fromEntries(reset.map(k=>[k,''])),[key]:value||''})} renderInput={p=><TextField {...p} size="small" placeholder={`انتخاب ${label}`} inputProps={{...p.inputProps,'aria-label':label}}/>}/>
 const range=(prefix:string,label:string)=> <div className="property-search-range">{['From','To'].map((suffix,i)=><TextField key={suffix} size="small" placeholder={i?'تا':'از'} value={values[prefix+suffix]||''} onChange={e=>set(prefix+suffix,digits(e.target.value))} inputProps={{'aria-label':`${label} ${i?'تا':'از'}${prefix==='price'?' (تومان)':''}`,inputMode:'numeric',maxLength:17}}/>)}</div>
 const toggle=(key:string,value:string,checked:boolean)=>{const selected=(values[key]||'').split('|').filter(Boolean);set(key,(checked?[...selected,value]:selected.filter(x=>x!==value)).join('|'))}
 return <form className="property-search" onSubmit={e=>{e.preventDefault();onSearch()}}>
 <div className="property-search-heading"><h2><SearchRounded/>جستجوی تکمیلی ملک</h2><div className="property-search-tabs"><span className="active"><FilterAltOutlined/>جستجوی فرم (پیشرفته)</span>{onMap?<button type="button" onClick={onMap}><MapOutlined/>جستجو روی نقشه</button>:<a href={mapHref}><MapOutlined/>جستجو روی نقشه</a>}</div></div>
 <div className="property-search-fields">
 {tile('نوع ملک',<HomeOutlined/>,select('propertyType','نوع ملک',PROPERTY_TYPE_OPTIONS))}
 {tile('نوع معامله',<SwapHoriz/>,select('contractType','نوع معامله',['فروش','رهن و اجاره']))}
 {tile('استان',<PlaceOutlined/>,geo('province','استان',['city','district','neighborhood']))}
 {tile('شهر',<HomeOutlined/>,geo('city','شهر',['district','neighborhood']))}
 {tile('منطقه',<LayersOutlined/>,geo('district','منطقه',['neighborhood']))}
 {tile('محله',<PlaceOutlined/>,geo('neighborhood','محله',[]))}
 {tile('متراژ (متر مربع)',<SquareFoot/>,range('area','متراژ'))}
 {tile(values.contractType==='رهن و اجاره'?'مبلغ رهن (تومان)':'قیمت (تومان)',<LayersOutlined/>,range('price','قیمت'))}
 {tile('تعداد اتاق',<BedOutlined/>,select('roomCount','تعداد اتاق',['0','1','2','3','4','5','6','7','8','9','10']))}
 {tile('سال ساخت',<CalendarMonthOutlined/>,select('buildYear','سال ساخت',BUILD_YEAR_OPTIONS))}
 {tile('طبقه',<LayersOutlined/>,select('floor','طبقه',Array.from({length:31},(_,i)=>String(i))))}
 {tile('وضعیت ملک',<CheckRounded/>,select('status','وضعیت ملک',STATUS_OPTIONS))}
 {tile('نوع کاربر ثبت‌کننده',<PersonOutline/>,<div className="property-search-roles">{[['expert','کارشناس'],['agency','املاکی'],['user','کاربر عادی']].map(([value,label])=><label key={value}><input type="checkbox" checked={(values.creatorRoles||'').split('|').includes(value)} onChange={e=>toggle('creatorRoles',value,e.target.checked)}/>{label}</label>)}</div>,true)}
 {tile('امکانات خاص',<StarOutline/>,<Autocomplete multiple options={AD_AMENITIES_OPTIONS} value={(values.amenities||'').split('|').filter(Boolean)} onChange={(_,v)=>set('amenities',v.join('|'))} renderInput={p=><TextField {...p} size="small" placeholder="انتخاب امکانات" inputProps={{...p.inputProps,'aria-label':'امکانات خاص'}}/>}/>)}
 {tile('کد فایل / شناسه',<LayersOutlined/>,<TextField size="small" fullWidth placeholder="مثلاً: ۱۲۳۴۵" value={values.recordId||''} onChange={e=>set('recordId',digits(e.target.value))} inputProps={{'aria-label':'کد فایل / شناسه',inputMode:'numeric'}}/>)}
 </div>{error&&<div role="alert" className="property-search-error">{error}</div>}
 <div className="property-search-actions">{count!==undefined&&<span className="property-search-count"><LayersOutlined/><strong>{count.toLocaleString('fa-IR')}</strong> فایل یافت شد</span>}<Button type="submit" variant="contained" endIcon={<SearchRounded/>}>جستجوی ملک</Button><Button type="button" variant="outlined" endIcon={<RestartAlt/>} onClick={()=>onChange({})}>پاک‌سازی فیلترها</Button></div>
 </form>
}

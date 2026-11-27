import {geographyEnabled,geographyLabels,geographyLevels,geographyPatch,useGeographyFilters} from '../Location/useGeographyFilters'
import {ReactNode,} from 'react'
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
import {AD_AMENITIES_OPTIONS,STATUS_OPTIONS,PROPERTY_TYPE_OPTIONS,DOCUMENT_TYPE_OPTIONS,OCCUPANCY_OPTIONS,HEATING_OPTIONS,COOLING_OPTIONS,FLOORING_OPTIONS,FACADE_OPTIONS,DIRECTION_OPTIONS,LAND_USE_OPTIONS} from '../PropertyRecordForm/constants'
import './advancedPropertySearch.css'
export type PropertySearchValues=Record<string,string>
export const propertySearchFields=['propertyType','contractType','province','city','district','neighborhood','areaFrom','areaTo','priceFrom','priceTo','roomCount','buildYear','totalFloor','floor','status','amenities','creatorRoles','recordId','landUse','office']
export function validatePropertySearch(values:PropertySearchValues){
 for(const [prefix,label] of [['price','قیمت'],['area','متراژ']])if(values[prefix+'From']&&values[prefix+'To']&&Number(values[prefix+'From'])>Number(values[prefix+'To']))return `حداکثر ${label} نباید کمتر از حداقل باشد.`
 return ''
}
export default function AdvancedPropertySearch({values,onChange,onSearch,count,officeOptions,demo=false,mapHref='#dashboard-map',onMap}:{values:PropertySearchValues;onChange:(v:PropertySearchValues)=>void;onSearch:()=>void;count?:number;officeOptions?:{id:string;name:string}[];demo?:boolean;mapHref?:string;onMap?:()=>void}){
 const {options,error}=useGeographyFilters(values,demo)
 const set=(key:string,value:string)=>onChange({...values,[key]:value})
 const digits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/[^0-9]/g,'')
 const integer=(key:string,label:string,signed=false)=><TextField fullWidth size="small" value={values[key]||''} onChange={e=>set(key,(signed&&/^[-−]/.test(e.target.value)?'-':'')+digits(e.target.value))} inputProps={{'aria-label':label,inputMode:signed?'text':'numeric',maxLength:8}}/>
 const tile=(title:string,icon:ReactNode,children:ReactNode,wide=false)=><div className={`property-search-field${wide?' is-wide':''}`}><div className="property-search-label">{icon}<span>{title}</span></div>{children}</div>
 const select=(key:string,label:string,options:string[])=> <TextField select fullWidth size="small" value={values[key]||''} onChange={e=>set(key,e.target.value)} SelectProps={{native:true}} inputProps={{'aria-label':label}}><option value="">همه</option>{options.map(x=><option key={x} value={x}>{/^\d+$/.test(x)?Number(x).toLocaleString('fa-IR',{useGrouping:false}):x}</option>)}</TextField>
 const geo=(level:typeof geographyLevels[number])=> <Autocomplete options={options[level]||[]} disabled={!geographyEnabled(level,values)} value={values[level]||null} onChange={(_,value)=>onChange({...values,...geographyPatch(level,value||''),office:''})} renderInput={p=><TextField {...p} size="small" placeholder={`انتخاب ${geographyLabels[level]}`} inputProps={{...p.inputProps,'aria-label':geographyLabels[level]}}/>}/>
 const range=(prefix:string,label:string)=> <div className="property-search-range">{['From','To'].map((suffix,i)=><TextField key={suffix} size="small" placeholder={i?'تا':'از'} value={values[prefix+suffix]||''} onChange={e=>set(prefix+suffix,digits(e.target.value))} inputProps={{'aria-label':`${label} ${i?'تا':'از'}${prefix==='price'?' (تومان)':''}`,inputMode:'numeric',maxLength:17}}/>)}</div>
 const toggle=(key:string,value:string,checked:boolean)=>{const selected=(values[key]||'').split('|').filter(Boolean);set(key,(checked?[...selected,value]:selected.filter(x=>x!==value)).join('|'))}
 return <form className="property-search" onSubmit={e=>{e.preventDefault();onSearch()}}>
 <div className="property-search-heading"><h2><SearchRounded/>جستجوی تکمیلی ملک</h2><div className="property-search-tabs"><span className="active"><FilterAltOutlined/>جستجوی فرم (پیشرفته)</span>{onMap?<button type="button" onClick={onMap}><MapOutlined/>جستجو روی نقشه</button>:<a href={mapHref}><MapOutlined/>جستجو روی نقشه</a>}</div></div>
 <div className="property-search-fields">
 {tile('نوع ملک',<HomeOutlined/>,<TextField select fullWidth size="small" value={values.propertyType||''} onChange={e=>onChange({...values,propertyType:e.target.value,landUse:''})} SelectProps={{native:true}} inputProps={{'aria-label':'نوع ملک'}}><option value="">همه</option>{PROPERTY_TYPE_OPTIONS.map(type=><option key={type}>{type}</option>)}</TextField>)}
 {values.propertyType==='زمین'&&tile('کاربری زمین',<MapOutlined/>,select('landUse','کاربری زمین',LAND_USE_OPTIONS))}
 {officeOptions&&tile('دفتر املاک',<HomeOutlined/>,<TextField select fullWidth size="small" value={values.office||''} onChange={e=>set('office',e.target.value)} SelectProps={{native:true}} inputProps={{'aria-label':'دفتر املاک'}}><option value="">همه دفاتر محدوده</option>{officeOptions.map(office=><option key={office.id} value={office.id}>{office.name}</option>)}</TextField>)}
 {tile('نوع معامله',<SwapHoriz/>,select('contractType','نوع معامله',['فروش','رهن و اجاره']))}
 {geographyLevels.map(level=><div key={level}>{tile(geographyLabels[level],<PlaceOutlined/>,geo(level))}</div>)}
 {tile('متراژ (متر مربع)',<SquareFoot/>,range('area','متراژ'))}
 {tile(values.contractType==='رهن و اجاره'?'مبلغ رهن (تومان)':'قیمت (تومان)',<LayersOutlined/>,range('price','قیمت'))}
 {tile('تعداد خواب',<BedOutlined/>,integer('roomCount','تعداد خواب'))}
 {tile('سال ساخت',<CalendarMonthOutlined/>,integer('buildYear','سال ساخت'))}
 {tile('تعداد کل طبقات',<LayersOutlined/>,integer('totalFloor','تعداد کل طبقات'))}
 {tile('شماره طبقه',<LayersOutlined/>,integer('floor','شماره طبقه',true))}
 {tile('وضعیت ملک',<CheckRounded/>,select('status','وضعیت ملک',STATUS_OPTIONS))}
 {officeOptions&&([
  ['documentType','نوع سند',DOCUMENT_TYPE_OPTIONS],['occupancyStatus','وضعیت اشغال',OCCUPANCY_OPTIONS],
  ['heating','گرمایش',HEATING_OPTIONS],['cooling','سرمایش',COOLING_OPTIONS],['flooring','کف‌پوش',FLOORING_OPTIONS],
  ['facade','نما',FACADE_OPTIONS],['direction','جهت ساختمان',DIRECTION_OPTIONS],['bathroom','سرویس بهداشتی',['ایرانی','فرنگی','هر دو']],
 ] as [string,string,string[]][]).map(([key,label,options])=><div key={key}>{tile(label,<LayersOutlined/>,select(key,label,options))}</div>)}
 {tile('نوع کاربر ثبت‌کننده',<PersonOutline/>,<div className="property-search-roles">{[['expert','کارشناس'],['agency','املاکی'],['user','کاربر عادی']].map(([value,label])=><label key={value}><input type="checkbox" checked={(values.creatorRoles||'').split('|').includes(value)} onChange={e=>toggle('creatorRoles',value,e.target.checked)}/>{label}</label>)}</div>,true)}
 {tile('امکانات خاص',<StarOutline/>,<Autocomplete multiple options={AD_AMENITIES_OPTIONS} value={(values.amenities||'').split('|').filter(Boolean)} onChange={(_,v)=>set('amenities',v.join('|'))} renderInput={p=><TextField {...p} size="small" placeholder="انتخاب امکانات" inputProps={{...p.inputProps,'aria-label':'امکانات خاص'}}/>}/>)}
 {tile('کد فایل / شناسه',<LayersOutlined/>,<TextField size="small" fullWidth placeholder="مثلاً: ۱۲۳۴۵" value={values.recordId||''} onChange={e=>set('recordId',digits(e.target.value))} inputProps={{'aria-label':'کد فایل / شناسه',inputMode:'numeric'}}/>)}
 </div>{error&&<div role="alert" className="property-search-error">{error}</div>}
 <div className="property-search-actions">{count!==undefined&&<span className="property-search-count"><LayersOutlined/><strong>{count.toLocaleString('fa-IR')}</strong> فایل یافت شد</span>}<Button type="submit" variant="contained" endIcon={<SearchRounded/>}>جستجوی ملک</Button><Button type="button" variant="outlined" endIcon={<RestartAlt/>} onClick={()=>onChange({})}>پاک‌سازی فیلترها</Button></div>
 </form>
}

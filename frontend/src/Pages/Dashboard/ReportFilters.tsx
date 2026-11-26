import {useEffect,useState} from 'react'
import {Autocomplete,Button,TextField} from '@mui/material'
import RestartAlt from '@mui/icons-material/RestartAlt'
import api from '../../Core/Request'
import {PROPERTY_TYPE_OPTIONS} from '../../Components/PropertyRecordForm/constants'
export type ReportFilterValues=Record<string,string>
export type ReportOption={id:string;name:string}
const levels=['province','county','city','district','neighborhood']
const labels:Record<string,string>={province:'استان',county:'شهرستان',city:'شهر',district:'منطقه',neighborhood:'محله'}
export function reportFilterError(values:ReportFilterValues){for(const prefix of ['price','area'])if(values[prefix+'From']&&values[prefix+'To']&&Number(values[prefix+'From'])>Number(values[prefix+'To']))return 'حداکثر قیمت یا متراژ نباید کمتر از حداقل باشد.';return ''}
export default function ReportFilters({values,onChange,offices=[],experts=[]}:{values:ReportFilterValues;onChange:(v:ReportFilterValues)=>void;offices?:ReportOption[];experts?:ReportOption[]}){
 const [options,setOptions]=useState<Record<string,string[]>>({}),[error,setError]=useState('')
 const locationKey=JSON.stringify(levels.map(key=>values[key]||''))
 useEffect(()=>{const c=new AbortController();setError('');Promise.all(levels.map(async(level,index)=>{if(index>0&&!values[levels[index-1]]&&!(level==='neighborhood'&&values.city))return [level,[]] as const;const params={level,all:true,...Object.fromEntries(levels.slice(0,index).filter(key=>values[key]).map(key=>[key,values[key]]))};const response=await api.get('locations/',{params,signal:c.signal});return [level,Array.from(new Set<string>(response.data.data.results.map((row:{name:string})=>row.name)))] as const})).then(rows=>{if(!c.signal.aborted)setOptions(Object.fromEntries(rows))}).catch(()=>{if(!c.signal.aborted)setError('فهرست موقعیت‌ها دریافت نشد؛ دوباره تلاش کنید.')});return()=>c.abort()},[locationKey])
 const set=(key:string,value:string)=>onChange({...values,[key]:value})
 const digits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/[^0-9]/g,'')
 const select=(key:string,label:string,choices:{id:string;name:string}[])=> <label><span>{label}</span><TextField select size="small" SelectProps={{native:true}} value={values[key]||''} onChange={event=>set(key,event.target.value)} inputProps={{'aria-label':label}}><option value="">همه</option>{choices.map(row=><option value={row.id} key={row.id}>{row.name}</option>)}</TextField></label>
 return <div className="dash-report-filters">{levels.map((level,index)=><label key={level}><span>{labels[level]}</span><Autocomplete size="small" value={values[level]||null} options={options[level]||[]} onChange={(_,value)=>{const next={...values};levels.slice(index+1).forEach(key=>delete next[key]);next[level]=value||'';onChange(next)}} renderInput={params=><TextField {...params} placeholder={'همه '+labels[level]+'ها'} inputProps={{...params.inputProps,'aria-label':labels[level]}}/>}/></label>)}
 {select('propertyType','نوع ملک',PROPERTY_TYPE_OPTIONS.map(name=>({id:name,name})))}
 {select('creatorRoles','نوع ثبت‌کننده',[{id:'user',name:'کاربر عادی'},{id:'expert',name:'کارشناس'},{id:'agency',name:'املاکی'},{id:'superadmin',name:'سوپرادمین'}])}
 {select('office','دفتر املاک',offices)}{select('expert','کارشناس',experts)}
 {select('contractType','نوع معامله',['فروش','رهن و اجاره','پیش‌فروش'].map(name=>({id:name,name})))}
 {(['price','area'] as const).map(prefix=><fieldset key={prefix}><legend>{prefix==='price'?'قیمت / رهن (تومان)':'متراژ (متر مربع)'}</legend><div className="dash-range">{['From','To'].map((suffix,index)=><TextField key={suffix} size="small" placeholder={index?'تا':'از'} value={values[prefix+suffix]||''} onChange={event=>set(prefix+suffix,digits(event.target.value))} inputProps={{inputMode:'numeric','aria-label':(prefix==='price'?'قیمت':'متراژ')+(index?' تا':' از')}}/>)}</div></fieldset>)}
 {error&&<p role="alert">{error}</p>}<Button startIcon={<RestartAlt/>} onClick={()=>onChange({})}>پاک‌کردن فیلترهای این بخش</Button></div>
}

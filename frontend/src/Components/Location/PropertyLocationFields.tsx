import {useEffect,useState} from 'react'
import {Alert,Autocomplete,Box,TextField} from '@mui/material'
import api from '../../Core/Request'
import type {ModeStepProps} from '../PropertyRecordForm/types'
import {CheckboxChoices} from '../PropertyRecordForm/components/CheckboxChoices'
import {asStringArray} from '../PropertyRecordForm/utils'
type Place={id:number|string;name:string;district?:string}
function usePlaces(level:string,params:Record<string,string|undefined>) {
 const [rows,setRows]=useState<Place[]>([]),[error,setError]=useState('');const key=JSON.stringify(params)
 useEffect(()=>{const controller=new AbortController();setRows([]);setError('');api.get('locations/',{params:{level,...JSON.parse(key)},signal:controller.signal}).then(r=>{if(!controller.signal.aborted)setRows(r.data.data.results)}).catch(()=>{if(!controller.signal.aborted)setError('دریافت فهرست مکان‌ها انجام نشد. اتصال را بررسی کنید.')});return()=>controller.abort()},[level,key]);return {rows,error}
}
export function PropertyLocationFields({property,setProperty,mode}:ModeStepProps) {
 const common={province:property.province,county:property.county,city:property.city}
 const provinces=usePlaces('province',{}),counties=usePlaces('county',{province:property.province}),cities=usePlaces('city',common),districts=usePlaces('district',common)
 const selectedDistricts=asStringArray(property.district),neighborhoods=usePlaces('neighborhood',{...common,districts:selectedDistricts.join('|')})
 const choice=(label:string,key:'province'|'county'|'city',rows:Place[],disabled:boolean)=><Autocomplete key={key} options={rows.map(x=>x.name)} value={property[key]||null} disabled={disabled} onChange={(_,next)=>setProperty(prev=>({...prev,[key]:next||'',...(key==='province'?{county:'',city:''}:key==='county'?{city:''}:{}),district:mode==='request'?[]:'',neighborhood:mode==='request'?[]:''}))} noOptionsText="موردی پیدا نشد" renderInput={params=><TextField {...params} label={label}/>}/>
 return <Box><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'repeat(2,1fr)',lg:'repeat(3,1fr)'},gap:2}}>
 {choice('استان','province',provinces.rows,false)}{choice('شهرستان','county',counties.rows,!property.province)}{choice('شهر','city',cities.rows,!property.county)}
 {mode==='request'?<><CheckboxChoices label="منطقه‌های موردنظر" options={['همه مناطق',...districts.rows.map(x=>x.name)]} value={selectedDistricts} disabled={!property.city||!districts.rows.length} onChange={district=>setProperty(prev=>({...prev,district:district.includes('همه مناطق')&&!selectedDistricts.includes('همه مناطق')?['همه مناطق']:district.filter(x=>x!=='همه مناطق'),neighborhood:selectedDistricts.every(x=>district.includes(x))?prev.neighborhood:[]}))} helperText={!districts.rows.length&&property.city?'برای این شهر منطقه شهری در منبع ثبت نشده است.':undefined}/><CheckboxChoices label="محله‌های موردنظر" options={neighborhoods.rows.map(x=>x.name)} value={asStringArray(property.neighborhood)} disabled={!property.city||(districts.rows.length>0&&!selectedDistricts.length)} onChange={neighborhood=>setProperty(prev=>({...prev,neighborhood}))} helperText={!selectedDistricts.length&&districts.rows.length?'ابتدا منطقه را انتخاب کنید.':!neighborhoods.rows.length&&property.city?'محله‌ای در منبع این محدوده ثبت نشده است؛ انتخاب شهر و منطقه کافی است.':'چند محله را می‌توانید تیک بزنید.'}/></>:<><Autocomplete options={districts.rows.map(x=>x.name)} value={selectedDistricts[0]||null} disabled={!property.city} onChange={(_,district)=>setProperty(prev=>({...prev,district:district||'',neighborhood:''}))} renderInput={params=><TextField {...params} label="منطقه"/>}/><Autocomplete freeSolo options={neighborhoods.rows.map(x=>x.name)} value={asStringArray(property.neighborhood)[0]||''} onInputChange={(_,neighborhood)=>setProperty(prev=>({...prev,neighborhood}))} renderInput={params=><TextField {...params} label="محله"/>}/></>}
 </Box>{(provinces.error||cities.error||neighborhoods.error)&&<Alert severity="warning" sx={{mt:2}}>{provinces.error||cities.error||neighborhoods.error}</Alert>}</Box>
}

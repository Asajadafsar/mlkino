import {geographyEnabled,geographyLabels,geographyLevels,geographyPatch,useGeographyFilters} from '../../Components/Location/useGeographyFilters'
import {Autocomplete,Button,TextField} from '@mui/material'
import RestartAlt from '@mui/icons-material/RestartAlt'
import {PROPERTY_TYPE_OPTIONS} from '../../Components/PropertyRecordForm/constants'
export type ReportFilterValues=Record<string,string>
export type ReportOption={id:string;name:string}
export function reportFilterError(values:ReportFilterValues){for(const prefix of ['price','area'])if(values[prefix+'From']&&values[prefix+'To']&&Number(values[prefix+'From'])>Number(values[prefix+'To']))return 'حداکثر قیمت یا متراژ نباید کمتر از حداقل باشد.';return ''}
export default function ReportFilters({values,onChange,offices=[],experts=[]}:{values:ReportFilterValues;onChange:(v:ReportFilterValues)=>void;offices?:ReportOption[];experts?:ReportOption[]}){
 const {options,error}=useGeographyFilters(values)
 const set=(key:string,value:string)=>onChange({...values,[key]:value})
 const digits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/[^0-9]/g,'')
 const select=(key:string,label:string,choices:{id:string;name:string}[])=> <label><span>{label}</span><TextField select size="small" SelectProps={{native:true}} value={values[key]||''} onChange={event=>set(key,event.target.value)} inputProps={{'aria-label':label}}><option value="">همه</option>{choices.map(row=><option value={row.id} key={row.id}>{row.name}</option>)}</TextField></label>
 return <div className="dash-report-filters">{geographyLevels.map(level=><label key={level}><span>{geographyLabels[level]}</span><Autocomplete size="small" disabled={!geographyEnabled(level,values)} value={values[level]||null} options={options[level]||[]} onChange={(_,value)=>onChange({...values,...geographyPatch(level,value||'')})} renderInput={params=><TextField {...params} placeholder={'همه '+geographyLabels[level]+'ها'} inputProps={{...params.inputProps,'aria-label':geographyLabels[level]}}/>}/></label>)}
 {select('propertyType','نوع ملک',PROPERTY_TYPE_OPTIONS.map(name=>({id:name,name})))}
 {select('creatorRoles','نوع ثبت‌کننده',[{id:'user',name:'کاربر عادی'},{id:'expert',name:'کارشناس'},{id:'agency',name:'املاکی'},{id:'superadmin',name:'سوپرادمین'}])}
 {select('office','دفتر املاک',offices)}{select('expert','کارشناس',experts)}
 {select('contractType','نوع معامله',['فروش','رهن و اجاره','پیش‌فروش'].map(name=>({id:name,name})))}
 {(['price','area'] as const).map(prefix=><fieldset key={prefix}><legend>{prefix==='price'?'قیمت / رهن (تومان)':'متراژ (متر مربع)'}</legend><div className="dash-range">{['From','To'].map((suffix,index)=><TextField key={suffix} size="small" placeholder={index?'تا':'از'} value={values[prefix+suffix]||''} onChange={event=>set(prefix+suffix,digits(event.target.value))} inputProps={{inputMode:'numeric','aria-label':(prefix==='price'?'قیمت':'متراژ')+(index?' تا':' از')}}/>)}</div></fieldset>)}
 {error&&<p role="alert">{error}</p>}<Button startIcon={<RestartAlt/>} onClick={()=>onChange({})}>پاک‌کردن فیلترهای این بخش</Button></div>
}

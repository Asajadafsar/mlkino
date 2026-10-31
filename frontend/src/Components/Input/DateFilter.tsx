import DatePickerFilter from '../Filter/DatePicker'
import type {ParamType} from '../Filter/CustomFilter'
export function DateFilter({setParams,noFilter,label,field,defaultValue,onChange}:{setParams:React.Dispatch<React.SetStateAction<ParamType>>;noFilter?:boolean;label:string;field:string;defaultValue?:string;onChange?:(value:any)=>void}){
 return noFilter?<DatePickerFilter mode="controlled" item={{field,label}} value={defaultValue||null} onChange={value=>onChange?.(value)}/>:<DatePickerFilter item={{field,label}} initialValue={defaultValue} setParams={setParams}/>
}

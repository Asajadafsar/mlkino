import {useState} from 'react'
import {Alert,Button,Stack,TextField,FormControlLabel,Switch} from '@mui/material'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {dateTimeIso} from '../../Core/PersianDate'
import {DataProvider} from '../../Core/DataProvider'
import type {ReminderType} from './Reminder'
export const remindersChanged=()=>window.dispatchEvent(new Event('mlkino:reminders-changed'))
export function ReminderEditor({initial,onSaved}:{initial?:ReminderType;onSaved:()=>void}){
 const [title,setTitle]=useState(initial?.title||''),[description,setDescription]=useState(initial?.description||''),[due,setDue]=useState(initial?.remind_at||new Date(Date.now()+3600000).toISOString()),[done,setDone]=useState(initial?.is_done||false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const save=async(event:React.FormEvent)=>{event.preventDefault();if(busy||!title.trim()||!due)return;setBusy(true);setError('');try{const data={title:title.trim(),description,remind_at:due,is_done:done};if(initial)await DataProvider.patch(`reminders/${initial.id}/`,{data});else await DataProvider.post('reminders/',{data});remindersChanged();onSaved()}catch(error:any){setError(error.message||'ذخیره یادآوری انجام نشد.')}finally{setBusy(false)}}
 return <Stack component="form" onSubmit={save} spacing={2.5}>{error&&<Alert severity="error">{error}</Alert>}<TextField required fullWidth label="عنوان یادآوری" value={title} onChange={e=>setTitle(e.target.value)} inputProps={{maxLength:200}}/><TextField fullWidth multiline minRows={4} label="یادداشت شخصی" value={description} onChange={e=>setDescription(e.target.value)} helperText="این یادآوری فقط در حساب خود شما دیده می‌شود."/><DatePickerFilter mode="controlled" item={{label:'تاریخ و ساعت یادآوری'}} value={due} withTime required onChange={value=>setDue(value?dateTimeIso(value):'')}/>{initial&&<FormControlLabel control={<Switch checked={done} onChange={(_,v)=>setDone(v)}/>} label="انجام شده"/>}<Button type="submit" variant="contained" disabled={busy||!title.trim()||!due} size="large">{busy?'در حال ذخیره…':initial?'ذخیره تغییرات':'ثبت یادآوری شخصی'}</Button></Stack>
}

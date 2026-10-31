import {useContext, useEffect, useState} from 'react'
import {Alert, Autocomplete, Button, CircularProgress, Grid, Stack, TextField, Typography} from '@mui/material'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {DataProvider} from '../../Core/DataProvider'
import {TasksType} from './Tasks'

export function localTaskDay() {
    let zone='Asia/Tehran'
    try {zone=JSON.parse(localStorage.getItem('mlkino:date-settings')||'{}').timezone||zone} catch {}
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date())
    return ['year','month','day'].map(type => parts.find(part => part.type===type)?.value).join('-')
}
type Recipient={id:number;full_name:string;phone:string;role?:string}
export function TaskComposer({initial, onSaved}: {initial?: TasksType; onSaved: (task: TasksType) => void}) {
    const {user}=useContext(CurrentUserContext)
    const [title,setTitle]=useState(initial?.title||'')
    const [description,setDescription]=useState(initial?.description||'')
    const [due,setDue]=useState(initial?.due_date||localTaskDay())
    const [recipients,setRecipients]=useState<Recipient[]>([])
    const [selected,setSelected]=useState<Recipient[]>([])
    const [loading,setLoading]=useState(!initial)
    const [saving,setSaving]=useState(false)
    const [error,setError]=useState('')
    useEffect(()=>{if(initial)return;let active=true;DataProvider.get<{results:Recipient[]}>('tasks/recipients/').then(response=>{if(active){setRecipients(response.data.results);setSelected(response.data.results.filter(person=>person.id===user.id))}}).catch(error=>{if(active)setError(error.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[initial,user.id])
    const save=async()=>{
        if(saving||!title.trim()||!due||(!initial&&!selected.length))return
        setSaving(true);setError('')
        try{
            const data={title:title.trim(),description,due_date:due,...(!initial?{assignee_ids:selected.map(person=>person.id)}:{})}
            const response=initial?await DataProvider.patch<TasksType>(`tasks/${initial.id}/`,{data}):await DataProvider.post<TasksType>('tasks/',{data})
            onSaved(response.data)
        }catch(error:any){setError(error.message||'ثبت وظیفه انجام نشد.')}finally{setSaving(false)}
    }
    return <Stack component="form" onSubmit={event=>{event.preventDefault();save()}} spacing={2.5}>
        {error&&<Alert severity="error">{error}</Alert>}
        <TextField fullWidth required label="عنوان وظیفه" value={title} onChange={event=>setTitle(event.target.value)} inputProps={{maxLength:200}} helperText="عنوانی کوتاه و مشخص برای کار خود انتخاب کنید." />
        <Grid container spacing={2}><Grid item xs={12} md={6}><TextField fullWidth required label="تاریخ سررسید" type="date" value={due} InputLabelProps={{shrink:true}} onChange={event=>setDue(event.target.value)} helperText={due?new Date(due+'T12:00:00').toLocaleDateString('fa-IR'):'تاریخ را انتخاب کنید'} /></Grid><Grid item xs={12} md={6}>{!initial&&<Autocomplete multiple options={recipients} loading={loading} getOptionLabel={person=>`${person.full_name||person.phone}${person.id===user.id?' (خودم)':''}`} isOptionEqualToValue={(a,b)=>a.id===b.id} value={selected} onChange={(_,values)=>setSelected(values)} renderInput={params=><TextField {...params} label="دریافت‌کنندگان" required={!selected.length} helperText="فقط افراد مجاز دفتر شما نمایش داده می‌شوند." />} />}</Grid></Grid>
        <TextField fullWidth multiline minRows={4} label="توضیحات و یادداشت" value={description} onChange={event=>setDescription(event.target.value)} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}><Typography variant="caption" color="text.secondary">وظیفه پس از ثبت، با تاریخ انتخاب‌شده در فهرست همه کارها قابل مشاهده است.</Typography><Button type="submit" variant="contained" startIcon={saving?<CircularProgress size={16} color="inherit"/>:<SaveOutlinedIcon/>} disabled={saving||loading||!title.trim()||!due||(!initial&&!selected.length)}>{initial?'ذخیره تغییرات':'ثبت وظیفه'}</Button></Stack>
    </Stack>
}

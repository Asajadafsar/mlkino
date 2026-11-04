import {useContext,useState} from 'react'
import {Alert,Button,MenuItem,Stack,TextField,Typography} from '@mui/material'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {DataProvider} from '../../Core/DataProvider'
const labels:Record<string,string>={user:'کاربر عادی',agency:'املاکی',expert:'کارشناس',superadmin:'سوپرادمین'}
const paths:Record<string,string>={user:'user',agency:'agencies',expert:'expert',superadmin:'super-users'}
export function RoleChange({target}:{target:{id:number;role:string}}){
 const {user}=useContext(CurrentUserContext)
 const [role,setRole]=useState(target.role),[busy,setBusy]=useState(false),[error,setError]=useState('')
 if(!(user.role==='superadmin'||(user as any).is_superuser)||!target.id)return null
 const save=async()=>{setBusy(true);setError('');try{await DataProvider.post(`users/${target.id}/role/`,{data:{role,expected_role:target.role}});if(target.id===user.id){window.location.replace('/dashboard');return}window.location.assign(`/users/${paths[role]}/${target.id}`)}catch(e:any){setError(e.response?.data?.message||e.message||'تغییر نقش انجام نشد.')}finally{setBusy(false)}}
 return <Stack spacing={1.5} sx={{p:2.5,border:'1px solid #dfe6ff',borderRadius:3,background:'linear-gradient(120deg,#f7f9ff,#fff)'}}><Typography fontWeight={800}>تغییر نقش و دسترسی کاربر</Typography><Typography fontSize={12} color="text.secondary">اطلاعات، مدارک و ارتباطات نقش‌های قبلی حفظ می‌شوند و با برگرداندن نقش دوباره نمایش داده خواهند شد. این عملیات مستقل از ذخیره فرم است.</Typography><Stack direction={{xs:'column',sm:'row'}} gap={1.5}><TextField select label="نقش جدید کاربر" value={role} disabled={busy} onChange={e=>setRole(e.target.value)} sx={{minWidth:200}}>{Object.entries(labels).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField><Button variant="contained" disabled={busy||role===target.role} onClick={save}>{busy?'در حال تغییر…':'اعمال نقش جدید'}</Button></Stack>{error&&<Alert severity="error">{error}</Alert>}</Stack>
}

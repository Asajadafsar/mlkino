import DatePickerFilter from '../../Components/Filter/DatePicker'
import {useEffect, useRef, useState} from 'react'
import {Alert, Avatar, Box, Button, Chip, CircularProgress, Grid, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography} from '@mui/material'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import {useSelector} from 'react-redux'
import {selectRole} from '../../redux/RoleSlice'
import api from '../../Core/Request'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import {formatDate} from '../../Core/FormatDate'

export function ProfileIdentityHero({value,onChange,title='پروفایل کاربری',description='اطلاعات حساب کاربری را مشاهده و ویرایش کنید.'}:{value:any;onChange?:(value:any)=>void;title?:string;description?:string}){
 const [preview,setPreview]=useState(''),[error,setError]=useState('')
 useEffect(()=>{if(!(value.avatar instanceof File)){setPreview('');return}const url=URL.createObjectURL(value.avatar);setPreview(url);return()=>URL.revokeObjectURL(url)},[value.avatar])
 return <Box sx={{p:{xs:2.5,md:4},border:'1px solid #e1eafe',borderRadius:4,background:'linear-gradient(120deg,#f8faff,#eaf1ff)',color:'#19253c',position:'relative',overflow:'hidden'}}>
  <Box sx={{position:'absolute',right:-40,bottom:-90,width:280,height:280,borderRadius:'40%',bgcolor:'#d9e6ff70',transform:'rotate(20deg)'}}/>
  <Stack direction="row" alignItems="center" gap={3} sx={{position:'relative'}}><Box sx={{position:'relative'}}><Avatar src={preview||(typeof value.avatar==='string'?value.avatar:undefined)} sx={{width:{xs:78,md:105},height:{xs:78,md:105},fontSize:35,bgcolor:'#dce8ff',color:'#246bfd',border:'4px solid #fff'}}>{(value.first_name||value.full_name||'م')[0]}</Avatar>{onChange&&<IconButton component="label" aria-label="انتخاب عکس پروفایل" sx={{position:'absolute',bottom:0,right:-4,bgcolor:'white',border:'1px solid #e3eafa','&:hover':{bgcolor:'#edf3ff'}}}><CameraAltOutlinedIcon fontSize="small"/><input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(file){if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))setError('عکس باید PNG، JPG یا WebP و کمتر از ۵ مگابایت باشد.');else{setError('');onChange({...value,avatar:file})}}event.target.value=''}}/></IconButton>}</Box><Box><Typography variant="h1" fontSize={{xs:23,md:30}} fontWeight={900}>{title}</Typography><Typography fontSize={13} color="#7b879d" sx={{mt:1}}>{description}</Typography>{onChange&&value.avatar&&<Button size="small" onClick={()=>onChange({...value,avatar:null})}>حذف عکس</Button>}</Box></Stack>{error&&<Alert severity="error" sx={{mt:2}}>{error}</Alert>}
 </Box>
}
const digits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,digit=>String(digit.charCodeAt(0)-(digit>='۰'?1776:1632)))
export function ProfileDetailsForm({value,onChange,mode='manage'}:{value:any;onChange:(value:any)=>void;mode?:'self'|'manage'|'create'}){
 const actor=useSelector(selectRole)
 const admin=actor==='superadmin',self=mode==='self',create=mode==='create'
 const [error,setError]=useState(''),[postalBusy,setPostalBusy]=useState(false),[copied,setCopied]=useState(false)
 const current=useRef(value);current.current=value
 const patch=(name:string,next:any)=>onChange({...value,[name]:next})
 const lookup=async()=>{const postal=digits(value.postal_code||'').replace(/\D/g,'');if(!/^\d{10}$/.test(postal)){setError('کد پستی باید دقیقاً ۱۰ رقم باشد.');return}setPostalBusy(true);setError('');try{const response=await api.get(`${ACCOUNTS_URL}/postal/lookup/`,{params:{postal_code:postal}});if((current.current.postal_code||'')===postal)onChange({...current.current,province:response.data.data.province,city:response.data.data.city,address:response.data.data.address})}catch(error:any){setError(error.message||'استعلام انجام نشد.')}finally{setPostalBusy(false)}}
 const field=(name:string,label:string,options:any={})=><Grid item xs={12} sm={6} lg={4} key={name}><TextField fullWidth label={label} value={value[name]??''} onChange={event=>patch(name,['phone','national_code'].includes(name)?digits(event.target.value):event.target.value||null)} {...options}/></Grid>
 return <Stack spacing={2.5}>
  {error&&<Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}
  <Grid container spacing={2.5} sx={{width:'calc(100% + 20px) !important',ml:'-20px !important'}}>
   {field('first_name','نام',{required:true})}{field('last_name','نام خانوادگی',{required:true})}
   <Grid item xs={12} sm={6} lg={4}><TextField fullWidth label="شناسه حساب کاربری" value={value.id?`#${value.id}`:'پس از ثبت ایجاد می‌شود'} disabled InputProps={{endAdornment:value.id?<InputAdornment position="end"><IconButton aria-label="کپی شناسه حساب" onClick={()=>{navigator.clipboard?.writeText(String(value.id)).then(()=>setCopied(true)).catch(()=>{})}}><ContentCopyRoundedIcon fontSize="small"/></IconButton></InputAdornment>:undefined}} helperText={copied?'کپی شد':'شناسه یکتای حساب'}/></Grid>
   {field('phone','شماره موبایل',{disabled:self,required:create,inputProps:{maxLength:11,inputMode:'tel'}})}
   {field('email','ایمیل',{type:'email'})}{field('national_code','کد ملی',{disabled:self||(!admin&&!create),inputProps:{maxLength:10}})}
   {create&&field('password','رمز عبور اولیه',{type:'password',required:true,inputProps:{minLength:8},helperText:'حداقل ۸ کاراکتر',autoComplete:'new-password'})}
   <Grid item xs={12} sm={6} lg={4}><TextField fullWidth label="کد پستی" value={value.postal_code||''} onChange={event=>onChange({...value,postal_code:digits(event.target.value).replace(/\D/g,'').slice(0,10),province:null,city:null,address:null})} inputProps={{inputMode:'numeric',maxLength:10}} helperText="پس از واردکردن کد پستی، استعلام را بزنید." InputProps={{endAdornment:<InputAdornment position="end"><IconButton aria-label="استعلام کد پستی" disabled={postalBusy||!/^\d{10}$/.test(value.postal_code||'')} onClick={lookup}>{postalBusy?<CircularProgress size={18}/>:<SearchRoundedIcon/>}</IconButton></InputAdornment>}}/></Grid>
   <Grid item xs={12} sm={6} lg={4}><DatePickerFilter mode="controlled" item={{label:'تاریخ تولد'}} value={value.birth_date||null} onChange={date=>patch('birth_date',date)}/></Grid>{field('province','استان',{disabled:true})}{field('city','شهر',{disabled:true})}
   <Grid item xs={12} sm={6} lg={8}><TextField fullWidth label="آدرس" value={value.address||''} disabled multiline minRows={1} helperText="آدرس از استعلام معتبر کد پستی دریافت می‌شود."/></Grid>
   {!self&&!create&&<Grid item xs={12} sm={6} lg={4}><TextField fullWidth select label="وضعیت حساب" value={value.account_status||'active'} onChange={event=>onChange({...value,account_status:event.target.value,is_active:event.target.value==='active'})}><MenuItem value="active">فعال</MenuItem><MenuItem value="inactive">غیرفعال</MenuItem><MenuItem value="suspended">مسدود</MenuItem></TextField></Grid>}
   {!self&&admin&&!create&&<Grid item xs={12} sm={6} lg={4}><TextField fullWidth select label="وضعیت احراز هویت" value={value.verification_status||'not_started'} onChange={event=>patch('verification_status',event.target.value)}><MenuItem value="not_started">شروع نشده</MenuItem><MenuItem value="pending">در انتظار</MenuItem><MenuItem value="verified">تأیید شده</MenuItem><MenuItem value="rejected">رد شده</MenuItem></TextField></Grid>}
   {!self&&<Grid item xs={12} sm={6} lg={4}><TextField fullWidth select label="نوع کاربر" value={value.user_type||'consumer'} onChange={event=>patch('user_type',event.target.value)}><MenuItem value="consumer">مصرف‌کننده</MenuItem><MenuItem value="investor">سرمایه‌گذار</MenuItem></TextField></Grid>}
  </Grid>
  {!create&&<Stack direction="row" flexWrap="wrap" gap={1.2} sx={{py:1}}>{[['حساب فعال',value.is_active],['موبایل تأیید شده',value.phone_verified],['کد ملی تأیید شده',value.national_code_verified],['پروفایل تکمیل شده',value.has_profile]].map(([label,yes])=><Chip key={String(label)} icon={<VerifiedOutlinedIcon/>} label={String(label)} color={yes?'success':'default'} variant="outlined" size="small"/>)}</Stack>}
  {!create&&<Grid container spacing={2}><Grid item xs={12} md={6}><Box sx={{p:2,borderRadius:3,bgcolor:'action.hover'}}><Typography variant="caption" color="text.secondary">تاریخ عضویت</Typography><Typography fontSize={12}>{formatDate(value.date_joined)}</Typography></Box></Grid><Grid item xs={12} md={6}><Box sx={{p:2,borderRadius:3,bgcolor:'action.hover'}}><Typography variant="caption" color="text.secondary">آخرین به‌روزرسانی</Typography><Typography fontSize={12}>{formatDate(value.profile_updated_at||value.last_login||value.date_joined)}</Typography></Box></Grid></Grid>}
 </Stack>
}

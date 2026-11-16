import {useState} from 'react'
import {Alert,Button,Stack,TextField,Typography} from '@mui/material'
import api from '../../../Core/Request'
import {ACCOUNTS_URL} from '../../../Core/APP_URL'

type Props={authenticated?:boolean;phone?:string;onComplete?:()=>void}
const digits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,digit=>String(digit.charCodeAt(0)-(digit>='۰'?1776:1632)))
const phoneHint=(phone:string)=>phone.length>6?`${phone.slice(0,4)}••••${phone.slice(-3)}`:phone

export default function PasswordOtpFlow({authenticated=false,phone:initialPhone='',onComplete}:Props){
 const [step,setStep]=useState<'send'|'phone'|'code'|'password'|'done'>(authenticated?'send':'phone')
 const [phone,setPhone]=useState(initialPhone),[code,setCode]=useState(''),[token,setToken]=useState('')
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const send=async()=>{setBusy(true);setError('');try{await api.post(`${ACCOUNTS_URL}/${authenticated?'password/change/send-otp':'password/reset/send-otp'}/`,authenticated?{}:{phone:digits(phone).replace(/\D/g,'')});setStep('code')}catch(reason:any){setError(reason.response?.data?.message||reason.message||'ارسال کد انجام نشد.')}finally{setBusy(false)}}
 const verify=async()=>{const normalized=digits(code).replace(/\D/g,'');if(normalized.length<4){setError('کد پیامکی را کامل وارد کنید.');return}setBusy(true);setError('');try{const path=authenticated?'password/change/verify-otp':'password/reset/verify-otp',payload=authenticated?{code:normalized}:{phone:digits(phone).replace(/\D/g,''),code:normalized};const response=await api.post(`${ACCOUNTS_URL}/${path}/`,payload);setToken(response.data.data.reset_token);setStep('password')}catch(reason:any){setError(reason.response?.data?.message||reason.message||'تأیید کد انجام نشد.')}finally{setBusy(false)}}
 const complete=async()=>{if(password.length<8){setError('رمز جدید باید حداقل ۸ کاراکتر باشد.');return}if(password!==confirm){setError('رمز جدید و تکرار آن یکسان نیست.');return}setBusy(true);setError('');try{await api.post(`${ACCOUNTS_URL}/password/reset/complete/`,{token,new_password:password,new_password_confirm:confirm});setStep('done');onComplete?.()}catch(reason:any){setError(reason.response?.data?.message||reason.message||'ثبت رمز جدید انجام نشد.')}finally{setBusy(false)}}
 return <Stack spacing={2.2} component="section" aria-label="تغییر رمز با کد پیامکی">
  {error&&<Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}
  {step==='send'&&<><Typography color="text.secondary" fontSize={13}>کد تأیید برای شماره ثبت‌شده‌ی شما ارسال می‌شود ({phoneHint(phone)}).</Typography><Button variant="contained" disabled={busy} onClick={send}>{busy?'در حال ارسال…':'ارسال کد تأیید'}</Button></>}
  {step==='phone'&&<><Typography color="text.secondary" fontSize={13}>کد تأیید برای شماره‌ای ارسال می‌شود که با آن حساب ساخته‌اید.</Typography><TextField fullWidth autoComplete="tel" label="شماره موبایل" value={phone} onChange={event=>setPhone(digits(event.target.value).replace(/\D/g,'').slice(0,11))} inputProps={{inputMode:'tel',maxLength:11,dir:'ltr'}}/><Button variant="contained" disabled={busy||!/^09\d{9}$/.test(phone)} onClick={send}>{busy?'در حال ارسال…':'ارسال کد تأیید'}</Button></>}
  {step==='code'&&<><Typography color="text.secondary" fontSize={13}>کد پیامکی {authenticated?`ارسال‌شده به ${phoneHint(phone)}`:'ارسال‌شده به شماره شما'} را وارد کنید.</Typography><TextField fullWidth autoFocus label="کد تأیید" value={code} onChange={event=>setCode(digits(event.target.value).replace(/\D/g,'').slice(0,6))} inputProps={{inputMode:'numeric',maxLength:6,dir:'ltr'}}/><Button variant="contained" disabled={busy||code.length<4} onClick={verify}>{busy?'در حال بررسی…':'تأیید کد'}</Button><Button disabled={busy} onClick={send}>ارسال دوباره کد</Button>{!authenticated&&<Button disabled={busy} onClick={()=>{setError('');setStep('phone')}}>اصلاح شماره موبایل</Button>}</>}
  {step==='password'&&<><Typography color="text.secondary" fontSize={13}>کد تأیید شد. رمز جدید را انتخاب کنید؛ حداقل ۸ کاراکتر.</Typography><TextField fullWidth autoFocus label="رمز جدید" type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} inputProps={{minLength:8}}/><TextField fullWidth label="تکرار رمز جدید" type="password" autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)} inputProps={{minLength:8}}/><Button variant="contained" disabled={busy||password.length<8||password!==confirm} onClick={complete}>{busy?'در حال ذخیره…':'ثبت رمز جدید'}</Button></>}
  {step==='done'&&<Alert severity="success">رمز با موفقیت تغییر کرد. برای ادامه دوباره وارد حساب شوید.</Alert>}
 </Stack>
}

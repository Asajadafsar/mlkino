import {useState} from 'react'
import {Alert,Button,Stack,TextField} from '@mui/material'
import {useDispatch} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import axios from 'axios'
import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import {latinDigits} from '../../../Core/PersianDate'
import {setRole} from '../../../redux/RoleSlice'
import {sendOtp} from '../Signup/authApi'
import {OtpVerification} from '../Shared/OtpVerification'
export default function LoginOtp({isOtpStep,setIsOtpStep}:{isOtpStep:boolean;setIsOtpStep:(value:boolean)=>void}){
 const [phone,setPhone]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const dispatch=useDispatch(),navigate=useNavigate()
 const send=async()=>{await sendOtp(phone);setIsOtpStep(true)}
 if(isOtpStep)return <OtpVerification phone={phone} onBack={()=>setIsOtpStep(false)} onResend={send} onVerify={async code=>{const response=await axios.post(`${ACCOUNTS_URL}/login/otp/`,{phone,code},{withCredentials:true});dispatch(setRole(response.data.data.user.role));navigate('/dashboard',{replace:true})}}/>
 return <Stack component="form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await send()}catch(error:any){setError(error.response?.data?.message||'ارسال کد انجام نشد.')}finally{setBusy(false)}}} spacing={2.5}>{error&&<Alert severity="error">{error}</Alert>}<TextField label="شماره تلفن" required fullWidth value={phone} onChange={e=>setPhone(latinDigits(e.target.value))} autoComplete="tel" inputProps={{inputMode:'tel',maxLength:11,pattern:'09[0-9]{9}',dir:'ltr'}}/><Button type="submit" variant="contained" disabled={busy} size="large">{busy?'در حال ارسال…':'دریافت کد ورود'}</Button></Stack>
}

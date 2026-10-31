import {Box,Button,Stack,Tab,Tabs,Typography} from '@mui/material'
import {useState} from 'react'
import {Link} from 'react-router-dom'
import {AuthShell} from '../Shared/AuthShell'
import LoginPassword from './LoginPassword'
import LoginOtp from './LoginOtp'
export type LoginMethod='password'|'otp'
export default function LoginPage(){
 const [method,setMethod]=useState<LoginMethod>('password'),[isOtpStep,setIsOtpStep]=useState(false)
 return <AuthShell><Tabs value={method} onChange={(_,value)=>{setMethod(value);setIsOtpStep(false)}} variant="fullWidth" sx={{borderBottom:'1px solid #e8eef8','& .MuiTab-root':{fontSize:13,minHeight:48}}}><Tab value="password" label="ورود با رمز عبور"/><Tab value="otp" label="ورود با کد یکبارمصرف"/></Tabs>
  <Box><Typography component="h1" fontSize={{xs:23,md:28}} fontWeight={900}>{isOtpStep?'کد تأیید را وارد کنید':'ورود به ملکینو'}</Typography><Typography fontSize={13} color="text.secondary" sx={{mt:1,lineHeight:2}}>{isOtpStep?'کد ارسال‌شده به شماره همراه خود را وارد کنید.':'برای ادامه، اطلاعات حساب خود را وارد کنید.'}</Typography></Box>
  {method==='password'?<LoginPassword/>:<LoginOtp isOtpStep={isOtpStep} setIsOtpStep={setIsOtpStep}/>}
  <Stack direction="row" justifyContent="center" alignItems="center" sx={{pt:2,mt:'auto !important'}}><Typography color="text.secondary" fontSize={13}>حساب کاربری ندارید؟</Typography><Button component={Link} to="/signup" size="small">ثبت‌نام کنید</Button></Stack>
 </AuthShell>
}

import {useState} from 'react'
import {Alert,Box,Button,Grid,IconButton,InputAdornment,Stack,Stepper,Step,StepLabel,TextField,Typography} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import {Link} from 'react-router-dom'
import {AuthShell} from '../Shared/AuthShell'
import {latinDigits} from '../../../Core/PersianDate'
import SignupInfo from './SignupInfo'
import SignupOtp from './SignupOtp'
import {sendOtp} from './authApi'
export type SignupStep=0|1|2
export default function SignupPage(){
 const [step,setStep]=useState<SignupStep>(0),[draft,setDraft]=useState({first_name:'',last_name:'',phone:'',password:'',password_confirm:''}),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const submit=async(event:React.FormEvent)=>{event.preventDefault();if(busy)return;if(draft.password!==draft.password_confirm){setError('رمز عبور و تکرار آن یکسان نیستند.');return}setBusy(true);setError('');try{await sendOtp(latinDigits(draft.phone));setStep(1)}catch(error:any){setError(error.response?.data?.message||'ارسال کد انجام نشد.')}finally{setBusy(false)}}
 const field=(key:keyof typeof draft,label:string,secret=false)=><TextField fullWidth required label={label} value={draft[key]} onChange={event=>setDraft({...draft,[key]:key==='phone'?latinDigits(event.target.value):event.target.value})} type={secret&&!show?'password':'text'} autoComplete={secret?'new-password':key==='phone'?'tel':'off'} inputProps={secret?{minLength:8}:key==='phone'?{maxLength:11,pattern:'09[0-9]{9}',inputMode:'tel',dir:'ltr'}:{minLength:2}} InputProps={secret?{endAdornment:<InputAdornment position="end"><IconButton aria-label={show?'پنهان کردن رمز':'نمایش رمز'} onClick={()=>setShow(!show)}>{show?<VisibilityOffOutlinedIcon/>:<VisibilityOutlinedIcon/>}</IconButton></InputAdornment>}:undefined}/>
 return <AuthShell title={step===1?'تأیید شماره تلفن':step===2?'تکمیل حساب':'شروع یک تجربه جدید در ملکینو'} subtitle="همین امروز حساب خود را ایجاد کنید و کارهای املاک را ساده‌تر مدیریت کنید.">
  <Box><Typography component="h1" fontWeight={900} fontSize={{xs:23,md:28}}>{step===1?'کد تأیید را وارد کنید':step===2?'اطلاعات تکمیلی':'ایجاد حساب کاربری'}</Typography><Typography fontSize={12} color="text.secondary" sx={{mt:1}}>برای ادامه، اطلاعات خود را وارد کنید.</Typography></Box>
  <Stepper activeStep={step} alternativeLabel sx={{'& .MuiStepLabel-label':{fontSize:11},'& .MuiStepIcon-text':{fontFamily:'inherit'}}}>{['اطلاعات فردی','تأیید شماره','تکمیل حساب'].map(label=><Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
  {error&&<Alert severity="error">{error}</Alert>}
  {step===0&&<Stack component="form" onSubmit={submit} spacing={2}><Grid container spacing={1.5}><Grid item xs={6}>{field('first_name','نام')}</Grid><Grid item xs={6}>{field('last_name','نام خانوادگی')}</Grid></Grid>{field('phone','شماره تلفن')}{field('password','رمز عبور',true)}{field('password_confirm','تکرار رمز عبور',true)}<Button variant="contained" type="submit" disabled={busy} size="large">{busy?'در حال ارسال…':'ادامه و دریافت کد تأیید'}</Button></Stack>}
  {step===1&&<SignupOtp phone={draft.phone} onBack={()=>setStep(0)} onSuccess={()=>setStep(2)}/>}
  {step===2&&<SignupInfo phone={draft.phone} onBack={()=>setStep(1)} initialValues={draft}/>}
  <Stack direction="row" justifyContent="center" alignItems="center"><Typography color="text.secondary" fontSize={12}>قبلاً ثبت‌نام کرده‌اید؟</Typography><Button component={Link} to="/login" size="small">ورود به حساب</Button></Stack>
 </AuthShell>
}

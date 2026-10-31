import {useState} from 'react'
import {Alert,Button,IconButton,InputAdornment,Stack,TextField} from '@mui/material'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import {Link,useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'
import axios from 'axios'
import {setRole,UserRole} from '../../../redux/RoleSlice'
import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import {latinDigits} from '../../../Core/PersianDate'
export default function LoginPassword(){
 const [phone,setPhone]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const dispatch=useDispatch(),navigate=useNavigate()
 const submit=async(event:React.FormEvent)=>{event.preventDefault();if(busy)return;setBusy(true);setError('');try{const response=await axios.post(`${ACCOUNTS_URL}/login/password/`,{phone:latinDigits(phone).trim(),password},{withCredentials:true});const role=response.data.data.user.role;if(Object.values(UserRole).includes(role))dispatch(setRole(role));navigate('/dashboard',{replace:true})}catch(error:any){setError(error.response?.data?.message||'ارتباط با سرور برقرار نشد.')}finally{setBusy(false)}}
 return <Stack component="form" onSubmit={submit} spacing={2.5}>{error&&<Alert severity="error">{error}</Alert>}<TextField fullWidth label="شماره تلفن" value={phone} onChange={event=>setPhone(latinDigits(event.target.value))} required autoComplete="tel" inputProps={{inputMode:'tel',maxLength:11,pattern:'09[0-9]{9}',dir:'ltr'}} InputProps={{endAdornment:<InputAdornment position="end"><PhoneIphoneOutlinedIcon fontSize="small"/></InputAdornment>}}/>
  <TextField fullWidth label="رمز عبور" type={show?'text':'password'} value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" required InputProps={{endAdornment:<InputAdornment position="end"><IconButton onClick={()=>setShow(!show)} aria-label={show?'پنهان کردن رمز':'نمایش رمز'}>{show?<VisibilityOffOutlinedIcon fontSize="small"/>:<VisibilityOutlinedIcon fontSize="small"/>}</IconButton></InputAdornment>}}/>
  <Button component={Link} to="/change-password" sx={{alignSelf:'flex-start',p:0,fontSize:12}}>رمز عبور را فراموش کرده‌اید؟</Button>
  <Button type="submit" variant="contained" size="large" endIcon={<ArrowBackRoundedIcon/>} disabled={busy} sx={{minHeight:48,boxShadow:'0 7px 18px #246bfd22'}}>{busy?'در حال ورود…':'ورود به حساب'}</Button>
 </Stack>
}

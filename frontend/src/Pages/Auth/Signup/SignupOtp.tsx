import {useLocation,useNavigate} from 'react-router-dom'
import {authDestination} from '../../../Core/AuthDestination'
import {OtpVerification} from '../Shared/OtpVerification'
import {sendOtp,verifyOtp} from './authApi'
export const formatTime=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`.replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])
export default function SignupOtp({phone,onBack,onSuccess}:{phone:string;onBack:()=>void;onSuccess:()=>void}){const location=useLocation(),navigate=useNavigate();return <OtpVerification phone={phone} onBack={onBack} onResend={()=>sendOtp(phone)} onVerify={async code=>{const response=await verifyOtp(phone,code);if(response.data?.data?.next_step==='dashboard')navigate(authDestination(location.search),{replace:true});else onSuccess()}}/>}

import {OtpVerification} from '../Shared/OtpVerification'
import {sendOtp,verifyOtp} from './authApi'
export const formatTime=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`.replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])
export default function SignupOtp({phone,onBack,onSuccess}:{phone:string;onBack:()=>void;onSuccess:()=>void}){return <OtpVerification phone={phone} onBack={onBack} onResend={()=>sendOtp(phone)} onVerify={async code=>{await verifyOtp(phone,code);onSuccess()}}/>}

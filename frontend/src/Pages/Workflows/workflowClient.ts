import api from '../../Core/Request'
export type WorkflowRow={id:number;[key:string]:any}
export const workflowUrl=(resource:string)=>`workflows/${resource}/`
export const workflowError=(error:any)=>error.response?.data?.message||error.response?.data?.errors?.[0]?.message||error.message||'ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.'
export function unpack<T=any>(response:any):T{return response.data.data}
export const persianNumber=(value:any)=>value===null||value===undefined||value===''?'—':Number.isFinite(Number(value))?Number(value).toLocaleString('fa-IR'):String(value)
export const dateTime=(value:any)=>{if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'})}
export const statusLabels:Record<string,string>={expert:'کارشناس دفتر',agreed:'توافقی',legal:'قانونی',cash:'وجوه نقد و بانک',receivables:'حساب‌های دریافتنی',commission_income:'درآمد کمیسیون',expert_payable:'بدهی به کارشناس',tax_payable:'مالیات پرداختنی',pending:'در انتظار',accepted:'پذیرفته‌شده',rejected:'ردشده',expired:'منقضی‌شده',market:'بازار املاک ملکینو',confirmed:'تأییدشده',completed:'انجام‌شده',liked:'پسند شد',disliked:'پسند نشد',follow_up:'پیگیری بعدی',cancelled:'لغوشده',draft:'پیش‌نویس',posted:'ثبت قطعی',reversed:'برگشت‌شده',published:'منتشرشده',owner:'مالک',buyer:'خریدار',landlord:'موجر',tenant:'مستأجر',invoice:'صورتحساب',payment:'پرداخت',settlement:'تسویه',reversal:'سند برگشت',debit:'بدهکار',credit:'بستانکار',partial:'پرداخت جزئی',paid:'پرداخت‌شده',unpaid:'در انتظار پرداخت',returned:'برگشت‌خورده'}
export const label=(value:any)=>statusLabels[String(value)]||String(value||'—')
export const digits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/,/g,'').trim()

export function requestKey(){if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`}

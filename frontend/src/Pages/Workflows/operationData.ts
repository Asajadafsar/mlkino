export const operationDemo = {
 overview:{counts:{contacts:12,pending_assignments:0,visits:14,finance:38}},
 tasks:{results:[{id:1,title:'بازدید ملک کد ۱۳۴۵',description:'با مشتری آقای محمدی',status:'pending'},{id:2,title:'پیگیری ارجاع درخواست شماره ۷۸۹۰',description:'بررسی مدارک و تعیین کارشناس',status:'pending'},{id:3,title:'جلسه هماهنگی تیم فروش',description:'بررسی پیشنهادهای ویژه',status:'pending'},{id:4,title:'ارسال پیشنهاد ملک به مشتری',description:'بر اساس نیازمندی‌های ثبت‌شده',status:'pending'}]},
 assignments:{results:[{id:1,property_title:'بررسی پیشنهاد ملک کد ۸۲۳۱',expert_name:'کارشناس فروش',status:'pending'},{id:2,property_title:'بررسی تخفیف ویژه',expert_name:'مدیر فروش',status:'pending'},{id:3,property_title:'بررسی ارجاع درخواست جدید',expert_name:'مدیر دفتر',status:'pending'}]},
 visits:{results:[]}, finance:{results:[]},
 report:{total_results:89,trend:[5,9,14,6,11,14,7].map((count,i)=>({date:`2026-11-${String(1+i*4).padStart(2,'0')}`,count})),comparison:[{label:'درخواست‌ها',current:38},{label:'بازدیدها',current:21},{label:'پیشنهادها',current:16},{label:'سایر عملیات',current:14}]},
}
export function recentOperations(data:Record<string,any>){
 return [...(data.assignments?.results||[]).map((r:any)=>({id:'assignment:'+r.id,title:'درخواست جدید ارجاع شد',detail:r.property_title,at:r.created_at,to:'/assignments'})),...(data.visits?.results||[]).map((r:any)=>({id:'visit:'+r.id,title:'بازدید ثبت شد',detail:r.property_title,at:r.created_at,to:'/visits'})),...(data.finance?.results||[]).map((r:any)=>({id:'finance:'+r.id,title:'سند مالی ثبت شد',detail:r.description,at:r.created_at,to:'/finance'}))].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,5)
}

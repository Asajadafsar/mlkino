import interior1 from '../../Images/file/1.webp'
import interior2 from '../../Images/file/2.webp'
import interior3 from '../../Images/file/3.webp'
import interior4 from '../../Images/file/4.jpg'
import interior5 from '../../Images/file/5.jpg'
import type {FileRecord} from './filePresentation'
export const demoImages=['/assets/auth-villa.webp',interior1,interior2,interior3,interior4,interior5]
export function demoFiles():FileRecord[]{
 const definitions=[
  ['آپارتمان لوکس سعادت‌آباد','آپارتمان','تهران','سعادت‌آباد','فروش',112,2,12100000000,'فعال'],
  ['ویلای مدرن با استخر اختصاصی','ویلایی','تهران','لواسان','فروش',380,4,47000000000,'فعال'],
  ['آپارتمان نوساز سالاریه','آپارتمان','قم','سالاریه','رهن و اجاره',140,3,1500000000,'فعال'],
  ['دفتر اداری نورگیر میرداماد','اداری','تهران','میرداماد','فروش',145,3,18900000000,'در انتظار بررسی'],
  ['خانهٔ حیاط‌دار پردیسان','ویلایی','قم','پردیسان','فروش',220,3,15900000000,'فروخته شده'],
  ['واحد تجاری بر خیابان اصلی','تجاری','تهران','زعفرانیه','رهن و اجاره',65,0,2200000000,'فعال'],
  ['آپارتمان خانوادگی نیاوران','آپارتمان','تهران','نیاوران','فروش',92,2,13800000000,'فعال'],
  ['آپارتمان مبله با تراس بزرگ','آپارتمان','قم','امام خمینی','رهن و اجاره',105,2,850000000,'فعال']
 ]
 return definitions.map(([title,propertyType,city,neighborhood,contractType,area,roomCount,amount,status],i)=>{
 const rent=contractType==='رهن و اجاره',value=Number(amount),image=i===3?'/assets/estate-hero-v1.webp':i%2?demoImages[0]:demoImages[(i%5)+1]
 return {id:900001+i,demo:true,title:String(title),propertyType:String(propertyType),contractType:String(contractType),city:String(city),province:String(city),district:i%2?'منطقه ۳':'منطقه ۴',neighborhood:String(neighborhood),address:'خیابان نمونه، کوچهٔ بهار، پلاک نمایشی '+(i+1),area:Number(area),roomCount:Number(roomCount),...(rent?{mortgagePrice:value,monthlyRent:(i+1)*5000000}:{totalPrice:value,pricePerMeter:Math.round(value/Number(area))}),status:String(status),publication_state:i===3?'pending':i===4?'draft':'published',archived:i===4,buildYear:String(1400+i%4),floor:i%5+1,totalFloor:7,documentType:'تک برگ',occupancyStatus:i%2?'تخلیه':'مالک',bathroom:'۲',heating:'پکیج',cooling:'اسپلیت',flooring:'پارکت',facade:'سنگ',direction:'جنوبی',amenities:i===3?['پارکینگ','آسانسور']:['پارکینگ','آسانسور','انباری','بالکن'],description:`${title}، دارای نورگیری مناسب و دسترسی به خدمات محله.\nاین فایل و تمام مشخصات اشخاص آن صرفاً دادهٔ نمونه برای بررسی طراحی هستند.`,internalNote:'یادداشت نمونه: هماهنگی بازدید در ساعات اداری انجام شود.',strongPoint:'نورگیری مناسب و دسترسی آسان',ownerName:'مالک نمایشی '+(i+1),expertName:['کارشناس نمونه الف','کارشناس نمونه ب','کارشناس نمونه ج'][i%3],agencyName:i%2?'املاک نمونه ملکینو':undefined,created_by_name:'ثبت‌کنندهٔ نمایشی',creatorRole:i%2?'agency':'expert',ownerPhone:undefined,expertPhone:undefined,images:[image,...demoImages.filter(url=>url!==image).slice(0,3)],created_at:`2026-11-${String(2+i).padStart(2,'0')}T08:30:00Z`,updated_at:`2026-11-${String(12+i).padStart(2,'0')}T12:00:00Z`,latitude:city==='قم'?34.6399:35.806,longitude:city==='قم'?50.8759:51.3756,external_links:{'سند نمایشی ملک (PDF)':'/assets/file-demo/sample-document.pdf'},pinned:i===0,source:'panel'} as FileRecord
 })
}

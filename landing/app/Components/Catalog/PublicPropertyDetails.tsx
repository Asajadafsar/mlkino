"use client";
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ApartmentRounded from '@mui/icons-material/ApartmentRounded';
import BedRounded from '@mui/icons-material/BedRounded';
import StraightenRounded from '@mui/icons-material/StraightenRounded';
import LocationOnRounded from '@mui/icons-material/LocationOnRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import ShareRounded from '@mui/icons-material/ShareRounded';
import {faNumber,propertyTitle,safeExternal,type PublicConfig,type PublicProperty} from '../../Core/catalog';
import {usePublic} from './usePublic';
import PublicMap from './PublicMap';
import {ContactButton} from './ContactButton';
import {FavoriteButton} from './FavoriteButton';
import {CatalogVisitButton} from './CatalogVisitButton';
import {PANEL_ORIGIN} from '../../Core/panel';
import styles from './propertyDetail.module.css';

const location=(row:PublicProperty)=>[row.province,row.city,Array.isArray(row.district)?row.district.join('، '):row.district,Array.isArray(row.neighborhood)?row.neighborhood.join('، '):row.neighborhood].filter(Boolean).join('، ');
const price=(row:PublicProperty)=>row.totalPrice!=null?`${faNumber(row.totalPrice)} تومان`:row.mortgagePrice!=null?`${faNumber(row.mortgagePrice)} رهن · ${faNumber(row.monthlyRent)} اجاره`:'قیمت توافقی';

export default function PublicPropertyDetails({id}:{id:number}){
 const {data:config}=usePublic<PublicConfig>('config/');
 const {data:row,error,loading,retry}=usePublic<PublicProperty>('catalog/'+id+'/');
 const [selected,setSelected]=useState(0),[broken,setBroken]=useState<Record<string,boolean>>({});
 if(loading)return <main className={styles.page}><div className={styles.skeleton}/></main>;
 if(error||!row)return <main className={styles.page}><section className={styles.error}><h1>دریافت جزئیات ملک انجام نشد</h1><p>{error||'این فایل منتشر نشده یا در دسترس نیست.'}</p><button onClick={retry}>تلاش دوباره</button><Link href="/files">بازگشت به فایل‌ها</Link></section></main>;
 const images=(row.images||[]).filter(x=>!!safeExternal(x)||x.startsWith('/')&&!x.startsWith('//'));
 const image=images[selected]||images[0];
 const specs=[{icon:<StraightenRounded/>,label:'متراژ',value:`${faNumber(row.area??row.areaFrom)} متر`},{icon:<BedRounded/>,label:'تعداد خواب',value:`${faNumber(row.roomCount)} خواب`},{icon:<ApartmentRounded/>,label:'نوع ملک',value:row.propertyType},{icon:<VerifiedUserRounded/>,label:'نوع معامله',value:row.contractType}];
 return <main className={styles.page}>
  <nav className={styles.breadcrumb}><Link href="/">خانه</Link><span>›</span><Link href={row.kind==='request'?'/requests':'/files'}>{row.kind==='request'?'درخواست‌ها':'املاک'}</Link><span>›</span><b>{propertyTitle(row)}</b></nav>
  <header className={styles.heading}><div><div className={styles.badges}>{row.featured&&<span>👑 ویژه</span>}<small>کد فایل: MLK-{faNumber(row.id)}</small></div><h1>{propertyTitle(row)}</h1><p><LocationOnRounded/>{location(row)}</p></div><div className={styles.headActions}><button aria-label="اشتراک‌گذاری"><ShareRounded/></button><FavoriteButton id={row.id} title={propertyTitle(row)}/></div></header>
  <div className={styles.layout}>
   <section className={styles.content}>
    <div className={styles.gallery}><div className={styles.mainImage}>{image&&!broken[image]?<Image src={image} alt={propertyTitle(row)} fill sizes="(max-width:900px) 100vw, 70vw" priority onError={()=>setBroken(v=>({...v,[image]:true}))}/>:<div className={styles.noImage}><ApartmentRounded/><span>تصویر ملک ثبت نشده است</span></div>}<span className={styles.counter}>{faNumber(selected+1)} / {faNumber(Math.max(images.length,1))}</span></div>{images.length>1&&<div className={styles.thumbnails}>{images.slice(0,6).map((src,index)=><button key={src} aria-pressed={selected===index} onClick={()=>setSelected(index)}><Image src={src} alt="" fill sizes="120px"/></button>)}</div>}</div>
    <div className={styles.tabs}><a href="#specs">مشخصات فایل</a><a href="#description">توضیحات</a><a href="#amenities">امکانات</a><a href="#map">موقعیت روی نقشه</a></div>
    <section id="specs" className={styles.card}><div className={styles.specGrid}>{specs.map(item=><div key={item.label}>{item.icon}<small>{item.label}</small><strong>{item.value}</strong></div>)}</div></section>
    <section id="description" className={styles.card}><h2>توضیحات فایل</h2><p>{row.description||'توضیحات تکمیلی برای این فایل ثبت نشده است.'}</p></section>
    <section id="amenities" className={styles.card}><h2>امکانات رفاهی</h2><div className={styles.amenities}>{row.amenities?.length?row.amenities.map(item=><span key={item}>✓ {item}</span>):<span>امکاناتی ثبت نشده است.</span>}</div></section>
    <section id="map" className={styles.card}><h2>موقعیت ملک</h2><PublicMap rows={[row]}/></section>
   </section>
   <aside className={styles.sidebar}>
    <section className={styles.agent}><div className={styles.avatar}>{row.expert?.name?.slice(0,1)||'م'}</div><div><strong>{row.expert?.name||'کارشناس ملکینو'}</strong><small>{row.office?.name||'دفتر املاک ملکینو'}</small></div></section>
    <div className={styles.actions}><ContactButton id={row.id} label="تماس با کارشناس"/>{config?.features?.visits!==false&&<CatalogVisitButton propertyId={row.id} label="رزرو بازدید"/>}{config?.features?.chats!==false&&<Link href={PANEL_ORIGIN+'/chats?property='+row.id}>ارسال پیام</Link>}</div>
    <section className={styles.price}><small>قیمت پیشنهادی</small><strong>{price(row)}</strong></section>
    <div className={styles.secondary}><FavoriteBorderRounded/> افزودن به علاقه‌مندی‌ها</div>
    {row.external_links&&<section className={styles.links}><h3>مشاهده آنلاین ملک</h3>{Object.entries(row.external_links).map(([name,url])=>{const safe=safeExternal(url);return safe?<a key={name} href={safe} target="_blank" rel="noopener noreferrer">{({telegram:'تلگرام',eitaa:'ایتا',instagram:'اینستاگرام',virtual_tour:'تور مجازی ۳۶۰'} as Record<string,string>)[name]||'لینک تکمیلی'}</a>:null})}</section>}
   </aside>
  </div>
 </main>;
}

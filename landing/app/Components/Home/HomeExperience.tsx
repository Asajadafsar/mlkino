"use client";

import { useRef, useState } from "react";
import {useFileView} from "../../Hooks/useFileView";
import Link from "next/link";
import { propertyItem } from "@/app/Core/sampleData";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import StarOutlineRounded from "@mui/icons-material/StarOutlineRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import GridViewRounded from "@mui/icons-material/GridViewRounded";
import ViewListRounded from "@mui/icons-material/ViewListRounded";
import CardFile from "../Card/CardFile";
import PropertySearch, { DealTabs } from "./PropertySearch";
import { CATEGORIES } from "./categories";
import MapPreview from "./MapPreview";
import styles from "./home.module.css";

const listings = [
  {...propertyItem, propertyType:"آپارتمان", neighborhood:"صادقیه", area:110, roomCount:2, totalPrice:12800000000, images:["/images/properties/apartment.png"]},
  {...propertyItem, propertyType:"ویلا", neighborhood:"لواسان", contractType:"پیش‌فروش", area:520, roomCount:4, totalPrice:45000000000, images:["/images/properties/hero.png"]},
  {...propertyItem, propertyType:"آپارتمان", neighborhood:"فرمانیه", contractType:"رهن و اجاره", area:150, roomCount:3, mortgagePrice:3500000000, monthlyRent:50000000, images:["/images/properties/apartment.png"]},
  {...propertyItem, propertyType:"ویلا", neighborhood:"زعفرانیه", area:350, roomCount:4, totalPrice:11550000000, images:["/images/properties/hero.png"]},
];

export default function HomeExperience() {
  const [deal,setDeal] = useState("buy");
  const [categoryPage,setCategoryPage] = useState(0);
  const [tab,setTab] = useState("latest");
  const [view,changeView] = useFileView();
  const categoryRef = useRef<HTMLDivElement>(null);
  const ordered = tab === "popular" ? [...listings].sort((a,b)=>b.totalPrice-a.totalPrice) : tab === "nearby" ? listings.filter(item=>item.city === "تهران") : tab === "suggested" ? listings.filter(item=>item.propertyType === "ویلا") : listings;
  return <div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><h1><span>ملکینو</span>، مدیریت هوشمند املاک</h1><p>ثبت، مدیریت و فروش سریع املاک در یک پلتفرم حرفه‌ای</p></div>
      <div className={styles.desktopSearch}><PropertySearch compact dealValue={deal} onDealChange={setDeal} /></div>
    </section>
    <div className={styles.mobileSearch}>
      <DealTabs value={deal} onChange={setDeal} />
      <Link href={`/search?deal=${deal}`} className={styles.quickSearch}><SearchRounded /><span>جستجوی ملک، منطقه یا کد آگهی…</span><span className={styles.quickSearchButton}><SearchRounded /></span></Link>
    </div>

    <section className={styles.categorySection} aria-label="دسته‌بندی املاک">
      <button type="button" className={styles.categoryArrow} aria-label="دسته‌بندی‌های قبلی" onClick={()=>categoryRef.current?.scrollBy({left:400,behavior:"smooth"})}><ChevronRightRounded /></button>
      <div className={styles.categories} ref={categoryRef}>{CATEGORIES.map(({label,Icon},i)=><Link key={label} href={`/files?propertyType=${encodeURIComponent(label)}`} className={`${styles.category} ${i===0?styles.categoryActive:""} ${i>=8?styles.extraCategory:""}`} data-page={categoryPage}><Icon /><span>{label}</span></Link>)}</div>
      <button type="button" className={styles.categoryArrow} aria-label="دسته‌بندی‌های بعدی" onClick={()=>categoryRef.current?.scrollBy({left:-400,behavior:"smooth"})}><ChevronLeftRounded /></button>
      <div className={styles.categoryPagination}><button type="button" aria-label="دسته‌بندی‌های اول" aria-pressed={categoryPage===0} onClick={()=>setCategoryPage(0)} /><button type="button" aria-label="دسته‌بندی‌های بیشتر" aria-pressed={categoryPage===1} onClick={()=>setCategoryPage(1)} /><Link href="/categories">همه دسته‌بندی‌ها <ArrowBackRounded /></Link></div>
    </section>

    <div className={styles.dashboard}>
      <div className={styles.results}>
        <section className={styles.stats} aria-label="آمار فعالیت ملکینو">
          {[{Icon:NotificationsNoneRounded,value:"۴۸",label:"یادآوری فعال",color:"orange"},{Icon:VisibilityOutlined,value:"۱.۲K",label:"بازدید امروز",color:"green"},{Icon:DescriptionOutlined,value:"۳۴۰",label:"فایل ملکی",color:"blue"},{Icon:PeopleOutlineRounded,value:"۱۲۸",label:"مشتریان فعال",color:"purple"}].map(({Icon,value,label,color})=><div className={`${styles.stat} ${styles[color]}`} key={label}><div><strong>{value}</strong><span>{label}</span></div><span className={styles.statIcon}><Icon /></span></div>)}
        </section>
        <div className={styles.feedToolbar}>
        <div className={styles.feedTabs} role="group" aria-label="نمایش فایل‌ها">{[{key:"latest",label:"جدیدترین فایل‌ها",Icon:AutoAwesomeOutlined},{key:"suggested",label:"پیشنهادهای ملکینو",Icon:StarOutlineRounded},{key:"popular",label:"بالاترین قیمت",Icon:TrendingUpRounded},{key:"nearby",label:"فایل‌های تهران",Icon:LocationOnOutlined}].map(({key,label,Icon})=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>setTab(key)}><Icon />{label}</button>)}</div>
        <div className={styles.viewControls}><span>{ordered.length.toLocaleString("fa-IR")} فایل ملکی</span><div><button type="button" aria-label="نمایش شبکه‌ای" aria-pressed={view==="grid"} onClick={()=>changeView("grid")}><GridViewRounded /></button><button type="button" aria-label="نمایش لیستی" aria-pressed={view==="list"} onClick={()=>changeView("list")}><ViewListRounded /></button></div></div>
        </div>
        <div className={styles.mobileHeading}><h2><AutoAwesomeOutlined />جدیدترین فایل‌های ملکینو</h2><Link href="/files">مشاهده همه <ArrowBackRounded /></Link></div>
        <div className={`${styles.listings} ${view==="list"?styles.listView:""}`}>{ordered.map((data,index)=><CardFile key={`${tab}-${index}`} data={data} appearance="showcase" />)}</div>
      </div>
      <MapPreview />
    </div>
  </div>;
}

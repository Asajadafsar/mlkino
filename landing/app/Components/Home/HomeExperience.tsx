"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import {usePublicFiles} from "@/app/Core/usePublicFiles";
import { formatNumber } from "../Card/cardFileUtils";
import InfiniteListingFeed from "../Card/InfiniteListingFeed";
import PropertySearch, { DealTabs } from "./PropertySearch";
import SearchBox from "../Navbar/SearchBox";
import { CATEGORIES } from "./categories";
import styles from "./home.module.css";

function requestBudget(value: number) {
  return value >= 1_000_000_000 ? `${formatNumber(value / 1_000_000_000)} میلیارد` : `${formatNumber(value / 1_000_000)} میلیون`;
}

const SECTIONS = [
  { key: "vip", label: "فایل‌های ویژه", Icon: WorkspacePremiumOutlined },
  { key: "files", label: "فایل‌های ملکی", Icon: ApartmentOutlined },
  { key: "requests", label: "درخواست‌های ملکی", Icon: AssignmentOutlined },
];

export default function HomeExperience() {
  const router = useRouter();
  const [deal, setDeal] = useState("buy");
  const [active, setActive] = useState("files");
  const files = usePublicFiles(active === "vip" ? "featured=1&page_size=48" : "page_size=48");
  const requests = usePublicFiles("page_size=12", "request");
  const fileFeed = (label: string) => files?.data?.items.length
    ? <InfiniteListingFeed items={files.data.items} label={label}/>
    : <p role="status">{files?.error || (files ? "فایل منتشرشده‌ای موجود نیست." : "در حال دریافت فایل‌ها…")}</p>;

  return <div className={styles.page}>
    <section className={styles.hero} aria-label="ملکینو، مدیریت هوشمند املاک">
      <div className={styles.heroCopy}><h1><span>ملکینو</span>، مدیریت هوشمند املاک</h1><p>خرید، فروش، رهن و اجاره ملک در سراسر کشور</p></div>
      <div className={styles.heroDeals}><DealTabs value={deal} onChange={setDeal} /></div>
    </section>
    <div className={styles.desktopSearch}><PropertySearch compact hideDeals dealValue={deal} onDealChange={setDeal} /></div>
    <div className={styles.mobileSearch}><SearchBox placeholder="جستجوی ملک، محله یا کد آگهی…" onSearch={query => router.push(`/files?q=${encodeURIComponent(query)}`)} onFilterClick={() => router.push(`/search?deal=${deal}`)} /></div>

    <section className={styles.categories} aria-label="دسته‌بندی‌های ملک">{CATEGORIES.map(({label,Icon},i) => <Link key={label} href={`/files?propertyType=${encodeURIComponent(label)}`} data-land={label === "زمین" || undefined} className={`${styles.category} ${i === 0 ? styles.activeCategory : ""}`}><Icon /><span>{label}</span></Link>)}</section>

    <div className={styles.sectionTabs} role="group" aria-label="فایل‌ها و درخواست‌ها">{SECTIONS.map(({key,label,Icon}) => <button type="button" key={key} aria-pressed={active === key} onClick={() => setActive(key)}><Icon /><span>{label}</span></button>)}</div>

    <div className={styles.sections}>
      <section className={`${styles.panel} ${styles.featuredPanel}`} data-active={active === "vip"} aria-label="فایل‌های ویژه">
        <h2><WorkspacePremiumOutlined />فایل‌های ویژه</h2>
        {active === "vip" && fileFeed("فهرست پیمایشی فایل‌های ویژه")}
        <Link className={styles.viewAll} href="/vip">مشاهده همه فایل‌های ویژه <ArrowBackRounded /></Link>
      </section>
      <section className={styles.panel} data-active={active === "files"} aria-label="فایل‌های ملکی">
        <h2><ApartmentOutlined />فایل‌های ملکی</h2>
        {active === "files" && fileFeed("فهرست پیمایشی فایل‌های ملکی")}
        <Link className={styles.viewAll} href="/files">مشاهده همه فایل‌های ملکی <ArrowBackRounded /></Link>
      </section>
      <section className={`${styles.panel} ${styles.requestsPanel}`} data-active={active === "requests"} aria-label="درخواست‌های ملکی">
        <h2><AssignmentOutlined />درخواست‌های ملکی</h2>
        <div className={styles.requests}>{requests?.data?.items.map(item => <Link key={item.id} href={`/requests/${item.id}`} className={styles.request}><AssignmentOutlined /><div><h3>درخواست {["خرید", "فروش"].includes(item.contractType) ? "خرید" : "رهن"} {item.propertyType}</h3><p>{item.city} · {Array.isArray(item.neighborhood) ? item.neighborhood[0] : item.neighborhood}</p></div><span>تا {requestBudget(["خرید", "فروش"].includes(item.contractType) ? item.totalPriceTo || item.totalPrice : item.mortgagePriceTo || item.mortgagePrice)}</span></Link>)}</div>
        {!requests?.data?.items.length && <p role="status">{requests?.error || (requests ? "درخواست منتشرشده‌ای موجود نیست." : "در حال دریافت درخواست‌ها…")}</p>}
        <Link className={styles.viewAll} href="/requests">مشاهده همه درخواست‌ها <ArrowBackRounded /></Link>
      </section>
    </div>
    <Link className={styles.allCategories} href="/categories">مشاهده همه دسته‌بندی‌ها <ArrowBackRounded /></Link>
  </div>;
}

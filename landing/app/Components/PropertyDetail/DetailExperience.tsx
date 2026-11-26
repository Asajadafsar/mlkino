"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Dialog, IconButton, Snackbar, TextField, useMediaQuery } from "@mui/material";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import PhoneInTalkOutlined from "@mui/icons-material/PhoneInTalkOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import BedOutlined from "@mui/icons-material/BedOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import ElevatorOutlined from "@mui/icons-material/ElevatorOutlined";
import OpenInFullRounded from "@mui/icons-material/OpenInFullRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import DiamondOutlined from "@mui/icons-material/DiamondOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ChatOutlined from "@mui/icons-material/ChatOutlined";
import Instagram from "@mui/icons-material/Instagram";
import Telegram from "@mui/icons-material/Telegram";
import ThreeSixtyRounded from "@mui/icons-material/ThreeSixtyRounded";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import BalconyOutlined from "@mui/icons-material/BalconyOutlined";
import AcUnitOutlined from "@mui/icons-material/AcUnitOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import HandshakeOutlined from "@mui/icons-material/HandshakeOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";
import LinkRounded from "@mui/icons-material/LinkRounded";
import type { PropertyType } from "@/app/Core/types";
import { PROPERTIES, propertyTitle } from "@/app/Core/listings";
import { formatNumber, getDisplayArea, getPriceInfo } from "../Card/cardFileUtils";
import ListingCard from "../Card/ListingCard";
import VisitRequestModal from "../Card/VisitRequestModal";
import VirtualTourModal from "../Card/VirtualTourModal";
import PropertyGallery from "./PropertyGallery";
import styles from "./detail.module.css";

const technicalLabels: Record<string, string> = {
  landArea: "متراژ زمین", buildingArea: "متراژ سازه مسکونی", buildingAge: "قدمت بنا",
  waterHours: "سهم آب (ساعت)", waterMinutes: "سهم آب (دقیقه)", utilities: "انشعابات",
  hasPermit: "مجوز", pool: "استخر", structureType: "نوع سازه", renovated: "بازسازی",
  density: "تراکم", parking: "پارکینگ", storage: "انباری", terrace: "بهارخواب یا تراس",
  frontage: "بر ملک", completionCertificate: "پایان کار", passageWidth: "عرض گذر",
  balcony: "بالکن", commercialUse: "کاربری تجاری", unitCount: "تعداد واحد",
  unitsPerFloor: "تعداد واحد در طبقه", utilityType: "نوع انشعابات", violationsPaid: "پرداخت عدم خلاف",
  ceilingHeight: "ارتفاع سقف", electricityType: "نوع برق", permitType: "نوع مجوز",
  builderType: "نوع سازنده", deliveryDate: "زمان تحویل",
};

function technicalSpecs(details?: Record<string, unknown>) {
  return Object.entries(technicalLabels).flatMap(([key, label]) => {
    const value = details?.[key];
    if (typeof value === "boolean") return [[label, value ? "بله" : "خیر"]];
    if (typeof value === "number") return [[label, formatNumber(value)]];
    if (typeof value === "string" && value) return [[label, value]];
    if (Array.isArray(value) && value.length) return [[label, value.join("، ")]];
    return [];
  });
}

function range(from?: number, to?: number, unit = "") {
  const max = Math.max(from || 0, to || 0);
  const scale = unit.startsWith("تومان") && max >= 1_000_000_000 ? 1_000_000_000 : unit.startsWith("تومان") && max >= 1_000_000 ? 1_000_000 : 1;
  const suffix = scale === 1_000_000_000 ? `میلیارد ${unit}` : scale === 1_000_000 ? `میلیون ${unit}` : unit;
  return from && to ? `${formatNumber(from / scale)} تا ${formatNumber(to / scale)} ${suffix}` : `تا ${formatNumber((to || from || 0) / scale)} ${suffix}`;
}

function DetailSection({ id, label, icon, children, className = "", desktop, expanded, onExpandedChange }: { id: string; label: string; icon: ReactNode; children: ReactNode; className?: string; desktop: boolean; expanded: string[]; onExpandedChange: (id: string, open: boolean) => void }) {
  return <details id={`detail-${id}`} className={`${styles.section} ${className}`} open={desktop || expanded.includes(id)} onToggle={event => { if (!desktop) onExpandedChange(id, event.currentTarget.open); }}><summary>{icon}<span>{label}</span><ChevronLeftRounded /></summary><div className={styles.sectionBody}><h2>{icon}{label}</h2>{children}</div></details>;
}

export default function DetailExperience({ data, mode = "file" }: { data: PropertyType; mode?: "file" | "request" }) {
  const isRequest = mode === "request";
  const desktop = useMediaQuery("(min-width: 900px)");
  const [favorite, setFavorite] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [copyFallback, setCopyFallback] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [tab, setTab] = useState("general");
  const [relatedIndex, setRelatedIndex] = useState(0);
  const relatedRef = useRef<HTMLDivElement>(null);
  const neighborhood = Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood;
  const title = isRequest ? `درخواست ${data.contractType} ${data.propertyType}` : propertyTitle(data);
  const phone = isRequest ? data.requesterPhone || "" : data.contactPhone;
  const chatEnabled = isRequest || data.allowOnlineChat !== false;
  const name = isRequest ? data.requesterName : data.advisorName || data.assignedTo;
  const related = PROPERTIES.filter(item => item.id !== data.id).slice(0,4);
  const photos = data.images.filter((image): image is string => typeof image === "string");
  const mapAddress = isRequest ? `${data.city}، ${neighborhood}` : data.address.startsWith(data.city) ? data.address : `${data.city}، ${neighborhood}، ${data.address}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;
  const price = isRequest ? (data.contractType === "خرید" ? range(data.totalPriceFrom, data.totalPriceTo, "تومان") : range(data.mortgagePriceFrom, data.mortgagePriceTo, "تومان ودیعه")) : `${getPriceInfo(data).value} تومان`;

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice("کپی شد"); } catch { setCopyFallback(text); }
  }
  async function share() {
    try { if (navigator.share) await navigator.share({title, url:window.location.href}); else await copy(window.location.href); } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setCopyFallback(window.location.href); }
  }
  function navigateSection(id: string) {
    setTab(id);
    setExpanded(current => current.includes(id) ? current : [...current,id]);
    window.requestAnimationFrame(() => document.getElementById(id === "address" && window.matchMedia("(min-width: 1100px)").matches ? "sidebar-address" : `detail-${id}`)?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",block:"start"}));
  }
  const sectionOptions = { desktop, expanded, onExpandedChange: (id: string, open: boolean) => setExpanded(current => open ? current.includes(id) ? current : [...current,id] : current.includes(id) ? current.filter(key => key !== id) : current) };
  const socialLinks = <div className={styles.socialLinks}>
    {chatEnabled && <button type="button" onClick={() => setMessageOpen(true)}><ChatOutlined /><span>گفتگو</span></button>}
    {!isRequest && data.virtualTourUrl?.instagram && <a href={data.virtualTourUrl.instagram} target="_blank" rel="noreferrer"><Instagram /><span>اینستاگرام</span></a>}
    {!isRequest && data.virtualTourUrl?.telegram && <a href={data.virtualTourUrl.telegram} target="_blank" rel="noreferrer"><Telegram /><span>تلگرام</span></a>}
    {!isRequest && <button type="button" onClick={() => setTourOpen(true)}><ThreeSixtyRounded /><span>تور مجازی</span></button>}
    {isRequest && <button type="button" onClick={share}><LinkRounded /><span>اشتراک درخواست</span></button>}
  </div>;
  const addressView = <div className={styles.addressView}>
    <a href={mapUrl} target="_blank" rel="noreferrer" className={styles.streetMap} aria-label="باز کردن محدوده ملک روی نقشه"><svg viewBox="0 0 320 190" aria-hidden="true"><rect width="320" height="190" fill="#f4f1e7" /><g transform="rotate(24 160 95)" stroke="#fff" strokeWidth="6">{Array.from({length:14},(_,i) => <path key={`v${i}`} d={`M${i*32-64} -100V300`} />)}{Array.from({length:10},(_,i) => <path key={`h${i}`} d={`M-100 ${i*30-50}H420`} />)}</g><path d="M0 135L320 52" stroke="#d8ebcf" strokeWidth="35" /><path d="M0 60L320 132" stroke="#fff" strokeWidth="10" /><path d="M70 0L152 190" stroke="#fff" strokeWidth="10" /></svg><span><LocationOnOutlined /></span><small>محدوده ملک</small></a>
    <p>{mapAddress}<button type="button" aria-label="کپی آدرس" onClick={() => copy(mapAddress)}><ContentCopyOutlined /></button></p><a className={styles.mapLink} href={mapUrl} target="_blank" rel="noreferrer"><LocationOnOutlined />مشاهده روی نقشه</a>
  </div>;

  const specs = isRequest ? [
    ["نوع ملک",data.propertyType],["نوع درخواست",data.contractType],["شهر",data.city],["محله‌های درخواستی",neighborhood],["محدوده متراژ",range(data.areaFrom,data.areaTo,"متر")],["تعداد خواب",`${formatNumber(data.roomCount)} خواب`],["بودجه",price],["شرایط",data.mortgageTerms || data.budgetType || "توافقی"],
  ] : [
    ["نوع ملک",data.propertyType],["وضعیت",data.contractType],["قیمت",price],["متراژ",getDisplayArea(data)],["تعداد خواب",formatNumber(data.roomCount)],["طبقات ساختمان",formatNumber(data.totalFloor)],...(data.floor == null ? [] : [["طبقه", `${formatNumber(data.floor)}${data.totalFloor ? ` از ${formatNumber(data.totalFloor)}` : ""}`]]),...(data.landUse ? [["کاربری زمین",data.landUse]] : []),["سال ساخت",data.buildYear || "ثبت نشده"],["وضعیت اشغال",data.occupancyStatus],["جهت ملک",data.direction],["نوع سند",data.documentTypeOther || data.documentType],["کف‌پوش",data.flooring],["نمای ساختمان",data.facade],["سرمایش",data.cooling],["گرمایش",data.heating], ...technicalSpecs(data.technical),
  ];
  const metrics = isRequest ? [
    {Icon:OpenInFullRounded,value:`${formatNumber(data.areaFrom)}–${formatNumber(data.areaTo)}`,label:"متر مربع"},
    {Icon:BedOutlined,value:formatNumber(data.roomCount),label:"خواب"},
    {Icon:ApartmentOutlined,value:data.propertyType,label:"نوع ملک"},
    {Icon:LocationOnOutlined,value:data.city,label:"شهر"},
    {Icon:AssignmentOutlined,value:data.contractType,label:"درخواست"},
  ] : [
    {Icon:OpenInFullRounded,value:formatNumber(data.area),label:"متر مربع"},
    {Icon:BedOutlined,value:formatNumber(data.roomCount),label:"خواب"},
    {Icon:DirectionsCarOutlined,value:data.amenities.includes("پارکینگ") ? "دارد" : "ندارد",label:"پارکینگ"},
    {Icon:ElevatorOutlined,value:data.amenities.includes("آسانسور") ? "دارد" : "ندارد",label:"آسانسور"},
    {Icon:CalendarMonthOutlined,value:data.buildYear || "—",label:"سال ساخت"},
  ];

  return <div className={styles.page} data-detail-page>
    <nav className={styles.breadcrumb} aria-label="مسیر صفحه"><Link href="/">خانه</Link><ChevronLeftRounded /><Link href={isRequest ? "/requests" : "/files"}>{isRequest ? "درخواست‌های ملکی" : "فایل‌های ملکی"}</Link><ChevronLeftRounded /><span aria-current="page">{title}</span></nav>
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.overview}>
          <section className={styles.summary} aria-label="خلاصه مشخصات">
            <div className={styles.titleRow}><span className={styles.summaryBadge}>{isRequest ? <AssignmentOutlined /> : <WorkspacePremiumOutlined />}{isRequest ? "درخواست ملک" : "فایل ویژه"}</span><h1>{title}</h1></div>
            <p className={styles.subtitle}>{data.propertyType} · {data.contractType}</p>
            <p className={styles.location}><LocationOnOutlined />{mapAddress}</p>
            <div className={styles.price}><span>{isRequest ? "بودجه درخواستی" : "قیمت"}</span><strong>{price}</strong>{data.monthlyRent > 0 && <small>{isRequest ? range(data.monthlyRentFrom,data.monthlyRentTo,"تومان اجاره ماهانه") : `${formatNumber(data.monthlyRent)} تومان اجاره ماهانه`}</small>}</div>
            <div className={styles.metrics}>{metrics.map(({Icon,value,label}) => <div key={label}><Icon /><strong>{value}</strong><span>{label}</span></div>)}</div>
            <div className={styles.primaryActions}>
              <button type="button" className={styles.goldButton} onClick={() => isRequest ? setMessageOpen(true) : setVisitOpen(true)}>{isRequest ? <HandshakeOutlined /> : <CalendarMonthOutlined />}{isRequest ? "من ملک مناسب دارم" : "درخواست بازدید"}</button>
              {phone && <a href={`tel:${phone}`} className={styles.blueButton}><PhoneInTalkOutlined />{isRequest ? "تماس با متقاضی" : "تماس با کارشناس"} <bdi>{phone}</bdi></a>}
            </div>
          </section>
          <div className={styles.galleryColumn}>{isRequest ? <div className={styles.requestVisual}><AssignmentOutlined /><span>درخواست {data.contractType}</span><h2>{data.propertyType} در {data.city}</h2><p>{neighborhood}</p><div>{data.amenities.map(amenity => <span key={amenity}>{amenity}</span>)}</div><button type="button" onClick={share}><LinkRounded />اشتراک‌گذاری درخواست</button></div> : <PropertyGallery images={photos} title={title} favorite={favorite} onFavorite={() => setFavorite(value => !value)} onShare={share} />}</div>
        </div>
        <div className={styles.mobileSocial}>{socialLinks}</div>
        <div className={styles.information}>
          <nav className={styles.detailTabs} aria-label="بخش‌های جزئیات">{[{id:"general",label:isRequest ? "مشخصات درخواست" : "مشخصات فایل"},{id:"description",label:"توضیحات"},{id:"amenities",label:"امکانات و ویژگی‌ها"},{id:"address",label:isRequest ? "محدوده درخواستی" : "موقعیت و آدرس"}].map(item => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => navigateSection(item.id)}>{item.label}</button>)}{!isRequest && <button type="button" onClick={() => setTourOpen(true)}>تور مجازی</button>}</nav>
          <div className={styles.detailGrid}>
            <DetailSection {...sectionOptions} id="general" label={isRequest ? "مشخصات درخواست" : "مشخصات کلی"} icon={<InfoOutlined />}><dl className={styles.specs}>{specs.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "ثبت نشده"}</dd></div>)}</dl></DetailSection>
            <div className={styles.amenityColumn}>
              <DetailSection {...sectionOptions} id="amenities" label={isRequest ? "امکانات موردنیاز" : "امکانات و ویژگی‌ها"} icon={<DiamondOutlined />}><div className={styles.amenities}>{data.amenities.map(amenity => {const Icon=amenity === "پارکینگ" ? DirectionsCarOutlined : amenity === "آسانسور" ? ElevatorOutlined : amenity === "بالکن" ? BalconyOutlined : amenity === "انباری" ? Inventory2Outlined : VerifiedUserOutlined;return <span key={amenity}><Icon />{amenity}</span>;})}{!isRequest && data.cooling && <span><AcUnitOutlined />{data.cooling}</span>}</div></DetailSection>
              {!isRequest && <div className={styles.relatedLinks}><h2><LinkRounded />لینک‌های مرتبط</h2>{socialLinks}</div>}
            </div>
            <DetailSection {...sectionOptions} id="description" label="توضیحات" icon={<DescriptionOutlined />} className={styles.description}><p>{data.description || "توضیحی برای این مورد ثبت نشده است."}</p></DetailSection>
            <DetailSection {...sectionOptions} id="address" label={isRequest ? "محدوده درخواستی" : "موقعیت و آدرس"} icon={<LocationOnOutlined />} className={styles.mobileAddress}>{addressView}</DetailSection>
          </div>
        </div>
      </div>
      <aside className={styles.sidebar}>
        <div className={styles.advisor}><div className={styles.advisorHeading}><img src="/images/profile.webp" alt="" loading="lazy" decoding="async" /><div><h2>{name}</h2><p>{isRequest ? "متقاضی ملک" : "کارشناس املاک"}</p></div></div><div className={styles.advisorMeta}><span><VerifiedUserOutlined />{isRequest ? "درخواست ثبت‌شده" : data.agencyName || "مشاور ملکینو"}</span><span>کد {formatNumber(data.id)}</span></div>{phone && <a href={`tel:${phone}`} className={styles.blueButton}><PhoneInTalkOutlined />{isRequest ? "تماس با متقاضی" : "تماس با کارشناس"} <bdi>{phone}</bdi></a>}{chatEnabled && <button type="button" className={styles.softButton} onClick={() => setMessageOpen(true)}><ChatOutlined />گفتگو در ملکینو</button>}{!isRequest && socialLinks}</div>
        <section id="sidebar-address" className={styles.sidebarAddress}><h2><LocationOnOutlined />{isRequest ? "محدوده درخواستی" : "موقعیت و آدرس"}</h2>{addressView}</section>
      </aside>
    </div>

    <section className={styles.related} aria-label={isRequest ? "فایل‌های پیشنهادی" : "ملک‌های مشابه"}>
      <div className={styles.relatedHeading}><h2><ApartmentOutlined />{isRequest ? "فایل‌هایی برای بررسی" : "ملک‌های مشابه"}</h2><div><button type="button" aria-label="ملک مشابه قبلی" onClick={() => relatedRef.current?.scrollBy({left:relatedRef.current.clientWidth + 16,behavior:"smooth"})}><ChevronRightRounded /></button><button type="button" aria-label="ملک مشابه بعدی" onClick={() => relatedRef.current?.scrollBy({left:-(relatedRef.current.clientWidth + 16),behavior:"smooth"})}><ChevronLeftRounded /></button></div></div>
      <div className={styles.relatedCards} ref={relatedRef} onScroll={event => {const container=event.currentTarget;const width=container.firstElementChild?.getBoundingClientRect().width || container.clientWidth;setRelatedIndex(Math.round(Math.abs(container.scrollLeft)/(width+16)));}}>{related.map(item => <ListingCard key={item.id} data={item} variant="related" />)}</div>
      <div className={styles.relatedDots}>{related.map((item,index) => <button key={item.id} type="button" aria-label={`نمایش ملک مشابه ${index+1}`} aria-pressed={relatedIndex === index} onClick={() => {const container=relatedRef.current;if(container){const width=container.firstElementChild?.getBoundingClientRect().width || container.clientWidth;container.scrollTo({left:-index*(width+16),behavior:"smooth"});}}} />)}</div>
    </section>
    <VisitRequestModal key={visitOpen ? "open" : "closed"} open={visitOpen} onClose={() => setVisitOpen(false)} property={data} />
    <VirtualTourModal open={tourOpen} onClose={() => setTourOpen(false)} links={data.virtualTourUrl} />
    <Dialog open={chatEnabled && messageOpen} onClose={() => setMessageOpen(false)} fullWidth maxWidth="sm" slotProps={{paper:{sx:{borderRadius:5}}}}><div className={styles.messageDialog}><div><h2>{isRequest ? "معرفی ملک به متقاضی" : "گفتگو با کارشناس"}</h2><IconButton aria-label="بستن گفتگو" onClick={() => setMessageOpen(false)}><CloseRounded /></IconButton></div><p>{title}</p><TextField className={styles.dialogField} id="detail-message" label="متن پیام" fullWidth multiline minRows={4} maxRows={8} value={message} onChange={event => setMessage(event.target.value)} placeholder={isRequest ? "مشخصات ملک مناسب را بنویسید…" : "سلام، برای دریافت اطلاعات این ملک پیام می‌دهم…"} helperText={`${message.length.toLocaleString("fa-IR")} / ۱۰۰۰`} slotProps={{inputLabel:{shrink:true},htmlInput:{maxLength:1000}}} /><button type="button" className={styles.softButton} disabled={!message.trim()} onClick={() => copy(message)}><ContentCopyOutlined />کپی متن پیام</button><a className={styles.blueButton} href={isRequest ? `https://mlkino.com/panel/support?requestId=${data.id}` : `https://mlkino.com/panel/files/${data.id}`}><ChatOutlined />ادامه گفتگو در پنل ملکینو</a></div></Dialog>
    <Dialog open={Boolean(copyFallback)} onClose={() => setCopyFallback("")} maxWidth="sm" fullWidth slotProps={{paper:{sx:{borderRadius:5}}}}><div className={styles.messageDialog}><div><h2>کپی اطلاعات</h2><IconButton aria-label="بستن اشتراک‌گذاری" onClick={() => setCopyFallback("")}><CloseRounded /></IconButton></div><TextField className={styles.dialogField} label="اطلاعات قابل کپی" fullWidth value={copyFallback} onFocus={event => {if (event.target instanceof HTMLInputElement) event.target.select();}} slotProps={{input:{readOnly:true},htmlInput:{"aria-label":"اطلاعات قابل کپی",dir:"auto"}}} /></div></Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={2500} onClose={() => setNotice("")} message={notice} />
  </div>;
}

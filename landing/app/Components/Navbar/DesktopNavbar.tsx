"use client";
import {useLandingSession} from "../../Core/Session";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Drawer, IconButton } from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import ChatBubbleOutlineRounded from "@mui/icons-material/ChatBubbleOutlineRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import LocationPickerModal, { type LocationValue } from "../ChooseCity/LocationPickerModal";
import { CITY_BY_ID, PROVINCE_BY_ID } from "@/app/data/iran/geography";
import { isNavActive } from "./nav-items";
import SubmitMenu from "./SubmitMenu";
import styles from "./navbar.module.css";

const links = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/files", label: "فایل‌های ملکی" },
  { href: "/requests", label: "درخواست‌های ملکی" },
  { href: "/vip", label: "فایل‌های ویژه" },
  { href: "/search", label: "جستجوی پیشرفته" },
];

export default function DesktopNavbar() {
  const pathname = usePathname();
  const {user}=useLandingSession();
  const [cityOpen, setCityOpen] = useState(false);
  const [location, setLocation] = useState<LocationValue>({allIran:false,cities:[],provinces:[]});
  const count = location.cities.length + location.provinces.length;
  const cityLabel = location.allIran ? "ایران" : count === 0 ? "انتخاب شهر" : count === 1
    ? CITY_BY_ID.get(location.cities[0])?.name || PROVINCE_BY_ID.get(location.provinces[0])?.name || "منطقه منتخب"
    : `${count.toLocaleString("fa-IR")} منطقه`;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitAnchor, setSubmitAnchor] = useState<HTMLElement | null>(null);
  return <>
    <header className={`${styles.header} ${pathname === "/search" ? styles.searchHeader : ""}`}>
      <div className={styles.shell}>
        <IconButton className={styles.menuButton} aria-label="باز کردن منوی اصلی" aria-expanded={drawerOpen} aria-controls={drawerOpen ? "main-navigation-drawer" : undefined} onClick={() => setDrawerOpen(true)}><MenuRounded /></IconButton>
        <Link href="/" className={styles.brand} aria-label="ملکینو، صفحه اصلی"><Image src="/images/melkino.webp" alt="" width={54} height={54} priority /><strong>ملکینو</strong></Link>
        <button type="button" className={styles.cityButton} onClick={() => setCityOpen(true)} aria-label="انتخاب شهر"><span>{cityLabel}</span><KeyboardArrowDownRounded /></button>
        <nav className={styles.desktopLinks} aria-label="منوی اصلی سایت">{links.map(({ href, label }) => <Link key={href} href={href} aria-current={isNavActive(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
        <div className={styles.actions}>
          <button type="button" className={styles.submitDesktop} onClick={event => setSubmitAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(submitAnchor)} aria-controls={submitAnchor ? "header-submit-menu" : undefined}><AddRounded /> ثبت ملک / درخواست</button>
          <Link href="https://mlkino.com/panel/support" className={styles.iconLink} aria-label="چت و تماس"><ChatBubbleOutlineRounded /></Link>
          <Link href="/reminders" className={styles.iconLink} aria-label="یادآوری‌ها"><NotificationsNoneRounded /><span className={styles.notificationDot} /></Link>
          <Link href="https://mlkino.com/panel" className={styles.account} aria-label="ملکینوی من">{user?.avatar?<img src={user.avatar} alt="عکس پروفایل" width={38} height={38} style={{borderRadius:"50%",objectFit:"cover"}}/>:<PersonOutlineRounded />}<span><strong>ملکینوی من</strong><small>{cityLabel}</small></span><KeyboardArrowDownRounded /></Link>
        </div>
      </div>
    </header>
    <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { width: 320, maxWidth: "calc(100vw - 32px)", bgcolor:"#f9f9ff" } } }}>
      <div id="main-navigation-drawer" className={styles.drawer}>
        <div className={styles.drawerTitle}><strong>منوی ملکینو</strong><IconButton aria-label="بستن منو" onClick={() => setDrawerOpen(false)}><CloseRounded /></IconButton></div>
        <nav aria-label="منوی اصلی موبایل">{[...links, {href:"/categories",label:"همه دسته‌بندی‌ها"}, {href:"https://mlkino.com/panel/support",label:"چت و تماس"}, {href:"https://mlkino.com/panel",label:"ملکینوی من"}].map(({ href, label }) => <Link key={href} href={href} onClick={() => setDrawerOpen(false)} aria-current={isNavActive(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
      </div>
    </Drawer>
    <LocationPickerModal open={cityOpen} onClose={() => setCityOpen(false)} value={location} onApply={setLocation} />
    <SubmitMenu id="header-submit-menu" anchorEl={submitAnchor} onClose={() => setSubmitAnchor(null)} />
  </>;
}

"use client";
import {useLandingSession} from "../../Core/Session";
import {PANEL_LINKS} from "../../Core/panel";


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
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import { isNavActive } from "./nav-items";
import SubmitMenu from "./SubmitMenu";
import styles from "./navbar.module.css";

const links = [
  { href: "/", label: "خانه" },
  { href: "/files", label: "فایل‌های ملکی" },
  { href: "/requests", label: "درخواست‌های ملکی" },
  { href: PANEL_LINKS.reminders, label: "یادآوری‌ها" },
];

export default function DesktopNavbar() {
  const pathname = usePathname();
  const {user,loading}=useLandingSession();
  const accountHref=user?PANEL_LINKS.dashboard:PANEL_LINKS.login;
  const accountLabel=user?(user.full_name||"حساب من"):"ورود / ثبت‌نام";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitAnchor, setSubmitAnchor] = useState<HTMLElement | null>(null);
  return <>
    <header className={`${styles.header} ${pathname === "/search" ? styles.searchHeader : ""}`}>
      <div className={styles.shell}>
        <IconButton className={styles.menuButton} aria-label="باز کردن منوی اصلی" aria-expanded={drawerOpen} aria-controls={drawerOpen ? "main-navigation-drawer" : undefined} onClick={() => setDrawerOpen(true)}><MenuRounded /></IconButton>
        <Link href="/" className={styles.brand} aria-label="ملکینو، صفحه اصلی"><Image src="/images/melkino.png" alt="" width={54} height={54} priority /><strong>ملکینو</strong></Link>
        <nav className={styles.desktopLinks} aria-label="منوی اصلی سایت">{links.map(({ href, label }) => <Link key={href} href={href} aria-current={isNavActive(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
        <div className={styles.actions}>
          <button type="button" className={styles.submitDesktop} onClick={event => setSubmitAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(submitAnchor)} aria-controls={submitAnchor ? "header-submit-menu" : undefined}><AddRounded /> ثبت ملک</button>
          <Link href={PANEL_LINKS.chats} className={styles.iconLink} aria-label="چت و تماس"><ChatBubbleOutlineRounded /></Link>
          <Link href={PANEL_LINKS.reminders} className={styles.iconLink} aria-label="یادآوری‌ها"><NotificationsNoneRounded /></Link>
          <Link href={accountHref} className={styles.account} aria-label={accountLabel} aria-busy={loading}>{user?.avatar?<img src={user.avatar} alt="" width={36} height={36} style={{borderRadius:"50%",objectFit:"cover"}}/>:<PersonOutlineRounded />}<span><strong>{accountLabel}</strong><small>{user?.role_display||"پنل کاربری"}</small></span><KeyboardArrowDownRounded /></Link>
        </div>
      </div>
    </header>
    <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { width: 320, maxWidth: "calc(100vw - 32px)", bgcolor:"#f9f9ff" } } }}>
      <div id="main-navigation-drawer" className={styles.drawer}>
        <div className={styles.drawerTitle}><strong>منوی ملکینو</strong><IconButton aria-label="بستن منو" onClick={() => setDrawerOpen(false)}><CloseRounded /></IconButton></div>
        <nav aria-label="منوی اصلی موبایل">{[...links, {href:"/search",label:"جستجوی پیشرفته"}, {href:"/categories",label:"همه دسته‌بندی‌ها"}, {href:"/vip",label:"فایل‌های ویژه"}, {href:PANEL_LINKS.chats,label:"چت و تماس"}, {href:accountHref,label:accountLabel}].map(({ href, label }) => <Link key={href} href={href} onClick={() => setDrawerOpen(false)} aria-current={isNavActive(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
      </div>
    </Drawer>
    <SubmitMenu id="header-submit-menu" anchorEl={submitAnchor} onClose={() => setSubmitAnchor(null)} />
  </>;
}

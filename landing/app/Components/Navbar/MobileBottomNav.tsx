"use client";

import {useLandingSession} from "../../Core/Session";
import {PANEL_LINKS} from "../../Core/panel";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddRounded from "@mui/icons-material/AddRounded";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import SubmitMenu from "./SubmitMenu";
import styles from "./navbar.module.css";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const {user,loading}=useLandingSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return <>
    <nav className={styles.bottom} aria-label="ناوبری پایین صفحه">
      <div className={styles.bottomInner}>
        {NAV_ITEMS.map(({ key, href, label, icon: Icon, activeIcon: ActiveIcon }) => {
          if (key === "submit"&&user?.role==='expert') return <Link prefetch={false} key={key} href={PANEL_LINKS.createFile} className={styles.submitBottom} aria-label="ثبت فایل تخصصی"><span className={styles.submitIcon}><AddRounded/></span><span>ثبت فایل</span></Link>;
          if (key === "submit") return <button
            key={key}
            type="button"
            className={styles.submitBottom}
            aria-label="ثبت ملک یا درخواست ملک"
            aria-haspopup="menu"
            aria-expanded={Boolean(anchorEl)}
            aria-controls={anchorEl ? "bottom-submit-menu" : undefined}
            onClick={event => setAnchorEl(event.currentTarget)}
          ><span className={styles.submitIcon}><AddRounded /></span><span>ثبت</span></button>;
          const target=key==="profile"?(user?PANEL_LINKS.dashboard:PANEL_LINKS.login):href;
          const title=key==="profile"?(loading?"حساب کاربری":user?"پنل کاربری":"ورود / ثبت‌نام"):label;
          const active = isNavActive(pathname, target);
          return <Link prefetch={false} key={key} href={target} className={styles.bottomLink} aria-busy={key==='profile'&&loading} aria-current={active ? "page" : undefined}>
            <span className={styles.bottomIcon}>{active ? <ActiveIcon /> : <Icon />}</span><span>{title}</span>
          </Link>;
        })}
      </div>
    </nav>
    <SubmitMenu id="bottom-submit-menu" anchorEl={anchorEl} onClose={() => setAnchorEl(null)} placement="top" />
  </>;
}

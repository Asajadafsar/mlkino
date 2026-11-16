"use client";
import {useLandingSession} from "../../Core/Session";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import SubmitMenu from "./SubmitMenu";
import styles from "./mobile-bottom.module.css";

type SubmitAnchor = { element: HTMLElement; pathname: string };

export default function MobileBottomNav() {
  const pathname = usePathname();
  const {user}=useLandingSession();
  const [menu, setMenu] = useState<SubmitAnchor | null>(null);
  const anchorEl = menu?.pathname === pathname ? menu.element : null;
  const selected = NAV_ITEMS.find(item => item.key !== "submit" && isNavActive(pathname, item.href))?.key ?? false;

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    const breakpoint = window.matchMedia("(min-width: 1100px)");
    breakpoint.addEventListener("change", closeMenu);
    window.addEventListener("popstate", closeMenu);
    return () => {
      breakpoint.removeEventListener("change", closeMenu);
      window.removeEventListener("popstate", closeMenu);
    };
  }, []);

  if (/^\/(property|requests)\/[^/]+/.test(pathname)) return null;

  return <>
    <nav className={styles.bottom} aria-label="ناوبری پایین صفحه">
      <BottomNavigation className={styles.bar} showLabels value={selected}>
        {NAV_ITEMS.map(({ key, href, label, icon: Icon, activeIcon: ActiveIcon }) => {
          if (key === "submit") return <BottomNavigationAction
            key={key}
            value={key}
            id="bottom-submit-trigger"
            className={`${styles.action} ${styles.submitAction}`}
            label="ثبت"
            icon={<span className={styles.submitIcon}><AddRounded /></span>}
            aria-label="ثبت ملک یا درخواست ملک"
            aria-haspopup="menu"
            aria-expanded={Boolean(anchorEl)}
            aria-controls={anchorEl ? "bottom-submit-menu" : undefined}
            onClick={event => {
              const element = event.currentTarget;
              setMenu({ element, pathname });
            }}
          />;
          const active = selected === key;
          return <BottomNavigationAction
            key={key}
            value={key}
            component={Link}
            href={href}
            className={styles.action}
            label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => setMenu(null)}
            icon={<span className={styles.icon}>{key==="profile"&&user?.avatar?<img src={user.avatar} alt="عکس پروفایل" width={28} height={28} style={{borderRadius:"50%",objectFit:"cover"}}/>:active ? <ActiveIcon /> : <Icon />}</span>}
          />;
        })}
      </BottomNavigation>
    </nav>
    <SubmitMenu id="bottom-submit-menu" triggerId="bottom-submit-trigger" anchorEl={anchorEl} onClose={() => setMenu(null)} placement="top" />
  </>;
}

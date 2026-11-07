"use client";
import {useLandingSession} from '../../Core/Session';
import {PANEL_LINKS} from '../../Core/panel';
import {usePublic} from '../Catalog/usePublic';
import type {PublicConfig} from '../../Core/catalog';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import {isNavActive} from './nav-items';
import SubmitMenu from './SubmitMenu';
import styles from './navbar.module.css';
const links=[{href:'/',label:'صفحه اصلی'},{href:'/files',label:'فایل‌های ملکینو'},{href:'/requests',label:'درخواست‌های ملکینو'},{href:'/vip',label:'فایل‌های ویژه'},{href:'/search',label:'جستجوی پیشرفته'}];
export default function DesktopNavbar(){const pathname=usePathname(),{user,loading}=useLandingSession(),{data:config}=usePublic<PublicConfig>('config/'),[anchor,setAnchor]=useState<HTMLElement|null>(null);const href=user?PANEL_LINKS.dashboard:PANEL_LINKS.login,label=loading?'در حال بررسی حساب…':user?(user.full_name||'حساب من'):'ورود / ثبت‌نام';return <><header className={styles.header}><div className={styles.shell}><Link prefetch={false} href="/" className={styles.brand} aria-label="ملکینو، صفحه اصلی"><Image src="/images/melkino.webp" alt="" width={54} height={54} preload/><strong>ملکینو</strong></Link><nav className={styles.desktopLinks} aria-label="منوی اصلی سایت">{links.filter(x=>x.href!=='/files'&&x.href!=='/vip'||config?.features?.files!==false).filter(x=>x.href!=='/requests'||config?.features?.requests!==false).map(x=><Link prefetch={false} key={x.href} href={x.href} aria-current={isNavActive(pathname,x.href)?'page':undefined}>{x.label}</Link>)}</nav><div className={styles.actions}>{user?.role==='expert'?<Link prefetch={false} className={styles.submitDesktop} href={PANEL_LINKS.createFile}><AddRounded/>ثبت فایل تخصصی</Link>:<button type="button" className={styles.submitDesktop} aria-haspopup="menu" aria-expanded={!!anchor} onClick={e=>setAnchor(e.currentTarget)}><AddRounded/>ثبت ملک / درخواست</button>}{config?.features?.chats!==false&&<Link prefetch={false} href={PANEL_LINKS.chats} className={styles.iconLink} aria-label="چت و تماس"><ChatBubbleOutlineRounded/></Link>}<Link prefetch={false} href={PANEL_LINKS.reminders} className={styles.iconLink} aria-label="یادآوری‌ها"><NotificationsNoneRounded/></Link><Link prefetch={false} href={href} className={styles.account} aria-label={label} aria-busy={loading}>{user?.avatar?<Image src={user.avatar} alt="" width={36} height={36}/>:<PersonOutlineRounded/>}<span><strong>{label}</strong><small>{user?.role_display||'پنل کاربری'}</small></span></Link></div></div><nav className={styles.quickMobile} aria-label="فهرست املاک در موبایل">{links.filter(x=>x.href!=='/').filter(x=>x.href!=='/files'&&x.href!=='/vip'||config?.features?.files!==false).filter(x=>x.href!=='/requests'||config?.features?.requests!==false).map(x=><Link prefetch={false} key={x.href} href={x.href} aria-current={isNavActive(pathname,x.href)?'page':undefined}>{x.label}</Link>)}</nav></header><SubmitMenu id="header-submit-menu" anchorEl={anchor} onClose={()=>setAnchor(null)}/></>}

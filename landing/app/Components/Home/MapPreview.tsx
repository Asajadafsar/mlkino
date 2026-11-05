"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, IconButton } from "@mui/material";
import MapOutlined from "@mui/icons-material/MapOutlined";
import HomeRounded from "@mui/icons-material/HomeRounded";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import styles from "./home.module.css";

function MapCanvas() {
  const [zoom, setZoom] = useState(1);
  return <div className={styles.mapCanvas}>
    <div className={styles.mapDrawing} style={{ transform: `scale(${zoom})` }}>
      <svg viewBox="0 0 360 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="map-streets" width="45" height="45" patternTransform="rotate(28)" patternUnits="userSpaceOnUse"><path d="M0 0H45V45H0Z M0 17H45 M18 0V45" fill="none" stroke="#406899" strokeWidth=".6" opacity=".4" /></pattern><radialGradient id="map-light"><stop stopColor="#315e95" /><stop offset="1" stopColor="#102d55" /></radialGradient></defs>
        <rect width="360" height="460" fill="url(#map-light)" /><rect width="360" height="460" fill="url(#map-streets)" />
        <g fill="none" strokeLinecap="round"><path d="M-20 120C40 185 83 111 128 168S202 220 230 151 290 125 380 95" stroke="#4a89d2" strokeWidth="3" /><path d="M-20 300C85 240 84 430 190 349S279 271 380 329" stroke="#488bd7" strokeWidth="3" /><path d="M75 -20C160 91 15 172 108 245S215 300 249 480M300 -20C269 96 344 181 266 250S187 340 175 480" stroke="#3a679b" strokeWidth="2" /></g>
        <g fill="#5ca2e2" opacity=".6"><circle cx="129" cy="168" r="4" /><circle cx="263" cy="249" r="4" /><circle cx="189" cy="350" r="4" /><circle cx="83" cy="85" r="3" /><circle cx="313" cy="181" r="3" /></g>
      </svg>
      {[{x:52,y:49,main:true},{x:27,y:35},{x:72,y:74},{x:67,y:15}].map((pin,i) => <Link key={i} href="/property/101" className={pin.main ? styles.mainPin : styles.pin} style={{left:`${pin.x}%`,top:`${pin.y}%`}} aria-label="مشاهده ملک نمونه روی نقشه">{pin.main ? <HomeRounded /> : <LocationOnRounded />}</Link>)}
    </div>
    <div className={styles.zoom}><button type="button" aria-label="بزرگ‌نمایی نقشه" disabled={zoom >= 1.6} onClick={() => setZoom(value => Math.min(1.6, value + .2))}><AddRounded /></button><button type="button" aria-label="کوچک‌نمایی نقشه" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .2))}><RemoveRounded /></button></div>
  </div>;
}

export default function MapPreview() {
  const [open,setOpen] = useState(false);
  return <>
    <aside className={styles.map} aria-label="پیش‌نمایش نقشه املاک"><MapCanvas /><button className={styles.mapButton} type="button" onClick={() => setOpen(true)}><MapOutlined /> نمایش روی نقشه</button></aside>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" slotProps={{paper:{sx:{borderRadius:5, overflow:"hidden"}}}}><div className={styles.mapHeading}><div><h2>نمایش فایل‌ها روی نقشه</h2><p>موقعیت‌های نمایشی برای فایل‌های نمونه</p></div><IconButton aria-label="بستن نقشه" onClick={()=>setOpen(false)}><CloseRounded /></IconButton></div><div className={styles.mapExpanded}><MapCanvas /></div></Dialog>
  </>;
}

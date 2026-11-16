"use client";

import { useState } from "react";
import Link from "next/link";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRounded from "@mui/icons-material/FavoriteRounded";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import BedOutlined from "@mui/icons-material/BedOutlined";
import SquareFootRounded from "@mui/icons-material/SquareFootRounded";
import PhoneInTalkOutlined from "@mui/icons-material/PhoneInTalkOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { Dialog, IconButton } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import type { PropertyType } from "@/app/Core/types";
import { propertyTitle } from "@/app/Core/listings";
import { formatNumber } from "./cardFileUtils";
import VisitRequestModal from "./VisitRequestModal";
import styles from "./listing.module.css";

export default function ListingCard({ data, variant = "featured" }: { data: PropertyType; variant?: "featured" | "compact" | "related" }) {
  const [favorite, setFavorite] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const image = typeof data.images[0] === "string" ? data.images[0] : "/images/properties/apartment.png";
  const href = `/property/${data.id}`;

  return <>
    <article className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.cover}>
        <Link href={href} aria-label={propertyTitle(data)}><img src={image} alt={propertyTitle(data)} loading="lazy" /></Link>
        {variant !== "compact" && <>
          <span className={styles.badge}><WorkspacePremiumOutlined /> ویژه</span>
          <button type="button" className={styles.favorite} aria-label="علاقه‌مندی ملک" aria-pressed={favorite} onClick={() => setFavorite(value => !value)}>{favorite ? <FavoriteRounded /> : <FavoriteBorderRounded />}</button>
        </>}
      </div>
      <div className={styles.content}>
        <Link href={href} className={styles.title}>{propertyTitle(data)}</Link>
        <p className={styles.location}><LocationOnOutlined />{data.city}، {Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood}</p>
        <div className={styles.metrics}><span><SquareFootRounded />{formatNumber(data.area)} متر</span><span><BedOutlined />{formatNumber(data.roomCount)} خواب</span>{variant === "related" && <span>{data.buildYear}</span>}</div>
        <p className={styles.price}>{formatNumber(data.totalPrice)} <span>تومان</span></p>
      </div>
      {variant === "featured" && <div className={styles.actions}><button type="button" className={styles.visit} onClick={() => setVisitOpen(true)}><CalendarMonthOutlined /> درخواست بازدید</button><button type="button" className={styles.call} onClick={() => setContactOpen(true)}><PhoneInTalkOutlined /> تماس</button></div>}
    </article>
    <VisitRequestModal key={visitOpen ? "open" : "closed"} open={visitOpen} onClose={() => setVisitOpen(false)} property={data} onSubmit={async payload => { console.log("Visit request:", { ...payload, propertyId: data.id }); }} />
    <Dialog open={contactOpen} onClose={() => setContactOpen(false)} maxWidth="xs" fullWidth slotProps={{paper:{sx:{borderRadius:5}}}}><div className={styles.contact}><div><h2>تماس با کارشناس</h2><IconButton aria-label="بستن تماس" onClick={() => setContactOpen(false)}><CloseRounded /></IconButton></div><p>{data.advisorName || data.assignedTo}</p><a href={`tel:${data.contactPhone || data.ownerPhone}`}><PhoneInTalkOutlined />{data.contactPhone || data.ownerPhone}</a></div></Dialog>
  </>;
}

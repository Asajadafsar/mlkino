"use client";

import { useState } from "react";
import { Dialog, IconButton } from "@mui/material";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRounded from "@mui/icons-material/FavoriteRounded";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import FullscreenRounded from "@mui/icons-material/FullscreenRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/zoom";
import styles from "./detail.module.css";

const DEFAULT_IMAGES = ["/images/properties/apartment.webp", "/images/properties/interior.webp", "/images/properties/hero.webp"];

export default function PropertyGallery({ images = DEFAULT_IMAGES, title = "تصاویر ملک", favorite = false, onFavorite, onShare }: { images?: string[]; title?: string; favorite?: boolean; onFavorite?: () => void; onShare?: () => void }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const photos = images.length ? images : DEFAULT_IMAGES;
  const go = (direction: number) => setActive(index => (index + direction + photos.length) % photos.length);

  return <div className={styles.gallery}>
    <div className={styles.galleryStage}>
      <button type="button" className={styles.galleryImage} onClick={() => setFullscreen(true)} aria-label="باز کردن گالری تمام‌صفحه"><img src={photos[active]} alt={`${title}؛ تصویر ${(active + 1).toLocaleString("fa-IR")}`} fetchPriority="high" decoding="async" /></button>
      <span className={styles.vipBadge}><WorkspacePremiumOutlined /> فایل ویژه</span>
      <div className={styles.galleryTools}>
        <button type="button" aria-label="علاقه‌مندی ملک" aria-pressed={favorite} onClick={onFavorite}>{favorite ? <FavoriteRounded /> : <FavoriteBorderRounded />}</button>
        <button type="button" aria-label="اشتراک‌گذاری فایل" onClick={onShare}><ShareOutlined /></button>
        <button type="button" aria-label="گالری تمام‌صفحه" onClick={() => setFullscreen(true)}><FullscreenRounded /></button>
      </div>
      <button type="button" className={`${styles.galleryArrow} ${styles.galleryPrevious}`} aria-label="تصویر قبلی" onClick={() => go(-1)}><ChevronLeftRounded /></button>
      <button type="button" className={`${styles.galleryArrow} ${styles.galleryNext}`} aria-label="تصویر بعدی" onClick={() => go(1)}><ChevronRightRounded /></button>
      <span className={styles.imageCounter} aria-live="polite"><PhotoLibraryOutlined /><b>{(active + 1).toLocaleString("fa-IR")} / {photos.length.toLocaleString("fa-IR")}</b></span>
    </div>
    <div className={styles.thumbnails} style={{gridTemplateColumns:`repeat(${Math.min(photos.length,6)}, minmax(0,1fr))`}} aria-label="تصاویر گالری">{photos.map((src, index) => <button key={`${src}-${index}`} type="button" aria-label={`نمایش تصویر ${(index + 1).toLocaleString("fa-IR")}`} aria-pressed={active === index} onClick={() => setActive(index)}><img src={src} alt="" loading="lazy" decoding="async" /></button>)}</div>
    <Dialog open={fullscreen} onClose={() => setFullscreen(false)} fullScreen slotProps={{paper:{sx:{bgcolor:"#060c1d",color:"white"}}}}>
      <div className={styles.lightboxHeader}><p>{title}</p><IconButton aria-label="بستن گالری" onClick={() => setFullscreen(false)} sx={{color:"white"}}><CloseRounded /></IconButton></div>
      <Swiper className={styles.lightbox} dir="rtl" modules={[Keyboard, Zoom]} keyboard={{enabled:true}} zoom={{maxRatio:3}} initialSlide={active} onSlideChange={swiper => setActive(swiper.activeIndex)}>{photos.map((src,index) => <SwiperSlide key={`${src}-${index}`}><div className="swiper-zoom-container"><img src={src} alt={`${title}؛ تصویر ${index + 1}`} loading="lazy" decoding="async" /></div></SwiperSlide>)}</Swiper>
      <p className={styles.lightboxHint}>برای جابه‌جایی بکشید یا از کلیدهای جهت‌دار استفاده کنید؛ برای بزرگ‌نمایی دوبار لمس کنید.</p>
    </Dialog>
  </div>;
}

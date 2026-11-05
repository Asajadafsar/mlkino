"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Modal, Fade, Backdrop } from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Zoom } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/zoom";

const NAVY = "#0d1830";
const GOLD = "#f5b02e";

const IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=80",
  "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=80",
];

const toFa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

type TileProps = {
  src: string;
  alt: string;
  onClick: () => void;
  zoom?: number;
  children?: React.ReactNode;
  sx?: object;
};

function GalleryTile({ src, alt, onClick, zoom = 1.04, children, sx }: TileProps) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={alt}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        borderRadius: { xs: "10px", md: "12px" },
        minHeight: 0,
        "&:hover img": { transform: `scale(${zoom})` },
        "&:focus-visible": { outline: `2px solid ${GOLD}`, outlineOffset: -2 },
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        loading="lazy"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.5s ease",
        }}
      />
      {children}
    </Box>
  );
}

export default function PropertyGallery() {
  const [openModal, setOpenModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const extraCount = Math.max(IMAGES.length - 4, 0);

  const handleOpen = (index = 0) => {
    setActiveIndex(index);
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  useEffect(() => {
    if (thumbsSwiper && !thumbsSwiper.destroyed) {
      thumbsSwiper.slideTo(Math.max(activeIndex - 2, 0));
    }
  }, [activeIndex, thumbsSwiper]);

  return (
    <>
      <Box
        sx={{
          width: "100%",
          backgroundColor: NAVY,
          borderRadius: { xs: "14px", md: "16px" },
          p: 0.5,
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(13, 24, 48, 0.18)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 0.5,
            height: { xs: "auto", md: 520, lg: 600, xl: 660 },
          }}
        >
          <GalleryTile
            src={IMAGES[0]}
            alt="تصویر اصلی ملک"
            onClick={() => handleOpen(0)}
            zoom={1.03}
            sx={{ height: { xs: 260, sm: 340, md: "auto" } }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateRows: { xs: "190px 180px", md: "1fr 1fr" },
              gap: 0.5,
              minHeight: 0,
            }}
          >
            <GalleryTile
              src={IMAGES[1]}
              alt="تصویر سالن پذیرایی"
              onClick={() => handleOpen(1)}
            />

            <Box
              sx={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0.5,
                minHeight: 0,
              }}
            >
              <GalleryTile
                src={IMAGES[2]}
                alt="تصویر آشپزخانه"
                onClick={() => handleOpen(2)}
              />

              <GalleryTile
                src={IMAGES[3]}
                alt="مشاهده آلبوم کامل"
                onClick={() => handleOpen(3)}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(10, 16, 36, 0.72)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    pb: { xs: 3, md: 4 },
                  }}
                >
                  <GridViewIcon sx={{ color: GOLD, fontSize: { xs: 22, md: 26 } }} />
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: { xs: "0.85rem", md: "0.95rem" },
                    }}
                  >
                    +{toFa(extraCount)} تصویر
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: { xs: "0.62rem", md: "0.68rem" },
                    }}
                  >
                    مشاهده آلبوم کامل
                  </Typography>
                </Box>
              </GalleryTile>
            </Box>
          </Box>
        </Box>
      </Box>

      <Modal
        open={openModal}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 400,
            sx: { backgroundColor: "#000" },
          },
        }}
        sx={{ zIndex: 1300 }}
      >
        <Fade in={openModal}>
          <Box
            dir="rtl"
            sx={{
              position: "absolute",
              inset: 0,
              outline: "none",
              overflow: "hidden",
              backgroundColor: "#000",
            }}
          >
            <Swiper
              dir="rtl"
              modules={[Keyboard, Zoom]}
              slidesPerView={1}
              initialSlide={activeIndex}
              keyboard={{ enabled: true }}
              zoom={{ maxRatio: 3 }}
              onSwiper={setMainSwiper}
              onSlideChange={(s) => setActiveIndex(s.activeIndex)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              {IMAGES.map((img, index) => (
                <SwiperSlide key={img}>
                  <div className="swiper-zoom-container">
                    <Box
                      component="img"
                      src={img}
                      alt={`تصویر ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: { xs: 1.5, sm: 2, md: 2.5 },
                background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            >
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: { xs: "0.8rem", md: "0.9rem" },
                  fontWeight: 700,
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                {toFa(activeIndex + 1)} / {toFa(IMAGES.length)}
              </Typography>

              <IconButton
                onClick={handleClose}
                aria-label="بستن"
                sx={{
                  pointerEvents: "auto",
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.28)" },
                }}
              >
                <CloseIcon sx={{ fontSize: { xs: 20, md: 22 } }} />
              </IconButton>
            </Box>

            {[
              { side: "left", label: "قبلی", icon: <ArrowForwardIosIcon />, action: () => mainSwiper?.slidePrev() },
              { side: "right", label: "بعدی", icon: <ArrowBackIosNewIcon />, action: () => mainSwiper?.slideNext() },
            ].map((btn) => (
              <IconButton
                key={btn.side}
                aria-label={btn.label}
                onClick={btn.action}
                sx={{
                  position: "absolute",
                  top: "50%",
                  [btn.side]: { xs: 8, md: 24 },
                  transform: "translateY(-50%)",
                  zIndex: 20,
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  width: { xs: 38, md: 48 },
                  height: { xs: 38, md: 48 },
                  border: "1px solid rgba(255,255,255,0.2)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.28)" },
                  "& svg": { fontSize: { xs: 16, md: 20 } },
                }}
              >
                {btn.icon}
              </IconButton>
            ))}

            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 20,
                px: { sm: 1.5, md: 2 },
                pt: 4,
                pb: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                display: { xs: "none", sm: "block" },
                pointerEvents: "none",
              }}
            >
              <Swiper
                dir="rtl"
                onSwiper={setThumbsSwiper}
                spaceBetween={8}
                slidesPerView="auto"
                style={{ padding: "2px", pointerEvents: "auto" }}
              >
                {IMAGES.map((img, index) => (
                  <SwiperSlide key={img} style={{ width: "auto" }}>
                    <Box
                      role="button"
                      tabIndex={0}
                      aria-label={`نمایش تصویر ${index + 1}`}
                      onClick={() => mainSwiper?.slideTo(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          mainSwiper?.slideTo(index);
                        }
                      }}
                      sx={{
                        width: { sm: 70, md: 90 },
                        height: { sm: 50, md: 60 },
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "2px solid",
                        borderColor: activeIndex === index ? GOLD : "transparent",
                        opacity: activeIndex === index ? 1 : 0.55,
                        transition: "all 0.2s ease",
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={img}
                        alt=""
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </Box>
                  </SwiperSlide>
                ))}
              </Swiper>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
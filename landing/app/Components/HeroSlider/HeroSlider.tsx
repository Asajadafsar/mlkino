"use client";
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

import "swiper/css";
import "swiper/css/effect-fade";

const GOLD = "#f7b23b";
const BG = "#090d22";

// داده‌های نمونه (تصاویر را با تصاویر واقعی خودتان یا داده‌ی API جایگزین کنید)
const slidesData = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80",
    category: "مجموعه پنت‌هاوس‌ها و ویلاهای اختصاصی",
    badge: "پنت‌هاوس مدرن نیاوران - ۷۵۰ متر - ویو ابدی تهران و البرز",
    titleStart: "ملکینو؛ دروازه ورود به",
    titleHighlight: "خانه‌های خاص و لوکس",
    titleEnd: "ایران",
    description:
      "دسترسی بی‌واسطه به شاهکارهای معماری، عمارت‌های فوق‌مدرن و برترین فرصت‌های سرمایه‌گذاری ملکی با پشتیبانی کارشناسان نخبه حقوقی.",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
    category: "ویلاهای لوکس شمال",
    badge: "ویلای ساحلی چالوس - ۱۲۰۰ متر - جنگل و دریا",
    titleStart: "سرمایه‌گذاری هوشمند در",
    titleHighlight: "بهترین ویلاهای",
    titleEnd: "ایران",
    description:
      "با مشاوره تخصصی ما، بهترین فرصت‌های سرمایه‌گذاری در شمال کشور را از دست ندهید و آینده مالی خود را تضمین کنید.",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1920&q=80",
    category: "عمارت‌های فوق‌مدرن",
    badge: "عمارت مدرن لواسان - ۹۰۰ متر - باغ ۲۵۰۰ متری",
    titleStart: "عمارت‌هایی با",
    titleHighlight: "معماری ماندگار",
    titleEnd: "در قلب طبیعت",
    description:
      "از باغ‌ویلاهای لواسان تا برج‌های شاخص شمیران؛ فایل‌های بررسی‌شده با اسناد کامل و قیمت شفاف.",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80",
    category: "فرصت‌های سرمایه‌گذاری",
    badge: "برج لوکس الهیه - ۳۲۰ متر - ویو پانوراما",
    titleStart: "خرید مطمئن با",
    titleHighlight: "پشتیبانی حقوقی",
    titleEnd: "تا لحظه سند",
    description:
      "کارشناسان حقوقی ملکینو تمام مراحل استعلام، قرارداد و انتقال سند را همراه شما پیش می‌برند.",
  },
];

const toFa = (n: number) =>
  n.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false });

const glass = {
  backgroundColor: "rgba(30, 34, 52, 0.75)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.14)",
} as const;

export default function HeroSlider() {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const total = slidesData.length;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        bgcolor: BG,
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        mt: 2,
      }}
    >
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        slidesPerView={1}
        loop
        speed={900}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        onSwiper={setSwiper}
        onSlideChange={(s) => setActive(s.realIndex)}
        style={{ width: "100%" }}
      >
        {slidesData.map((slide) => (
          <SwiperSlide key={slide.id} style={{ height: "auto" }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: { xs: 560, sm: 560, md: 620, lg: 640 },
                display: "flex",
                backgroundImage: `url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(9,13,34,0.96) 0%, rgba(9,13,34,0.6) 40%, rgba(9,13,34,0.5) 100%)",
                },
              }}
            >
              {/* دسته‌بندی بالا-راست */}
              <Box
                sx={{
                  ...glass,
                  position: "absolute",
                  top: { xs: 20, md: 28 },
                  right: { xs: 16, sm: 24, md: 40 },
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: { xs: 1.5, md: 2 },
                  py: 1,
                  borderRadius: "999px",
                  color: "#fff",
                  fontSize: { xs: "0.68rem", md: "0.78rem" },
                  fontWeight: 700,
                  maxWidth: {
                    xs: "calc(100% - 130px)",
                    sm: "calc(100% - 160px)",
                  },
                }}
              >
                <WorkspacePremiumOutlinedIcon
                  sx={{ fontSize: 18, color: GOLD, flexShrink: 0 }}
                />
                <Box
                  component="span"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {slide.category}
                </Box>
              </Box>

              {/* محتوای اصلی */}
              <Box
                sx={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start", // در RTL یعنی سمت راست
                  px: { xs: 2, sm: 3, md: 5 },
                  pt: { xs: 10, sm: 11, md: 12 },
                  pb: { xs: 4, md: 6 },
                }}
              >
                {/* نشان موقعیت */}
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    mb: { xs: 2, md: 2.5 },
                    maxWidth: "100%",
                    borderRadius: "8px",
                    backgroundColor: "rgba(12, 15, 32, 0.7)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#e8e8ee",
                    fontSize: { xs: "0.65rem", md: "0.72rem" },
                    lineHeight: 1.6,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      boxShadow: "0 0 0 3px rgba(34,197,94,0.25)",
                    }}
                  />
                  {slide.badge}
                </Box>

                {/* تیتر */}
                <Typography
                  component="h2"
                  sx={{
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: {
                      xs: "1.45rem",
                      sm: "2rem",
                      md: "2.4rem",
                      lg: "2.75rem",
                    },
                    lineHeight: 1.55,
                    maxWidth: 720,
                    mb: 1.5,
                  }}
                >
                  {slide.titleStart}{" "}
                  <Box
                    component="span"
                    sx={{
                      color: GOLD,
                      textDecoration: "underline",
                      textDecorationThickness: { xs: "2px", md: "3px" },
                      textUnderlineOffset: { xs: "6px", md: "9px" },
                    }}
                  >
                    {slide.titleHighlight}
                  </Box>{" "}
                  {slide.titleEnd}
                </Typography>

                {/* توضیحات */}
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.78)",
                    fontSize: { xs: "0.82rem", sm: "0.92rem", md: "1rem" },
                    lineHeight: { xs: 1.9, md: 2 },
                    maxWidth: 680,
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: { xs: 4, sm: "unset" },
                    overflow: "hidden",
                  }}
                >
                  {slide.description}
                </Typography>
              </Box>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* شمارنده بالا-چپ */}
      <Box
        sx={{
          ...glass,
          position: "absolute",
          top: { xs: 20, md: 28 },
          left: { xs: 16, sm: 24, md: 40 },
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 0.75,
          borderRadius: "999px",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <Box component="span" sx={{ color: GOLD }}>
          {toFa(active + 1)}
        </Box>
        <Box component="span" sx={{ opacity: 0.5 }}>
          /
        </Box>
        <Box component="span">{toFa(total)}</Box>
      </Box>

      {/* نوار کنترل پایین */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mx: { xs: 2, sm: 3, md: 5 },
          pt: { xs: 2, md: 2.5 },
          // روی دسکتاپ فضای همپوشانی کارت‌ها (۷۰px) + فاصله‌ی عادی (۲۶px)
          pb: { xs: 2, md: "96px" },
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* دکمه‌های CTA (سمت راست) */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <Button
            variant="contained"
            disableElevation
            startIcon={<ExploreOutlinedIcon sx={{ marginInlineEnd: 0.5 }} />}
            sx={{
              backgroundColor: GOLD,
              color: "#111",
              fontWeight: 800,
              borderRadius: "10px",
              px: 3,
              py: 1.3,
              fontSize: { xs: "0.8rem", md: "0.875rem" },
              whiteSpace: "nowrap",
              flex: { sm: 1, md: "none" },
              "&:hover": { backgroundColor: "#e6a12a" },
            }}
          >
            کاوش فایل‌های ویژه و VIP
          </Button>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ViewInArOutlinedIcon sx={{ marginInlineEnd: 0.5 }} />}
            sx={{
              ...glass,
              color: "#fff",
              fontWeight: 600,
              borderRadius: "10px",
              px: 3,
              py: 1.3,
              fontSize: { xs: "0.8rem", md: "0.875rem" },
              whiteSpace: "nowrap",
              flex: { sm: 1, md: "none" },
              "&:hover": { backgroundColor: "rgba(60, 66, 92, 0.85)" },
            }}
          >
            درخواست تور مجازی اختصاصی
          </Button>
        </Stack>

        {/* ناوبری (سمت چپ): نقطه‌ها | فلش‌ها */}
        <Stack
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            gap: 1.5,
            alignSelf: { xs: "center", md: "auto" },
          }}
        >
          <Stack  sx={{display:'flex',flexDirection:'row',alignItems:'center',gap:.9}}>
            {slidesData.map((s, i) => (
              <Box
                key={s.id}
                component="button"
                type="button"
                aria-label={`اسلاید ${i + 1}`}
                onClick={() => swiper?.slideToLoop(i)}
                sx={{
                  p: 0,
                  border: 0,
                  cursor: "pointer",
                  height: 8,
                  width: i === active ? 34 : 8,
                  borderRadius: "999px",
                  backgroundColor:
                    i === active ? GOLD : "rgba(255,255,255,0.35)",
                  transition: "width 0.3s ease, background-color 0.3s ease",
                }}
              />
            ))}
          </Stack>

          <Box
            sx={{
              width: "1px",
              height: 24,
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          />

          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label="قبلی"
              onClick={() => swiper?.slidePrev()}
              sx={{
                ...glass,
                color: "#fff",
                width: 42,
                height: 42,
                borderRadius: "10px",
                "&:hover": { backgroundColor: "rgba(60, 66, 92, 0.85)" },
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              aria-label="بعدی"
              onClick={() => swiper?.slideNext()}
              sx={{
                ...glass,
                color: "#fff",
                width: 42,
                height: 42,
                borderRadius: "10px",
                "&:hover": { backgroundColor: "rgba(60, 66, 92, 0.85)" },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

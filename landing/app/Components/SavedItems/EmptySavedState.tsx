"use client";
import React from "react";
import { Box, Typography, Button, Stack, Divider } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DiamondIcon from "@mui/icons-material/Diamond";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

// ==================== داده‌های کارت‌های راهنما ====================
const GUIDE_CARDS = [
  {
    id: 1,
    number: "۱",
    title: "کاوش و جستجوی فایل‌ها",
    description:
      "در میان صدها پروژه مسکونی، تجاری و ویلا در محدوده مورد نظرتان جستجو کنید.",
    icon: SearchIcon,
  },
  {
    id: 2,
    number: "۲",
    title: "لمس آیکون نشان‌کردن",
    description:
      "بر آیکون یک‌ضلعی موجود روی تصاویر کارت‌ها یا در صفحه جزئیات آیکن کلیک کنید.",
    icon: TouchAppIcon,
  },
  {
    id: 3,
    number: "۳",
    title: "رصد تغییرات و مقایسه",
    description:
      "در صورت تخفیف یا کاهش قیمت، فاصله‌ها از طریق پیامک یا نوتیفیکیشن مطلع شوید.",
    icon: TrendingUpIcon,
  },
];

// ==================== کامپوننت ====================
export default function EmptySavedState() {
  return (
    <Box
      sx={{
        width: "100%",
     borderRadius: 3,
        border: "1px solid #eef0f4",
        boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
        bgcolor: "background.paper",
        position: "relative",
        overflow: "hidden",
        p: { xs: 2, sm: 3, md: 4, lg: 5 },
      }}
    >
      {/* ==================== دایره‌های تزئینی پس‌زمینه ==================== */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: -80, md: -120 },
          right: { xs: -80, md: -120 },
          width: { xs: 180, md: 300 },
          height: { xs: 180, md: 300 },
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245, 176, 46, 0.12) 0%, rgba(245, 176, 46, 0.02) 70%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: -60, md: -100 },
          left: { xs: -60, md: -100 },
          width: { xs: 150, md: 250 },
          height: { xs: 150, md: 250 },
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(26, 115, 232, 0.08) 0%, rgba(26, 115, 232, 0.01) 70%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ==================== بخش بالایی: آیکون + متن + دکمه‌ها ==================== */}
      <Stack
        sx={{display:'flex',alignItems:'center', position: "relative", zIndex: 1, mb: { xs: 4, md: 6 } }}
      >
        {/* ---------- آیکون مرکزی با نشان‌ها ---------- */}
        <Box
          sx={{
            position: "relative",
            mb: { xs: 2.5, md: 3.5 },
          }}
        >
          {/* باکس اصلی آیکون */}
          <Box
            sx={{
              width: { xs: 80, sm: 90, md: 110 },
              height: { xs: 80, sm: 90, md: 110 },
              borderRadius: { xs: "16px", md: "22px" },
              backgroundColor: "#fff",
              border: "1.5px solid #e8ecf3",
              boxShadow: "0 8px 24px rgba(20, 30, 60, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <BookmarkBorderIcon
              sx={{
                color: "#1a73e8",
                fontSize: { xs: 40, sm: 46, md: 56 },
              }}
            />

            {/* ستاره کوچک زرد گوشه باکس */}
            <StarIcon
              sx={{
                position: "absolute",
                bottom: { xs: 6, md: 10 },
                left: { xs: 8, md: 12 },
                color: "#f5b02e",
                fontSize: { xs: 16, md: 20 },
              }}
            />
          </Box>

          {/* نشان + (بالا راست) */}
          <Box
            sx={{
              position: "absolute",
              top: { xs: -6, md: -8 },
              right: { xs: -6, md: -8 },
              width: { xs: 26, sm: 30, md: 34 },
              height: { xs: 26, sm: 30, md: 34 },
              borderRadius: "50%",
              backgroundColor: "#f5b02e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(245, 176, 46, 0.4)",
              border: "2px solid #fff",
            }}
          >
            <AddIcon
              sx={{
                color: "#fff",
                fontSize: { xs: 14, sm: 16, md: 18 },
              }}
            />
          </Box>

          {/* نشان ۳ (پایین چپ) */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: -6, md: -8 },
              left: { xs: -6, md: -8 },
              width: { xs: 26, sm: 30, md: 34 },
              height: { xs: 26, sm: 30, md: 34 },
              borderRadius: "50%",
              backgroundColor: "#1a73e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(26, 115, 232, 0.4)",
              border: "2px solid #fff",
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" },
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              ۳
            </Typography>
          </Box>
        </Box>

        {/* ---------- عنوان ---------- */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1a1a1a",
            fontSize: {
              xs: "1.15rem",
              sm: "1.35rem",
              md: "1.6rem",
              lg: "1.75rem",
            },
            textAlign: "center",
            mb: { xs: 1.5, md: 2 },
            lineHeight: 1.4,
          }}
        >
          هنوز هیچ ملکی را نشان نکرده‌اید!
        </Typography>

        {/* ---------- توضیحات ---------- */}
        <Typography
          variant="body1"
          sx={{
            color: "#7a8291",
            fontSize: { xs: "0.78rem", sm: "0.85rem", md: "0.95rem" },
            textAlign: "center",
            lineHeight: { xs: 1.8, md: 2 },
            maxWidth: { xs: "100%", sm: 550, md: 650 },
            mb: { xs: 3, md: 4 },
            px: { xs: 1, sm: 0 },
          }}
        >
          با نشان‌کردن آگهی‌ها و فایل‌های ملکی دلخواهتان، می‌توانید نوسانات
          قیمت، وضعیت استعلام سند و پیشرفت معامله آن‌ها را در هر زمان و روی تمام
          دستگاه‌های هوشمند خود به آسانی دنبال کرده و با یکدیگر مقایسه نمایید.
        </Typography>

        {/* ---------- دکمه‌های CTA ---------- */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 1.5, md: 2 }}
          sx={{
            width: { xs: "100%", sm: "auto" },
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            startIcon={<SearchIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
            sx={{
              backgroundColor: "#1a73e8",
              color: "#fff",
              fontWeight: 700,
              borderRadius: { xs: "10px", md: "12px" },
              px: { xs: 3, sm: 3.5, md: 4 },
              py: { xs: 1.2, md: 1.5 },
              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
              textTransform: "none",
              width: { xs: "100%", sm: "auto" },
              boxShadow: "0 4px 14px rgba(26, 115, 232, 0.3)",
              "&:hover": {
                backgroundColor: "#1557b0",
                boxShadow: "0 6px 18px rgba(26, 115, 232, 0.4)",
              },
            }}
          >
            مشاهده و جستجوی فایل‌های ملکی
          </Button>

          <Button
            variant="contained"
            startIcon={
              <DiamondIcon
                sx={{ fontSize: { xs: 16, md: 18 }, color: "#5b3d0f" }}
              />
            }
            sx={{
              backgroundColor: "#f5b02e",
              color: "#5b3d0f",
              fontWeight: 800,
              borderRadius: { xs: "10px", md: "12px" },
              px: { xs: 3, sm: 3.5, md: 4 },
              py: { xs: 1.2, md: 1.5 },
              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
              textTransform: "none",
              width: { xs: "100%", sm: "auto" },
              boxShadow: "0 4px 14px rgba(245, 176, 46, 0.3)",
              "&:hover": {
                backgroundColor: "#e0a028",
                boxShadow: "0 6px 18px rgba(245, 176, 46, 0.4)",
              },
            }}
          >
            فایل‌های ویژه و VIP
          </Button>
        </Stack>
      </Stack>

      {/* ==================== بخش پایینی: راهنما ==================== */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* ---------- عنوان راهنما با خطوط ---------- */}
        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            mb: { xs: 2.5, md: 3.5 },
          }}
        >
          <Divider
            sx={{
              width: { xs: 30, sm: 50, md: 70 },
              borderColor: "#d0d7e2",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "#5b6472",
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
              fontWeight: 700,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            چگونه فایل‌های مورد نظر را ذخیره کنیم؟
          </Typography>
          <Divider
            sx={{
              width: { xs: 30, sm: 50, md: 70 },
              borderColor: "#d0d7e2",
            }}
          />
        </Stack>

        {/* ---------- کارت‌های راهنما ---------- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
          }}
        >
          {GUIDE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Box
                key={card.id}
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: { xs: "12px", md: "14px" },
                  border: "1px solid #eef0f4",
                  p: { xs: 2, sm: 2.5, md: 3 },
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: { xs: 1.5, md: 2 },
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(20, 30, 60, 0.08)",
                    transform: { xs: "none", md: "translateY(-3px)" },
                    borderColor: "#e0e6ee",
                  },
                }}
              >
                {/* آیکون */}
                <Box
                  sx={{
                    width: { xs: 40, md: 44 },
                    height: { xs: 40, md: 44 },
                    borderRadius: "10px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #eef0f4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <Icon
                    sx={{
                      color: "#8b93a1",
                      fontSize: { xs: 20, md: 22 },
                    }}
                  />
                </Box>

                {/* متن */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 0.8,
                      mb: 0.8,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#1a73e8",
                        fontWeight: 800,
                        fontSize: { xs: "0.85rem", md: "0.95rem" },
                      }}
                    >
                      {card.number}.
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "#1a1a1a",
                        fontWeight: 700,
                        fontSize: { xs: "0.82rem", md: "0.9rem" },
                        lineHeight: 1.4,
                      }}
                    >
                      {card.title}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#7a8291",
                      fontSize: { xs: "0.72rem", sm: "0.75rem", md: "0.8rem" },
                      lineHeight: 1.9,
                    }}
                  >
                    {card.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

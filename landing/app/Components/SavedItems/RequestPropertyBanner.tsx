"use client";
import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

export default function RequestPropertyBanner() {
  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "primary.dark",
        borderRadius: 3,
        p: { xs: 2, sm: 2.5, md: 3, lg: 3.5 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: "0 6px 24px rgba(26, 79, 163, 0.25)",
      }}
    >
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1.5, sm: 2, md: 2.5 },
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* باکس آیکون */}
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            borderRadius: { xs: "10px", md: "12px" },
            p: { xs: 1, sm: 1.2, md: 1.5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <SupportAgentIcon
            sx={{
              color: "#fff",
              fontSize: { xs: 24, sm: 28, md: 32 },
            }}
          />
        </Box>

        {/* متن‌ها */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              fontWeight: 800,
              fontSize: {
                xs: "0.95rem",
                sm: "1.05rem",
                md: "1.15rem",
                lg: "1.25rem",
              },
              mb: { xs: 0.5, md: 0.8 },
              lineHeight: 1.4,
              textAlign:'left',
            }}
          >
            ملک خاصی مد نظر دارید که پیدا نمی‌کنید؟
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: { xs: "0.72rem", sm: "0.78rem", md: "0.85rem" },
              lineHeight: { xs: 1.7, md: 1.9 },
              textAlign: 'left',
            }}
          >
            مشاورین مجرب ملکینو بر اساس بودجه و نیاز اختصاصی شما، فایل‌های بدون
            واسطه را در اسرع وقت مهیا می‌کنند.
          </Typography>
        </Box>
      </Stack>

      {/* ==================== بخش چپ: دکمه ==================== */}
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: "100%", md: "auto" },
          display: "flex",
          justifyContent: { xs: "center", md: "flex-end" },
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          sx={{
            color: "#1a1a1a",
            fontWeight: 800,
            borderRadius: { xs: "10px", md: "12px" },
            px: { xs: 3, sm: 3.5, md: 4, lg: 5 },
            py: { xs: 1.2, md: 1.4 },
            fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
            textTransform: "none",
            whiteSpace: "nowrap",
            width: { xs: "100%", sm: "auto" },
            boxShadow: "0 4px 14px rgba(245, 176, 46, 0.35)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#e0a028",
              boxShadow: "0 6px 18px rgba(245, 176, 46, 0.45)",
              transform: { xs: "none", md: "translateY(-1px)" },
            },
          }}
        >
          ثبت رایگان درخواست ملک
        </Button>
      </Box>
    </Box>
  );
}

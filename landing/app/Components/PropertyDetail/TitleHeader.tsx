"use client";
import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

type Props = {
  title?: string;
};

export default function TitleHeader({
  title = "پنت‌هاوس مجلل ۱۸۵ متری ۳ خوابه کلیدنخورده با ویوی ابدی پایتخت و ۲ تراس گردن",
}: Props) {
  return (
    <Box
      sx={{
             border: "1px solid #eef0f4",
        boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
        bgcolor: "background.paper",
        borderRadius:3,
        p: { xs: 2, sm: 2.5, md: 3 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1, sm: 1.25, md: 1.5 },
      }}
    >
      {/* ==================== عنوان اصلی ==================== */}
      <Typography
        component="h1"
        sx={{
          color: "#1a1a1a",
          fontWeight: 800,
          fontSize: {
            xs: "1rem",
            sm: "1.15rem",
            md: "1.3rem",
            lg: "1.5rem",
          },
          lineHeight: { xs: 1.6, md: 1.5 },
          textAlign: "left",
          wordBreak: "break-word",
          transition: "color 0.2s ease",
          "&:hover": {
            color: "#1a4fa3",
          },
        }}
      >
        {title}
      </Typography>

    
    </Box>
  );
}
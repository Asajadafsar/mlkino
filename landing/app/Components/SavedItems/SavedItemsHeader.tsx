"use client";
import React from "react";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TuneIcon from "@mui/icons-material/Tune";

export type SavedItemsHeaderProps = {
  count?: number;
  onSortClick?: () => void;
  onShareClick?: () => void;
};

const toPersianDigits = (n: number): string => n.toLocaleString("fa-IR");

const buttonBaseSx = {
  flexShrink: 0,
  gap: 0.5,
  px: { xs: 2, md: 2.5 },
  py: 1,
  borderRadius: "10px",
  fontFamily: "inherit",
  fontSize: "0.8125rem",
  fontWeight: 600,
  textTransform: "none",
  whiteSpace: "nowrap",
  "& .MuiButton-startIcon": { m: 0 },
} as const;

export default function SavedItemsHeader({
  count = 0,
  onSortClick,
  onShareClick,
}: SavedItemsHeaderProps) {
  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: { xs: 2, md: 3 },
        px: { xs: 2, md: 2.5 },
        py: { xs: 2, md: 2 },
        borderRadius: 3,
        border: "1px solid #eef0f4",
        boxShadow: "0 4px 20px rgba(20, 30, 60, 0.06)",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 1.75,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: { xs: 40, md: 44 },
            height: { xs: 40, md: 44 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: "12px",
            backgroundColor: "#1f5fc9",
            boxShadow: "0 4px 12px rgba(31, 95, 201, 0.28)",
          }}
        >
          <BookmarkIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1,
              mb: 0.25,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                color: "#141a26",
                fontSize: { xs: "1.1rem", md: "1.25rem" },
                lineHeight: 1.4,
              }}
            >
              نشان‌شده‌های من
            </Typography>

            <Chip
              label={`${toPersianDigits(count)} فایل`}
              size="small"
              sx={{
                height: 22,
                borderRadius: "6px",
                backgroundColor: "#eef0f5",
                color: "#3d4656",
                fontSize: "0.7rem",
                fontWeight: 600,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Stack>

          <Typography
            sx={{
              color: "#7a8291",
              fontSize: { xs: "0.75rem", md: "0.8125rem" },
              lineHeight: 1.8,
            }}
          >
            فایل‌های ملکی ذخیره‌شده شما در سراسر پلتفرم برای مقایسه و دسترسی
            آسان
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

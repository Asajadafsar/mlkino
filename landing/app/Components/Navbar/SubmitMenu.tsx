"use client";

import Link from "next/link";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import HomeWorkRounded from "@mui/icons-material/HomeWorkRounded";
import ManageSearchRounded from "@mui/icons-material/ManageSearchRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";

export default function SubmitMenu({ anchorEl, onClose, id, triggerId, placement = "bottom" }: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  id: string;
  triggerId?: string;
  placement?: "top" | "bottom";
}) {
  return (
    <Menu
      id={id}
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: placement === "top" ? "top" : "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: placement === "top" ? "bottom" : "top", horizontal: "center" }}
      slotProps={{
        paper: { sx: { width: 300, maxWidth: "calc(100vw - 32px)", borderRadius: 4, p: 1, m: 0, boxShadow: "0 12px 48px #192e5b26" } },
        list: { "aria-label": triggerId ? undefined : "گزینه‌های ثبت", "aria-labelledby": triggerId, sx: { p: 0 } },
      }}
    >
      {[
        { href: "https://panel.mlkino.com/files/create", title: "ثبت ملک", caption: "ویژه مالک و موجر", Icon: HomeWorkRounded },
        { href: "https://panel.mlkino.com/requests/create", title: "درخواست ملک", caption: "ویژه خریدار و مستأجر", Icon: ManageSearchRounded },
      ].map(({ href, title, caption, Icon }) => (
        <MenuItem component={Link} href={href} key={href} onClick={onClose} sx={{ gap: 1.5, p: 1.5, borderRadius: 3, whiteSpace: "normal" }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0, borderRadius: 3, bgcolor: "#fff4dc", color: "#ed9700" }}><Icon /></Box>
          <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 14, fontWeight: 750 }}>{title}</Typography><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{caption}</Typography></Box>
          <ArrowBackRounded sx={{ fontSize: 18, color: "text.secondary" }} />
        </MenuItem>
      ))}
    </Menu>
  );
}

"use client";
import {PANEL_LINKS} from "../../Core/panel";


import Link from "next/link";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import HomeWorkRounded from "@mui/icons-material/HomeWorkRounded";
import ManageSearchRounded from "@mui/icons-material/ManageSearchRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";

export default function SubmitMenu({ anchorEl, onClose, id, placement = "bottom" }: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  id: string;
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
        paper: { sx: { width: 300, maxWidth: "calc(100vw - 32px)", borderRadius: 4, p: 1, my: 1, boxShadow: "0 12px 48px #192e5b26" } },
        list: { "aria-label": "گزینه‌های ثبت", sx: { p: 0 } },
      }}
    >
      {[
        { href: PANEL_LINKS.createFile, title: "ثبت ملک", caption: "ویژه مالک و موجر", Icon: HomeWorkRounded },
        { href: PANEL_LINKS.createRequest, title: "درخواست ملک", caption: "ویژه خریدار و مستأجر", Icon: ManageSearchRounded },
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

"use client";
import {useLandingSession} from "../../Core/Session";
import {PANEL_LINKS} from "../../Core/panel";
import {useState} from "react";
import LandingSubmissionDialog,{LandingSubmissionKind} from "./LandingSubmissionDialog";


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
  const {user}=useLandingSession();
  const [dialog,setDialog]=useState<LandingSubmissionKind|null>(null);
  const choose=(kind:LandingSubmissionKind)=>{onClose();if(!user){window.location.assign(PANEL_LINKS.login+`?next=${encodeURIComponent('/')}`);return}setDialog(kind)};
  return <>
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
        { kind:"owner" as const, title: user?.role==='expert'?"ثبت فایل تخصصی":"مالک هستم", caption: "می‌خواهم ملک ثبت کنم", Icon: HomeWorkRounded },
        { kind:"request" as const, title: "دنبال ملک هستم", caption: "می‌خواهم درخواست فایل ثبت کنم", Icon: ManageSearchRounded },
      ].filter((_,i)=>user?.role!=='expert'||i===0).map(({ kind, title, caption, Icon }) => (
        <MenuItem component="button" key={kind} onClick={()=>user?.role==='expert'?window.location.assign(PANEL_LINKS.createFile):choose(kind)} sx={{ width:"100%",gap: 1.5, p: 1.5, borderRadius: 3, whiteSpace: "normal" }}>
          <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0, borderRadius: 3, bgcolor: "#fff4dc", color: "#ed9700" }}><Icon /></Box>
          <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 14, fontWeight: 750 }}>{title}</Typography><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{caption}</Typography></Box>
          <ArrowBackRounded sx={{ fontSize: 18, color: "text.secondary" }} />
        </MenuItem>
      ))}
    </Menu>
    {dialog&&<LandingSubmissionDialog open kind={dialog} onClose={()=>setDialog(null)}/>}
  </>;
}

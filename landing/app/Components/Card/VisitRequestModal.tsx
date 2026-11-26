"use client";

import {useEffect, useState, type FormEvent} from "react";
import {
  Alert, alpha, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, IconButton, InputAdornment, Stack, TextField, Typography, useMediaQuery,
} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import HomeWorkRounded from "@mui/icons-material/HomeWorkRounded";
import {apiOrigin, useLandingSession} from "@/app/Core/Session";
import {propertyTitle} from "@/app/Core/listings";
import type {PropertyType} from "@/app/Core/types";

type Slot = {id: number; starts_at: string; ends_at: string};
type Props = {open: boolean; onClose: () => void; property: PropertyType};
const timeZone = "Asia/Tehran";
const dateFormat = new Intl.DateTimeFormat("fa-IR", {timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric"});
const timeFormat = new Intl.DateTimeFormat("fa-IR", {timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23"});

function slotLabel(slot: Slot) {
  const start = new Date(slot.starts_at), end = new Date(slot.ends_at);
  const date = dateFormat.format(start), endDate = dateFormat.format(end);
  return `${date}، ${timeFormat.format(start)} تا ${date === endDate ? "" : `${endDate}، `}${timeFormat.format(end)}`;
}

export default function VisitRequestModal({open, onClose, property}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const {user, loading: sessionLoading} = useLandingSession();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [saved, setSaved] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open || !property.published) return;
    const controller = new AbortController();
    async function loadSlots() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch(`${apiOrigin()}/api/panel/public/catalog/${property.id}/visit-slots/`, {signal: controller.signal, cache: "no-store"});
        if (!response.ok) throw Error();
        const result = (await response.json()).data.results as Slot[];
        if (controller.signal.aborted) return;
        setSlots(result);
        setSelected(current => current && result.find(slot => slot.id === current.id) || null);
      } catch {
        if (!controller.signal.aborted) setLoadError("دریافت زمان‌های بازدید انجام نشد.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSlots();
    return () => controller.abort();
  }, [open, property.id, property.published, reload]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !user || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const origin = apiOrigin();
      const csrfResponse = await fetch(`${origin}/api/accounts/csrf/`, {credentials: "include", cache: "no-store"});
      if (!csrfResponse.ok) throw Error();
      const {csrfToken} = await csrfResponse.json();
      const response = await fetch(`${origin}/api/panel/public/catalog/${property.id}/visits/`, {
        method: "POST", credentials: "include",
        headers: {"Content-Type": "application/json", "X-CSRFToken": csrfToken},
        body: JSON.stringify({slot_id: selected.id, visitor_name: name.trim(), visitor_phone: phone.trim(), notes: notes.trim()}),
      });
      if (response.status === 401) {
        setSubmitError("برای ثبت بازدید دوباره وارد حساب خود شوید.");
        return;
      }
      const body = await response.json();
      if (!response.ok) {
        setSubmitError(typeof body.message === "string" ? body.message : "ثبت درخواست بازدید انجام نشد.");
        setReload(value => value + 1);
        return;
      }
      setSaved(selected);
    } catch {
      setSubmitError("ثبت درخواست بازدید انجام نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  const login = process.env.NODE_ENV === "development" ? `http://${typeof window === "undefined" ? "localhost" : window.location.hostname}:3001/login` : "/panel/login";
  const available = property.published && !loading && !loadError && slots.length > 0;

  return <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isMobile}
    aria-labelledby="visit-title" slotProps={{paper: {sx: {borderRadius: {xs: 0, sm: "16px"}, backgroundImage: "none"}}}}>
    <Stack direction="row" sx={{alignItems: "center", justifyContent: "space-between", gap: 1.5, px: {xs: 2, sm: 3}, py: 2, borderBottom: "1px solid", borderColor: "background.border"}}>
      <Stack direction="row" sx={{alignItems: "center", gap: 1.5}}>
        <Box sx={{width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: "10px", color: "primary.main", bgcolor: t => alpha(t.palette.primary.main, 0.1)}}><EventAvailableRounded/></Box>
        <Typography id="visit-title" component="h2" sx={{fontSize: 17, fontWeight: 800, color: "text.title"}}>درخواست بازدید</Typography>
      </Stack>
      <IconButton onClick={onClose} disabled={submitting} aria-label="بستن"><CloseRounded/></IconButton>
    </Stack>
    <Box component="form" onSubmit={submit} sx={{minHeight: 0, display: "flex", flexDirection: "column"}}>
      <DialogContent sx={{px: {xs: 2, sm: 3}, py: 2.5, bgcolor: "background.default"}}>
        {saved ? <Stack spacing={1.5} sx={{py: 5, alignItems: "center", textAlign: "center"}}>
          <CheckCircleRounded color="primary" sx={{fontSize: 56}}/>
          <Typography sx={{fontWeight: 800}}>درخواست بازدید ثبت شد</Typography>
          <Typography color="primary.dark">{slotLabel(saved)}</Typography>
          <Typography color="text.secondary">کارشناس برای تأیید زمان با شما تماس می‌گیرد.</Typography>
        </Stack> : <Stack spacing={2.5}>
          <Stack direction="row" sx={{alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", bgcolor: "background.paper", border: "1px solid", borderColor: "background.border", borderInlineStart: "4px solid", borderInlineStartColor: "secondary.main"}}>
            <HomeWorkRounded color="action"/>
            <Typography sx={{fontSize: 14, fontWeight: 700}}>{propertyTitle(property)}</Typography>
          </Stack>
          {property.published && loading ? <CircularProgress size={24} aria-label="دریافت زمان‌های بازدید"/> :
            loadError ? <Alert severity="error" action={<Button onClick={() => setReload(value => value + 1)}>تلاش مجدد</Button>}>{loadError}</Alert> :
            !available ? <Alert severity="info">زمان آزادی برای بازدید این فایل ثبت نشده است.</Alert> : <>
              <Stack role="group" aria-label="زمان‌های بازدید" spacing={1}>
                <Typography sx={{fontWeight: 700}}>زمان بازدید را انتخاب کنید</Typography>
                {slots.map(slot => <Button key={slot.id} type="button" aria-pressed={selected?.id === slot.id} disabled={submitting}
                  onClick={() => {setSelected(slot); setSubmitError("");}} variant={selected?.id === slot.id ? "contained" : "outlined"} sx={{justifyContent: "flex-start", borderRadius: "8px"}}>{slotLabel(slot)}</Button>)}
              </Stack>
              {!sessionLoading && !user && <Alert severity="info" action={<Button component="a" href={login} target="_blank" rel="noopener">ورود</Button>}>برای ثبت درخواست وارد حساب ملکینو شوید.</Alert>}
              {user && <>
                <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                  <TextField fullWidth label="نام و نام خانوادگی" value={name || user.full_name} onChange={event => setName(event.target.value)} slotProps={{htmlInput: {maxLength: 200}}}/>
                  <TextField fullWidth label="شماره موبایل" value={phone} onChange={event => setPhone(event.target.value)} placeholder="شماره حساب کاربری" slotProps={{htmlInput: {inputMode: "tel", maxLength: 20}}}/>
                </Stack>
                <TextField label="توضیحات (اختیاری)" value={notes} onChange={event => setNotes(event.target.value)} fullWidth multiline minRows={2} slotProps={{htmlInput: {maxLength: 3000}, input: {endAdornment: <InputAdornment position="end">{notes.length.toLocaleString("fa-IR")} / ۳۰۰۰</InputAdornment>}}}/>
              </>}
            </>}
          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Stack>}
      </DialogContent>
      <DialogActions sx={{px: {xs: 2, sm: 3}, py: 2}}>
        <Button disabled={submitting} onClick={onClose}>{saved ? "بستن" : "انصراف"}</Button>
        {!saved && available && <Button type="submit" variant="contained" disabled={submitting || !selected || !user} startIcon={submitting ? <CircularProgress size={16}/> : <EventAvailableRounded/>}>{submitting ? "در حال ثبت…" : "ثبت درخواست بازدید"}</Button>}
      </DialogActions>
    </Box>
  </Dialog>;
}

"use client";

import * as React from "react";

import {
  Alert,
  alpha,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import { PropertyType } from "@/app/Core/types";

import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface VisitRequestPayload {
  fullName: string;
  phone: string;
  visitDate: string; // YYYY-MM-DD (میلادی، انگلیسی) - برای ارسال به API
  visitTime: string; // HH:mm (انگلیسی)
  description: string;
}

export interface VisitRequestModalProps {
  open: boolean;
  onClose: () => void;
  property?: PropertyType | null;
  onSubmit?: (payload: VisitRequestPayload) => void | Promise<void>;
}

type FormErrors = Partial<Record<keyof VisitRequestPayload, string>>;

const initialForm: VisitRequestPayload = {
  fullName: "",
  phone: "",
  visitDate: "",
  visitTime: "",
  description: "",
};

/** ساعت‌های پیشنهادی برای انتخاب سریع */
const TIME_SLOTS = ["09:00", "10:30", "12:00", "14:00", "16:00", "18:00"];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/** تبدیل اعداد فارسی/عربی به انگلیسی */
const toEnglishDigits = (str: string) =>
  str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/** تبدیل اعداد انگلیسی به فارسی (فقط برای نمایش) */
const toPersianDigits = (str: string) =>
  str.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** اعتبارسنجی شماره موبایل ایران */
const isValidIranMobile = (phone: string) =>
  /^09\d{9}$/.test(toEnglishDigits(phone).replace(/\s|-/g, ""));

/**
 * تاریخ شمسی → رشته‌ی میلادی YYYY-MM-DD با ارقام انگلیسی
 * (کلون می‌شود تا شیء اصلی تغییر نکند)
 */
const toGregorianString = (date: DateObject) =>
  toEnglishDigits(new DateObject(date).convert(gregorian).format("YYYY-MM-DD"));

const nowHHmm = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(
    n.getMinutes()
  ).padStart(2, "0")}`;
};

/* -------------------------------------------------------------------------- */
/*                               Small components                             */
/* -------------------------------------------------------------------------- */

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{
        display: "block",
        mb: 0.75,
        fontSize: 13,
        fontWeight: 600,
        color: "text.secondary",
      }}
    >
      {children}
    </Typography>
  );
}

interface ChoiceButtonProps {
  selected?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children: React.ReactNode;
}

/** دکمه‌ی انتخابی (برای تاریخ و ساعت سریع) */
function ChoiceButton({
  selected = false,
  disabled = false,
  onClick,
  children,
}: ChoiceButtonProps) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      focusRipple
      sx={(theme) => ({
        width: "100%",
        minHeight: 48,
        px: 1,
        py: 0.75,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        borderRadius: "8px",
        border: "1px solid",
        borderColor: selected
          ? theme.palette.primary.main
          : theme.palette.background.border,
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, 0.08)
          : theme.palette.background.paper,
        color: selected
          ? theme.palette.primary.dark
          : theme.palette.text.primary,
        fontWeight: selected ? 700 : 500,
        transition: theme.transitions.create(
          ["border-color", "background-color", "color"],
          { duration: 150 }
        ),
        "&:hover": {
          borderColor: theme.palette.primary.light,
        },
        "&.Mui-focusVisible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
        "&.Mui-disabled": {
          opacity: 0.4,
          backgroundColor: theme.palette.background.default,
        },
      })}
    >
      {children}
    </ButtonBase>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export default function VisitRequestModal({
  open,
  onClose,
  property,
  onSubmit,
}: VisitRequestModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = React.useState<VisitRequestPayload>(initialForm);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  /** مقدار داخلی انتخابگر تاریخ شمسی (برای نمایش) */
  const [selectedVisitDate, setSelectedVisitDate] =
    React.useState<Date | null>(null);

  /** مقدار داخلی انتخابگر ساعت دلخواه */
  const [selectedVisitTime, setSelectedVisitTime] =
    React.useState<DateObject | null>(null);

  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /** هر بار که مودال باز می‌شود، فرم از نو شروع شود */
  React.useEffect(() => {
    if (!open) return;
    setForm(initialForm);
    setErrors({});
    setSubmitError("");
    setSuccess(false);
    setSubmitting(false);
    setSelectedVisitDate(null);
    setSelectedVisitTime(null);
  }, [open]);

  React.useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  /** امروز، فردا و پس‌فردا برای انتخاب سریع */
  const quickDates = React.useMemo(
    () =>
      [0, 1, 2].map((n) =>
        new DateObject({ calendar: persian, locale: persian_fa }).add(
          n,
          "day"
        )
      ),
    // با هر بار باز شدن مودال دوباره محاسبه می‌شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );

  const quickDateValues = quickDates.map(toGregorianString);
  const todayValue = quickDateValues[0];
  const isCustomDate = !!form.visitDate && !quickDateValues.includes(form.visitDate);
  const isCustomTime = !!form.visitTime && !TIME_SLOTS.includes(form.visitTime);

  /* ------------------------------- handlers -------------------------------- */

  const clearError = (field: keyof VisitRequestPayload) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleChange =
    (field: keyof VisitRequestPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) clearError(field);
    };

  /**
   * تغییر تاریخ
   * UI: ۱۴۰۵/۰۷/۱۵  →  Payload: 2026-10-07
   */
  const handleVisitDateChange = (date: DateObject | null) => {
    if (!date) {
      setSelectedVisitDate(null);
      setForm((prev) => ({ ...prev, visitDate: "" }));
      clearError("visitDate");
      return;
    }

    const value = toGregorianString(date);

    setSelectedVisitDate(date.toDate());
    setForm((prev) => {
      // اگر امروز انتخاب شد و ساعت قبلی گذشته است، ساعت پاک شود
      const timePassed =
        value === todayValue && !!prev.visitTime && prev.visitTime <= nowHHmm();
      return { ...prev, visitDate: value, visitTime: timePassed ? "" : prev.visitTime };
    });
    clearError("visitDate");
  };

  /** انتخاب ساعت دلخواه از TimePicker → HH:mm */
  const handleVisitTimeChange = (date: DateObject | null) => {
    if (!date) {
      setSelectedVisitTime(null);
      setForm((prev) => ({ ...prev, visitTime: "" }));
      clearError("visitTime");
      return;
    }

    setSelectedVisitTime(date);
    setForm((prev) => ({
      ...prev,
      visitTime: toEnglishDigits(date.format("HH:mm")),
    }));
    clearError("visitTime");
  };

  const handleSlotClick = (slot: string) => {
    setSelectedVisitTime(null);
    setForm((prev) => ({ ...prev, visitTime: slot }));
    clearError("visitTime");
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.fullName.trim()) {
      next.fullName = "نام و نام خانوادگی الزامی است.";
    }

    if (!form.phone.trim()) {
      next.phone = "شماره تماس الزامی است.";
    } else if (!isValidIranMobile(form.phone)) {
      next.phone = "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).";
    }

    if (!form.visitDate) {
      next.visitDate = "تاریخ بازدید را انتخاب کنید.";
    }

    if (!form.visitTime) {
      next.visitTime = "ساعت بازدید را انتخاب کنید.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      await onSubmit?.({
        ...form,
        phone: toEnglishDigits(form.phone).replace(/\s|-/g, ""),
      });

      setSuccess(true);
      closeTimer.current = setTimeout(onClose, 2500);
    } catch {
      setSubmitError("ثبت درخواست انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------- derived -------------------------------- */

  const propertyTitle = property
    ? `${property.propertyType ?? ""}${
        property.contractType ? ` - ${property.contractType}` : ""
      }${property.city ? ` • ${property.city}` : ""}`.trim()
    : "";

  const successSummary = React.useMemo(() => {
    if (!selectedVisitDate && !form.visitDate) return "";
    const d = selectedVisitDate
      ? new DateObject({
          date: selectedVisitDate,
          calendar: persian,
          locale: persian_fa,
        })
      : null;
    const dateText = d ? d.format("dddd D MMMM") : "";
    const timeText = form.visitTime ? toPersianDigits(form.visitTime) : "";
    return [dateText, timeText && `ساعت ${timeText}`].filter(Boolean).join("، ");
  }, [selectedVisitDate, form.visitDate, form.visitTime]);

  const fieldSx = {
    "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
  };

  const adornmentIcon = (Icon: React.ElementType) => (
    <InputAdornment position="start">
      <Icon sx={{ fontSize: 20, color: "text.subtitle" }} />
    </InputAdornment>
  );

  /* --------------------------------- render -------------------------------- */

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      disableEnforceFocus
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, sm: "16px" },
            overflow: "hidden",
            backgroundImage: "none",
          },
        },
      }}
    >
      {/* هدر */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, sm: 3 },
          py: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "background.border",
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              color: "primary.main",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            }}
          >
            <EventAvailableRoundedIcon sx={{ fontSize: 22 }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h2"
              sx={{
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1.4,
                color: "text.title",
              }}
            >
              درخواست بازدید
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "text.subtitle" }}>
              زمان و اطلاعات تماس را وارد کنید تا هماهنگ کنیم.
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          disabled={submitting}
          aria-label="بستن"
          sx={{ color: "text.muted" }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2.5,
          bgcolor: "background.default",
        }}
      >
        {success ? (
          <Stack
            spacing={1.5}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              py: 5,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "primary.main" }} />
            </Box>

            <Typography sx={{ fontSize: 18, fontWeight: 800, color: "text.title" }}>
              درخواست بازدید ثبت شد
            </Typography>

            {successSummary && (
              <Typography sx={{ fontWeight: 600, color: "primary.dark" }}>
                {successSummary}
              </Typography>
            )}

            <Typography sx={{ fontSize: 14, color: "text.subtitle", maxWidth: 320 }}>
              کارشناس ما برای تأیید زمان، به‌زودی با شما تماس می‌گیرد.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            {/* ملک انتخاب‌شده */}
            {propertyTitle && (
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: "10px",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "background.border",
                  borderInlineStart: "4px solid",
                  borderInlineStartColor: "secondary.main",
                }}
              >
                <HomeWorkRoundedIcon sx={{ color: "text.muted" }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, color: "text.subtitle" }}>
                    ملک انتخاب‌شده
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ fontSize: 14, fontWeight: 700, color: "text.title" }}
                  >
                    {propertyTitle}
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* نام و شماره تماس */}
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <Box>
                <FieldLabel htmlFor="visit-fullname">نام و نام خانوادگی</FieldLabel>
                <TextField
                  id="visit-fullname"
                  placeholder="مثلاً: علی محمدی"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  fullWidth
                  sx={fieldSx}
                  slotProps={{
                    input: { startAdornment: adornmentIcon(PersonOutlineRoundedIcon) },
                  }}
                />
              </Box>

              <Box>
                <FieldLabel htmlFor="visit-phone">شماره موبایل</FieldLabel>
                <TextField
                  id="visit-phone"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  fullWidth
                  sx={fieldSx}
                  slotProps={{
                    htmlInput: {
                      inputMode: "tel",
                      dir: "ltr",
                      style: { textAlign: "right" },
                    },
                    input: { startAdornment: adornmentIcon(PhoneInTalkRoundedIcon) },
                  }}
                />
              </Box>
            </Box>

            {/* تاریخ بازدید */}
            <Box role="group" aria-labelledby="visit-date-label">
              <Typography
                id="visit-date-label"
                sx={{ mb: 0.75, fontSize: 13, fontWeight: 600, color: "text.secondary" }}
              >
                چه روزی؟
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: "repeat(4, 1fr)",
                }}
              >
                {quickDates.map((d, i) => (
                  <ChoiceButton
                    key={quickDateValues[i]}
                    selected={form.visitDate === quickDateValues[i]}
                    onClick={() => handleVisitDateChange(d)}
                  >
                    <Typography component="span" sx={{ fontSize: 12.5, fontWeight: "inherit" }}>
                      {i === 0 ? "امروز" : i === 1 ? "فردا" : d.format("dddd")}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: 12, color: "text.subtitle", fontWeight: 400 }}
                    >
                      {d.format("D MMMM")}
                    </Typography>
                  </ChoiceButton>
                ))}

                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-center"
                  portal
                  zIndex={1500}
                  format="YYYY/MM/DD"
                  value={selectedVisitDate}
                  onChange={handleVisitDateChange}
                  minDate={new Date()}
                  containerStyle={{ width: "100%" }}
                  render={(_value: unknown, openCalendar: () => void) => (
                    <ChoiceButton selected={isCustomDate} onClick={openCalendar}>
                      <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: "inherit" }}>
                        {isCustomDate && selectedVisitDate
                          ? new DateObject({
                              date: selectedVisitDate,
                              calendar: persian,
                              locale: persian_fa,
                            }).format("D MMMM")
                          : "تاریخ دیگر"}
                      </Typography>
                    </ChoiceButton>
                  )}
                />
              </Box>

              {errors.visitDate && (
                <FormHelperText error sx={{ mx: 0 }}>
                  {errors.visitDate}
                </FormHelperText>
              )}
            </Box>

            {/* ساعت بازدید */}
            <Box role="group" aria-labelledby="visit-time-label">
              <Typography
                id="visit-time-label"
                sx={{ mb: 0.75, fontSize: 13, fontWeight: 600, color: "text.secondary" }}
              >
                چه ساعتی؟
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: {
                    xs: "repeat(3, 1fr)",
                    sm: "repeat(4, 1fr)",
                  },
                }}
              >
                {TIME_SLOTS.map((slot) => {
                  const passed = form.visitDate === todayValue && slot <= nowHHmm();
                  return (
                    <ChoiceButton
                      key={slot}
                      selected={form.visitTime === slot}
                      disabled={passed}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <Typography component="span" sx={{ fontSize: 14, fontWeight: "inherit" }}>
                        {toPersianDigits(slot)}
                      </Typography>
                    </ChoiceButton>
                  );
                })}

                <DatePicker
                  disableDayPicker
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-center"
                  portal
                  zIndex={1500}
                  format="HH:mm"
                  value={selectedVisitTime}
                  onChange={handleVisitTimeChange}
                  plugins={[
                    <TimePicker key="visit-time-picker" position="bottom" hideSeconds />,
                  ]}
                  containerStyle={{ width: "100%" }}
                  render={(_value: unknown, openCalendar: () => void) => (
                    <ChoiceButton selected={isCustomTime} onClick={openCalendar}>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
                        <ScheduleRoundedIcon sx={{ fontSize: 18 }} />
                        <Typography component="span" sx={{ fontSize: 12.5, fontWeight: "inherit" }}>
                          {isCustomTime ? toPersianDigits(form.visitTime) : "ساعت دیگر"}
                        </Typography>
                      </Stack>
                    </ChoiceButton>
                  )}
                />
              </Box>

              {errors.visitTime && (
                <FormHelperText error sx={{ mx: 0 }}>
                  {errors.visitTime}
                </FormHelperText>
              )}
            </Box>

            {/* توضیحات */}
            <Box>
              <FieldLabel htmlFor="visit-description">توضیحات (اختیاری)</FieldLabel>
              <TextField
                id="visit-description"
                placeholder="مثلاً: ترجیحاً بعد از ساعت کاری، همراه با همسرم می‌آیم."
                value={form.description}
                onChange={handleChange("description")}
                fullWidth
                multiline
                minRows={3}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        sx={{ alignSelf: "flex-start", mt: 1.25 }}
                      >
                        <NotesRoundedIcon sx={{ fontSize: 20, color: "text.subtitle" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            {submitError && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {submitError}
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          gap: 1,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "background.border",
        }}
      >
        {success ? (
          <Button
            onClick={onClose}
            variant="contained"
            disableElevation
            sx={{ fontWeight: 700, borderRadius: "8px", px: 4 }}
          >
            بستن
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              variant="text"
              color="inherit"
              disabled={submitting}
              sx={{ fontWeight: 600, borderRadius: "8px", color: "text.muted" }}
            >
              انصراف
            </Button>

            <Button
              onClick={handleSubmit}
              variant="contained"
              disableElevation
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <EventAvailableRoundedIcon sx={{ fontSize: 20 }} />
                )
              }
              sx={{
                flex: { xs: 1, sm: "0 0 auto" },
                px: 3,
                py: 1,
                fontWeight: 700,
                borderRadius: "8px",
              }}
            >
              {submitting ? "در حال ثبت..." : "ثبت درخواست بازدید"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
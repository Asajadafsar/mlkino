"use client";

import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SvgIconComponent } from "@mui/icons-material";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import BusinessIcon from "@mui/icons-material/Business";
import ApartmentIcon from "@mui/icons-material/Apartment";
import VillaIcon from "@mui/icons-material/Villa";
import HistoryIcon from "@mui/icons-material/History";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

/* ========================= انواع و داده‌ها ========================= */

export type LocationValue = {
  allIran: boolean;
  cities: string[]; // id شهرها
  provinces: string[]; // id استان‌ها
};

type Place = { id: string; name: string; Icon?: SvgIconComponent };

const EMPTY_VALUE: LocationValue = { allIran: false, cities: [], provinces: [] };

const POPULAR_CITIES: Place[] = [
  { id: "tehran", name: "تهران", Icon: BusinessIcon },
  { id: "karaj", name: "کرج", Icon: ApartmentIcon },
  { id: "mashhad", name: "مشهد", Icon: BusinessIcon },
  { id: "shiraz", name: "شیراز", Icon: BusinessIcon },
  { id: "isfahan", name: "اصفهان", Icon: BusinessIcon },
  { id: "tabriz", name: "تبریز", Icon: BusinessIcon },
  { id: "kish", name: "کیش", Icon: VillaIcon },
  { id: "qeshm", name: "قشم", Icon: VillaIcon },
];

const PROVINCES: Place[] = [
  { id: "qom", name: "قم (مرکز استان)" },
  { id: "lorestan", name: "لرستان و شهرستان‌ها" },
  { id: "damavand", name: "دماوند و رودهن" },
  { id: "mazandaran", name: "مازندران (نوشهر و چالوس)" },
  { id: "ahvaz", name: "اهواز (خوزستان)" },
  { id: "kermanshah", name: "کرمانشاه" },
  { id: "gilan", name: "گیلان (رشت)" },
  { id: "hamedan", name: "همدان" },
  { id: "yazd", name: "یزد" },
  { id: "kerman", name: "کرمان" },
  { id: "urmia", name: "آذربایجان غربی (ارومیه)" },
  { id: "bandar", name: "هرمزگان (بندرعباس)" },
];

const COLLAPSED_COUNT = 6;
const INITIAL_RECENT = ["تهران", "کرج", "قم", "لواسان"]; 

/* ========================= ابزارها ========================= */

const fa = (n: number) => n.toLocaleString("fa-IR");

// یکسان‌سازی ی/ک عربی و فارسی برای جستجو
const normalize = (s: string) =>
  s
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]+/g, " ")
    .trim()
    .toLowerCase();

const flip = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

/* ========================= اجزای کوچک ========================= */

// کارت انتخابی قابل‌دسترس (کیبورد + aria) بدون Checkbox تو در تو
function Option({
  selected,
  onClick,
  children,
  py = 1.25,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  py?: number;
}) {
  return (
    <ButtonBase
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      sx={(t) => ({
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        textAlign: "start",
        px: 1.5,
        py,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? alpha(t.palette.primary.main, 0.07) : "background.paper",
        transition: "border-color .2s ease, background-color .2s ease",
        "&:hover": { borderColor: "primary.main" },
        "&.Mui-focusVisible": {
          outline: `2px solid ${t.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {children}
      </Box>
      {selected ? (
        <CheckBoxIcon color="primary" fontSize="small" />
      ) : (
        <CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: "text.disabled" }} />
      )}
    </ButtonBase>
  );
}

function SectionTitle({
  icon,
  title,
  end,
}: {
  icon: ReactNode;
  title: string;
  end?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25 }}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
        <Box sx={{ display: "flex", color: "primary.main" }}>{icon}</Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      {end}
    </Stack>
  );
}

const linkButtonSx = { minWidth: 0, p: 0, fontSize: "0.75rem", fontWeight: 600 } as const;

/* ========================= بدنه مودال ========================= */
// state داخل بدنه است؛ با بسته‌شدن Dialog بدنه unmount می‌شود
// و دفعه بعد دوباره از value شروع می‌کند (بستن بدون تایید = لغو تغییرات)

function PickerBody({
  value,
  onClose,
  onApply,
}: {
  value?: LocationValue;
  onClose: () => void;
  onApply?: (v: LocationValue) => void;
}) {
  const [draft, setDraft] = useState<LocationValue>(value ?? EMPTY_VALUE);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [recent, setRecent] = useState(INITIAL_RECENT);

  const q = normalize(search);
  const matches = (p: Place) => !q || normalize(p.name).includes(q);

  const cities = POPULAR_CITIES.filter(matches);
  const provinceMatches = PROVINCES.filter(matches);
  const provinces =
    q || expanded ? provinceMatches : provinceMatches.slice(0, COLLAPSED_COUNT);
  const canExpand = !q && PROVINCES.length > COLLAPSED_COUNT;
  const nothingFound = !!q && cities.length === 0 && provinceMatches.length === 0;

  // انتخاب شهر/استان، «سراسر ایران» را خاموش می‌کند و برعکس
  const toggle = (key: "cities" | "provinces", id: string) =>
    setDraft((d) => ({ ...d, allIran: false, [key]: flip(d[key], id) }));

  const toggleAllIran = () =>
    setDraft((d) => (d.allIran ? { ...d, allIran: false } : { allIran: true, cities: [], provinces: [] }));

  const count = draft.allIran ? 1 : draft.cities.length + draft.provinces.length;
  const selectedNames = draft.allIran
    ? []
    : [...POPULAR_CITIES, ...PROVINCES]
        .filter((p) => draft.cities.includes(p.id) || draft.provinces.includes(p.id))
        .map((p) => p.name.replace(/\s*\(.*\)/, ""));

  const apply = () => {
    onApply?.(draft);
    onClose();
  };

  return (
    <>
      {/* ===== هدر ===== */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2 }}>
        <Box
          sx={(t) => ({
            display: "flex",
            p: 1,
            borderRadius: 2.5,
            color: "primary.main",
            bgcolor: alpha(t.palette.primary.main, 0.1),
          })}
        >
          <LocationOnIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="location-picker-title" variant="subtitle1" sx={{ fontWeight: 700 }}>
            انتخاب موقعیت مکانی و شهرها
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            نمایش فایل‌های ملکی متناسب با شهرهای منتخب شما
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="بستن" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Stack spacing={3}>
          {/* ===== جستجو ===== */}
          <OutlinedInput
            fullWidth
            size="small"
            placeholder="جستجوی نام شهر، منطقه یا استان (مثال: تهران، اصفهان، لواسان)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ "aria-label": "جستجوی شهر یا استان" }}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
            endAdornment={
              search && (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="پاک کردن جستجو" onClick={() => setSearch("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }
            sx={{ borderRadius: 3, bgcolor: "grey.50" }}
          />

          {/* ===== سراسر ایران ===== */}
          {!q && (
            <Option selected={draft.allIran} onClick={toggleAllIran} py={1.5}>
              <Box
                sx={{
                  display: "flex",
                  p: 0.875,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                <PublicIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  سراسر ایران (نمایش تمام کشور)
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  مشاهده تمامی آگهی‌ها و فرصت‌های ملکی بدون محدودیت مکانی
                </Typography>
              </Box>
            </Option>
          )}

          {/* ===== جستجوهای اخیر ===== */}
          {!q && recent.length > 0 && (
            <Box>
              <SectionTitle
                icon={<HistoryIcon fontSize="small" />}
                title="جستجوهای اخیر شما"
                end={
                  <Button size="small" onClick={() => setRecent([])} sx={linkButtonSx}>
                    پاک کردن تاریخچه
                  </Button>
                }
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {recent.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    size="small"
                    variant="outlined"
                    onClick={() => setSearch(item)}
                    onDelete={() => setRecent((r) => r.filter((x) => x !== item))}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* ===== شهرهای محبوب ===== */}
          {cities.length > 0 && (
            <Box>
              <SectionTitle
                icon={<LocalFireDepartmentIcon fontSize="small" />}
                title="شهرهای محبوب و پرتقاضا"
                end={
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    انتخاب همزمان چند شهر امکان‌پذیر است
                  </Typography>
                }
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                  gap: 1.25,
                }}
              >
                {cities.map(({ id, name, Icon }) => (
                  <Option key={id} selected={draft.cities.includes(id)} onClick={() => toggle("cities", id)}>
                    {Icon && <Icon fontSize="small" sx={{ color: "text.secondary" }} />}
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {name}
                    </Typography>
                  </Option>
                ))}
              </Box>
            </Box>
          )}

          {/* ===== سایر استان‌ها ===== */}
          {provinceMatches.length > 0 && (
            <Box>
              <SectionTitle
                icon={<MapOutlinedIcon fontSize="small" />}
                title="سایر استان‌ها و شهرها"
                end={
                  canExpand && (
                    <Button size="small" onClick={() => setExpanded((v) => !v)} sx={linkButtonSx}>
                      {expanded ? "نمایش کمتر" : "مشاهده همه استان‌ها"}
                    </Button>
                  )
                }
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 1.25,
                }}
              >
                {provinces.map(({ id, name }) => (
                  <Option
                    key={id}
                    py={1}
                    selected={draft.provinces.includes(id)}
                    onClick={() => toggle("provinces", id)}
                  >
                    <Typography variant="body2" noWrap>
                      {name}
                    </Typography>
                  </Option>
                ))}
              </Box>
            </Box>
          )}

          {/* ===== نتیجه‌ای پیدا نشد ===== */}
          {nothingFound && (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                نتیجه‌ای برای «{search}» پیدا نشد
              </Typography>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                نام شهر یا استان را کوتاه‌تر یا با املای دیگری بنویسید
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      {/* ===== فوتر ===== */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
          py: 2,
          pb: { xs: "max(env(safe-area-inset-bottom), 16px)", sm: 2 },
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flex: "1 1 180px", minWidth: 0 }}>
          <CheckCircleIcon sx={{ fontSize: 18, color: count ? "success.main" : "text.disabled" }} />
          <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
            {draft.allIran ? (
              "سراسر ایران انتخاب شده است"
            ) : count === 0 ? (
              "هنوز موردی انتخاب نشده است"
            ) : (
              <>
                {fa(count)} مورد انتخاب شده{" "}
                <Box component="span" sx={{ color: "text.disabled" }}>
                  ({selectedNames.join("، ")})
                </Box>
              </>
            )}
          </Typography>
        </Stack>

        <Button
          color="inherit"
          disabled={count === 0}
          onClick={() => setDraft(EMPTY_VALUE)}
          sx={{ borderRadius: 2.5, px: 2, py: 1, color: "text.secondary", border: "1px solid", borderColor: "divider" }}
        >
          پاک کردن همه
        </Button>

        <Button
          variant="contained"
          disableElevation
          onClick={apply}
          sx={{
            gap: 1,
            borderRadius: 2.5,
            px: 3.5,
            py: 1,
            fontWeight: 700,
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
          }}
        >
          <CheckRoundedIcon fontSize="small" />
          تایید و اعمال انتخاب
        </Button>
      </Box>
    </>
  );
}

/* ========================= کامپوننت اصلی ========================= */

export default function LocationPickerModal({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value?: LocationValue; // انتخاب فعلی (از والد)
  onApply?: (value: LocationValue) => void; // بعد از «تایید و اعمال»
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog 
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="location-picker-title"
      sx={{
        "& .MuiDialog-paper": { borderRadius: fullScreen ? 0 : 4, backgroundImage: "none" },
      }}
    >
      <PickerBody value={value} onClose={onClose} onApply={onApply} />
    </Dialog>
  );
}
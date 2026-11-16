"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
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
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import KeyboardArrowLeftRounded from "@mui/icons-material/KeyboardArrowLeftRounded";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { CITIES_BY_PROVINCE, PROVINCES } from "@/app/data/iran/geography";

export type LocationValue = {
  allIran: boolean;
  cities: string[];
  provinces: string[];
};

const EMPTY_VALUE: LocationValue = { allIran: false, cities: [], provinces: [] };
const fa = (value: number) => value.toLocaleString("fa-IR");
const normalize = (value: string) => value.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim().toLowerCase();
const flip = (list: string[], id: string) => list.includes(id) ? list.filter((value) => value !== id) : [...list, id];

function SelectableOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <ButtonBase
    role="checkbox"
    aria-checked={selected}
    onClick={onClick}
    sx={(theme) => ({
      width: "100%", minHeight: 46, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
      textAlign: "start", px: 1.5, py: 1, borderRadius: 2.5, border: "1px solid",
      borderColor: selected ? "primary.main" : "divider",
      bgcolor: selected ? alpha(theme.palette.primary.main, 0.07) : "background.paper",
      "&:hover": { borderColor: "primary.main" },
      "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
    })}
  >
    <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 1 }}>{children}</Box>
    {selected ? <CheckBoxIcon color="primary" fontSize="small" /> : <CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: "text.disabled" }} />}
  </ButtonBase>;
}

export default function LocationPickerModal({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value?: LocationValue;
  onApply?: (value: LocationValue) => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [draft, setDraft] = useState<LocationValue>(value ?? EMPTY_VALUE);
  const [search, setSearch] = useState("");
  const [activeProvinceId, setActiveProvinceId] = useState<number | null>(null);
  const query = normalize(search);
  const provinceMatches = useMemo(() => PROVINCES.filter((province) => !query || normalize(province.name).includes(query)), [query]);
  const provinceCities = activeProvinceId === null ? [] : CITIES_BY_PROVINCE.get(activeProvinceId) ?? [];
  const visibleCities = provinceCities.filter((city) => !query || normalize(city.name).includes(query));
  const activeProvince = PROVINCES.find((province) => province.id === activeProvinceId);
  const count = draft.allIran ? 1 : draft.cities.length + draft.provinces.length;

  const toggle = (key: "cities" | "provinces", id: string) => setDraft((current) => ({
    ...current,
    allIran: false,
    [key]: flip(current[key], id),
  }));
  const toggleAllIran = () => setDraft((current) => current.allIran
    ? { ...current, allIran: false }
    : { allIran: true, cities: [], provinces: [] });
  const selectedNames = [
    ...PROVINCES.filter((province) => draft.provinces.includes(String(province.id))).map((province) => province.name),
    ...[...CITIES_BY_PROVINCE.values()].flat().filter((city) => draft.cities.includes(String(city.id))).map((city) => city.name),
  ];
  const apply = () => {
    onApply?.(draft);
    onClose();
  };

  return <Dialog
    open={open}
    onClose={onClose}
    fullScreen={fullScreen}
    fullWidth
    maxWidth="sm"
    aria-labelledby="location-picker-title"
    slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 4, maxHeight: fullScreen ? "100%" : "min(88vh, 820px)" } } }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2 }}>
      <Box sx={(t) => ({ display: "flex", p: 1, borderRadius: 2.5, color: "primary.main", bgcolor: alpha(t.palette.primary.main, 0.1) })}><LocationOnIcon /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography id="location-picker-title" variant="subtitle1" sx={{ fontWeight: 700 }}>انتخاب استان و شهر</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>ابتدا استان را انتخاب کنید، سپس شهرهای همان استان را ببینید.</Typography>
      </Box>
      <IconButton onClick={onClose} aria-label="بستن" size="small"><CloseIcon fontSize="small" /></IconButton>
    </Box>

    <Divider />

    <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
      <Stack spacing={2.5}>
        <OutlinedInput
          fullWidth
          size="small"
          placeholder={activeProvince ? `جستجو در شهرهای ${activeProvince.name}` : "جستجوی استان"}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          inputProps={{ "aria-label": activeProvince ? `جستجوی شهرهای ${activeProvince.name}` : "جستجوی استان" }}
          startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>}
          endAdornment={search ? <InputAdornment position="end"><IconButton size="small" aria-label="پاک کردن جستجو" onClick={() => setSearch("")}><CloseIcon fontSize="small" /></IconButton></InputAdornment> : null}
          sx={{ borderRadius: 3, bgcolor: "grey.50" }}
        />

        <SelectableOption selected={draft.allIran} onClick={toggleAllIran}>
          <Box sx={{ display: "flex", p: 0.875, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText" }}><PublicIcon fontSize="small" /></Box>
          <Box><Typography variant="body2" sx={{ fontWeight: 700 }}>سراسر ایران</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>نمایش آگهی‌ها بدون محدودیت مکانی</Typography></Box>
        </SelectableOption>

        {!activeProvince && <Box>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, mb: 1.25 }}>
            <MapOutlinedIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>همهٔ استان‌ها ({fa(PROVINCES.length)})</Typography>
          </Stack>
          {provinceMatches.length ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1 }}>
            {provinceMatches.map((province) => {
              const expanded = activeProvinceId === province.id;
              return <ButtonBase key={province.id} onClick={() => { setActiveProvinceId(expanded ? null : province.id); setSearch(""); }} aria-expanded={expanded} sx={{ minWidth: 0, minHeight: 46, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 1.5, py: 1, border: "1px solid", borderColor: expanded ? "primary.main" : "divider", borderRadius: 2.5, textAlign: "start", bgcolor: expanded ? "action.selected" : "background.paper", "&:hover": { borderColor: "primary.main" } }}>
                <Typography variant="body2" noWrap>{province.name}</Typography>
                <KeyboardArrowLeftRounded sx={{ color: "primary.main", transform: expanded ? "rotate(-90deg)" : "none" }} />
              </ButtonBase>;
            })}
          </Box> : <Typography variant="body2" sx={{ py: 2, color: "text.secondary", textAlign: "center" }}>استانی با این نام پیدا نشد.</Typography>}
        </Box>}

        {activeProvince && <Box>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>شهرهای {activeProvince.name} ({fa(visibleCities.length)})</Typography>
            <Button size="small" startIcon={<KeyboardArrowLeftRounded />} onClick={() => { setActiveProvinceId(null); setSearch(""); }}>استان‌ها</Button>
          </Stack>
          <SelectableOption selected={draft.provinces.includes(String(activeProvince.id))} onClick={() => toggle("provinces", String(activeProvince.id))}>
            <Typography variant="body2" sx={{ fontWeight: 650 }}>همهٔ شهرهای استان {activeProvince.name}</Typography>
          </SelectableOption>
          {visibleCities.length ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1, mt: 1 }}>
            {visibleCities.map((city) => <SelectableOption key={city.id} selected={draft.cities.includes(String(city.id))} onClick={() => toggle("cities", String(city.id))}>
              <Typography variant="body2" noWrap>{city.name}</Typography>
            </SelectableOption>)}
          </Box> : <Typography variant="body2" sx={{ py: 2, color: "text.secondary", textAlign: "center" }}>شهری با این نام پیدا نشد.</Typography>}
        </Box>}
      </Stack>
    </DialogContent>

    <Divider />
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 }, py: 2, pb: { xs: "max(env(safe-area-inset-bottom), 16px)", sm: 2 } }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flex: "1 1 180px", minWidth: 0 }}>
        <CheckCircleIcon sx={{ fontSize: 18, color: count ? "success.main" : "text.disabled" }} />
        <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
          {draft.allIran ? "سراسر ایران انتخاب شده است" : count === 0 ? "هنوز موردی انتخاب نشده است" : <>{fa(count)} مورد انتخاب شده <Box component="span" sx={{ color: "text.disabled" }}>({selectedNames.slice(0, 4).join("، ")}{selectedNames.length > 4 ? "، …" : ""})</Box></>}
        </Typography>
      </Stack>
      <Button color="inherit" disabled={count === 0} onClick={() => setDraft(EMPTY_VALUE)} sx={{ borderRadius: 2.5, px: 2, py: 1, color: "text.secondary", border: "1px solid", borderColor: "divider" }}>پاک کردن همه</Button>
      <Button variant="contained" disableElevation onClick={apply} sx={{ gap: 1, borderRadius: 2.5, px: 3.5, py: 1, fontWeight: 700, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}><CheckRoundedIcon fontSize="small" />تایید و اعمال انتخاب</Button>
    </Box>
  </Dialog>;
}

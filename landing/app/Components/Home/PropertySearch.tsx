"use client";

import { useId, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ButtonBase, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import LandscapeOutlined from "@mui/icons-material/LandscapeOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import OpenInFullRounded from "@mui/icons-material/OpenInFullRounded";
import BedOutlined from "@mui/icons-material/BedOutlined";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import { CATEGORIES, LAND_SUBTYPES } from "./categories";
import { CITIES_BY_PROVINCE, PROVINCES } from "@/app/data/iran/geography";
import AdvancedFilterPanel, { EMPTY_FILTERS, type FilterState } from "../Filter/AdvancedFilterPanel";
import styles from "./search.module.css";

export const DEALS = [
  { value: "buy", label: "خرید", Icon: HomeOutlined },
  { value: "rent", label: "رهن و اجاره", Icon: KeyOutlined },
  { value: "presale", label: "پیش‌فروش", Icon: LayersOutlined },
  { value: "partnership", label: "مشارکت", Icon: GroupsOutlined },
];
type Option = { value: string; label: string };
function SearchSelect({ label, value, onChange, options, Icon, compact, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; options: Option[]; Icon: ElementType; compact: boolean; disabled?: boolean;
}) {
  const id = useId();
  return <FormControl className={styles.field} fullWidth size="small">
    <InputLabel id={`${id}-label`} shrink>{label}</InputLabel>
    <Select<string>
      labelId={`${id}-label`}
      id={id}
      label={label}
      disabled={disabled}
      value={value}
      onChange={event => onChange(event.target.value)}
      displayEmpty
      IconComponent={KeyboardArrowDownRounded}
      inputProps={{ "aria-label": label }}
      startAdornment={compact ? undefined : <InputAdornment position="start"><Icon fontSize="small" /></InputAdornment>}
      MenuProps={{ slotProps: { paper: { dir: "rtl", sx: { maxHeight: 320, borderRadius: 3, mt: .5, "& .MuiMenuItem-root": { minHeight: 44, fontSize: 14 } } } } }}
    >
      {options.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
    </Select>
  </FormControl>;
}

export function DealTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className={styles.deals} role="group" aria-label="نوع معامله">{DEALS.map(({ value: key, label, Icon }) => <ButtonBase key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}><Icon /><span>{label}</span></ButtonBase>)}</div>;
}

export default function PropertySearch({ compact = false, initialDeal = "buy", dealValue, onDealChange, hideDeals = false }: {
  compact?: boolean; initialDeal?: string; dealValue?: string; onDealChange?: (value: string) => void; hideDeals?: boolean;
}) {
  const router = useRouter();
  const [localDeal, setLocalDeal] = useState(DEALS.some(item => item.value === initialDeal) ? initialDeal : "buy");
  const deal = dealValue ?? localDeal;
  const setDeal = (value: string) => { setLocalDeal(value); onDealChange?.(value); };
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [property, setProperty] = useState("");
  const [landSubtype, setLandSubtype] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [areaFrom, setAreaFrom] = useState("");
  const [areaTo, setAreaTo] = useState("");
  const [rooms, setRooms] = useState("all");
  const [advanced, setAdvanced] = useState<FilterState | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState("");
  const invalidArea = Boolean(areaFrom && areaTo && Number(areaFrom) > Number(areaTo));
  const invalidPrice = Boolean(priceFrom && priceTo && Number(priceFrom) > Number(priceTo));

  function reset() {
    setDeal("buy"); setCity(""); setProvince(""); setProperty(""); setLandSubtype("");
    setPriceFrom(""); setPriceTo(""); setAreaFrom(""); setAreaTo(""); setRooms("all");
    setAdvanced(null); setError(""); setResetKey(key => key + 1);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalidPrice || invalidArea) { setError("مقدار «از» باید کمتر از مقدار «تا» باشد."); return; }
    const params = new URLSearchParams({ deal, city });
    if (province) params.set("province", province);
    Object.entries({ propertyType: property, landSubtype, priceFrom, priceTo, areaFrom, areaTo, rooms: rooms === "all" ? "" : rooms }).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (advanced) params.set("advanced", JSON.stringify(advanced));
    router.push(`/files?${params}`);
  }

  return <section className={compact ? styles.compact : styles.page} aria-label="جستجوی ملک">
    {!compact && <header className={styles.heading}><div><h1><TuneRounded /> جستجوی پیشرفته ملک</h1><p>با فیلترهای دقیق، ملک دلخواه خود را سریع‌تر پیدا کنید.</p></div><Link href="/" aria-label="بستن جستجو"><CloseRounded /></Link></header>}
    <form onSubmit={submit}>
      {!hideDeals && <DealTabs value={deal} onChange={setDeal} />}
      <div className={`${styles.fields} ${property === "زمین" ? styles.withLand : ""}`}>
        <SearchSelect label="نوع ملک" value={property} onChange={value => {setProperty(value);if(value !== "زمین")setLandSubtype("");}} options={[{value:"",label:"همه املاک"},...CATEGORIES.map(item => ({value:item.label,label:item.label}))]} Icon={ApartmentOutlined} compact={compact} />
        {property === "زمین" && <SearchSelect label="کاربری زمین" value={landSubtype} onChange={setLandSubtype} options={[{value:"",label:"همه کاربری‌ها"},...LAND_SUBTYPES.map(value => ({value,label:value}))]} Icon={LandscapeOutlined} compact={compact} />}
        <SearchSelect label="استان" value={province} onChange={value => {setProvince(value);setCity("");}} options={[{value:"",label:"همه استان‌ها"},...PROVINCES.map(({name}) => ({value:name,label:name}))]} Icon={LocationOnOutlined} compact={compact} />
        <SearchSelect label="شهر" value={city} onChange={setCity} options={[{value:"",label:province ? "همه شهرها" : "ابتدا استان را انتخاب کنید"},...(PROVINCES.find(item => item.name === province) ? CITIES_BY_PROVINCE.get(PROVINCES.find(item => item.name === province)!.id) ?? [] : []).map(({name}) => ({value:name,label:name}))]} Icon={LocationOnOutlined} compact={compact} disabled={!province} />
        {compact ? <fieldset className={`${styles.range} ${styles.priceRange}`}><legend><PaymentsOutlined /> بازه قیمت (تومان)</legend>
          <TextField label="از" size="small" fullWidth type="number" value={priceFrom} onChange={event => setPriceFrom(event.target.value)} placeholder="حداقل" error={invalidPrice} slotProps={{inputLabel:{shrink:true},htmlInput:{"aria-label":"حداقل قیمت",inputMode:"numeric",min:0,max:priceTo || undefined,step:1}}} />
          <TextField label="تا" size="small" fullWidth type="number" value={priceTo} onChange={event => setPriceTo(event.target.value)} placeholder="حداکثر" error={invalidPrice} slotProps={{inputLabel:{shrink:true},htmlInput:{"aria-label":"حداکثر قیمت",inputMode:"numeric",min:priceFrom || 0,step:1}}} />
        </fieldset> : <>
          <fieldset className={styles.range}><legend><OpenInFullRounded /> متراژ (متر)</legend>
            <TextField label="از" size="small" fullWidth type="number" value={areaFrom} onChange={event => setAreaFrom(event.target.value)} placeholder="۸۰" error={invalidArea} slotProps={{inputLabel:{shrink:true},htmlInput:{"aria-label":"حداقل متراژ",inputMode:"numeric",min:0,max:areaTo || undefined}}} />
            <TextField label="تا" size="small" fullWidth type="number" value={areaTo} onChange={event => setAreaTo(event.target.value)} placeholder="۳۰۰" error={invalidArea} slotProps={{inputLabel:{shrink:true},htmlInput:{"aria-label":"حداکثر متراژ",inputMode:"numeric",min:areaFrom || 0}}} />
          </fieldset>
          <fieldset className={`${styles.range} ${styles.priceRange}`}><legend><PaymentsOutlined /> محدوده قیمت (تومان)</legend>
            <TextField label="از" size="small" fullWidth type="number" value={priceFrom} onChange={event => setPriceFrom(event.target.value)} placeholder="بدون حداقل" error={invalidPrice} slotProps={{inputLabel:{shrink:true},htmlInput:{"aria-label":"حداقل قیمت",inputMode:"numeric",min:0,max:priceTo || undefined,step:1}}} />
            <TextField label="تا" size="small" fullWidth type="number" value={priceTo} onChange={event => setPriceTo(event.target.value)} placeholder="بدون حداکثر" error={invalidPrice} slotProps={{inputLabel:{shrink:true},htmlInput:{"aria-label":"حداکثر قیمت",inputMode:"numeric",min:priceFrom || 0,step:1}}} />
          </fieldset>
        </>}
      </div>
      {!compact && <>
        <fieldset className={styles.rooms}><legend><BedOutlined /> تعداد خواب</legend><ToggleButtonGroup className={styles.roomChoices} value={rooms} exclusive aria-label="تعداد خواب" onChange={(_,value:string|null) => {if(value !== null)setRooms(value);}}>{[{key:"all",label:"همه"},{key:"1",label:"۱+"},{key:"2",label:"۲+"},{key:"3",label:"۳+"},{key:"4",label:"۴+"}].map(room => <ToggleButton key={room.key} value={room.key}>{room.label}</ToggleButton>)}</ToggleButtonGroup></fieldset>
        <details className={styles.more}><summary><TuneRounded /><span>سایر فیلترها<small>امکانات، وضعیت بنا و …</small></span></summary><AdvancedFilterPanel key={resetKey} initialFilters={EMPTY_FILTERS} embedded onApply={setAdvanced} /></details>
      </>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <Button className={styles.searchButton} type="submit" variant="contained" disableElevation startIcon={<SearchRounded />} aria-label="جستجوی ملک">{compact ? "جستجو" : "جستجوی ملک"}</Button>
      {!compact && <Button className={styles.reset} type="button" onClick={reset} startIcon={<RestartAltRounded />}>پاک کردن همه فیلترها</Button>}
    </form>
  </section>;
}

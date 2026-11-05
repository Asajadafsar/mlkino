"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import OpenInFullRounded from "@mui/icons-material/OpenInFullRounded";
import BedOutlined from "@mui/icons-material/BedOutlined";
import { CATEGORIES } from "./categories";
import AdvancedFilterPanel, { EMPTY_FILTERS, type FilterState } from "../Filter/AdvancedFilterPanel";
import styles from "./search.module.css";

export const DEALS = [
  { value: "buy", label: "خرید", Icon: HomeOutlined },
  { value: "rent", label: "رهن و اجاره", Icon: KeyOutlined },
  { value: "presale", label: "پیش‌فروش", Icon: LayersOutlined },
  { value: "partnership", label: "مشارکت", Icon: GroupsOutlined },
];

export function DealTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className={styles.deals} role="group" aria-label="نوع معامله">{DEALS.map(({ value: key, label, Icon }) => <button type="button" key={key} aria-pressed={value === key} onClick={() => onChange(key)}><Icon /><span>{label}</span></button>)}</div>;
}

export default function PropertySearch({ compact = false, initialDeal = "buy", dealValue, onDealChange }: { compact?: boolean; initialDeal?: string; dealValue?: string; onDealChange?: (value: string) => void }) {
  const router = useRouter();
  const [localDeal, setLocalDeal] = useState(DEALS.some(item => item.value === initialDeal) ? initialDeal : "buy");
  const deal = dealValue ?? localDeal;
  const setDeal = (value: string) => { setLocalDeal(value); onDealChange?.(value); };
  const [city, setCity] = useState("تهران");
  const [property, setProperty] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [areaFrom, setAreaFrom] = useState("");
  const [areaTo, setAreaTo] = useState("");
  const [rooms, setRooms] = useState("all");
  const [advanced, setAdvanced] = useState<FilterState | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState("");

  function reset() {
    setDeal("buy"); setCity("تهران"); setProperty(""); setPriceFrom(""); setPriceTo(""); setAreaFrom(""); setAreaTo(""); setRooms("all"); setAdvanced(null); setError(""); setResetKey(key => key + 1);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((priceFrom && priceTo && Number(priceFrom) > Number(priceTo)) || (areaFrom && areaTo && Number(areaFrom) > Number(areaTo))) {
      setError("مقدار «از» باید کمتر از مقدار «تا» باشد."); return;
    }
    const params = new URLSearchParams({ deal, city });
    Object.entries({ propertyType: property, priceFrom, priceTo, areaFrom, areaTo, rooms: rooms === "all" ? "" : rooms }).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (advanced) params.set("advanced", JSON.stringify(advanced));
    router.push(`/files?${params}`);
  }

  return <section className={compact ? styles.compact : styles.page} aria-label="جستجوی ملک">
    {!compact && <header className={styles.heading}><div><h1><TuneRounded /> جستجوی پیشرفته ملک</h1><p>با فیلترهای دقیق، ملک دلخواه خود را سریع‌تر پیدا کنید.</p></div><Link href="/" aria-label="بستن جستجو"><CloseRounded /></Link></header>}
    <form onSubmit={submit}>
      <DealTabs value={deal} onChange={setDeal} />
      <div className={styles.fields}>
        <label className={styles.field}><ApartmentOutlined /><span>نوع ملک</span><select aria-label="نوع ملک" value={property} onChange={e => setProperty(e.target.value)}><option value="">همه املاک</option>{CATEGORIES.map(c => <option key={c.label}>{c.label}</option>)}</select></label>
        <label className={styles.field}><LocationOnOutlined /><span>استان و شهر</span><select aria-label="استان و شهر" value={city} onChange={e => setCity(e.target.value)}>{["تهران", "کرج", "مشهد", "شیراز", "اصفهان", "تبریز", "سراسر ایران"].map(item => <option key={item}>{item}</option>)}</select></label>
        {compact ? <>
          <label className={styles.field}><OpenInFullRounded /><span>متراژ</span><select aria-label="بازه متراژ" value={`${areaFrom}:${areaTo}`} onChange={e => { const [from,to] = e.target.value.split(":"); setAreaFrom(from); setAreaTo(to); }}><option value=":">همه متراژها</option><option value="0:100">تا ۱۰۰ متر</option><option value="100:200">۱۰۰ تا ۲۰۰ متر</option><option value="200:300">۲۰۰ تا ۳۰۰ متر</option><option value="300:">بیش از ۳۰۰ متر</option></select></label>
          <label className={styles.field}><PaymentsOutlined /><span>بازه قیمت</span><select aria-label="بازه قیمت" value={`${priceFrom}:${priceTo}`} onChange={e => { const [from,to] = e.target.value.split(":"); setPriceFrom(from); setPriceTo(to); }}><option value=":">همه قیمت‌ها</option><option value="0:5000000000">تا ۵ میلیارد</option><option value="5000000000:10000000000">۵ تا ۱۰ میلیارد</option><option value="10000000000:20000000000">۱۰ تا ۲۰ میلیارد</option><option value="20000000000:">بیش از ۲۰ میلیارد</option></select></label>
        </> : <>
        <fieldset className={styles.range}><legend><OpenInFullRounded /> متراژ (متر)</legend><label>از<input aria-label="حداقل متراژ" type="number" min="0" max={areaTo || undefined} inputMode="numeric" placeholder="۸۰" value={areaFrom} onChange={e => setAreaFrom(e.target.value)} /></label><label>تا<input aria-label="حداکثر متراژ" type="number" min={areaFrom || 0} inputMode="numeric" placeholder="۳۰۰" value={areaTo} onChange={e => setAreaTo(e.target.value)} /></label></fieldset>
        <fieldset className={styles.range}><legend><PaymentsOutlined /> محدوده قیمت (تومان)</legend><label>از<input aria-label="حداقل قیمت" type="number" min="0" max={priceTo || undefined} step="any" inputMode="numeric" placeholder="بدون حداقل" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} /></label><label>تا<input aria-label="حداکثر قیمت" type="number" min={priceFrom || 0} step="any" inputMode="numeric" placeholder="بدون حداکثر" value={priceTo} onChange={e => setPriceTo(e.target.value)} /></label></fieldset>
        </>}

      </div>
      {!compact && <>
        <fieldset className={styles.rooms}><legend><BedOutlined /> تعداد خواب</legend><div>{[{ key: "all", label: "همه" }, { key: "1", label: "۱+" }, { key: "2", label: "۲+" }, { key: "3", label: "۳+" }, { key: "4", label: "۴+" }].map(room => <button key={room.key} type="button" aria-pressed={rooms === room.key} onClick={() => setRooms(room.key)}>{room.label}</button>)}</div></fieldset>
        <details className={styles.more}><summary><TuneRounded /><span>سایر فیلترها<small>امکانات، وضعیت بنا و …</small></span></summary><AdvancedFilterPanel key={resetKey} initialFilters={EMPTY_FILTERS} embedded onApply={setAdvanced} /></details>
      </>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button className={styles.searchButton} type="submit" aria-label="جستجوی ملک"><SearchRounded />{!compact && "جستجوی ملک"}</button>
      {!compact && <button className={styles.reset} type="button" onClick={reset}><RestartAltRounded /> پاک کردن همه فیلترها</button>}
    </form>
  </section>;
}

import type { Metadata } from "next";
import PublicCatalog from "../Components/Catalog/PublicCatalog";
import HomeRounded from '@mui/icons-material/HomeRounded';
import styles from './search.module.css';

export const metadata: Metadata = { title: "جستجوی پیشرفته ملک | ملکینو" };
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query=new URLSearchParams();for(const [key,value] of Object.entries(params))if(typeof value==='string')query.set(key,value);
  return <main className={styles.page}><header className={styles.hero}><div className={styles.icon}><HomeRounded/></div><div><h1>جستجوی پیشرفته ملک</h1><p>با فیلترهای دقیق، ملک دلخواه خود را سریع‌تر پیدا کنید.</p></div></header><section className={styles.searchBox}><div className={styles.tabs}><span className={styles.active}>فایل‌های ویژه</span><span>فایل‌های ملکی</span><span>درخواست‌های ملکی</span></div><PublicCatalog query={query.toString()} showFilters showMap/></section></main>;
}

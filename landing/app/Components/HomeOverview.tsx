import Link from 'next/link';
import HomeExperience from './Home/HomeExperience';
import {CATEGORIES} from './Home/categories';
export function HomeOverview(){return <HomeExperience/>}
export function HomeCategories(){return <nav aria-label="دسته‌بندی املاک" style={{display:'flex',gap:12,flexWrap:'wrap'}}>{CATEGORIES.slice(0,8).map(({label,Icon})=><Link key={label} href={'/files?propertyType='+encodeURIComponent(label)}><Icon/>{label}</Link>)}</nav>}

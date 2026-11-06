import Link from 'next/link';
import {PANEL_ORIGIN} from '../../Core/panel';
export default function SavedItems(){return <section><h2>علاقه‌مندی‌های من</h2><p>فهرست علاقه‌مندی‌ها در حساب شما ذخیره و از پنل مدیریت می‌شود.</p><Link href={PANEL_ORIGIN+'/favorites'}>مشاهده علاقه‌مندی‌ها</Link></section>}

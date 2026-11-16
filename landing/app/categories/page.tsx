import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import CottageRounded from "@mui/icons-material/CottageRounded";
import LandscapeRounded from "@mui/icons-material/LandscapeRounded";
import BusinessRounded from "@mui/icons-material/BusinessRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import SpaOutlined from "@mui/icons-material/SpaOutlined";
import PrecisionManufacturingOutlined from "@mui/icons-material/PrecisionManufacturingOutlined";
import ConstructionOutlined from "@mui/icons-material/ConstructionOutlined";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import styles from "./categories.module.css";

export const metadata: Metadata = {
  title: "دسته‌بندی‌های املاک | ملکینو",
  description: "دسته‌بندی‌های املاک ملکینو؛ آپارتمان، ویلا، زمین، اداری و تجاری.",
};

const categories = [
  { title: "ساختمان", subtitle: "فراتر از یک واحد", description: "ساختمان‌های مسکونی و چندواحدی برای نیازهای بزرگ‌تر.", Icon: BusinessRounded, color: "#254c89", tint: "#edf3ff", tag: "برای توسعه" },
  { title: "پیش‌فروش", subtitle: "خانه فردا را امروز انتخاب کنید", description: "پروژه‌های در حال ساخت و فرصت‌های پیش‌خرید ملک.", Icon: ConstructionOutlined, color: "#d58a15", tint: "#fff5df", tag: "برای آینده" },
  { title: "مستغلات", subtitle: "یک مجموعه، فرصت‌های بسیار", description: "املاک یکپارچه و مجموعه‌های مستقل مسکونی و تجاری.", Icon: AccountBalanceOutlined, color: "#486caa", tint: "#edf2fc", tag: "برای سرمایه‌گذاری" },
  { title: "کشاورزی", subtitle: "نزدیک‌تر به زمین و زندگی", description: "باغ، زمین کشاورزی و فضاهای مناسب کشت و پرورش.", Icon: SpaOutlined, color: "#36934c", tint: "#eaf8ed", tag: "برای رویش" },
  { title: "صنعتی", subtitle: "فضایی برای تولید", description: "کارگاه، کارخانه و فضاهای صنعتی برای گسترش کسب‌وکار.", Icon: PrecisionManufacturingOutlined, color: "#65658a", tint: "#f0f0f8", tag: "برای تولید" },
  { title: "آپارتمان", subtitle: "یک شروع تازه، یک خانه تازه", description: "فضایی برای زندگی روزمره؛ از خانه‌های جمع‌وجور تا آپارتمان‌های بزرگ و خانوادگی.", Icon: ApartmentRounded, color: "#1667ff", tint: "#eaf2ff", tag: "برای زندگی" },
  { title: "ویلا", subtitle: "نزدیک‌تر به آرامش", description: "خانه‌ای مستقل، حیاطی دلباز و فضایی برای لحظه‌هایی دور از شلوغی شهر.", Icon: CottageRounded, color: "#16866d", tint: "#e9f7f1", tag: "برای آرامش" },
  { title: "زمین", subtitle: "جایی برای ساختن فردا", description: "از یک قطعه زمین تا یک ایده بزرگ؛ نقطه شروعی برای ساختن آنچه در ذهن دارید.", Icon: LandscapeRounded, color: "#aa7224", tint: "#fff5e5", tag: "برای ساختن" },
  { title: "اداری", subtitle: "فضای رشد کار شما", description: "محیطی برای تمرکز، همکاری و قدم‌های بعدی کسب‌وکارتان.", Icon: BusinessRounded, color: "#8053cd", tint: "#f3edff", tag: "برای پیشرفت" },
  { title: "تجاری", subtitle: "ویترین ایده‌های شما", description: "از یک مغازه تا یک فضای تجاری بزرگ؛ جایی برای دیده‌شدن کسب‌وکار شما.", Icon: StorefrontRounded, color: "#d16445", tint: "#fff0ea", tag: "برای کسب‌وکار" },
];

export default function CategoriesPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
        <Link href="/"><ArrowForwardRounded aria-hidden="true" /> صفحه اصلی</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">دسته‌بندی‌ها</span>
      </nav>

      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}><span /> یک قدم نزدیک‌تر به ملک دلخواه</span>
          <h1>برای هر خواسته، <span>یک فضا</span></h1>
          <p>از خانه بعدی تا محل کار آینده؛ دسته‌بندی‌های ملکینو را کشف کنید.</p>
        </div>
        <div className={styles.headerMark} aria-hidden="true"><ApartmentRounded /><CottageRounded /><BusinessRounded /></div>
      </header>

      <section className={styles.grid} aria-label="همه دسته‌بندی‌های املاک">
        {categories.map(({ title, subtitle, description, Icon, color, tint, tag }, index) => (
          <Link
            href="/files"
            key={title}
            className={styles.card}
            style={{ "--accent": color, "--tint": tint, "--delay": `${index * 75}ms` } as CSSProperties}
            aria-label={`${title}؛ مشاهده فایل‌های ملکی`}
          >
            <div className={styles.art} aria-hidden="true">
              <span className={styles.orbit} />
              <span className={styles.orbitInner} />
              <span className={styles.spark} />
              <span className={styles.sparkSmall} />
              <Icon className={styles.building} />
              <span className={styles.ground} />
              <span className={styles.number}>{(index + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</span>
            </div>
            <div className={styles.content}>
              <span className={styles.tag}>{tag}</span>
              <h2>{title}</h2>
              <h3>{subtitle}</h3>
              <p>{description}</p>
              <span className={styles.action}>مشاهده فایل‌های ملکی <span><ArrowBackRounded aria-hidden="true" /></span></span>
            </div>
          </Link>
        ))}
      </section>

      <footer className={styles.footer}>
        <div><h2>هنوز در حال بررسی هستید؟</h2><p>همه فایل‌های ملکی را یک‌جا ببینید و گزینه‌ها را مقایسه کنید.</p></div>
        <Link href="/files">دیدن همه فایل‌ها <ArrowBackRounded aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}

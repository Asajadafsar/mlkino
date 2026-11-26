import type { PropertyType } from "./types";
import { propertyItem, requestItem } from "./sampleData";

export const PROPERTIES: PropertyType[] = [
  {
    ...propertyItem,
    id: 101,
    neighborhood: "سعادت‌آباد",
    address: "تهران، سعادت‌آباد، خیابان سرو",
    area: 140,
    roomCount: 3,
    totalPrice: 38900000000,
    buildYear: "۱۴۰۱",
    advisorName: "علی رضایی",
    assignedTo: "علی رضایی",
    images: ["/images/properties/apartment.webp", "/images/properties/interior.webp", "/images/properties/hero.webp"],
    description: "آپارتمان لوکس و خوش‌نقشه با نورگیری عالی، در یکی از محله‌های آرام و خوش‌دسترسی تهران. فضای پذیرایی دلباز، آشپزخانه مدرن و امکانات کامل، این خانه را به گزینه‌ای مناسب برای زندگی تبدیل کرده‌اند.",
  },
  { ...propertyItem, id: 102, propertyType: "ویلا", neighborhood: "لواسان", area: 500, roomCount: 5, totalPrice: 78000000000, images: ["/images/properties/hero.webp", "/images/properties/interior.webp"], buildYear: "۱۴۰۰" },
  { ...propertyItem, id: 103, neighborhood: "فرمانیه", area: 240, roomCount: 4, totalPrice: 49000000000, images: ["/images/properties/apartment.webp", "/images/properties/interior.webp"], buildYear: "۱۴۰۲" },
  { ...propertyItem, id: 104, propertyType: "اداری", neighborhood: "میرداماد", area: 220, roomCount: 3, totalPrice: 35000000000, images: ["/images/properties/apartment.webp", "/images/properties/interior.webp"], buildYear: "۱۴۰۱" },
  { ...propertyItem, id: 105, neighborhood: "شهرک غرب", area: 155, roomCount: 3, totalPrice: 42800000000, images: ["/images/properties/apartment.webp", "/images/properties/interior.webp"], buildYear: "۱۴۰۲" },
];

export const REQUESTS: PropertyType[] = [
  { ...requestItem, id: 202, contractType: "خرید", city: "تهران", neighborhood: ["سعادت‌آباد", "شهرک غرب"], areaFrom: 100, areaTo: 150, totalPriceFrom: 30000000000, totalPriceTo: 40000000000, mortgagePriceFrom: 0, mortgagePriceTo: 0, monthlyRentFrom: 0, monthlyRentTo: 0, mortgagePrice: 0, monthlyRent: 0, requesterName: "علی محمدی", description: "متقاضی خرید آپارتمان خوش‌نقشه و نورگیر در محله‌ای آرام. دسترسی مناسب، پارکینگ و آسانسور در اولویت است." },
  { ...requestItem, id: 203, city: "کرج", neighborhood: ["عظیمیه"], mortgagePriceFrom: 0, mortgagePriceTo: 500000000, mortgagePrice: 500000000, monthlyRentFrom: 0, monthlyRentTo: 20000000, requesterName: "رضا احمدی" },
  { ...requestItem, id: 204, propertyType: "ویلا", contractType: "خرید", city: "متل قو", neighborhood: ["شمال"], areaFrom: 400, areaTo: 600, totalPriceFrom: 0, totalPriceTo: 40000000000, requesterName: "مریم رضایی" },
];

export function propertyTitle(data: PropertyType) {
  if (data.title) return data.title;
  const neighborhood = Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood;
  return `${data.propertyType}${data.propertyType === "آپارتمان" ? " لوکس" : " مدرن"} در ${neighborhood || data.city}`;
}

export function isListingBodyClick(target: EventTarget | null) {
  return target instanceof Element &&
    !target.closest("a, button, summary, input, select, textarea, [role='button'], [role='dialog']");
}

import { PropertyType } from "@/app/Core/types";

export const formatNumber = (num?: number) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return num.toLocaleString("fa-IR");
};

export const getFormattedLocation = (data: PropertyType) => {
  const parts: string[] = [];
  if (data.city) parts.push(data.city);
  if (data.district) {
    parts.push(
      Array.isArray(data.district) ? data.district.join("، ") : data.district,
    );
  }
  if (data.neighborhood) {
    parts.push(
      Array.isArray(data.neighborhood)
        ? data.neighborhood.join("، ")
        : data.neighborhood,
    );
  }
  return parts.length > 0 ? parts.join("، ") : "موقعیت مشخص نشده";
};

export const getDisplayArea = (data: PropertyType): string => {
  if (data.area) return `${formatNumber(data.area)} متر`;
  if (data.areaFrom || data.areaTo) {
    return `${formatNumber(data.areaFrom || 0)} تا ${formatNumber(
      data.areaTo || 0,
    )} متر`;
  }
  return "نامشخص";
};

export const getPriceInfo = (data: PropertyType) => {
  const isRentType =
    data.contractType === "رهن و اجاره" || data.contractType === "اجاره";
  return {
    label: isRentType ? "قیمت رهن / ودیعه:" : "قیمت کل:",
    value: isRentType
      ? formatNumber(data.mortgagePrice || data.rent || data.mortgagePriceFrom)
      : formatNumber(data.totalPrice || data.totalPriceFrom),
  };
};

export const getPersonName = (data: PropertyType) =>
  data.assignedTo || data.advisorName || data.ownerName || "کارشناس مربوطه";

export const getCoverImage = (data: PropertyType): string | null => {
  if (data.images && data.images.length > 0) {
    const firstImg = data.images[0];
    if (typeof firstImg === "string") return firstImg;
    if (firstImg instanceof File) return URL.createObjectURL(firstImg);
  }
  return null;
};
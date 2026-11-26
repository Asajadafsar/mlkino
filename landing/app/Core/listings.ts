import type { PropertyType } from "./types";
export function propertyTitle(data: PropertyType) {
  if (data.title) return data.title;
  const neighborhood = Array.isArray(data.neighborhood) ? data.neighborhood.join("، ") : data.neighborhood;
  return `${data.propertyType}${data.propertyType === "آپارتمان" ? " لوکس" : " مدرن"} در ${neighborhood || data.city}`;
}

export function isListingBodyClick(target: EventTarget | null) {
  return target instanceof Element &&
    !target.closest("a, button, summary, input, select, textarea, [role='button'], [role='dialog']");
}

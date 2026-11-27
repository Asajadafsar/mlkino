import type {PropertyType} from "./types";

type CatalogFile = Omit<Partial<PropertyType>, "buildYear"> & {
  id: number;
  kind: "file" | "request";
  buildYear?: string | number;
  workPhone?: string | null;
  expert?: {name: string; work_phone: string | null};
  office?: {name: string};
  external_links?: {telegram?: string; instagram?: string; eitaa?: string};
};

export function toPublicFile(row: CatalogFile): PropertyType {
  return {
    ...row,
    published: true,
    propertyType: row.propertyType || "ملک",
    contractType: row.contractType || "",
    documentType: row.documentType || "",
    monthlyCharge: "",
    city: row.city || "",
    district: row.district || "",
    neighborhood: row.neighborhood || "",
    address: "",
    budgetType: "",
    area: row.area ?? 0,
    totalPrice: row.totalPrice ?? 0,
    pricePerMeter: 0,
    rent: 0,
    mortgagePrice: row.mortgagePrice ?? 0,
    monthlyRent: row.monthlyRent ?? 0,
    mortgageTerms: "",
    roomCount: row.roomCount ?? 0,
    occupancyStatus: "",
    bathroom: "",
    heating: row.heating || "",
    cooling: row.cooling || "",
    flooring: "",
    facade: row.facade || "",
    totalFloor: row.totalFloor ?? 0,
    direction: row.direction || "",
    ownerName: "",
    ownerPhone: "",
    ownerPhone2: "",
    ownerJob: "",
    amenities: row.amenities || [],
    images: row.images || [],
    description: row.description || "",
    buildYear: row.buildYear ? Number(row.buildYear).toLocaleString("fa-IR", {useGrouping: false}) : undefined,
    advisorName: row.expert?.name,
    agencyName: row.office?.name,
    contactPhone: row.workPhone || row.expert?.work_phone || undefined,
    virtualTourLink: "",
    virtualTourUrl: row.external_links ? {
      telegram: row.external_links.telegram || "", instagram: row.external_links.instagram || "", eitaa: row.external_links.eitaa || "",
    } : undefined,
  };
}

export async function getPublicFile(id: string, kind: CatalogFile["kind"] = "file") {
  if (!/^[1-9]\d*$/.test(id)) return null;
  const origin = process.env.MLKINO_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://mlkino.com");
  const response = await fetch(new URL(`/api/panel/public/catalog/${id}/`, origin), {cache: "no-store", signal: AbortSignal.timeout(6000)});
  if (response.status === 404) return null;
  if (!response.ok) throw Error("دریافت اطلاعات ملک انجام نشد.");
  const row = (await response.json()).data as CatalogFile;
  return row.kind === kind ? toPublicFile(row) : null;
}

export async function getPublicFiles(origin: string, filters: string, signal: AbortSignal, kind: CatalogFile["kind"] = "file") {
  const params = new URLSearchParams(filters);
  params.set("kind", kind);
  const response = await fetch(`${origin}/api/panel/public/catalog/?${params}`, {signal, cache: "no-store"});
  if (!response.ok) throw Error("دریافت فایل‌های ملکی انجام نشد.");
  const data = (await response.json()).data as {results: CatalogFile[]; total_results: number; page_size: number};
  return {items: data.results.filter(row => row.kind === kind).map(toPublicFile), count: data.total_results, pageSize: data.page_size};
}

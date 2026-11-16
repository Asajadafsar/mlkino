import provinceRows from "./provinces.json";
import cityRows from "./cities.json";

export type Province = { id: number; name: string; slug: string; tel_prefix: string };
export type City = { id: number; name: string; slug: string; province_id: number; county_id: number; district_id: number };

export const PROVINCES = provinceRows as Province[];
export const CITIES = cityRows as City[];
export const PROVINCE_BY_ID = new Map(PROVINCES.map((province) => [String(province.id), province]));
export const CITY_BY_ID = new Map(CITIES.map((city) => [String(city.id), city]));
export const CITIES_BY_PROVINCE = new Map(
  PROVINCES.map((province) => [
    province.id,
    CITIES.filter((city) => city.province_id === province.id).sort((a, b) => a.name.localeCompare(b.name, "fa")),
  ]),
);

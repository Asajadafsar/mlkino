import type { Metadata } from "next";
import PropertySearch from "../Components/Home/PropertySearch";

export const metadata: Metadata = { title: "جستجوی پیشرفته ملک | ملکینو" };
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <PropertySearch initialDeal={typeof params.deal === "string" ? params.deal : "buy"} />;
}

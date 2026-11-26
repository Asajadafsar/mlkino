import { notFound } from "next/navigation";
import { PROPERTIES, REQUESTS, propertyTitle } from "@/app/Core/listings";
import DetailExperience from "@/app/Components/PropertyDetail/DetailExperience";
import {getPublicFile} from "@/app/Core/publicFiles";
import {cache} from "react";

type Props = { params: Promise<{ id: string }> };
const loadFile = cache(getPublicFile);
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const property = await loadFile(id).catch(() => null);
  return { title: property ? `${propertyTitle(property)} | ملکینو` : "جزئیات ملک | ملکینو" };
}
export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const sample = PROPERTIES.find(item => item.id === Number(id)) || (id === "1" ? PROPERTIES[0] : undefined);
  const property = await loadFile(id).catch(error => {if (!sample) throw error; return null;}) || sample;
  if (property) return <DetailExperience data={property} />;
  const request = REQUESTS.find(item => item.id === Number(id));
  if (request) return <DetailExperience data={request} mode="request" />;
  notFound();
}

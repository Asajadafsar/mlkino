import { notFound } from "next/navigation";
import { propertyTitle } from "@/app/Core/listings";
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
  const property = await loadFile(id);
  if (!property) notFound();
  return <DetailExperience data={property} />;
}

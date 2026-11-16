import { notFound } from "next/navigation";
import { PROPERTIES, REQUESTS, propertyTitle } from "@/app/Core/listings";
import DetailExperience from "@/app/Components/PropertyDetail/DetailExperience";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const property = PROPERTIES.find(item => item.id === Number(id)) || (id === "1" ? PROPERTIES[0] : undefined);
  return { title: property ? `${propertyTitle(property)} | ملکینو` : "جزئیات ملک | ملکینو" };
}
export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const property = PROPERTIES.find(item => item.id === Number(id)) || (id === "1" ? PROPERTIES[0] : undefined);
  if (property) return <DetailExperience data={property} />;
  const request = REQUESTS.find(item => item.id === Number(id));
  if (request) return <DetailExperience data={request} mode="request" />;
  notFound();
}

import { notFound } from "next/navigation";
import { REQUESTS } from "@/app/Core/listings";
import DetailExperience from "@/app/Components/PropertyDetail/DetailExperience";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const request = REQUESTS.find(item => item.id === Number(id));
  return { title: request ? `درخواست ${request.contractType} ${request.propertyType} | ملکینو` : "جزئیات درخواست | ملکینو" };
}
export default async function RequestPage({ params }: Props) {
  const { id } = await params;
  const request = REQUESTS.find(item => item.id === Number(id));
  if (!request) notFound();
  return <DetailExperience data={request} mode="request" />;
}

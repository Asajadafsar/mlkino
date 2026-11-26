import { notFound } from "next/navigation";
import {getPublicFile} from "@/app/Core/publicFiles";
import {cache} from "react";

const loadRequest = cache((id: string) => getPublicFile(id, "request"));
import DetailExperience from "@/app/Components/PropertyDetail/DetailExperience";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const request = await loadRequest(id).catch(() => null);
  return { title: request ? `درخواست ${request.contractType} ${request.propertyType} | ملکینو` : "جزئیات درخواست | ملکینو" };
}
export default async function RequestPage({ params }: Props) {
  const { id } = await params;
  const request = await loadRequest(id);
  if (!request) notFound();
  return <DetailExperience data={request} mode="request" />;
}

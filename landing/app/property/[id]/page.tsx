import PropertyDetails, {
  FilePropertyData,
  RequestPropertyData,
} from "@/app/Components/PropertyDetail/PropertyDetail";
import PropertyGallery from "@/app/Components/PropertyDetail/PropertyGallery";
import TitleHeader from "@/app/Components/PropertyDetail/TitleHeader";
import { Container } from "@mui/material";
import React from "react";

const fileData: FilePropertyData = {
  id: 1,
  status: "فعال",
  propertyType: "آپارتمان",
  contractType: "فروش",
  documentType: "تک برگ",
  city: "تهران",
  district: "منطقه ۲",
  neighborhood: "سعادت‌آباد",
  address: "خیابان علامه شمالی، کوچه ۱۲، پلاک ۴",
  area: 120,
  totalPrice: 8500000000,
  pricePerMeter: 70833333,
  roomCount: 2,
  occupancyStatus: "تخلیه",
  bathroom: "ایرانی و فرنگی",
  heating: "پکیج",
  cooling: "اسپلیت",
  flooring: "سرامیک",
  facade: "سنگ",
  totalFloor: 6,
  direction: "شمالی",
  amenities: ["آسانسور", "پارکینگ", "انباری", "بالکن"],
  description: "واحد نوساز، نور عالی، نزدیک مترو و مراکز خرید.",
  agent: {
    id: "ag-1",
    firstName: "محمد",
    lastName: "کریمی",
    phoneNumber: "09123334455",
    profileImage: null,
    role: "real_estate_agent",
    agencyId: "agn-1",
    agencyName: "املاک آرین",
    homeAddress: "تهران، سعادت‌آباد",
    workAddress: "تهران، سعادت‌آباد، خیابان علامه شمالی",
    registrationData: {},
  },
  agency: {
    id: "agn-1",
    firstName: "رضا",
    lastName: "احمدی",
    phoneNumber: "02122334455",
    profileImage: null,
    role: "manager",
    agencyName: "املاک آرین",
    postalCode: "1998712345",
    maritalStatus: "married",
    officeAddress: "تهران، سعادت‌آباد، خیابان علامه شمالی، پلاک ۱۰",
    officePropertyStatus: "owner",
    leaseEndDate: null,
    logo: null,
    managerImage: null,
    registrationData: {},
  },
};
// دیتای درخواست (نمونه)
const requestData: RequestPropertyData = {
  id: 1,
  propertyType: "آپارتمان",
  contractType: "فروش",
  city: "تهران",
  district: ["منطقه ۱", "منطقه ۲"],
  neighborhood: ["زعفرانیه", "الهیه"],
  areaFrom: 90,
  areaTo: 130,
  totalPriceFrom: 5000000000,
  totalPriceTo: 7500000000,
  roomCount: 2,
  requesterName: "علی محمدی",
  requesterPhone: "09121234567",
};

export default function page() {
  return (
    <Container
      maxWidth={false}
      sx={{
        px: {
          xs: 2,
          sm: 4,
        },
        width: "100%",
        maxWidth: "var(--page-max-width)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mb: 5,
        mt: 2,
      }}
    >
      <TitleHeader  />
      <PropertyGallery />
      <PropertyDetails mode="file" data={fileData} />
    </Container>
  );
}

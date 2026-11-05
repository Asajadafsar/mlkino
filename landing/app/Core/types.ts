export type PropertyType = {

    id: number
    virtualTourUrl?:{
        telegram:string
        instagram:string
        eitaa:string
    }

    propertyType: string

    contractType: string

    documentType: string

    requesterName?: string

    requesterPhone?: string

    vacateDate?: string

    // در حالت «فایل» یعنی اختصاص به مشتری و در حالت «درخواست» یعنی اختصاص به کارشناس

    assignedTo?: string

    monthlyCharge: string

    city: string

    virtualTourLink: string

    // در حالت «فایل» رشته آزاد و در حالت «درخواست» چند مقداری است

    district: string | string[]

    neighborhood: string | string[]

    address: string

    budgetType: string

    area: number

    totalPrice: number

    pricePerMeter: number

    rent: number



    mortgagePrice: number

    monthlyRent: number

    mortgageTerms: string



    // فیلدهای بازه‌ای، فقط برای «ثبت درخواست» استفاده می‌شوند

    areaFrom?: number

    areaTo?: number

    totalPriceFrom?: number

    totalPriceTo?: number

    mortgagePriceFrom?: number

    mortgagePriceTo?: number

    monthlyRentFrom?: number

    monthlyRentTo?: number

    totalFloorFrom?: number

    totalFloorTo?: number



    roomCount: number

    occupancyStatus: string

    bathroom: string

    heating: string

    cooling: string

    flooring: string

    facade: string

    totalFloor: number

    direction: string



    amenities: string[]



    ownerName: string

    ownerPhone: string

    ownerPhone2: string

    ownerJob: string



    // پشتیبانی از هر دو حالت: فایل آپلودی (File) یا مسیر/URL تصویر (string) برای دیتای نمونه یا تصاویر از سرور

    images: (string | File)[]

    description: string




    // فیلدهای مخصوص «آگهی»
    buildYear?: string

    adTone?: string

    strongPoint?: string

    advisorName?: string

    agencyName?: string

    contactPhone?: string

    toneOfTheAd?: string
}
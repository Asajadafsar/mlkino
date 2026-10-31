import type { Dispatch, SetStateAction } from 'react'

export type RecordMode = 'file' | 'request' | 'ad'
export type PropertyType = {
    isAd:boolean
    id: number
    status: string
    publicationStatus:string
    requestStatus:string
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
    virtualTourLink: {
        eitaa: string
        telegram: string
        instagram: string
    }
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

      expertName: string
    expertPhone: string
    agencyPhone: string
    agencyAddress:string

    // پشتیبانی از هر دو حالت: فایل آپلودی (File) یا مسیر/URL تصویر (string) برای دیتای نمونه یا تصاویر از سرور
    images: (string | File)[]

    description: string
    internalNote: string

    // فیلدهای مخصوص «آگهی»
    buildYear?: string
    adTone?: string
    strongPoint?: string
    advisorName?: string
    agencyName?: string
    contactPhone?: string
    toneOfTheAd?: string
    occupancyDate?:string

}
export type FilesType = {
    id: number
    title: string
    description: string
    link: string
}

// پراپ‌های پایه‌ای که تقریبا همه‌ی مراحل به آن نیاز دارند
export type StepProps = {
    property: PropertyType
    setProperty: Dispatch<SetStateAction<PropertyType>>
    resource: string
    editMode?: boolean
}

// مراحلی که رفتارشان بین «فایل» و «درخواست» فرق می‌کند
export type ModeStepProps = StepProps & {
    mode: RecordMode
}

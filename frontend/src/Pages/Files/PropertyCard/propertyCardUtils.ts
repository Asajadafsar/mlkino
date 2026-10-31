import { PropertyType } from "../../../Components/PropertyRecordForm"

export const STATUS_COLOR: Record<string, string> = {
    فعال: 'primary.main',
    'فروخته شده': 'text.disabled',
    'منصرف شد': 'secondary.main',
    'کنسل شد': 'error.main',
}

export const isFilled = (value: unknown) =>
    value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)

export const formatNumber = (value?: number) =>
    value || value === 0 ? value.toLocaleString('fa-IR') : undefined

export const formatRange = (from?: number, to?: number) => {
    const f = formatNumber(from)
    const t = formatNumber(to)
    if (f && t) return `${f} تا ${t}`
    if (f) return `از ${f}`
    if (t) return `تا ${t}`
    return undefined
}

export const toText = (value?: string | string[]) => {
    if (!value) return undefined
    if (Array.isArray(value)) return value.filter(Boolean).join('، ') || undefined
    return value
}

export type DetailField = {
    label: string
    value?: React.ReactNode
}

export function useDerivedPropertyInfo(item: Partial<PropertyType>) {
    const location = [item.city, toText(item.district), toText(item.neighborhood)]
        .filter(Boolean)
        .join(' - ')

    const areaText = formatNumber(item.area)
        ? `${formatNumber(item.area)} متر`
        : formatRange(item.areaFrom, item.areaTo)
        ? `${formatRange(item.areaFrom, item.areaTo)} متر`
        : undefined

    const roomCountText = isFilled(item.roomCount) ? `${item.roomCount} خوابه` : undefined
    const totalFloorText = formatNumber(item.totalFloor) ?? formatRange(item.totalFloorFrom, item.totalFloorTo)

    const totalPriceText = formatNumber(item.totalPrice) ?? formatRange(item.totalPriceFrom, item.totalPriceTo)
    const mortgagePriceText =
        formatNumber(item.mortgagePrice) ?? formatRange(item.mortgagePriceFrom, item.mortgagePriceTo)
    const monthlyRentText =
        formatNumber(item.monthlyRent) ?? formatRange(item.monthlyRentFrom, item.monthlyRentTo)

    let priceMain: string | undefined
    let priceLabel: string | undefined
    let priceSecondary: string | undefined

    if (totalPriceText) {
        priceMain = totalPriceText
        priceLabel = 'قیمت کل'
    } else if (mortgagePriceText) {
        priceMain = mortgagePriceText
        priceLabel = 'رهن'
        if (monthlyRentText) priceSecondary = `اجاره ماهانه ${monthlyRentText} تومان`
    } else if (monthlyRentText) {
        priceMain = monthlyRentText
        priceLabel = 'اجاره ماهانه'
    }

    const amenities = item.amenities?.filter(Boolean) ?? []

    // مشخصات کلیدی که به‌صورت چیپ در بالای مودال نشون داده می‌شن؛
    // به همین دلیل از لیست «مشخصات ملک» عمومی حذف شدن تا تکراری نباشن
    const quickFacts = {
        areaText,
        roomCountText,
        totalFloorText: totalFloorText ? `${totalFloorText} طبقه` : undefined,
        direction: item.direction,
    }

    const specFields: DetailField[] = [
        {label: 'آدرس', value: item.address},
        {label: 'وضعیت تصرف', value: item.occupancyStatus},
        {label: 'سال ساخت', value: item.buildYear},
        {label: 'نما', value: item.facade},
        {label: 'کف‌پوش', value: item.flooring},
        {label: 'سیستم گرمایش', value: item.heating},
        {label: 'سیستم سرمایش', value: item.cooling},
        {label: 'سرویس بهداشتی', value: item.bathroom},
    ]

    const financialFields: DetailField[] = [
        {label: 'قیمت هر متر', value: formatNumber(item.pricePerMeter) ? `${formatNumber(item.pricePerMeter)} تومان` : undefined},
        {label: 'اجاره', value: formatNumber(item.rent) ? `${formatNumber(item.rent)} تومان` : undefined},
        {label: 'شرایط رهن', value: item.mortgageTerms},
    ]

    const ownerFields: DetailField[] = [
        {label: 'نام مالک', value: item.ownerName},
        {label: 'تلفن مالک', value: item.ownerPhone},
        {label: 'تلفن دوم مالک', value: item.ownerPhone2},
        {label: 'شغل مالک', value: item.ownerJob},
    ]
     const expertFields: DetailField[] = [
        {label: 'نام کارشناس', value: item.expertName},
        {label: 'تلفن کارشناس', value: item.expertPhone},
        {label: 'نام املاک', value: item.agencyName},
        {label: 'تلفن املاک', value: item.agencyPhone},
        {label: 'آدرس املاک', value: item.agencyAddress},
    ]

    const requesterFields: DetailField[] = [
        {label: 'نام درخواست‌کننده', value: item.requesterName},
        {label: 'تلفن درخواست‌کننده', value: item.requesterPhone},
    ]

    // فیلدهای مخصوص «آگهی» — فقط وقتی رکورد از فرم آگهی ثبت شده باشد پر هستند
    const adFields: DetailField[] = [
        {label: 'لحن آگهی', value: item.adTone},
        {label: 'نام مشاور', value: item.advisorName},
        {label: 'نام آژانس املاک', value: item.agencyName},
        {label: 'شماره تماس در متن آگهی', value: item.contactPhone},
    ]

    return {
        location,
        areaText,
        roomCountText,
        quickFacts,
        priceMain,
        priceLabel,
        priceSecondary,
        amenities,
        specFields,
        financialFields,
        ownerFields,
        expertFields,
        requesterFields,
        adFields,
        hasNotes: [item.description, item.internalNote, item.strongPoint].some(isFilled),
    }
}
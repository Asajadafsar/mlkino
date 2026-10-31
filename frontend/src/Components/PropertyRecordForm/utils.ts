import {numberToPersianWordsToman} from './shared'

export const toSelectOptions = (values: string[]) =>
    values.map((value) => ({
        label: value,
        value,
    }))

// اگر مقدار خالی/صفر بود متن حروفی نشون داده نشه
export const priceHelperText = (value: number) => (value ? numberToPersianWordsToman(value) : '')

// نرمال‌سازی مقدار رشته/آرایه برای فیلدهای چند مقداری (منطقه/محله)
export const asStringArray = (value: string | string[] | undefined): string[] => {
    if (Array.isArray(value)) return value
    if (!value) return []
    return [value]
}

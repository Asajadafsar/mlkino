const yekan = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const dahgan = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const sadgan = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']
const dahyek = [
    'ده',
    'یازده',
    'دوازده',
    'سیزده',
    'چهارده',
    'پانزده',
    'شانزده',
    'هفده',
    'هجده',
    'نوزده',
]
const magnitude = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون']

function threeDigitToWords(n: number): string {
    if (n === 0) return ''

    const parts: string[] = []
    const s = Math.floor(n / 100)
    const d = Math.floor((n % 100) / 10)
    const y = n % 10

    if (s > 0) parts.push(sadgan[s])

    if (d === 1) {
        parts.push(dahyek[y])
    } else {
        if (d > 0) parts.push(dahgan[d])
        if (y > 0) parts.push(yekan[y])
    }

    return parts.join(' و ')
}

/**
 * تبدیل عدد به حروف فارسی (بدون واحد)
 */
export function numberToPersianWords(input: number | string): string {
    let num = typeof input === 'string' ? Number(input) : input

    if (!Number.isFinite(num) || Number.isNaN(num)) return ''
    if (num === 0) return 'صفر'

    const isNegative = num < 0
    num = Math.abs(Math.floor(num))

    const groups: number[] = []
    while (num > 0) {
        groups.unshift(num % 1000)
        num = Math.floor(num / 1000)
    }

    const words: string[] = []
    const len = groups.length

    groups.forEach((group, idx) => {
        if (group === 0) return

        const groupWords = threeDigitToWords(group)
        const magIdx = len - idx - 1
        const mag = magnitude[magIdx] ?? ''

        words.push(mag ? `${groupWords} ${mag}` : groupWords)
    })

    return (isNegative ? 'منفی ' : '') + words.join(' و ')
}


export function numberToPersianWordsToman(input: number | string): string {
    const words = numberToPersianWords(input)
    if (!words) return ''
    return `${words} تومان`
}
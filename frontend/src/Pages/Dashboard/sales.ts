export const dataset = [
    {
        sales: 1000000000,
        month: 'فروردین',
    },
    {
        sales: 15000000,
        month: 'اردیبهشت',
    },
    {
        sales: 200000,
        month: 'خرداد',
    },
    {
        sales: 300000,
        month: 'تیر',
    },
    {
        sales: 4000000,
        month: 'مرداد',
    },
    {
        sales: 500000,
        month: 'شهریور',
    },
    {
        sales: 600000,
        month: 'مهر',
    },
    {
        sales: 700000,
        month: 'آبان',
    },
    {
        sales: 800000,
        month: 'آذر',
    },
    {
        sales: 900000,
        month: 'دی',
    },
    {
        sales: 1000000,
        month: 'بهمن',
    },
    {
        sales: 1100000,
        month: 'اسفند',
    },
]

export function valueFormatter(value: number | null) {
    if (value === null) return '۰ تومان'
    return `${value.toLocaleString()} تومان`
}

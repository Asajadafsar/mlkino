import {dateTime, digits, label, persianNumber, WorkflowRow} from './workflowClient'

export type ReportType = 'operations' | 'agencies' | 'experts' | 'finance'
export type ReportFilters = Record<string, string>
export type ReportGroup = {label: string; current: number; previous: number}
export type ReportData = {
  results: WorkflowRow[]; total_results: number; page_size?: number;
  columns?: {key?: string; field?: string; label: string}[];
  summary?: Record<string, any>; trend?: {date: string; count: number}[];
  comparison?: ReportGroup[]; date_from?: string; date_to?: string;
}
export const reportTitles: Record<ReportType, string> = {
  operations: 'عملیات و درخواست‌ها', agencies: 'دفاتر املاک', experts: 'عملکرد کارشناسان', finance: 'عملکرد مالی',
}
export const initialReportFilters: ReportFilters = {
  period: 'month', filters: '', ordering: '-created_at', date_from: '', date_to: '',
  province: '', city: '', district: '', neighborhood: '', agency: '', expert: '', status: '', search: '',
  expertCountFrom: '', expertCountTo: '', license: '', priceFrom: '', priceTo: '', areaFrom: '', areaTo: '',
}
export function reportValidation(filters: ReportFilters) {
  for (const [from, to, title] of [['expertCountFrom', 'expertCountTo', 'تعداد کارشناس'], ['priceFrom', 'priceTo', 'قیمت'], ['areaFrom', 'areaTo', 'متراژ']]) {
    for (const key of [from, to]) if (filters[key] && (!Number.isFinite(Number(filters[key])) || Number(filters[key]) < 0)) return `مقدار ${title} باید عددی نامنفی باشد.`
    if (filters[from] && filters[to] && Number(filters[from]) > Number(filters[to])) return `حداکثر ${title} نباید کمتر از حداقل باشد.`
  }
  for (const key of ['agency', 'expert']) if (filters[key] && (!/^\d+$/.test(filters[key]) || Number(filters[key]) < 1)) return 'شناسه دفتر و کارشناس باید عددی مثبت باشد.'
  if (filters.period === 'custom' && (!filters.date_from || !filters.date_to)) return 'تاریخ شروع و پایان بازه را انتخاب کنید.'
  if (filters.period === 'custom' && filters.date_from > filters.date_to) return 'تاریخ پایان باید پس از شروع باشد.'
  return ''
}
export function reportQuery(filters: ReportFilters) {
  return Object.fromEntries(Object.entries({...filters, period: filters.period === 'custom' ? 'month' : filters.period})
    .filter(([key, value]) => value !== '' && (!['date_from', 'date_to'].includes(key) || filters.period === 'custom')))
}
export const reportLabel = (value: any) => ({active:'فعال',inactive:'غیرفعال',archived:'بایگانی‌شده'} as Record<string,string>)[String(value)] || label(value)
export const reportCell = (row: WorkflowRow, key: string): string => {
  const value = row[key]
  if (value === null || value === undefined || value === '') return '—'
  if (key.endsWith('_at') || key.includes('datetime')) return dateTime(value)
  if (['status', 'kind', 'direction'].includes(key)) return reportLabel(value)
  if (key === 'license_status') return ({valid: 'معتبر', without: 'بدون پروانه', expired: 'منقضی', unknown: 'نامشخص'} as Record<string, string>)[value] || String(value)
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر'
  if (typeof value === 'number' || (['price', 'amount', 'area'].includes(key) && /^\d+(\.\d+)?$/.test(value))) return persianNumber(value)
  if (Array.isArray(value)) return value.join('، ')
  return typeof value === 'object' ? '—' : String(value)
}
export const csvCell = (value: any) => {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}
export const reportLink = (row: WorkflowRow, report: ReportType) => {
  if (report === 'agencies') return '/users/agencies/' + row.id
  if (report === 'experts') return '/users/expert/' + row.id
  if (report === 'finance') return '/finance'
  const url = String(row.record_url || '')
  const match = url.match(/^\/(files|requests)\/(\d+)$/)
  return match ? `/${match[1]}?demo=0&detail=${match[2]}` : url.startsWith('/') && !url.startsWith('//') ? url : ''
}
export const numericReportInput = (value: string) => digits(value)

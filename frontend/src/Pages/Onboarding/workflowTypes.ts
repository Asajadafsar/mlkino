import type {GatewayOptions} from '../Settings/GatewaySettings'
export type Plan = {id: string; label: string; price: number; promotions: number; color?: string; description?: string; features?: string[]}
export type Office = {name: string; logo?: string; address: string; active_experts: number; city?: string; district?: string}
export type Application = {
    id: number; created_at: string; kind: 'expert' | 'office' | 'upgrade'; status: 'pending' | 'await_pay' | 'fix' | 'approved' | 'rejected'
    tier: string; resume_url?: string; name: string; phone: string; office_name?: string; terms_accepted_at?: string
    details: {office_approved?: boolean; job_title?: string; specialties?: string[]; experience_years?: number; job_details?: string; monthly_price?: number; review_note?: string; payment_reference?: string; focus_areas?: string; property_types?: string}
    profile?: Record<string, string | boolean | null>
}
export type WorkflowState = {
    demo_gateway: GatewayOptions; own: Application[]; incoming: Application[]; reviewed: Application[]; plans: Plan[]; terms: string
    subscription?: {office_name?: string; logo?: string; code: string; tier: string; active_tier: string; paid_until?: string; started_at?: string; ai_available: boolean; promoted_files: number[]}
}
export const applicationNames = {expert: 'درخواست همکاری', office: 'درخواست دفتر املاک', upgrade: 'تمدید یا ارتقای اشتراک'}
export const statuses = {pending: 'در انتظار بررسی', await_pay: 'در انتظار پرداخت', fix: 'نیاز به اطلاعات بیشتر', approved: 'تأیید شده', rejected: 'رد شده'}
export const number = (value: number) => value.toLocaleString('fa-IR')
export const date = (value?: string) => value ? new Date(value).toLocaleDateString('fa-IR') : '—'
export const profileLabels: Record<string, string> = {
    agency_name: 'نام دفتر', office_province: 'استان', office_city: 'شهر', office_address: 'نشانی', occupancy_type: 'نوع مالکیت',
    lease_end_date: 'پایان اجاره', landline: 'تلفن ثابت', office_district: 'منطقه', office_neighborhood: 'محله',
    license_number: 'شماره پروانه', license_expires_at: 'اعتبار پروانه', description: 'نوع فعالیت',
}

export type UploadValue = File | string | null

export interface CommonUserType {
    password?: string
    id: number
    first_name: string
    last_name: string
    full_name: string
    phone: string
    email: string | null
    national_code: string | null
    birth_date: string | null
    avatar: UploadValue
    province: string | null
    city: string | null
    postal_code: string | null
    address: string | null
    user_type: 'consumer' | 'investor'
    role: string
    account_status: string
    verification_status: string
    phone_verified: boolean
    national_code_verified: boolean
    is_active: boolean
    has_profile: boolean
    date_joined: string
    last_login: string | null
    role_display?: string
    user_type_display?: string
    account_status_display?: string
    verification_status_display?: string
}

export const commonUserDefaults: CommonUserType = {
    id: 0, first_name: '', last_name: '', full_name: '', phone: '',
    email: null, national_code: null, birth_date: null, avatar: null,
    province: null, city: null, postal_code: null, address: null,
    user_type: 'consumer', role: 'user', account_status: 'active',
    verification_status: 'not_started', phone_verified: false,
    national_code_verified: false, is_active: true, has_profile: false,
    date_joined: '', last_login: null,
}

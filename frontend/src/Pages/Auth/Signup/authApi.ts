import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import axios from 'axios'
import {installCsrf} from '../../../Core/Csrf'

const api = axios.create({
    baseURL: ACCOUNTS_URL,
    withCredentials: true,
})
installCsrf(api)

export interface RegisterPayload {
    postal_manual?: boolean
    phone: string
    first_name: string
    last_name: string
    email: string
    national_code: string
    birth_date: string
    avatar?: File
    province: string
    city: string
    postal_code: string
    address: string
    password: string
    password_confirm: string
    user_type: 'consumer' | 'investor'
}

export const sendOtp = (phone: string) =>
    api.post('/send-otp/', { phone })

export const verifyOtp = (phone: string, code: string) =>
    api.post(
        '/verify-otp/',
        { phone, code },
        {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        },
    )

export const registerUser = (payload: RegisterPayload) => {
    const formData = new FormData()
    const nationalCode = payload.national_code.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit >= '۰' ? 1776 : 1632))).replace(/\D/g, '').slice(0, 10)

    if(payload.postal_manual)formData.append('postal_manual','true')
    formData.append('phone', payload.phone)
    formData.append('first_name', payload.first_name)
    formData.append('last_name', payload.last_name)
    formData.append('email', payload.email)
    formData.append('national_code', nationalCode)
    formData.append('birth_date', payload.birth_date)
    formData.append('province', payload.province)
    formData.append('city', payload.city)
    formData.append('postal_code', payload.postal_code)
    formData.append('address', payload.address)
    formData.append('password', payload.password)
    formData.append('password_confirm', payload.password_confirm)
    formData.append('user_type', payload.user_type)

    if (payload.avatar) {
        formData.append('avatar', payload.avatar)
    }

    return api.post('/complete-register/', formData, {
        timeout:60000,
        withCredentials: true,
    })
}

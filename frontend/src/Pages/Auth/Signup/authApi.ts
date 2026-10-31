import APP_URL from '../../../Core/APP_URL'
import axios from 'axios'

const api = axios.create({
    baseURL: APP_URL,
    withCredentials: true,
})

export interface RegisterPayload {
    phone: string
    first_name: string
    last_name: string
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
    api.post('/accounts/send-otp/', { phone })

export const verifyOtp = (phone: string, code: string) =>
    api.post(
        '/accounts/verify-otp/',
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

    formData.append('phone', payload.phone)
    formData.append('first_name', payload.first_name)
    formData.append('last_name', payload.last_name)
    formData.append('national_code', payload.national_code)
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

    return api.post('/accounts/complete-register/', formData, {
        withCredentials: true,
    })
}
import axios, { AxiosRequestConfig } from 'axios'
import {installSessionRefresh} from './SessionRefresh'
import {PANEL_URL} from './APP_URL'

export interface ApiResponse<DataType> {
    statusCode: string
    status: number
    message: string
    data: DataType
}

const api = axios.create({
    baseURL: PANEL_URL,
    timeout: 15000,
    withCredentials: true,
    xsrfCookieName: process.env.REACT_APP_CSRF_COOKIE_NAME || 'csrftoken',
    xsrfHeaderName: process.env.REACT_APP_CSRF_HEADER_NAME || 'X-CSRFToken',
})

installSessionRefresh(api)

export async function query<DataType>(
    options: AxiosRequestConfig,
): Promise<DataType> {
    const response = await api(options)

    return response.data as DataType
}

export default api
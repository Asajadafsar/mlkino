import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios'
import {ACCOUNTS_URL} from './APP_URL'

let refreshPromise: Promise<unknown> | null = null

export function installSessionRefresh(client: AxiosInstance) {
    client.interceptors.response.use(response => response, async (error: AxiosError<any>) => {
        const request = error.config as (AxiosRequestConfig & {_retry?: boolean}) | undefined
        if (error.response?.status === 401 && request && !request._retry) {
            request._retry = true
            try {
                if (!refreshPromise) {
                    refreshPromise = axios.post(`${ACCOUNTS_URL}/token/refresh/`, null, {
                        withCredentials: true, timeout: 15000,
                    }).finally(() => {refreshPromise = null})
                }
                await refreshPromise
                return client(request)
            } catch (refreshError) {
                return Promise.reject(refreshError)
            }
        }
        const message = error.response?.data?.message || error.response?.data?.detail
        if (typeof message === 'string') error.message = message
        return Promise.reject(error)
    })
}

import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios'
import {ACCOUNTS_URL} from './APP_URL'
import {getCsrfToken} from './Csrf'
import {apiErrorMessage} from './ApiError'

async function refreshSession() {
    const post = async (force = false) => axios.post(`${ACCOUNTS_URL}/token/refresh/`, null, {
        withCredentials: true, timeout: 15000, xsrfCookieName: '',
        headers: {'X-CSRFToken': await getCsrfToken(force)},
    })
    try {
        return await post()
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403 && error.response.data?.error_code === 'csrf_failed') {
            return post(true)
        }
        throw error
    }
}

let refreshPromise: Promise<unknown> | null = null

export function installSessionRefresh(client: AxiosInstance) {
    client.interceptors.response.use(response => response, async (error: AxiosError<any>) => {
        const request = error.config as (AxiosRequestConfig & {_retry?: boolean}) | undefined
        if (error.response?.status === 401 && request && !request._retry) {
            request._retry = true
            try {
                if (!refreshPromise) {
                    refreshPromise = refreshSession().finally(() => {refreshPromise = null})
                }
                await refreshPromise
                return client(request)
            } catch (refreshError) {
                return Promise.reject(refreshError)
            }
        }
        error.message = apiErrorMessage(error, 'دریافت پاسخ از سرور انجام نشد. دوباره تلاش کنید.')
        return Promise.reject(error)
    })
}

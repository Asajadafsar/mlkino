import axios, {AxiosInstance} from 'axios'
import {ACCOUNTS_URL} from './APP_URL'

let token = ''
let pending: Promise<string> | null = null
const installed = new WeakSet<AxiosInstance>()

export async function getCsrfToken(): Promise<string> {
    if (token) return token
    if (!pending) pending = axios.get(`${ACCOUNTS_URL}/csrf/`, {withCredentials:true, timeout:15000})
        .then(response => {
            if (typeof response.data.csrfToken !== 'string') throw Error('پاسخ CSRF سرور معتبر نیست.')
            token = response.data.csrfToken
            return token
        }).finally(() => {pending=null})
    return pending
}

export function installCsrf(client: AxiosInstance) {
    if (installed.has(client)) return
    installed.add(client)
    client.interceptors.request.use(async config => {
        const url = new URL(config.url || '', config.baseURL || window.location.origin)
        if (url.origin !== new URL(ACCOUNTS_URL).origin || /^(get|head|options)$/i.test(config.method || 'get')) return config
        const csrfToken = await getCsrfToken()
        config.withCredentials = true
        // Axios 0.26 otherwise may overwrite our header with a localhost cookie.
        config.xsrfCookieName = ''
        config.headers = {...config.headers, 'X-CSRFToken':csrfToken}
        return config
    })
    client.interceptors.response.use(response=>response, error=>{
        if (error.response?.data?.error_code === 'csrf_failed') token=''
        return Promise.reject(error)
    })
}

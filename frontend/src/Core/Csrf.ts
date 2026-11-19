import axios, {AxiosInstance} from 'axios'
import {ACCOUNTS_URL} from './APP_URL'

let token = ''
let pending: Promise<string> | null = null
const installed = new WeakSet<AxiosInstance>()

export async function getCsrfToken(force=false): Promise<string> {
    if (force) token=''
    if (token) return token
    if (!pending) pending = axios.get(`${ACCOUNTS_URL}/csrf/`, {withCredentials:true, timeout:15000})
        .then(async response => {
            if (response.data.csrfCookiePresent === false) {
                response = await axios.get(`${ACCOUNTS_URL}/csrf/`, {withCredentials:true, timeout:15000})
                if (response.data.csrfCookiePresent === false) throw Error('مرورگر کوکی API را ذخیره نکرده است. فرانت لوکال را با npm run start:server و proxy هم‌مبدأ اجرا کنید.')
            }
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
    client.interceptors.response.use(response=>response, async error=>{
        if (error.response?.data?.error_code === 'csrf_failed') {
            token=''
            const request=error.config
            const own=request && new URL(request.url || '',request.baseURL || window.location.origin).origin===new URL(ACCOUNTS_URL).origin
            if (own && !request._csrfRetried && error.response?.status===403) {
                request._csrfRetried=true
                await getCsrfToken(true)
                return client(request)
            }
        }
        return Promise.reject(error)
    })
}

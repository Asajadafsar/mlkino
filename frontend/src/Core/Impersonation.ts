import axios from 'axios'
import {installSessionRefresh} from './SessionRefresh'
import {PANEL_URL} from './APP_URL'
import {UserRole} from '../redux/RoleSlice'

export type ImpersonationStatus = {
    active: boolean
    session_id?: string | number | null
    actor_id?: number | null
    target_id?: number | null
    target_role?: UserRole | null
    expires_at?: string | null
}

// Separate client: these endpoints validate the ORIGINAL administrator session.
// Refresh renews the original admin JWT; it never exchanges it for target tokens.
const client = axios.create({baseURL: PANEL_URL, timeout: 15000, withCredentials: true, headers: {'Accept-Language': 'fa'}})

installSessionRefresh(client)

function statusFromPayload(payload: ImpersonationStatus | {data: ImpersonationStatus}): ImpersonationStatus {
    if (!payload || typeof payload !== 'object') throw new Error('پاسخ وضعیت ورود مدیریتی معتبر نیست')
    const status = 'data' in payload ? payload.data : payload
    if (!status || typeof status.active !== 'boolean') throw new Error('پاسخ وضعیت ورود مدیریتی معتبر نیست')
    if (status.active && (!status.actor_id || !status.target_id || status.actor_id === status.target_id ||
        ![UserRole.USER, UserRole.AGENCY, UserRole.EXPERT].includes(status.target_role as UserRole))) {
        throw new Error('اطلاعات نشست ورود مدیریتی معتبر نیست')
    }
    return status
}

export async function getImpersonationStatus(): Promise<ImpersonationStatus> {
    const response = await client.get('impersonation/status/')
    return statusFromPayload(response.data)
}

async function csrfHeaders() {
    await client.get('impersonation/csrf/')
    const cookieName = process.env.REACT_APP_CSRF_COOKIE_NAME || 'csrftoken'
    const headerName = process.env.REACT_APP_CSRF_HEADER_NAME || 'X-CSRFToken'
    // Read ONLY the configured readable CSRF cookie, never authentication or impersonation cookies.
    const cookie = document.cookie.split(';').map((item) => item.trim())
        .find((item) => item.startsWith(`${cookieName}=`))
    const token = cookie ? decodeURIComponent(cookie.slice(cookieName.length + 1)) : ''
    if (!token) throw new Error('ورود مدیریتی در حال حاضر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.')
    return {[headerName]: token}
}

export async function startImpersonation(userId: number) {
    if (!Number.isInteger(userId) || userId < 1) throw new Error('شناسه کاربر معتبر نیست')
    const headers = await csrfHeaders()
    const response = await client.post(`users/${userId}/impersonate/`, undefined, {headers})
    const status = statusFromPayload(response.data)
    if (!status.active || status.target_id !== userId) throw new Error('ورود مدیریتی تأیید نشد')
    return status
}

export async function exitImpersonation() {
    const headers = await csrfHeaders()
    const response = await client.post('impersonation/exit/', undefined, {headers})
    const status = statusFromPayload(response.data)
    if (status.active) throw new Error('نشست ورود مدیریتی هنوز فعال است')
    return status
}

export function impersonationError(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.response?.data?.detail || error.message || fallback
    }
    return error instanceof Error ? error.message : fallback
}

export function reloadIdentity() {
    try {
        // Broadcast only an invalidation timestamp; never persist session data or credentials.
        localStorage.setItem('mlkino:identity-change', String(Date.now()))
    } catch { /* Reload still works when storage is unavailable. */ }
    window.location.replace('/dashboard')
}

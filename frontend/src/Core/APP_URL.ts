const BACKEND_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.mlkino.com' : 'http://127.0.0.1:8000')

export function resolveBackendUrl(backendUrl: string, frontendHostname: string): string {
    const url = new URL(backendUrl)
    const localHosts = ['localhost', '127.0.0.1']

    // In development, a LAN browser must reach the API on the dev machine,
    // not its own loopback interface. Production API origins stay untouched.
    const privateFrontend = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(frontendHostname)
    if (localHosts.includes(url.hostname) && (localHosts.includes(frontendHostname) || privateFrontend)) {
        url.hostname = frontendHostname
    }

    return url.toString().replace(/\/$/, '')
}

const APP_URL = resolveBackendUrl(BACKEND_URL, window.location.hostname)
const API_BASE_URL = APP_URL.endsWith('/api') ? APP_URL : `${APP_URL}/api`

export function resolveWebSocketUrl(apiUrl: string, configured?: string): string {
    const url = new URL(configured || apiUrl)
    url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:'
    return url.origin
}
export const WS_URL = resolveWebSocketUrl(APP_URL, process.env.REACT_APP_WS_URL)

export const ACCOUNTS_URL = `${API_BASE_URL}/accounts`
export const PANEL_URL = `${API_BASE_URL}/panel`

export default APP_URL

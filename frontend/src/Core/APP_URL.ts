const BACKEND_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.mlkino.com' : 'http://127.0.0.1:8000')

export function resolveBackendUrl(backendUrl: string, frontendHostname: string): string {
    const url = new URL(backendUrl)
    const localHosts = ['localhost', '127.0.0.1']

    // Keep local auth cookies on the same site as the frontend.
    if (localHosts.includes(url.hostname) && localHosts.includes(frontendHostname)) {
        url.hostname = frontendHostname
    }

    return url.toString().replace(/\/$/, '')
}

const APP_URL = resolveBackendUrl(BACKEND_URL, window.location.hostname)

export function resolveWebSocketUrl(apiUrl: string, configured?: string): string {
    const url = new URL(configured || apiUrl)
    url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:'
    return url.origin
}
export const WS_URL = resolveWebSocketUrl(APP_URL, process.env.REACT_APP_WS_URL)

export const ACCOUNTS_URL = `${APP_URL}/accounts`
export const PANEL_URL = `${APP_URL}/panel`

export default APP_URL

/** Revalidate a restored tab against the currently deployed entry bundle. */
export function installPanelVersionCheck(reload = () => window.location.reload(), onReady?: () => void) {
    const running = Array.from(document.scripts).map(script => script.src).find(src => /\/static\/js\/main\.[^/]+\.js$/.test(src))
    if (!running) { onReady?.(); return () => {} }
    const base = new URL((process.env.PUBLIC_URL || '').replace(/\/$/, '') + '/', window.location.origin)
    const manifest = new URL('asset-manifest.json', base)
    let pending = false
    let disposed = false
    let reloading = false
    let lastCheck = -Infinity
    const check = async () => {
        if (disposed || pending || reloading || document.visibilityState === 'hidden' || Date.now() - lastCheck < 1500) return
        pending = true
        lastCheck = Date.now()
        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 5000)
        try {
            const freshManifest = new URL(manifest)
            freshManifest.searchParams.set('_panel_version', String(Date.now()))
            const response = await fetch(freshManifest.href, {cache: 'no-store', credentials: 'same-origin', signal: controller.signal})
            if (!response.ok) return
            const data = await response.json()
            if (typeof data?.files?.['main.js'] !== 'string') return
            const latest = new URL(data.files['main.js'], manifest)
            if (!disposed && latest.origin === base.origin && latest.pathname.startsWith(base.pathname + 'static/js/main.') && latest.href !== running) {
                reloading = true
                reload()
            }
        } catch { /* Offline or failed checks leave the current panel usable. */ }
        finally { window.clearTimeout(timeout); pending = false }
    }
    const onReturn = () => { void check() }
    window.addEventListener('pageshow', onReturn)
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    if (onReady) void check().finally(() => { if (!disposed && !reloading) onReady() })
    return () => {
        disposed = true
        window.removeEventListener('pageshow', onReturn)
        window.removeEventListener('focus', onReturn)
        document.removeEventListener('visibilitychange', onReturn)
    }
}

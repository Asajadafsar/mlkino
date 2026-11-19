/* Local CRA development only. No production cookie or server security settings change. */
const http = require('http')
const https = require('https')

const loopback = hostname => ['localhost', '127.0.0.1'].includes(hostname)
const remote = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && ['api.mlkino.com', 'mlkino.com'].includes(url.hostname) ? url.origin : null }
    catch { return null }
}

function localCookie(cookie, secure) {
    let value = cookie.replace(/;\s*Domain=[^;]*/ig, '').replace(/;\s*SameSite=[^;]*/ig, '; SameSite=Lax')
    // Only HTTP loopback development needs a non-Secure cookie. Upstream stays HTTPS/Secure.
    if (!secure) value = value.replace(/;\s*Secure(?=;|$)/ig, '')
    return value
}

function createLocalApiProxy(target) {
    const upstream = new URL(target)
    return (req, res, next) => {
        const path = req.originalUrl || req.url
        if (!/^\/(api\/(accounts|panel)\/|accounts\/|media\/)/.test(path) && !(/^\/panel\//.test(path) && !String(req.headers.accept).includes('text/html'))) return next()
        let local
        try { local = new URL(`${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`) }
        catch { res.writeHead(403); return res.end() }
        const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
        const peer = req.socket.remoteAddress || ''
        const localPeer = peer === '127.0.0.1' || peer === '::1' || peer === '::ffff:127.0.0.1'
        if (!localPeer || !loopback(local.hostname) || (req.headers.origin && req.headers.origin !== local.origin) || (unsafe && req.headers.origin !== local.origin)) {
            res.writeHead(403, {'Content-Type':'application/json','Cache-Control':'no-store'})
            return res.end(JSON.stringify({message:'Local API proxy requires a matching loopback Origin.'}))
        }
        const headers = {...req.headers, host:upstream.host, origin:upstream.origin, referer:upstream.origin+'/', 'accept-encoding':'identity'}
        delete headers['x-forwarded-host']; delete headers['x-forwarded-proto']; delete headers['x-forwarded-for']
        const transport = upstream.protocol === 'https:' ? https : http
        const outgoing = transport.request({hostname:upstream.hostname,port:upstream.port || undefined,path,method:req.method,headers,rejectUnauthorized:true,localAddress:process.env.MLKINO_DEV_PROXY_LOCAL_ADDRESS || undefined}, response => {
            const responseHeaders = {...response.headers}
            delete responseHeaders['access-control-allow-origin']; delete responseHeaders['access-control-allow-credentials']
            if (responseHeaders['set-cookie']) responseHeaders['set-cookie'] = responseHeaders['set-cookie'].map(cookie => localCookie(cookie,!!req.socket.encrypted))
            if (responseHeaders.location) {
                const location = new URL(responseHeaders.location,upstream)
                if (location.origin === upstream.origin) responseHeaders.location = location.pathname+location.search
            }
            res.writeHead(response.statusCode,responseHeaders); response.pipe(res)
        })
        outgoing.setTimeout(20000,()=>outgoing.destroy(Error('API proxy timeout')))
        outgoing.on('error',()=>{if(!res.headersSent){res.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({message:'ارتباط امن proxy لوکال با API برقرار نشد.'}))}else res.destroy()})
        req.on('aborted',()=>outgoing.destroy())
        req.pipe(outgoing)
    }
}

module.exports = app => {
    const target = remote(process.env.REACT_APP_API_URL || '')
    if (target) app.use(createLocalApiProxy(target))
}
module.exports.createLocalApiProxy = createLocalApiProxy
module.exports.localCookie = localCookie

import {resolveBackendUrl, resolveWebSocketUrl} from './APP_URL'

test.each(['localhost', '127.0.0.1'])('local API follows frontend host %s', (hostname) => {
    expect(resolveBackendUrl('http://127.0.0.1:8000', hostname)).toBe(`http://${hostname}:8000`)
    expect(resolveBackendUrl('http://localhost:8000', hostname)).toBe(`http://${hostname}:8000`)
})

test('remote backend remains configured when frontend runs locally', () => {
    expect(resolveBackendUrl('https://api.mlkino.com', 'localhost')).toBe('https://api.mlkino.com')
})

test('remote frontend does not change the configured local backend', () => {
    expect(resolveBackendUrl('http://127.0.0.1:8000', 'panel.example.com')).toBe('http://127.0.0.1:8000')
})

test('production WebSocket uses TLS and preserves the API host',()=>{
 expect(resolveWebSocketUrl('https://api.mlkino.com')).toBe('wss://api.mlkino.com')
 expect(resolveWebSocketUrl('http://localhost:8000')).toBe('ws://localhost:8000')
 expect(resolveWebSocketUrl('http://localhost:8000','wss://api.mlkino.com')).toBe('wss://api.mlkino.com')
})

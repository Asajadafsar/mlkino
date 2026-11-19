import {resolveBackendUrl, resolveWebSocketUrl,resolveApiBaseUrl} from './APP_URL'

test.each(['localhost', '127.0.0.1'])('local API follows frontend host %s', (hostname) => {
    expect(resolveBackendUrl('http://127.0.0.1:8000', hostname)).toBe(`http://${hostname}:8000`)
    expect(resolveBackendUrl('http://localhost:8000', hostname)).toBe(`http://${hostname}:8000`)
})

test('remote backend remains configured when frontend runs locally', () => {
    expect(resolveBackendUrl('https://api.mlkino.com', 'localhost')).toBe('https://api.mlkino.com')
})

test('remote API uses the same-origin proxy only in loopback development',()=>{
 expect(resolveApiBaseUrl('https://api.mlkino.com','http://localhost:3000',true)).toBe('http://localhost:3000/api')
 expect(resolveApiBaseUrl('https://api.mlkino.com/api','http://127.0.0.1:3000',true)).toBe('http://127.0.0.1:3000/api')
 expect(resolveApiBaseUrl('https://api.mlkino.com','https://mlkino.com',false)).toBe('https://api.mlkino.com/api')
 expect(resolveApiBaseUrl('http://127.0.0.1:8000','http://localhost:3000',true)).toBe('http://127.0.0.1:8000/api')
})

test('remote frontend does not change the configured local backend', () => {
    expect(resolveBackendUrl('http://127.0.0.1:8000', 'panel.example.com')).toBe('http://127.0.0.1:8000')
})

test.each(['192.168.1.10','10.0.0.2','172.20.10.2'])('LAN API follows the development server host %s', hostname=>{
    expect(resolveBackendUrl('http://localhost:8000',hostname)).toBe(`http://${hostname}:8000`)
})

test('production WebSocket uses TLS and preserves the API host',()=>{
 expect(resolveWebSocketUrl('https://api.mlkino.com')).toBe('wss://api.mlkino.com')
 expect(resolveWebSocketUrl('http://localhost:8000')).toBe('ws://localhost:8000')
 expect(resolveWebSocketUrl('http://localhost:8000','wss://api.mlkino.com')).toBe('wss://api.mlkino.com')
})

import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {CurrentUserContext} from './CurrentUser'
import {RealtimeProvider, useRealtime} from './RealtimeContext'
import api from './Request'
jest.mock('./Request', () => ({__esModule: true, default: {get: jest.fn()}}))

let ws: any
let peer: any
const stop = jest.fn()
class Socket {
    static OPEN = 1
    readyState = 1
    onopen: any; onclose: any; onmessage: any; onerror: any
    send = jest.fn()
    close = jest.fn()
    constructor() {ws = this}
}
class Peer {
    connectionState = 'new'
    localDescription = {toJSON: () => ({type: 'offer', sdp: 'offer'})}
    onconnectionstatechange: any
    addTrack = jest.fn()
    close = jest.fn()
    createOffer = jest.fn(async () => ({type: 'offer', sdp: 'offer'}))
    setLocalDescription = jest.fn(async () => {})
    constructor(config: any) {peer = this; (this as any).config = config}
}
function Caller() {
    const {startCall, connected} = useRealtime()
    return <button disabled={!connected} onClick={() => startCall({id: 1, peer: {id: 2, full_name: 'مخاطب'}} as any)}>call</button>
}
test('active media survives a signaling disconnect and uses authenticated TURN configuration', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    Object.defineProperty(window, 'WebSocket', {configurable: true, value: Socket})
    Object.defineProperty(window, 'RTCPeerConnection', {configurable: true, value: Peer})
    Object.defineProperty(navigator, 'mediaDevices', {configurable: true, value: {getUserMedia: jest.fn(async () => ({getTracks: () => [{stop}]}))}})
    const servers = [{urls: 'turn:example.test:3478', username: 'temporary', credential: 'temporary'}]
    ;(api.get as jest.Mock).mockImplementation(async (path: string) => ({data: {data: path === 'chats/call-config/' ? {ice_servers: servers} : []}}))
    const view = render(<CurrentUserContext.Provider value={{user: {id: 1} as any, setUser: () => {}}}><RealtimeProvider><Caller /></RealtimeProvider></CurrentUserContext.Provider>)
    act(() => ws.onopen())
    fireEvent.click(screen.getByText('call'))
    await waitFor(() => expect(peer?.createOffer).toHaveBeenCalled())
    expect(peer.config.iceServers).toEqual(servers)
    act(() => {peer.connectionState = 'connected'; peer.onconnectionstatechange()})
    expect(screen.getByText('تماس برقرار است')).toBeTruthy()
    act(() => ws.onclose({code: 1006}))
    expect(screen.getByText('تماس برقرار است')).toBeTruthy()
    expect(peer.close).not.toHaveBeenCalled()
    expect(stop).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'پایان تماس'}))
    expect(peer.close).toHaveBeenCalled()
    expect(stop).toHaveBeenCalled()
    view.unmount()
})

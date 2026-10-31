import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {Alert, Avatar, Box, Button, Dialog, DialogContent, IconButton, Snackbar, Stack, Typography} from '@mui/material'
import CallEndRoundedIcon from '@mui/icons-material/CallEndRounded'
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded'
import MicRoundedIcon from '@mui/icons-material/MicRounded'
import api from './Request'
import {WS_URL, ACCOUNTS_URL} from './APP_URL'
import {CurrentUserContext} from './CurrentUser'
import type {ChatPeer, Conversation, RealtimeEvent} from '../Pages/Chats/types'

type Call = {id: string; conversation: number; peer: ChatPeer; video: boolean; incoming: boolean; status: 'ringing' | 'connecting' | 'active'; offer?: RTCSessionDescriptionInit}
type RealtimeValue = {connected: boolean; conversations: Conversation[]; lastEvent: RealtimeEvent | null; reload: () => Promise<void>; send: (event: string, data: any) => boolean; startCall: (conversation: Conversation, video?: boolean) => Promise<void>; error: string}
const Context = createContext<RealtimeValue>({connected: false, conversations: [], lastEvent: null, reload: async () => {}, send: () => false, startCall: async () => {}, error: ''})
export const useRealtime = () => useContext(Context)

function StreamMedia({stream, local = false, video = false}: {stream: MediaStream | null; local?: boolean; video?: boolean}) {
    const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null)
    useEffect(() => {if (ref.current) {ref.current.srcObject = stream; ref.current.play().catch(() => {})}}, [stream])
    if (video) return <video ref={ref} autoPlay playsInline muted={local} controls={!local} style={{width: '100%', maxHeight: 300, borderRadius: 16, background: '#111827'}} />
    return local ? null : <audio ref={ref} autoPlay controls style={{width: '100%'}} />
}

export function RealtimeProvider({children}: {children: React.ReactNode}) {
    const {user} = useContext(CurrentUserContext)
    const [connected, setConnected] = useState(false)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [call, setCall] = useState<Call | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [muted, setMuted] = useState(false)
    const socket = useRef<WebSocket | null>(null)
    const callRef = useRef<Call | null>(null)
    const pc = useRef<RTCPeerConnection | null>(null)
    const media = useRef<MediaStream | null>(null)
    const disconnectTimer = useRef<ReturnType<typeof setTimeout>>()
    const ice = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
    const signalHandler = useRef<(event: RealtimeEvent) => Promise<void>>(async () => {})
    const updateCall = (value: Call | null) => {callRef.current = value; setCall(value)}
    const reload = useCallback(async () => {
        try {const response = await api.get('chats/'); setConversations(response.data.data); setError('')}
        catch (error: any) {setError(error.message || 'دریافت گفتگوها انجام نشد')}
    }, [])
    const send = useCallback((event: string, data: any) => {
        if (socket.current?.readyState !== WebSocket.OPEN) return false
        socket.current.send(JSON.stringify({event, data})); return true
    }, [])
    const cleanup = useCallback(() => {
        clearTimeout(disconnectTimer.current)
        if (pc.current) {pc.current.onconnectionstatechange = null; pc.current.close(); pc.current = null}
        media.current?.getTracks().forEach(track => track.stop()); media.current = null
        setLocalStream(null); setRemoteStream(null); setMuted(false); ice.current.clear()
        callRef.current = null; setCall(null)
    }, [])
    const end = useCallback((notify = true) => {
        const current = callRef.current
        if (notify && current) send('call.end', {conversation: current.conversation, call_id: current.id})
        cleanup()
    }, [send, cleanup])
    const createPeer = async (current: Call) => {
        if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') throw new Error('مرورگر از تماس پشتیبانی نمی‌کند. از HTTPS یا localhost و مرورگر به‌روز استفاده کنید.')
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: current.video})
        if (callRef.current?.id !== current.id) {stream.getTracks().forEach(track => track.stop()); throw new Error('تماس پایان یافت')}
        media.current = stream; setLocalStream(stream)
        let servers: RTCIceServer[] = [{urls: 'stun:stun.l.google.com:19302'}]
        if (process.env.REACT_APP_ICE_SERVERS) servers = JSON.parse(process.env.REACT_APP_ICE_SERVERS)
        const peer = new RTCPeerConnection({iceServers: servers})
        pc.current = peer
        stream.getTracks().forEach(track => peer.addTrack(track, stream))
        peer.ontrack = event => setRemoteStream(event.streams[0] || new MediaStream([event.track]))
        peer.onicecandidate = event => {if (event.candidate) send('call.ice', {conversation: current.conversation, call_id: current.id, candidate: event.candidate.toJSON()})}
        peer.onconnectionstatechange = () => {
            if (peer.connectionState === 'connected' && callRef.current) {clearTimeout(disconnectTimer.current); updateCall({...callRef.current, status: 'active'})}
            if (peer.connectionState === 'disconnected') {
                clearTimeout(disconnectTimer.current)
                disconnectTimer.current = setTimeout(() => {if (peer.connectionState === 'disconnected') {setNotice('ارتباط مخاطب قطع شد.'); end()}}, 8000)
            }
            if (peer.connectionState === 'failed') {setNotice('ارتباط تماس برقرار نشد. شبکه یا تنظیمات TURN را بررسی کنید.'); end()}
        }
        return peer
    }
    const flushIce = async (id: string) => {
        const candidates = ice.current.get(id) || []; ice.current.delete(id)
        for (const candidate of candidates) await pc.current?.addIceCandidate(candidate)
    }
    const startCall = async (conversation: Conversation, video = false) => {
        if (callRef.current) {setNotice('ابتدا تماس فعلی را پایان دهید.'); return}
        if (!connected) {setNotice('برای تماس، اتصال لحظه‌ای باید برقرار باشد.'); return}
        const current: Call = {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, conversation: conversation.id, peer: conversation.peer, video, incoming: false, status: 'ringing'}
        updateCall(current)
        try {
            const peer = await createPeer(current)
            await peer.setLocalDescription(await peer.createOffer())
            if (!send('call.offer', {conversation: current.conversation, call_id: current.id, description: peer.localDescription?.toJSON(), video})) throw new Error('اتصال تماس قطع شد')
        } catch (error: any) {if ((callRef.current as Call | null)?.id === current.id) {setNotice(error.message || 'دسترسی میکروفون یا دوربین فراهم نشد'); end()}}
    }
    const accept = async () => {
        const current = callRef.current
        if (!current?.offer) return
        updateCall({...current, status: 'connecting'})
        try {
            const peer = await createPeer(current)
            await peer.setRemoteDescription(current.offer)
            await flushIce(current.id)
            await peer.setLocalDescription(await peer.createAnswer())
            send('call.answer', {conversation: current.conversation, call_id: current.id, description: peer.localDescription?.toJSON()})
        } catch (error: any) {setNotice(error.message || 'برقراری تماس انجام نشد'); end()}
    }
    signalHandler.current = async event => {
        const data = event.data
        const current = callRef.current
        if (event.event === 'call.offer') {
            if (current) {if (current.id !== data.call_id) send('call.reject', {conversation: data.conversation, call_id: data.call_id}); return}
            updateCall({id: data.call_id, conversation: data.conversation, peer: {id: data.sender.id, full_name: data.sender.name, role: ''}, video: Boolean(data.video), incoming: true, status: 'ringing', offer: data.description})
        } else if (event.event === 'call.ice') {
            if (current?.id === data.call_id && pc.current?.remoteDescription) await pc.current.addIceCandidate(data.candidate)
            else if (ice.current.size < 5) {const list = ice.current.get(data.call_id) || []; if (list.length < 100) ice.current.set(data.call_id, [...list, data.candidate])}
        } else if (current && current.id === data.call_id && current.conversation === data.conversation) {
            if (event.event === 'call.answer' && pc.current) {
                await pc.current.setRemoteDescription(data.description); await flushIce(current.id)
                updateCall({...current, status: 'connecting'})
            } else if (event.event === 'call.end' || event.event === 'call.reject') {setNotice(event.event === 'call.reject' ? 'مخاطب در دسترس نیست یا تماس را رد کرد.' : 'تماس پایان یافت.'); end(false)}
        }
    }
    useEffect(() => {
        let disposed = false
        let timer: ReturnType<typeof setTimeout>
        let refreshTimer: ReturnType<typeof setTimeout>
        let attempts = 0
        const connect = () => {
            if (disposed) return
            const url = new URL('/ws/inbox/', WS_URL)
            const ws = new WebSocket(url.toString()); socket.current = ws
            ws.onopen = () => {if (disposed) {ws.close(); return} attempts = 0; setConnected(true); reload()}
            ws.onmessage = event => {
                let parsed: RealtimeEvent
                try {parsed = JSON.parse(event.data)} catch {return}
                if (!parsed || typeof parsed.event !== 'string') return
                if (parsed.event.startsWith('call.')) signalHandler.current(parsed).catch(() => {setNotice('خطا در برقراری تماس'); end()})
                else if (parsed.event !== 'chat.pong' && parsed.event !== 'inbox.connected') {
                    setLastEvent(parsed)
                    if (['chat.message','account.notification'].includes(parsed.event) && document.hidden && typeof Notification!=='undefined' && Notification.permission==='granted') {
                        api.get(`${ACCOUNTS_URL}/preferences/`).then(response=>{
                            if(!response.data.data.notifications.browser)return
                            const data=parsed.data
                            if(parsed.event==='chat.message'&&data.message?.sender===user.id)return
                            const notification=new Notification(data.title||'پیام جدید در ملکینو',{body:data.body||data.message?.body||'یک پیام جدید دریافت کردید.',icon:'/assets/melkino-logo-hd.png',tag:parsed.event+':'+(data.id||data.conversation||'new')})
                            notification.onclick=()=>{window.focus();notification.close()}
                        }).catch(()=>{})
                    }
                    if (['chat.message', 'chat.message.read', 'chat.message.deleted'].includes(parsed.event)) {
                        clearTimeout(refreshTimer); refreshTimer = setTimeout(reload, 200)
                    }
                }
            }
            ws.onclose = event => {
                if (disposed) return
                setConnected(false)
                if (callRef.current) {setNotice('اتصال تماس قطع شد'); end(false)}
                timer = setTimeout(async () => {
                    if (event.code === 4401) {try {await api.get(`${ACCOUNTS_URL}/profile/`)} catch {return}}
                    connect()
                }, Math.min(15000, 1000 * 2 ** attempts++))
            }
            ws.onerror = () => ws.close()
        }
        reload(); connect()
        const heartbeat = setInterval(() => {send('chat.ping', {})}, 25000)
        return () => {disposed = true; clearTimeout(timer); clearTimeout(refreshTimer); clearInterval(heartbeat); socket.current?.close(); cleanup()}
    }, [user.id, reload, send, cleanup, end])
    useEffect(() => {
        if (!call || call.status === 'active') return
        const timeout = setTimeout(() => {setNotice('تماس پاسخ داده نشد یا اتصال برقرار نشد.'); end()}, 45000)
        return () => clearTimeout(timeout)
    }, [call, end])
    const toggleMute = () => {media.current?.getAudioTracks().forEach(track => {track.enabled = muted}); setMuted(!muted)}
    return <Context.Provider value={{connected, conversations, lastEvent, reload, send, startCall, error}}>
        {children}
        <Dialog open={Boolean(call)} fullWidth maxWidth="sm" disableEscapeKeyDown>
            <DialogContent sx={{p: 4, textAlign: 'center'}}>
                <Stack spacing={2} alignItems="center">
                    <Avatar src={call?.peer.avatar || undefined} sx={{width: 76, height: 76, bgcolor: '#e8f0ff', color: 'primary.main', fontSize: 30}}>{call?.peer.full_name?.[0] || 'م'}</Avatar>
                    <Typography variant="h5" fontWeight={700}>{call?.peer.full_name || 'تماس'}</Typography>
                    <Typography color="text.secondary">{call?.status === 'active' ? 'تماس برقرار است' : call?.status === 'connecting' ? 'در حال اتصال…' : call?.incoming ? `تماس ${call.video ? 'تصویری' : 'صوتی'} ورودی` : 'در حال تماس…'}</Typography>
                    <StreamMedia stream={remoteStream} video={call?.video} />
                    {call?.video && localStream && <Box sx={{width: 150, alignSelf: 'flex-end'}}><StreamMedia stream={localStream} local video /></Box>}
                    <Stack direction="row" gap={2} alignItems="center">
                        {call?.incoming && call.status === 'ringing' && <Button variant="contained" color="success" onClick={accept}>پاسخ به تماس</Button>}
                        {localStream && <IconButton aria-label={muted ? 'روشن کردن میکروفون' : 'بی‌صدا کردن میکروفون'} onClick={toggleMute}>{muted ? <MicOffRoundedIcon /> : <MicRoundedIcon />}</IconButton>}
                        <Button variant="contained" color="error" startIcon={<CallEndRoundedIcon />} onClick={() => end()}>{call?.incoming && call.status === 'ringing' ? 'رد تماس' : 'پایان تماس'}</Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
        <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice('')}><Alert severity="info" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
    </Context.Provider>
}

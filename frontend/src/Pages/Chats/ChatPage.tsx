import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {Alert, Avatar, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, ListItemButton, Paper, Stack, TextField, Tooltip, Typography} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {useSearchParams} from 'react-router-dom'
import {DataProvider} from '../../Core/DataProvider'
import APP_URL from '../../Core/APP_URL'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {useRealtime} from '../../Core/RealtimeContext'
import {TicketAttachment} from '../Tickets/TicketAttachment'
import {ChatMessage, ChatPeer, Conversation, mergeMessages} from './types'

const roleNames: Record<string, string> = {superadmin: 'مدیریت', agency: 'املاکی', expert: 'کارشناس', user: 'کاربر'}
const time = (date: string) => new Date(date).toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'})

export default function ChatPage() {
    const {user} = useContext(CurrentUserContext)
    const {connected, conversations, lastEvent, reload, send, startCall, error: inboxError} = useRealtime()
    const [params, setParams] = useSearchParams()
    const selectedId = Number(params.get('conversation')) || null
    const [selected, setSelected] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [body, setBody] = useState('')
    const [attachment, setAttachment] = useState<File | null>(null)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [newOpen, setNewOpen] = useState(false)
    const [contacts, setContacts] = useState<ChatPeer[]>([])
    const [contactSearch, setContactSearch] = useState('')
    const [contactsLoading, setContactsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [typing, setTyping] = useState(false)
    const bottom = useRef<HTMLDivElement>(null)
    const fileInput = useRef<HTMLInputElement>(null)
    const typingTimer = useRef<ReturnType<typeof setTimeout>>()
    const lastTyping = useRef(0)
    const selectedRef = useRef(selectedId)
    selectedRef.current = selectedId
    const choose = (id: number) => setParams({conversation: String(id)})
    const markRead = useCallback(async (rows: ChatMessage[], id: number) => {
        const unread = rows.filter(message => message.sender !== user.id && !message.read_at)
        if (!unread.length) return
        try {await DataProvider.post(`chats/${id}/read/`, {data: {last_message_id: Math.max(...rows.map(message => message.id))}}); await reload()}
        catch { /* Messages stay available; the next connection retries read status. */ }
    }, [user.id, reload])
    useEffect(() => {setMessages([]); setBody(''); setAttachment(null)}, [selectedId])
    useEffect(() => {
        let active = true
        if (!selectedId) {setSelected(null); setMessages([]); return}
        setLoading(true); setError('')
        Promise.all([
            DataProvider.get<Conversation>(`chats/${selectedId}/`),
            DataProvider.get<{results: ChatMessage[]; has_more: boolean}>(`chats/${selectedId}/messages/`),
        ]).then(([chat, history]) => {
            if (!active) return
            setSelected(chat.data); setMessages(previous => mergeMessages(previous, history.data.results)); setHasMore(history.data.has_more)
            markRead(history.data.results, selectedId)
        }).catch(error => {if (active) setError(error.message || 'گفتگو دریافت نشد')}).finally(() => {if (active) setLoading(false)})
        return () => {active = false; clearTimeout(typingTimer.current); setTyping(false)}
    }, [selectedId, markRead, connected])
    useEffect(() => {
        if (!newOpen) return
        let active = true
        setContactsLoading(true)
        const timer = setTimeout(() => {
            DataProvider.get<ChatPeer[]>(`chats/contacts/?search=${encodeURIComponent(contactSearch)}`).then(response => {if (active) setContacts(response.data)}).catch(error => {if (active) setError(error.message)}).finally(() => {if (active) setContactsLoading(false)})
        }, 250)
        return () => {active = false; clearTimeout(timer)}
    }, [newOpen, contactSearch])
    useEffect(() => {
        if (!lastEvent || !selectedId) return
        const {event, data} = lastEvent
        if (Number(data.conversation) !== selectedId) return
        if (event === 'chat.message') {
            setMessages(previous => mergeMessages(previous, [data]))
            if (!document.hidden) markRead([data], selectedId)
        } else if (event === 'chat.message.deleted') {
            setMessages(previous => previous.map(message => message.id === data.message_id ? {...message, body: '', attachment: null, deleted_at: new Date().toISOString()} : message))
        } else if (event === 'chat.message.read') {
            setMessages(previous => previous.map(message => message.sender !== data.reader_id && message.id <= data.last_message_id ? {...message, read_at: new Date().toISOString()} : message))
        } else if (event === 'chat.typing' && data.sender?.id !== user.id) {
            setTyping(Boolean(data.is_typing)); clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 2500)
        }
    }, [lastEvent, selectedId, user.id, markRead])
    useEffect(() => {bottom.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'})}, [messages.length, typing])
    const openConversation = async (peer: ChatPeer) => {
        setError('')
        try {const response = await DataProvider.post<Conversation>('chats/', {data: {user_id: peer.id}}); await reload(); setNewOpen(false); choose(response.data.id)}
        catch (error: any) {setError(error.message)}
    }
    const submit = async () => {
        if (!selectedId || sending || (!body.trim() && !attachment)) return
        const id = selectedId
        setSending(true); setError('')
        try {
            let data: FormData | Record<string, unknown> = {body: body.trim()}
            if (attachment) {data = new FormData(); data.append('body', body.trim()); data.append('attachment', attachment)}
            const response = await DataProvider.post<ChatMessage>(`chats/${id}/messages/`, {data})
            if (selectedRef.current === id) {setMessages(previous => mergeMessages(previous, [response.data])); setBody(''); setAttachment(null)}
            await reload()
        } catch (error: any) {setError(error.message || 'ارسال انجام نشد. متن پیام حفظ شده است.')}
        finally {setSending(false)}
    }
    const older = async () => {
        if (!selectedId || !messages.length) return
        try {const response = await DataProvider.get<{results: ChatMessage[]; has_more: boolean}>(`chats/${selectedId}/messages/?before=${messages[0].id}`); setMessages(previous => mergeMessages(previous, response.data.results)); setHasMore(response.data.has_more)}
        catch (error: any) {setError(error.message)}
    }
    const deleteMessage = async (message: ChatMessage) => {
        try {await DataProvider.delete(`chats/${message.conversation}/messages/${message.id}/`); setMessages(previous => previous.map(item => item.id === message.id ? {...item, deleted_at: new Date().toISOString(), body: '', attachment: null} : item))}
        catch (error: any) {setError(error.message)}
    }
    const filtered = conversations.filter(chat => (chat.peer.full_name || '').includes(search) || chat.last_message?.body.includes(search))
    return <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography variant="h2">چت و تماس</Typography><Typography color="text.secondary" variant="body2">گفتگوهای شما، نزدیک‌تر از همیشه</Typography></Box><Chip size="small" color={connected ? 'success' : 'warning'} variant="outlined" label={connected ? 'اتصال لحظه‌ای برقرار' : 'در حال اتصال مجدد…'} /></Stack>
        {(error || inboxError) && <Alert severity="error" onClose={() => setError('')}>{error || inboxError}</Alert>}
        {!connected && <Alert severity="info">اتصال لحظه‌ای برقرار نیست. برای دریافت پیام‌های جدید، اتصال سرور را بررسی کنید. پیام‌های شما محفوظ‌اند.</Alert>}
        <Paper variant="outlined" sx={{borderRadius: '18px', overflow: 'hidden', height: {xs: 'calc(100dvh - 260px)', md: 'calc(100dvh - 225px)'}, minHeight: 470, display: 'flex'}}>
            <Stack sx={{width: {xs: '100%', md: 300, lg: 330}, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', display: {xs: selectedId ? 'none' : 'flex', md: 'flex'}}}>
                <Stack direction="row" sx={{p: 2.5}} justifyContent="space-between" alignItems="center"><Typography fontWeight={700}>گفتگوها <Typography component="span" color="text.secondary">({conversations.length.toLocaleString('fa-IR')})</Typography></Typography><Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setNewOpen(true)}>گفتگوی جدید</Button></Stack>
                <Box sx={{px: 2, pb: 2}}><TextField fullWidth placeholder="جستجو در گفتگوها…" value={search} onChange={event => setSearch(event.target.value)} InputProps={{startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>}} /></Box>
                <Divider />
                <Box sx={{overflowY: 'auto', flex: 1}}>
                    {!filtered.length && <Stack sx={{p: 4, textAlign: 'center'}} alignItems="center" spacing={1}><ChatBubbleOutlineRoundedIcon sx={{fontSize: 38, color: '#b5c8ec'}} /><Typography color="text.secondary">هنوز گفتگویی ندارید</Typography><Button onClick={() => setNewOpen(true)}>شروع اولین گفتگو</Button></Stack>}
                    {filtered.map(chat => <ListItemButton key={chat.id} selected={selectedId === chat.id} onClick={() => choose(chat.id)} sx={{p: 2, borderBottom: '1px solid', borderColor: 'divider', gap: 1.5, '&.Mui-selected': {bgcolor: '#edf4ff', borderLeft: '3px solid #246bfd'}}}>
                        <Badge badgeContent={chat.unread_count} color="primary"><Avatar src={chat.peer.avatar || undefined} sx={{bgcolor: '#e9effc', color: '#4974c0'}}>{chat.peer.full_name?.[0] || 'م'}</Avatar></Badge>
                        <Box sx={{minWidth: 0, flex: 1}}><Stack direction="row" justifyContent="space-between"><Typography fontSize={13} fontWeight={700} noWrap>{chat.peer.full_name || `کاربر #${chat.peer.id}`}</Typography><Typography variant="caption" color="text.secondary">{time(chat.updated_at)}</Typography></Stack><Typography fontSize={11} color="text.secondary" noWrap>{chat.last_message?.deleted_at ? 'پیام حذف شده' : chat.last_message?.body || (chat.last_message?.attachment ? 'فایل پیوست' : 'شروع گفتگو')}</Typography></Box>
                    </ListItemButton>)}
                </Box>
            </Stack>
            <Stack sx={{flex: 1, minWidth: 0, display: {xs: selectedId ? 'flex' : 'none', md: 'flex'}}}>
                {loading ? <Stack alignItems="center" justifyContent="center" flex={1}><CircularProgress /></Stack> : !selected ? <Stack alignItems="center" justifyContent="center" flex={1} spacing={2} sx={{background: 'radial-gradient(ellipse at center,#edf4ff,transparent 70%)', p: 3}}><Box sx={{p: 3, bgcolor: '#eaf1ff', borderRadius: '28px'}}><ChatBubbleOutlineRoundedIcon sx={{fontSize: 52, color: 'primary.main'}} /></Box><Typography variant="h5">یک گفتگوی خوب از اینجا شروع می‌شود</Typography><Typography color="text.secondary">یک مخاطب انتخاب کنید؛ پیام بدهید یا تماس بگیرید.</Typography><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setNewOpen(true)}>گفتگوی جدید</Button></Stack> : <>
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider'}}>
                        <IconButton aria-label="بازگشت به گفتگوها" sx={{display: {md: 'none'}}} onClick={() => setParams({})}><ArrowForwardRoundedIcon /></IconButton>
                        <Avatar src={selected.peer.avatar || undefined}>{selected.peer.full_name?.[0] || 'م'}</Avatar><Box sx={{flex: 1}}><Typography fontWeight={700}>{selected.peer.full_name || `کاربر #${selected.peer.id}`}</Typography><Typography variant="caption" color={typing ? 'primary' : 'text.secondary'}>{typing ? 'در حال نوشتن…' : roleNames[selected.peer.role] || 'مخاطب'}</Typography></Box>
                        <Tooltip title="تماس صوتی"><span><IconButton aria-label="تماس صوتی" disabled={!connected} onClick={() => startCall(selected)}><CallOutlinedIcon /></IconButton></span></Tooltip><Tooltip title="تماس تصویری"><span><IconButton aria-label="تماس تصویری" disabled={!connected} onClick={() => startCall(selected, true)}><VideocamOutlinedIcon /></IconButton></span></Tooltip>
                    </Stack>
                    <Stack spacing={1.5} sx={{flex: 1, overflowY: 'auto', p: {xs: 2, md: 3}, bgcolor: 'background.default', backgroundImage: 'radial-gradient(#b9c8e326 .8px,transparent .8px)', backgroundSize: '18px 18px'}}>
                        {hasMore && <Button onClick={older}>نمایش پیام‌های قبلی</Button>}
                        {!messages.length && <Typography textAlign="center" color="text.secondary" sx={{my: 'auto'}}>اولین پیام را شما بنویسید.</Typography>}
                        {messages.map(message => {
                            const mine = message.sender === user.id
                            return <Stack key={message.id} direction="row" alignSelf={mine ? 'flex-start' : 'flex-end'} sx={{maxWidth: '85%'}} alignItems="center">
                                <Box sx={{p: 1.5, px: 2, bgcolor: mine ? 'primary.main' : 'background.paper', color: mine ? '#fff' : 'text.primary', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', boxShadow: '0 2px 8px #203b6c05', minWidth: 90}}>
                                    <Typography fontSize={13} sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{message.deleted_at ? 'این پیام حذف شده است' : message.body}</Typography>
                                    {!message.deleted_at && message.attachment && (message.attachment_kind === 'voice' ? <audio controls crossOrigin="use-credentials" src={new URL(message.attachment, APP_URL).toString()} style={{maxWidth: '100%'}} /> : <TicketAttachment attachment={message.attachment} />)}
                                    <Stack direction="row" justifyContent="flex-end" gap={.5} alignItems="center" sx={{opacity: .75, mt: .5}}><Typography fontSize={9}>{time(message.created_at)}</Typography>{mine && <DoneAllRoundedIcon sx={{fontSize: 14, opacity: message.read_at ? 1 : .45}} />}</Stack>
                                </Box>
                                {mine && !message.deleted_at && <IconButton size="small" aria-label="حذف پیام" onClick={() => deleteMessage(message)} sx={{opacity: .4, '&:hover': {opacity: 1}}}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>}
                            </Stack>
                        })}
                        <div ref={bottom} />
                    </Stack>
                    {attachment && <Stack direction="row" alignItems="center" sx={{px: 2}}><Typography variant="caption">{attachment.name}</Typography><IconButton size="small" onClick={() => setAttachment(null)}><CloseRoundedIcon fontSize="small" /></IconButton></Stack>}
                    <Stack component="form" onSubmit={event => {event.preventDefault(); submit()}} direction="row" gap={1} alignItems="flex-end" sx={{p: 2, borderTop: '1px solid', borderColor: 'divider'}}>
                        <input hidden ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.zip,.mp3,.ogg,.wav,.m4a,.webm" onChange={event => {const file = event.target.files?.[0]; if (file && file.size > 10 * 1024 * 1024) setError('حداکثر حجم پیوست ۱۰ مگابایت است'); else setAttachment(file || null); event.target.value = ''}} />
                        <IconButton aria-label="پیوست فایل" disabled={sending} onClick={() => fileInput.current?.click()}><AttachFileRoundedIcon /></IconButton>
                        <TextField fullWidth multiline maxRows={4} placeholder="پیام خود را بنویسید…" value={body} disabled={sending} inputProps={{maxLength: 10000, 'aria-label': 'متن پیام'}} onChange={event => {setBody(event.target.value); if (selectedId && Date.now() - lastTyping.current > 1200) {send('chat.typing', {conversation: selectedId, is_typing: true}); lastTyping.current = Date.now()}}} onKeyDown={event => {if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {event.preventDefault(); submit()}}} />
                        <Button type="submit" variant="contained" aria-label="ارسال پیام" disabled={sending || (!body.trim() && !attachment)} sx={{minWidth: 46, p: 1.3}}>{sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon sx={{transform: 'rotate(180deg)'}} />}</Button>
                    </Stack>
                </>}
            </Stack>
        </Paper>
        <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="xs"><DialogTitle>گفتگوی جدید</DialogTitle><DialogContent><TextField fullWidth autoFocus value={contactSearch} onChange={event => setContactSearch(event.target.value)} placeholder="جستجوی نام مخاطب…" sx={{my: 1}} />{contactsLoading ? <CircularProgress size={22} /> : contacts.length ? contacts.map(peer => <ListItemButton key={peer.id} onClick={() => openConversation(peer)} sx={{gap: 2, borderRadius: 2, mt: 1}}><Avatar src={peer.avatar || undefined}>{peer.full_name?.[0] || 'م'}</Avatar><Box><Typography>{peer.full_name || `کاربر #${peer.id}`}</Typography><Typography variant="caption" color="text.secondary">{roleNames[peer.role]}</Typography></Box></ListItemButton>) : <Typography color="text.secondary">مخاطبی پیدا نشد.</Typography>}</DialogContent></Dialog>
    </Stack>
}

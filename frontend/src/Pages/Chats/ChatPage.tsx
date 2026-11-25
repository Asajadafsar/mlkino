import {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {Alert, Avatar, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, ListItemButton, Paper, Stack, TextField, Tooltip, Typography} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import FileInput from '../Files/FileInput'
import './chatWorkspace.css'
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
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import {usePanelSettings} from '../../Core/PanelSettingsContext';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {useSearchParams,Link} from 'react-router-dom'
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
    const {settings}=usePanelSettings()
    const [notice,setNotice]=useState('')
    const {connected, conversations, lastEvent, reload, send, startCall, error: inboxError} = useRealtime()
    const [params, setParams] = useSearchParams()
    const selectedId = Number(params.get('conversation')) || null
    const propertyIntent=params.get('property')
    useEffect(()=>{if(!propertyIntent||params.get('conversation'))return;let active=true;DataProvider.post<any>(`workflows/properties/${propertyIntent}/chat/`,{data:{}}).then(async response=>{await reload();if(active)setParams({conversation:String(response.data.chat_id),property:propertyIntent},{replace:true})}).catch(e=>{if(active)setError(e.message||'گفتگوی این ملک برقرار نشد.')});return()=>{active=false}},[propertyIntent,params.get('conversation')])
    const [selected, setSelected] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [body, setBody] = useState('')
    const [attachment, setAttachment] = useState<File | null>(null)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [chatTab,setChatTab]=useState('all')
    const [showInfo,setShowInfo]=useState(false)
    const [newCall,setNewCall]=useState(false)
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
    useEffect(() => {setSelected(null); setMessages([]); setBody(''); setAttachment(null);setShowInfo(false)}, [selectedId])
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
        try {const response = await DataProvider.post<Conversation>('chats/', {data: {user_id: peer.id}}); await reload(); setNewOpen(false); choose(response.data.id);if(newCall){startCall(response.data);setNewCall(false)}}
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
        try {const response = await DataProvider.get<{results: ChatMessage[]; has_more: boolean}>(`chats/${selectedId}/messages/?before=${messages[0].id}`); if(selectedRef.current===selectedId){setMessages(previous => mergeMessages(previous, response.data.results)); setHasMore(response.data.has_more)}}
        catch (error: any) {setError(error.message)}
    }
    const deleteMessage = async (message: ChatMessage) => {
        try {await DataProvider.delete(`chats/${message.conversation}/messages/${message.id}/`); setMessages(previous => previous.map(item => item.id === message.id ? {...item, deleted_at: new Date().toISOString(), body: '', attachment: null} : item))}
        catch (error: any) {setError(error.message)}
    }
    const archiveSelected=async()=>{if(!selectedId||sending)return;setSending(true);try{await DataProvider.post('workflows/archive/',{data:{entity_type:'conversation',id:selectedId,archived:true}});await reload();setParams({});setNotice('گفتگو بایگانی شد.')}catch(e:any){setError(e.message||'بایگانی گفتگو انجام نشد.')}finally{setSending(false)}}
    const unreadCount=conversations.reduce((sum,chat)=>sum+chat.unread_count,0)
    const filtered = conversations.filter(chat => (chatTab!=='unread'||chat.unread_count>0)&&(chatTab!=='property'||!!chat.properties?.length)&&((chat.peer.full_name || '').includes(search) || chat.last_message?.body?.includes(search)))
    return <Stack spacing={2} className="chat-workspace">
        <header className="chat-hero" style={{'--chat-image':"url('/assets/estate-hero-v1.webp')"} as React.CSSProperties}><div className="chat-hero-title"><span><ChatBubbleOutlineRoundedIcon/></span><div><h1>چت و تماس</h1><p>گفتگوهای شما، ارتباط با مشتریان و پیگیری‌های مرتبط با املاک در یک مکان</p></div></div><div className="chat-hero-actions"><Button variant="contained" startIcon={<AddRoundedIcon/>} onClick={()=>{setNewCall(false);setNewOpen(true)}}>گفتگوی جدید</Button><Button variant="outlined" startIcon={<CallOutlinedIcon/>} disabled={!connected} onClick={()=>{setNewCall(true);setNewOpen(true)}}>تماس جدید</Button><div className="chat-unread-stat"><strong>{unreadCount.toLocaleString('fa-IR')}</strong><span>پیام خوانده‌نشده</span></div></div></header>
        {notice&&<Alert severity="success" onClose={()=>setNotice('')} action={<Button component={Link} to="/archives">مشاهده بایگانی</Button>}>{notice}</Alert>}
        {(error || inboxError) && <Alert severity="error" onClose={() => setError('')}>{error || inboxError}</Alert>}
        {!connected && <Alert severity="info">اتصال لحظه‌ای برقرار نیست. برای دریافت پیام‌های جدید، اتصال سرور را بررسی کنید. پیام‌های شما محفوظ‌اند.</Alert>}
        <Paper className="chat-columns" variant="outlined" sx={{borderRadius: '18px', overflow: 'hidden', height: {xs: 'calc(100dvh - 260px)', md: 'calc(100dvh - 225px)'}, minHeight: 470, display: 'flex'}}>
            <Stack className="chat-inbox" sx={{width: {xs: '100%', md: 300, lg: 330}, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', display: {xs: selectedId ? 'none' : 'flex', md: 'flex'}}}>
                <div className="chat-inbox-tabs">{[['all','همه گفتگوها'],['unread','خوانده‌نشده'],['property','مرتبط با ملک']].map(([key,text])=><button key={key} aria-pressed={chatTab===key} onClick={()=>setChatTab(key)}>{text}{key==='unread'&&unreadCount>0&&<b>{unreadCount.toLocaleString('fa-IR')}</b>}</button>)}</div>
                <Box sx={{px: 2, pb: 2}}><TextField size="small" inputProps={{'aria-label':'جستجو در گفتگوها'}} fullWidth placeholder="جستجو در گفتگوها…" value={search} onChange={event => setSearch(event.target.value)} InputProps={{startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>}} /></Box>
                <Divider />
                <Box sx={{overflowY: 'auto', flex: 1}}>
                    {!filtered.length && <Stack sx={{p: 4, textAlign: 'center'}} alignItems="center" spacing={1}><ChatBubbleOutlineRoundedIcon sx={{fontSize: 38, color: '#b5c8ec'}} /><Typography color="text.secondary">هنوز گفتگویی ندارید</Typography><Button onClick={() => {setNewCall(false);setNewOpen(true)}}>شروع اولین گفتگو</Button></Stack>}
                    {filtered.map(chat => <ListItemButton className="chat-inbox-item" key={chat.id} selected={selectedId === chat.id} onClick={() => choose(chat.id)} sx={{p: 2, borderBottom: '1px solid', borderColor: 'divider', gap: 1.5, '&.Mui-selected': {bgcolor: '#edf4ff', borderLeft: '3px solid #246bfd'}}}>
                        <Badge badgeContent={chat.unread_count} color="primary"><Avatar src={chat.peer.avatar || undefined} sx={{bgcolor: '#e9effc', color: '#4974c0'}}>{chat.peer.full_name?.[0] || 'م'}</Avatar></Badge>
                        <Box sx={{minWidth: 0, flex: 1}}><Stack direction="row" justifyContent="space-between"><Typography fontSize={13} fontWeight={700} noWrap>{chat.peer.full_name || `کاربر #${chat.peer.id}`}</Typography><Typography variant="caption" color="text.secondary">{time(chat.updated_at)}</Typography></Stack><Typography className="chat-preview" fontSize={11} color="text.secondary" noWrap>{chat.last_message?.deleted_at ? 'پیام حذف شده' : chat.last_message?.body || (chat.last_message?.attachment ? 'فایل پیوست' : 'شروع گفتگو')}</Typography></Box>
                    </ListItemButton>)}
                </Box>
            </Stack>
            <Stack className="chat-thread" sx={{flex: 1, minWidth: 0, display: {xs: selectedId ? 'flex' : 'none', md: 'flex'}}}>
                {loading ? <Stack alignItems="center" justifyContent="center" flex={1}><CircularProgress /></Stack> : !selected ? <Stack alignItems="center" justifyContent="center" flex={1} spacing={2} sx={{background: 'radial-gradient(ellipse at center,#edf4ff,transparent 70%)', p: 3}}><Box sx={{p: 3, bgcolor: '#eaf1ff', borderRadius: '28px'}}><ChatBubbleOutlineRoundedIcon sx={{fontSize: 52, color: 'primary.main'}} /></Box><Typography variant="h5">یک گفتگوی خوب از اینجا شروع می‌شود</Typography><Typography color="text.secondary">یک مخاطب انتخاب کنید؛ پیام بدهید یا تماس بگیرید.</Typography><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => {setNewCall(false);setNewOpen(true)}}>گفتگوی جدید</Button></Stack> : <>
                    <Stack className="chat-thread-heading" direction="row" alignItems="center" gap={1.5} sx={{px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider'}}>
                        <IconButton aria-label="بازگشت به گفتگوها" sx={{display: {md: 'none'}}} onClick={() => setParams({})}><ArrowForwardRoundedIcon /></IconButton>
                        <Avatar src={selected.peer.avatar || undefined}>{selected.peer.full_name?.[0] || 'م'}</Avatar><Box sx={{flex: 1}}><Typography fontWeight={700}>{selected.peer.full_name || `کاربر #${selected.peer.id}`}</Typography><Typography variant="caption" color={typing ? 'primary' : 'text.secondary'}>{typing ? 'در حال نوشتن…' : roleNames[selected.peer.role] || 'مخاطب'}</Typography></Box>
                        <IconButton aria-label="اطلاعات مخاطب" onClick={()=>setShowInfo(x=>!x)}><InfoOutlinedIcon/></IconButton>{settings.features.archives!==false&&<Tooltip title="بایگانی گفتگو"><span><IconButton aria-label="بایگانی گفتگو" disabled={sending} onClick={archiveSelected}><ArchiveOutlinedIcon/></IconButton></span></Tooltip>}<Tooltip title="تماس صوتی"><span><IconButton aria-label="تماس صوتی" disabled={!connected} onClick={() => startCall(selected)}><CallOutlinedIcon /></IconButton></span></Tooltip><Tooltip title="تماس تصویری"><span><IconButton aria-label="تماس تصویری" disabled={!connected} onClick={() => startCall(selected, true)}><VideocamOutlinedIcon /></IconButton></span></Tooltip>
                    </Stack>
                    {!!selected.properties?.length&&<Stack direction="row" flexWrap="wrap" gap={1} sx={{px:2,py:1,bgcolor:'background.paper'}}><Typography variant="caption">گفتگو درباره:</Typography>{selected.properties.map(property=><Chip key={property.id} size="small" component={Link} clickable to={`/${property.kind==='request'?'requests':'files'}?demo=0&detail=${property.id}`} label={property.title}/>)}</Stack>}
                    <Stack className="chat-message-history" spacing={1.5} sx={{flex: 1, overflowY: 'auto', p: {xs: 2, md: 3}, bgcolor: 'background.default', backgroundImage: 'radial-gradient(#b9c8e326 .8px,transparent .8px)', backgroundSize: '18px 18px'}}>
                        {hasMore && <Button onClick={older}>نمایش پیام‌های قبلی</Button>}
                        {!messages.length && <Typography textAlign="center" color="text.secondary" sx={{my: 'auto'}}>اولین پیام را شما بنویسید.</Typography>}
                        {messages.map(message => {
                            const mine = message.sender === user.id
                            return <Stack className={mine?"chat-message mine":"chat-message theirs"} key={message.id} direction="row" alignSelf={mine ? 'flex-start' : 'flex-end'} sx={{maxWidth: '85%'}} alignItems="center">
                                <Box className="chat-bubble" sx={{p: 1.5, px: 2, bgcolor: mine ? 'primary.main' : 'background.paper', color: mine ? '#fff' : 'text.primary', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', boxShadow: '0 2px 8px #203b6c05', minWidth: 90}}>
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
                    <div className="chat-quick-replies"><span>پیشنهاد پاسخ سریع:</span>{['موقعیت ملک را ارسال می‌کنم.','برای بازدید هماهنگ کنیم؟','مدارک را ارسال کردم.'].map(text=><button key={text} disabled={sending} onClick={()=>setBody(text)}>{text}</button>)}</div>
                    <Stack className="chat-compose" component="form" onSubmit={event => {event.preventDefault(); submit()}} direction="row" gap={1} alignItems="flex-end" sx={{p: 2, borderTop: '1px solid', borderColor: 'divider'}}>
                        <input hidden ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.zip,.mp3,.ogg,.wav,.m4a,.webm" onChange={event => {const file = event.target.files?.[0]; if (file && file.size > 10 * 1024 * 1024) setError('حداکثر حجم پیوست ۱۰ مگابایت است'); else setAttachment(file || null); event.target.value = ''}} />
                        <IconButton aria-label="پیوست فایل" disabled={sending} onClick={() => fileInput.current?.click()}><AttachFileRoundedIcon /></IconButton>
                        <TextField fullWidth multiline maxRows={4} placeholder="پیام خود را بنویسید…" value={body} disabled={sending} inputProps={{maxLength: 10000, 'aria-label': 'متن پیام'}} onChange={event => {setBody(event.target.value); if (selectedId && Date.now() - lastTyping.current > 1200) {send('chat.typing', {conversation: selectedId, is_typing: true}); lastTyping.current = Date.now()}}} onKeyDown={event => {if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {event.preventDefault(); submit()}}} />
                        <Button type="submit" variant="contained" aria-label="ارسال پیام" disabled={sending || (!body.trim() && !attachment)} sx={{minWidth: 46, p: 1.3}}>{sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon sx={{transform: 'rotate(180deg)'}} />}</Button>
                    </Stack>
                </>}
            </Stack>
            <aside className={'chat-contact-panel '+(showInfo?'is-open':'')}>
                <h2><InfoOutlinedIcon/>اطلاعات مخاطب<IconButton className="chat-info-close" aria-label="بستن اطلاعات مخاطب" onClick={()=>setShowInfo(false)}><CloseRoundedIcon/></IconButton></h2>
                {selected?<><div className="chat-contact-profile"><Avatar src={selected.peer.avatar||undefined}>{selected.peer.full_name?.[0]||'م'}</Avatar><strong>{selected.peer.full_name||'مخاطب'}</strong><span>{roleNames[selected.peer.role]||'کاربر'}</span></div><div className="chat-contact-actions"><Button disabled={!connected} onClick={()=>startCall(selected)}><CallOutlinedIcon/>تماس صوتی</Button><Button disabled={!connected} onClick={()=>startCall(selected,true)}><VideocamOutlinedIcon/>تماس تصویری</Button></div><section><h3>املاک و درخواست‌های مرتبط</h3>{selected.properties?.length?selected.properties.map(property=><Link className="chat-related-property" key={property.id} to={`/${property.kind==='request'?'requests':'files'}?demo=0&detail=${property.id}`}><ChatBubbleOutlineRoundedIcon/><div><strong>{property.title}</strong><small>{property.kind==='request'?'درخواست ملک':'فایل ملکی'} · مشاهده جزئیات</small></div></Link>):<p>ملک یا درخواستی به این گفتگو متصل نیست.</p>}</section><section><h3>پیوست‌های گفتگو</h3><p>{messages.filter(m=>!m.deleted_at&&m.attachment).length.toLocaleString('fa-IR')} پیوست در پیام‌های دریافت‌شده</p></section><section><h3>اقدامات سریع</h3><Button component={Link} to="/follow-ups">ثبت پیگیری</Button>{['superadmin','agency'].includes(user.role)&&<Button component={Link} to="/tasks/create">ایجاد وظیفه</Button>}</section><p className="chat-connection-note">{connected?'اتصال لحظه‌ای برقرار است':'در حال اتصال مجدد…'}</p></>:<div className="chat-contact-empty"><ChatBubbleOutlineRoundedIcon/><p>برای مشاهده اطلاعات مخاطب، یک گفتگو انتخاب کنید.</p></div>}
            </aside>
        </Paper>
        <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="xs"><DialogTitle>{newCall?'انتخاب مخاطب برای تماس':'گفتگوی جدید'}</DialogTitle><DialogContent><FileInput label="جستجوی مخاطب" fullWidth autoFocus value={contactSearch} onChange={event => setContactSearch(event.target.value)} placeholder="جستجوی نام مخاطب…" sx={{my: 1}} />{contactsLoading ? <CircularProgress size={22} /> : contacts.length ? contacts.map(peer => <ListItemButton key={peer.id} onClick={() => openConversation(peer)} sx={{gap: 2, borderRadius: 2, mt: 1}}><Avatar src={peer.avatar || undefined}>{peer.full_name?.[0] || 'م'}</Avatar><Box><Typography>{peer.full_name || `کاربر #${peer.id}`}</Typography><Typography variant="caption" color="text.secondary">{roleNames[peer.role]}</Typography></Box></ListItemButton>) : <Typography color="text.secondary">مخاطبی پیدا نشد.</Typography>}</DialogContent></Dialog>
    </Stack>
}

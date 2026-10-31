import {useContext, useEffect, useState} from 'react'
import {Alert, Box, Button, Grid, Paper, Skeleton, Stack, Typography} from '@mui/material'
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import {Link} from 'react-router-dom'
import {DataProvider} from '../../Core/DataProvider'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import {useRealtime} from '../../Core/RealtimeContext'
import {formatDate} from '../../Core/FormatDate'
import type {AnnouncementType} from '../Announcement/Announcement'
import TodayImportantTasks from './TodayImportantTasks'

export interface FilterState {year: number; month: string}

// A lightweight vector scene keeps the dashboard crisp at every screen size.
function CityScene() {
    return <svg viewBox="0 0 520 230" aria-hidden="true" style={{width: '100%', height: '100%'}}><defs><linearGradient id="hero-sky" x2="0" y2="1"><stop stopColor="#c9e0ff"/><stop offset="1" stopColor="#f1f7ff"/></linearGradient><linearGradient id="hero-wall" x2="1" y2="1"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#bacce7"/></linearGradient><linearGradient id="hero-glass" x2="1" y2="1"><stop stopColor="#8aaed8"/><stop offset="1" stopColor="#344a69"/></linearGradient></defs><rect width="520" height="230" fill="url(#hero-sky)" opacity=".35"/><circle cx="342" cy="63" r="32" fill="#ffdf94" opacity=".7"/>{[12,65,110,347,397,449].map((x,i)=><g key={x} opacity=".25"><rect x={x} y={80+i%3*16} width={36+i%2*12} height={140} fill="#7ca5e8" rx="2"/>{[0,1,2,3,4].map(y=><path key={y} d={`M${x+8} ${96+y*18} h20`} stroke="#e5f0ff" strokeWidth="5"/>)}</g>)}<path d="M0 224 Q140 187 260 211 T520 218V230H0Z" fill="#bdd5df"/><ellipse cx="236" cy="221" rx="155" ry="9" fill="#7c9baa" opacity=".2"/><path d="M112 137 L222 87 L339 133 L232 173Z" fill="#fbfdff"/><path d="M112 137 L232 173 V229H112Z" fill="url(#hero-wall)"/><path d="M232 173 L339 133V222L232 229Z" fill="#c7d6e9"/><path d="M124 150L223 182V220H124Z" fill="url(#hero-glass)"/>{[151,180,208].map(x=><path key={x} d={`M${x} ${154+(x-124)*.32}V224`} stroke="#dfd8cc" strokeWidth="5"/>)}<path d="M245 178L324 148V214L245 220Z" fill="url(#hero-glass)"/><path d="M272 167V220M300 156V218" stroke="#ece4d9" strokeWidth="5"/><path d="M103 136L222 81L348 130L340 140L222 98L111 148Z" fill="#ecf2fa"/><rect x="169" y="108" width="48" height="36" rx="2" fill="#e6edf7"/><path d="M170 108L218 91L239 100L193 117Z" fill="#fff"/>{[50,83,371,406,460].map((x,i)=><g key={x}><path d={`M${x} 230V${175+i%2*15}`} stroke="#729386" strokeWidth="5"/><circle cx={x} cy={175+i%2*15} r={23-i%2*5} fill={i%2 ? '#a5cfae' : '#89bd98'}/><circle cx={x-7} cy={167+i%2*15} r="13" fill="#b8dbb5"/></g>)}</svg>
}
function Section({title, icon, action, href}: {title: string; icon: React.ReactNode; action: string; href: string}) {
    return <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{mb: 1.5}}><Stack direction="row" alignItems="center" gap={1.2}><Box sx={{bgcolor: '#fff0db', color: '#ed9a23', p: 1, display: 'flex', borderRadius: '12px'}}>{icon}</Box><Typography variant="h3">{title}</Typography></Stack><Button component={Link} to={href} variant="outlined" size="small" endIcon={<ArrowBackRoundedIcon fontSize="small" />}>{action}</Button></Stack>
}
export default function DashboardLayout() {
    const {user} = useContext(CurrentUserContext)
    const {settings} = usePanelSettings()
    const {conversations} = useRealtime()
    const [dashboard, setDashboard] = useState<{announcements: {results: AnnouncementType[]; total_results: number}; important_tasks: {total_results: number; completed_count: number; pending_count: number}} | null>(null)
    const [error, setError] = useState('')
    useEffect(() => {let active = true; DataProvider.get<any>('dashboard/').then(response => {if (active) setDashboard(response.data)}).catch(error => {if (active) setError(error.message)}); return () => {active = false}}, [])
    const stats = [
        {label: 'گفتگوهای شما', value: conversations.length, icon: <ChatBubbleOutlineRoundedIcon />, color: '#246bfd', bg: '#e7f0ff'},
        {label: 'کارهای امروز', value: dashboard?.important_tasks.total_results, icon: <AssignmentTurnedInRoundedIcon />, color: '#f39b20', bg: '#fff3dd'},
        {label: 'کارهای انجام‌شده', value: dashboard?.important_tasks.completed_count, icon: <TaskAltRoundedIcon />, color: '#13b968', bg: '#ddf9eb'},
    ]
    return <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{borderRadius: '18px', minHeight: 200, position: 'relative', overflow: 'hidden', background: 'linear-gradient(105deg,#e1edff,#eff5ff)', border: '1px solid #e1ecff', color: '#17243b'}}>
            <Box sx={{position: 'absolute', right: 0, bottom: 0, width: {xs: 200, lg: 410}, height: 210, opacity: {xs: .25, md: .9}}}><CityScene /></Box>
            <Stack direction={{xs: 'column', lg: 'row'}} justifyContent="space-between" alignItems={{lg: 'center'}} gap={3} sx={{position: 'relative', p: {xs: 3, md: 4}, pr: {lg: '33%'}}}>
                <Box sx={{minWidth: 225}}><Typography fontWeight={900} fontSize={{xs: 23, md: 26}}>سلام {user.first_name || 'دوست عزیز'} <span style={{fontSize: 24}}>👋</span></Typography><Typography fontSize={18} fontWeight={700} sx={{mt: .8}}>به پنل {settings.general.shortName} خوش آمدید</Typography><Typography fontSize={11} color="#7b879d" sx={{mt: 2}}>امروز {new Date().toLocaleDateString('fa-IR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}، روز خوبی داشته باشید.</Typography></Box>
                <Stack direction="row" gap={1.3} sx={{flexWrap: 'wrap'}}>{stats.map(stat => <Stack key={stat.label} direction="row" alignItems="center" gap={1.2} sx={{bgcolor: '#ffffffd9', border: '1px solid #fff', borderRadius: '14px', px: 1.5, py: 1.2, minWidth: 135}}><Box sx={{color: stat.color, bgcolor: stat.bg, p: 1, display: 'flex', borderRadius: '11px'}}>{stat.icon}</Box><Box><Typography fontWeight={900} fontSize={21}>{stat.value === undefined ? '—' : stat.value.toLocaleString('fa-IR')}</Typography><Typography fontSize={10} color="#7b879d">{stat.label}</Typography></Box></Stack>)}</Stack>
            </Stack>
        </Box>
        <Box><Section title="اطلاعیه‌ها" icon={<CampaignRoundedIcon fontSize="small" />} href={user.role === 'superadmin' ? '/announcements' : '/dashboard'} action="مشاهده همه" />
            {!dashboard ? <Skeleton height={170} variant="rounded" /> : dashboard.announcements.results.length ? <Grid container spacing={2}>{dashboard.announcements.results.slice(0, 4).map((announcement, index) => <Grid key={announcement.id} item xs={12} md={6}><Paper variant="outlined" sx={{p: 2.5, borderRadius: '16px', minHeight: 200, position: 'relative', overflow: 'hidden'}}><Stack direction="row" justifyContent="space-between" gap={2}><Box sx={{flex: 1, minWidth: 0}}><Stack direction="row" alignItems="center" gap={1}><Box sx={{color: 'primary.main', bgcolor: '#edf4ff', display: 'flex', p: 1, borderRadius: 2}}><CampaignRoundedIcon /></Box><Typography fontWeight={700}>{announcement.title}</Typography></Stack><Typography color="text.secondary" sx={{mt: 2, fontSize: 13, lineHeight: 2.1, whiteSpace: 'pre-wrap'}}>{announcement.description}</Typography><Stack direction="row" gap={.8} alignItems="center" sx={{mt: 3, color: 'text.secondary'}}><CalendarMonthOutlinedIcon sx={{fontSize: 14}} /><Typography fontSize={10}>{formatDate(announcement.created_at)}</Typography></Stack></Box><Stack alignItems="center" justifyContent="center" sx={{width: {xs: 65, lg: 140}, flexShrink: 0, borderRadius: '35px 12px 35px 12px', bgcolor: index % 2 ? '#f0edff' : '#edf4ff'}}><CampaignRoundedIcon sx={{fontSize: {xs: 45, lg: 78}, color: index % 2 ? '#8b86ee' : '#79a9fa', filter: 'drop-shadow(0px 10px 8px #88aaff55)', transform: 'rotate(-15deg)'}} /></Stack></Stack></Paper></Grid>)}</Grid> : <Paper variant="outlined" sx={{p: 3, textAlign: 'center', borderRadius: '16px'}}><CampaignRoundedIcon sx={{color: '#b8cbed', fontSize: 38}} /><Typography color="text.secondary">اطلاعیه جدیدی منتشر نشده است.</Typography></Paper>}
        </Box>
        <Box><Section title="کارهای مهم امروز" icon={<AssignmentTurnedInRoundedIcon fontSize="small" />} href="/tasks" action="مدیریت وظایف" /><TodayImportantTasks /></Box>
        <Grid container spacing={2} sx={{width: 'calc(100% + 16px) !important', ml: '-16px !important', mt: '8px !important'}}>{[
            {title: 'گفتگوهای فعال', value: conversations.length, icon: <ChatBubbleOutlineRoundedIcon />, color: '#13b968', href: '/chats'},
            {title: 'پیام‌های خوانده‌نشده', value: conversations.reduce((sum, chat) => sum + chat.unread_count, 0), icon: <ChatBubbleOutlineRoundedIcon />, color: '#246bfd', href: '/chats'},
            {title: 'وظایف در انتظار', value: dashboard?.important_tasks.pending_count, icon: <AssignmentTurnedInRoundedIcon />, color: '#f39b20', href: '/tasks'},
            {title: 'اطلاعیه‌های منتشرشده', value: dashboard?.announcements.total_results, icon: <CampaignRoundedIcon />, color: '#9b66ed', href: user.role === 'superadmin' ? '/announcements' : '/dashboard'},
        ].map(item => <Grid key={item.title} item xs={6} lg={3}><Paper variant="outlined" sx={{p: 2, borderRadius: '14px', borderColor: `${item.color}35`, background: `linear-gradient(125deg, ${item.color}08, transparent)`, overflow: 'hidden', position: 'relative'}}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography fontWeight={900} fontSize={22}>{item.value === undefined ? '—' : item.value.toLocaleString('fa-IR')}</Typography><Box sx={{p: 1.4, display: 'flex', color: item.color, bgcolor: `${item.color}15`, borderRadius: '15px'}}>{item.icon}</Box></Stack><Typography color="text.secondary" fontSize={12} sx={{mt: 1}}>{item.title}</Typography><Button component={Link} to={item.href} size="small" endIcon={<ArrowBackRoundedIcon sx={{fontSize: '14px !important'}} />} sx={{p: 0, mt: 1, minHeight: 24, color: item.color}}>مشاهده</Button></Paper></Grid>)}</Grid>
    </Stack>
}

import {Badge, Box, IconButton, Tooltip, useMediaQuery, useTheme} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import {useEffect, useState} from 'react'
import {DataProvider} from '../../Core/DataProvider'
import {Link,useNavigate} from 'react-router-dom'
import './appbar.css'
import AppbarProfile from './AppbarProfile'
import AppbarSearch from './AppbarSearch'
import NewActivity from './NewActivity'
import {useRealtime} from '../../Core/RealtimeContext'
import {usePanelSettings} from '../../Core/PanelSettingsContext'

export default function Appbar({drawerOpen, setDrawerOpen, user, collapsed = false, onToggleCollapse}: {collapsed?: boolean; onToggleCollapse?: () => void; selectedTitle: string; drawerOpen: boolean; setDrawerOpen: (value: boolean) => void; user: any}) {
    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('mdl'))
    const navigate = useNavigate()
    const {conversations} = useRealtime()
    const {settings} = usePanelSettings()
    const unread = conversations.reduce((total, chat) => total + chat.unread_count, 0)
    const [remindersDue, setRemindersDue] = useState(0)
    useEffect(() => {
        let active = true
        const refresh = () => DataProvider.get<{results: {remind_at: string; is_done: boolean}[]}>('reminders/?is_done=false&page_size=100').then(response => {
            if (!active) return
            const now = Date.now()
            setRemindersDue(response.data.results.filter(row => !row.is_done && new Date(row.remind_at).getTime() <= now).length)
        }).catch(() => undefined)
        refresh()
        const timer = window.setInterval(refresh, 60_000)
        window.addEventListener('focus', refresh)
        window.addEventListener('mlkino:reminders-changed', refresh)
        return () => {active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('mlkino:reminders-changed', refresh)}
    }, [])
    const panelLabel=user.role==='superadmin'?'پنل مدیریت':user.role==='agency'?'پنل املاک':user.role==='expert'?'پنل کارشناسی':'پنل کاربری'
    return <Box component="header" className="panel-header" data-color-mode={theme.palette.mode} sx={{position:'fixed',top:{xs:8,sm:12},right:{xs:8,sm:12},left:{xs:8,sm:12},zIndex:theme.zIndex.appBar}}>
        <div className="panel-header-inner">
            <Link to="/dashboard" className="panel-header-brand" aria-label={`پیشخوان ${settings.general.shortName}`}>
                <img src={(mobile?settings.branding.mobileLogo:'')||settings.branding.logo||'/assets/melkino-logo-hd.webp'} alt=""/>
                <span><strong>{settings.general.shortName}</strong><small>{panelLabel}</small></span>
            </Link>
            <IconButton className="panel-header-icon panel-header-menu" aria-label={mobile?'باز کردن منو':collapsed?'باز کردن سایدبار':'جمع کردن سایدبار'} aria-expanded={mobile?drawerOpen:!collapsed} onClick={()=>mobile?setDrawerOpen(!drawerOpen):onToggleCollapse?.()}><MenuRoundedIcon/></IconButton>
            <div className="panel-header-search"><AppbarSearch/></div>
            <div className="panel-header-actions">
                <NewActivity/>
                {settings.features.chats&&<Tooltip title="گفتگوها و تماس‌ها"><IconButton className="panel-header-icon" aria-label="گفتگوها و تماس‌ها" onClick={()=>navigate('/chats')}><Badge badgeContent={unread.toLocaleString('fa-IR')} invisible={!unread} color="error"><ChatBubbleOutlineRoundedIcon/></Badge></IconButton></Tooltip>}
                <Tooltip title="یادآوری‌ها"><IconButton className="panel-header-icon" aria-label="یادآوری‌ها" onClick={()=>navigate('/reminders')}><Badge badgeContent={remindersDue.toLocaleString('fa-IR')} invisible={!remindersDue} color="error"><NotificationsNoneRoundedIcon/></Badge></IconButton></Tooltip>
                <AppbarProfile user={user}/>
            </div>
        </div>
    </Box>
}

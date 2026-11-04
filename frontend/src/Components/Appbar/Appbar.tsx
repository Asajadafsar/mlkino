import {Badge, Box, IconButton, Stack, Tooltip, useMediaQuery, useTheme} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import {useEffect, useState} from 'react'
import {DataProvider} from '../../Core/DataProvider'
import {useNavigate} from 'react-router-dom'
import {drawerWidth} from '../Drawer/AppDrawer'
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
    return <Box component="header" sx={{position: 'fixed', top: 0, right: 0, left: {xs: 0, mdl: collapsed ? 78 : drawerWidth}, transition: 'left .2s, right .2s', height: 84, zIndex: theme.zIndex.appBar, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: {xs: 1.5, md: 3}}}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{height: '100%'}} gap={2}>
            <IconButton aria-label={mobile ? "باز کردن منو" : collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"} onClick={() => mobile ? setDrawerOpen(!drawerOpen) : onToggleCollapse?.()}><MenuRoundedIcon /></IconButton>
            <Box sx={{flex: 1, maxWidth: 440, display: {xs: 'none', sm: 'block'}}}><AppbarSearch /></Box>
            <Stack direction="row" gap={{xs: 1, md: 2}} alignItems="center">
                <Box sx={{display: {xs: 'none', md: 'block'}}}><NewActivity /></Box>
                {settings.features.chats&&<Tooltip title="گفتگوها و تماس‌ها"><IconButton aria-label="گفتگوها و تماس‌ها" onClick={() => navigate('/chats')} sx={{border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover'}}><Badge badgeContent={unread} color="error"><ChatBubbleOutlineRoundedIcon fontSize="small" /></Badge></IconButton></Tooltip>}
                <Tooltip title="یادآوری‌ها"><IconButton aria-label="یادآوری‌ها" onClick={() => navigate('/reminders')} sx={{border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover'}}><Badge badgeContent={remindersDue} color="error"><NotificationsActiveRoundedIcon fontSize="small" /></Badge></IconButton></Tooltip>
                <AppbarProfile user={user} />
            </Stack>
        </Stack>
    </Box>
}

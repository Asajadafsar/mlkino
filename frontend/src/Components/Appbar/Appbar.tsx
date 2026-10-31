import {Badge, Box, IconButton, Stack, Tooltip, useMediaQuery, useTheme} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import {useNavigate} from 'react-router-dom'
import {drawerWidth} from '../Drawer/AppDrawer'
import AppbarProfile from './AppbarProfile'
import AppbarSearch from './AppbarSearch'
import NewActivity from './NewActivity'
import {useRealtime} from '../../Core/RealtimeContext'

export default function Appbar({drawerOpen, setDrawerOpen, user, collapsed = false, onToggleCollapse}: {collapsed?: boolean; onToggleCollapse?: () => void; selectedTitle: string; drawerOpen: boolean; setDrawerOpen: (value: boolean) => void; user: any}) {
    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('mdl'))
    const navigate = useNavigate()
    const {conversations} = useRealtime()
    const unread = conversations.reduce((total, chat) => total + chat.unread_count, 0)
    return <Box component="header" sx={{position: 'fixed', top: 0, right: 0, left: {xs: 0, mdl: collapsed ? 78 : drawerWidth}, transition: 'left .2s, right .2s', height: 84, zIndex: theme.zIndex.appBar, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: {xs: 1.5, md: 3}}}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{height: '100%'}} gap={2}>
            <IconButton aria-label={mobile ? "باز کردن منو" : collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"} onClick={() => mobile ? setDrawerOpen(!drawerOpen) : onToggleCollapse?.()}><MenuRoundedIcon /></IconButton>
            <Box sx={{flex: 1, maxWidth: 440, display: {xs: 'none', sm: 'block'}}}><AppbarSearch /></Box>
            <Stack direction="row" gap={{xs: 1, md: 2}} alignItems="center">
                <Box sx={{display: {xs: 'none', md: 'block'}}}><NewActivity /></Box>
                <Tooltip title="گفتگوها و تماس‌ها"><IconButton aria-label="گفتگوها و تماس‌ها" onClick={() => navigate('/chats')} sx={{border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover'}}><Badge badgeContent={unread} color="error"><ChatBubbleOutlineRoundedIcon fontSize="small" /></Badge></IconButton></Tooltip>
                <Tooltip title="تیکت‌های پشتیبانی"><IconButton aria-label="تیکت‌های پشتیبانی" onClick={() => navigate('/tickets')} sx={{border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover'}}><NotificationsNoneRoundedIcon fontSize="small" /></IconButton></Tooltip>
                <AppbarProfile user={user} />
            </Stack>
        </Stack>
    </Box>
}

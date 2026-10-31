import {Box, Button, Drawer, List, ListItemButton, ListItemIcon, Stack, Typography, IconButton, Tooltip, useMediaQuery, useTheme} from '@mui/material'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import {useEffect} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {drawerItems, canAccessDrawerItem} from './DrawerItems'
import {clearRole, selectRole} from '../../redux/RoleSlice'
import {clearImpersonation, selectImpersonation} from '../../redux/ImpersonationSlice'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import {exitImpersonation, reloadIdentity} from '../../Core/Impersonation'
import api from '../../Core/Request'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import {setUtil} from '../../redux/UtilSlice'

export const drawerWidth = 258
export function AppDrawer({setSelectedTitle, drawerOpen, setDrawerOpen, collapsed = false, onToggleCollapse}: {collapsed?: boolean; onToggleCollapse?: () => void; user?: any; setSelectedTitle: (title: string) => void; drawerOpen: boolean; setDrawerOpen: (open: boolean) => void}) {
    const role = useSelector(selectRole)
    const {session} = useSelector(selectImpersonation)
    const {settings} = usePanelSettings()
    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('mdl'))
    const rail = collapsed && !mobile
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const visible = drawerItems.filter(item => canAccessDrawerItem(item, role))
    const selected = visible.filter(item => location.pathname === `/${item.link}` || location.pathname.startsWith(`/${item.link}/`)).sort((a,b) => b.link.length - a.link.length)[0]
    useEffect(() => {setSelectedTitle(selected?.title ?? '')}, [selected?.title, setSelectedTitle])
    const logout = async () => {
        try {
            if (session?.active) {await exitImpersonation(); reloadIdentity(); return}
            await api.post(`${ACCOUNTS_URL}/logout/`)
            dispatch(clearRole()); dispatch(clearImpersonation()); navigate('/login', {replace: true})
        } catch (error: any) {dispatch(setUtil({open: true, message: error.message || 'خروج انجام نشد', severity: 'error'}))}
    }
    return <Drawer anchor="left" variant={mobile ? 'temporary' : 'permanent'} open={!mobile || drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{'& .MuiDrawer-paper': {width: rail ? 78 : drawerWidth, transition: 'width .2s', overflowX: 'hidden', border: 0, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none'}}}>
        <Stack sx={{height: '100%', minHeight: 0}}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{height: 84, px: rail ? 1 : 3, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider'}}>
                <Stack direction="row" alignItems="center" gap={1} onClick={() => navigate('/dashboard')} sx={{cursor: 'pointer'}}>
                    <Box component="img" src={(rail || mobile ? settings.branding.mobileLogo : '') || settings.branding.logo || '/assets/melkino-logo-hd.png'} alt={settings.general.panelName} sx={{width: rail ? 42 : 68, height: rail ? 42 : 68, objectFit: 'contain', borderRadius: '15px'}} />
                </Stack>
                {!rail && <IconButton aria-label={mobile ? 'بستن منو' : 'جمع کردن سایدبار'} onClick={() => mobile ? setDrawerOpen(false) : onToggleCollapse?.()}><KeyboardDoubleArrowRightRoundedIcon fontSize="small" /></IconButton>}
            </Stack>
            <List sx={{flex: 1, overflow: 'auto', px: rail ? .7 : 2.2, py: 2, minHeight: 0}}>
                {visible.map(item => {
                    const active = selected?.link === item.link
                    return <Tooltip key={item.link} title={rail ? item.title : ''} placement="right"><ListItemButton disabled={item.disabled} selected={active} onClick={() => {navigate(`/${item.link}`); if (mobile) setDrawerOpen(false)}} sx={{borderRadius: '12px', mb: .65, minHeight: 46, py: .8, px: 1.8, color: 'text.secondary', '&.Mui-selected': {color: '#fff', background: 'linear-gradient(105deg, #82acff, #246bfd)', boxShadow: '0 8px 20px #246bfd20', '&:hover': {bgcolor: 'primary.main'}}}}>
                        <ListItemIcon sx={{minWidth: rail ? 0 : 35, mx: rail ? 'auto' : 0, color: active ? '#fff' : '#929bad', '& .MuiSvgIcon-root': {fontSize: '23px !important'}}}>{item.icon}</ListItemIcon>
                        {!rail && <Typography fontSize={14} fontWeight={active ? 700 : 500}>{item.title}</Typography>}
                    </ListItemButton></Tooltip>
                })}
            </List>
            <Box sx={{px: rail ? .7 : 2.2, py: 1.7, borderTop: '1px solid', borderColor: 'divider'}}>
                {rail && <IconButton aria-label="باز کردن سایدبار" onClick={onToggleCollapse} sx={{mb: 1}}><KeyboardDoubleArrowRightRoundedIcon sx={{transform: 'rotate(180deg)'}} /></IconButton>}
                <Button fullWidth aria-label={session?.active ? 'بازگشت به حساب مدیر' : 'خروج از حساب'} color="error" onClick={logout} startIcon={<LogoutRoundedIcon />} sx={{bgcolor: '#fff1f3', border: '1px solid #ffe0e5'}}>{!rail && (session?.active ? 'بازگشت به حساب مدیر' : 'خروج از حساب')}</Button>
            </Box>
        </Stack>
    </Drawer>
}

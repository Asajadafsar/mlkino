import {Box, Button, Collapse, Drawer, List, ListItemButton, ListItemIcon, Stack, Typography, IconButton, Tooltip, useMediaQuery, useTheme} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {useEffect,useState} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import featureOptions from '../../Pages/Settings/featureOptions.json'
import {drawerGroups,drawerItems, canAccessDrawerItem} from './DrawerItems'
import {selectRole} from '../../redux/RoleSlice'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import {LANDING_URL} from '../../Pages/Auth/Shared/LandingEntry'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import {SidebarBrandMark, SidebarSkyline} from './SidebarArtwork'
import type {DrawerItemType} from './DrawerItems'
import './sidebar.css'

export const drawerWidth = 264
export function AppDrawer({user,setSelectedTitle, drawerOpen, setDrawerOpen, collapsed = false}: {collapsed?: boolean; user?: any; setSelectedTitle: (title: string) => void; drawerOpen: boolean; setDrawerOpen: (open: boolean) => void}) {
    const role = useSelector(selectRole)
    const {settings} = usePanelSettings()
    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('mdl'))
    const rail = collapsed && !mobile
    const location = useLocation()
    const navigate = useNavigate()
    const featureForLink = Object.fromEntries(featureOptions.map(x=>[x.link,x.key]))
    const expertPermissionForLink:Record<string,string>={files:'can_manage_files',requests:'can_manage_requests','seller-requests':'can_manage_files',assignments:'can_manage_requests',owners:'can_manage_contacts',customers:'can_manage_contacts','landlord-tenant':'can_manage_contacts',visits:'can_manage_visits','follow-ups':'can_manage_followups',finance:'can_manage_finance'}
    const visible = drawerItems.filter(item => (canAccessDrawerItem(item, role)||(['finance','reports'].includes(item.link)&&user?.permissions?.can_finance===true)) && (item.link==='settings' || item.link==='advertisements' || settings.features[featureForLink[item.link]]!==false) && (role!=='expert'||!expertPermissionForLink[item.link]||user?.permissions?.[expertPermissionForLink[item.link]]!==false))
    const selected = visible.filter(item => location.pathname === `/${item.link}` || location.pathname.startsWith(`/${item.link}/`)).sort((a,b) => b.link.length - a.link.length)[0]
    const [openGroups, setOpenGroups] = useState<string[]>(() => {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem('mlkino:drawer-groups') || '[]')
            return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
        } catch { return [] }
    })
    useEffect(() => {
        if (selected?.groupId) setOpenGroups(old => old.includes(selected.groupId!) ? old : [...old, selected.groupId!])
    }, [selected?.groupId])
    const toggleGroup = (id: string) => setOpenGroups(old => {
        const next = old.includes(id) ? old.filter(value => value !== id) : [...old, id]
        try { localStorage.setItem('mlkino:drawer-groups', JSON.stringify(next)) } catch { /* Navigation remains usable when storage is unavailable. */ }
        return next
    })
    useEffect(() => {setSelectedTitle(selected?.title ?? '')}, [selected?.title, setSelectedTitle])
    const visit = (path: string) => {
        navigate('/' + path)
        if (mobile) setDrawerOpen(false)
    }
    const navigationItem = (item: DrawerItemType, child = false) => {
        const active = selected?.link === item.link
        return <Tooltip key={item.link} title={rail ? item.title : ''} placement="left">
            <ListItemButton className={'sidebar-menu-button ' + (child ? 'sidebar-submenu-button' : 'sidebar-dashboard')} aria-label={item.title} aria-current={active ? 'page' : undefined} disabled={item.disabled} selected={active} onClick={() => visit(item.link)}>
                <ListItemIcon className="sidebar-menu-icon">{item.icon}</ListItemIcon>
                {!rail && <Typography component="span" className="sidebar-menu-label">{item.title}</Typography>}
            </ListItemButton>
        </Tooltip>
    }
    return <Drawer className={'panel-sidebar ' + (rail ? 'sidebar-is-collapsed' : '')} anchor="left" variant={mobile ? 'temporary' : 'permanent'} open={!mobile || drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{'& .MuiDrawer-paper': {width: rail ? 78 : drawerWidth, left: mobile ? 0 : 12, top: mobile ? 0 : 'calc(var(--panel-header-height, 84px) + 12px)', height: mobile ? '100%' : 'calc(100dvh - var(--panel-header-height, 84px) - 24px)', borderRadius: mobile ? '20px' : '22px', boxSizing: 'border-box', transition: 'width .2s', overflow: 'hidden', border: 0}}}>
        {mobile && <Stack className="sidebar-mobile-heading" direction="row" alignItems="center" justifyContent="space-between"><Typography component="h2" fontSize={16} fontWeight={800}>فهرست بخش‌ها</Typography><IconButton aria-label="بستن منو" onClick={() => setDrawerOpen(false)}><CloseRoundedIcon/></IconButton></Stack>}
        <div className="sidebar-scroll">
            <a className="sidebar-brand" href={LANDING_URL} aria-label="ملکینو؛ پنل مدیریت">
                {settings.branding.logo ? <img src={settings.branding.logo} alt=""/> : <SidebarBrandMark/>}
                {!rail && <div><strong>ملکینو</strong><span>پنل مدیریت</span></div>}
            </a>
            <List component="nav" className="sidebar-navigation" aria-label="بخش‌های پنل">
                <Tooltip title={rail ? 'ورود به صفحه اصلی' : ''} placement="left"><Button className="sidebar-home sidebar-menu-button" fullWidth component="a" href={LANDING_URL} aria-label="ورود به صفحه اصلی"><span className="sidebar-menu-icon"><HomeOutlinedIcon/></span>{!rail && <span className="sidebar-menu-label">ورود به صفحه اصلی</span>}</Button></Tooltip>
                {visible.filter(item => !item.groupId).map(item => navigationItem(item))}
                <div className="sidebar-groups">{drawerGroups.map(group => {
                    const items = visible.filter(item => item.groupId === group.id)
                    if (!items.length) return null
                    const expanded = rail || openGroups.includes(group.id)
                    return <Box key={group.id} className={'sidebar-group ' + (selected?.groupId === group.id ? 'sidebar-group-active' : '')}>
                        {!rail && <ListItemButton className="sidebar-menu-button sidebar-group-toggle" aria-label={group.title} aria-expanded={expanded} aria-controls={'sidebar-group-' + group.id} onClick={() => toggleGroup(group.id)}>
                            <ListItemIcon className="sidebar-menu-icon">{group.icon}</ListItemIcon><Typography component="span" className="sidebar-menu-label">{group.title}</Typography>{expanded ? <ExpandLessRoundedIcon className="sidebar-chevron"/> : <ExpandMoreRoundedIcon className="sidebar-chevron"/>}
                        </ListItemButton>}
                        <Collapse in={expanded} timeout="auto" unmountOnExit={!rail}><List id={'sidebar-group-' + group.id} className="sidebar-submenu" disablePadding>{items.map(item => navigationItem(item, true))}</List></Collapse>
                    </Box>
                })}</div>
            </List>
            {!rail && <div className="sidebar-footer"><SidebarSkyline/><section className="sidebar-support" aria-labelledby="sidebar-support-title"><span className="sidebar-support-symbol"><HeadsetMicOutlinedIcon/></span><h2 id="sidebar-support-title">پشتیبانی ملکینو</h2><p>در صورت نیاز با ما در تماس باشید.</p><Button className="sidebar-support-button" fullWidth onClick={() => visit('tickets')}><PhoneInTalkOutlinedIcon/>تماس با پشتیبانی</Button></section></div>}
        </div>
    </Drawer>
}

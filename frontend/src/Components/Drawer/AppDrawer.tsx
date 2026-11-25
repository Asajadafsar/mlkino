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

export const drawerWidth = 258
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
    const [openGroups,setOpenGroups]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('mlkino:drawer-groups')||'["estate","operations"]')}catch{return ['estate','operations']}})
    useEffect(()=>{if(selected?.groupId&&!openGroups.includes(selected.groupId))setOpenGroups(old=>[...old,selected.groupId!])},[selected?.groupId])
    const toggleGroup=(id:string)=>setOpenGroups(old=>{const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];localStorage.setItem('mlkino:drawer-groups',JSON.stringify(next));return next})
    useEffect(() => {setSelectedTitle(selected?.title ?? '')}, [selected?.title, setSelectedTitle])
    return <Drawer className="panel-sidebar" anchor="left" variant={mobile ? 'temporary' : 'permanent'} open={!mobile || drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{'& .MuiDrawer-paper': {width: rail ? 78 : drawerWidth, top: mobile ? 0 : 'var(--panel-header-height, 84px)', height: mobile ? '100%' : 'calc(100dvh - var(--panel-header-height, 84px))', boxSizing:'border-box', transition: 'width .2s', overflowX: 'hidden', border: 0, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none'}}}>
        <Stack sx={{height: '100%', minHeight: 0}}>
            {mobile&&<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{minHeight:64,px:2.2,borderBottom:'1px solid',borderColor:'divider',flexShrink:0}}><Typography component="h2" fontSize={16} fontWeight={800}>فهرست بخش‌ها</Typography><IconButton aria-label="بستن منو" onClick={()=>setDrawerOpen(false)}><CloseRoundedIcon/></IconButton></Stack>}
            <List component="nav" aria-label="بخش‌های پنل" sx={{flex: 1, overflow: 'auto', px: rail ? .7 : 2.2, py: 2, minHeight: 0}}>
                {visible.filter(item=>!item.groupId).map(item => {
                    const active = selected?.link === item.link
                    return <Tooltip key={item.link} title={rail ? item.title : ''} placement="right"><ListItemButton aria-label={item.title} disabled={item.disabled} selected={active} onClick={() => {navigate(`/${item.link}`); if (mobile) setDrawerOpen(false)}} sx={{borderRadius: '12px', mb: .65, minHeight: 46, py: .8, px: 1.8, color: 'text.secondary', '&.Mui-selected': {color: '#fff', background: 'linear-gradient(105deg, #82acff, #246bfd)', boxShadow: '0 8px 20px #246bfd20', '&:hover': {bgcolor: 'primary.main'}}}}>
                        <ListItemIcon sx={{minWidth: rail ? 0 : 35, mx: rail ? 'auto' : 0, color: active ? '#fff' : '#929bad', '& .MuiSvgIcon-root': {fontSize: '23px !important'}}}>{item.icon}</ListItemIcon>
                        {!rail && <Typography fontSize={14} fontWeight={active ? 700 : 500}>{item.title}</Typography>}
                    </ListItemButton></Tooltip>
                })}
                {drawerGroups.map(group=>{const items=visible.filter(item=>item.groupId===group.id);if(!items.length)return null;const expanded=rail||openGroups.includes(group.id);return <Box key={group.id} sx={{mt:1}}>
                    {!rail&&<ListItemButton aria-expanded={expanded} onClick={()=>toggleGroup(group.id)} sx={{borderRadius:2.5,minHeight:40,px:1.4,color:'text.secondary'}}><ListItemIcon sx={{minWidth:34,color:'primary.main'}}>{group.icon}</ListItemIcon><Typography flex={1} fontSize={12.5} fontWeight={850}>{group.title}</Typography>{expanded?<ExpandLessRoundedIcon fontSize="small"/>:<ExpandMoreRoundedIcon fontSize="small"/>}</ListItemButton>}
                    <Collapse in={expanded} timeout="auto" unmountOnExit={!rail}><List disablePadding sx={{pt:.4}}>{items.map(item=>{const active=selected?.link===item.link;return <Tooltip key={item.link} title={rail?item.title:''} placement="right"><ListItemButton aria-label={item.title} disabled={item.disabled} selected={active} onClick={()=>{navigate(`/${item.link}`);if(mobile)setDrawerOpen(false)}} sx={{borderRadius:'12px',mb:.45,minHeight:43,py:.7,px:rail?1.4:2.2,color:'text.secondary','&.Mui-selected':{color:'#fff',background:'linear-gradient(105deg,#82acff,#246bfd)',boxShadow:'0 8px 20px #246bfd20','&:hover':{bgcolor:'primary.main'}}}}><ListItemIcon sx={{minWidth:rail?0:34,mx:rail?'auto':0,color:active?'#fff':'#929bad','& .MuiSvgIcon-root':{fontSize:'22px !important'}}}>{item.icon}</ListItemIcon>{!rail&&<Typography fontSize={13.5} fontWeight={active?800:500}>{item.title}</Typography>}</ListItemButton></Tooltip>})}</List></Collapse>
                </Box>})}
            </List>
            <Box sx={{px: rail ? .7 : 2.2, py: 1.7, borderTop: '1px solid', borderColor: 'divider'}}>
                <Button fullWidth component="a" href={LANDING_URL} aria-label="صفحه عمومی" startIcon={<HomeOutlinedIcon/>} sx={{minWidth:0,mb:0}}>{!rail&&'صفحه عمومی'}</Button>

            </Box>
        </Stack>
    </Drawer>
}

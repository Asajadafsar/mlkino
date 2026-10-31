import {Alert, Box, Stack} from '@mui/material'
import {useContext, useState} from 'react'
import {usePanelSettings} from '../Core/PanelSettingsContext'
import {CurrentUserContext} from '../Core/CurrentUser'
import Appbar from './Appbar/Appbar'
import {AppDrawer, drawerWidth} from './Drawer/AppDrawer'

const MainLayout = ({children}: {children: React.ReactNode}) => {
    const [selectedTitle, setSelectedTitle] = useState<string>('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mlkino:sidebar-collapsed') === 'true')
    const toggleCollapsed = () => setCollapsed(value => {localStorage.setItem('mlkino:sidebar-collapsed', String(!value)); return !value})
    const {settings}=usePanelSettings()
    const {user} = useContext(CurrentUserContext)

    return (
        <Stack direction="row" bgcolor="background.default" minHeight="100vh" position={'relative'}>
            <AppDrawer
                collapsed={collapsed}
                onToggleCollapse={toggleCollapsed}
                user={user}
                setSelectedTitle={setSelectedTitle}
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
            />
            <Box
                component="main"
                flexGrow={1}
                sx={{
                    ml: {xs: 0, mdl: `${collapsed ? 78 : drawerWidth}px`},
                    transition: 'width .2s, margin .2s',
                    minWidth: 0,
                    width: {xs: '100%', mdl: `calc(100% - ${collapsed ? 78 : drawerWidth}px)`},
                }}
            >
                <Appbar
                    collapsed={collapsed}
                    onToggleCollapse={toggleCollapsed}
                    selectedTitle={selectedTitle}
                    drawerOpen={drawerOpen}
                    setDrawerOpen={setDrawerOpen}
                    user={user}
                />
                <Box sx={{pt: 1.5, minWidth: 0}}>{settings.general.maintenanceMode&&<Alert severity="warning" sx={{mx:3,mb:2}}>سامانه در حالت نگهداری است. عملیات کاربران موقتاً محدود شده؛ پشتیبانی در دسترس است.</Alert>}{children}</Box>
            </Box>
        </Stack>
    )
}

export default MainLayout

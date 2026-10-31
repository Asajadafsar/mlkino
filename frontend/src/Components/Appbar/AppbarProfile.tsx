import {clearRole} from '../../redux/RoleSlice'
import {clearImpersonation} from '../../redux/ImpersonationSlice'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import type {RootState} from '../../redux/store'
import {useDispatch, useSelector, useStore} from 'react-redux'
import {selectImpersonation, setImpersonationPending} from '../../redux/ImpersonationSlice'
import {exitImpersonation, impersonationError, reloadIdentity} from '../../Core/Impersonation'
import {setUtil} from '../../redux/UtilSlice'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

import {Avatar, Divider, ListItemIcon, Menu, MenuItem, Stack, Typography} from '@mui/material'

import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import axios from 'axios'

import {UsersType} from '../../Pages/User/Users'

const AppbarProfile = ({user}: {user: UsersType}) => {
    const {session, pending} = useSelector(selectImpersonation)
    const reduxStore = useStore<RootState>()
    const dispatch = useDispatch()
    const [exiting, setExiting] = useState(false)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const navigate = useNavigate()

    const open = Boolean(anchorEl)

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleProfile = () => {
        navigate('/profile')
        handleClose()
    }
    const handleSettings = () => {
        navigate('/settings')
        handleClose()
    }

    const handleLogout = async () => {
        if (exiting || reduxStore.getState().impersonation.pending) return
        if (session?.active) {
            dispatch(setImpersonationPending(true))
            setExiting(true)
            try {
                await exitImpersonation()
                reloadIdentity()
            } catch (error) {
                dispatch(setUtil({open: true, message: impersonationError(error, 'بازگشت به حساب مدیر انجام نشد'), severity: 'error'}))
                setExiting(false)
                dispatch(setImpersonationPending(false))
            }
            return
        }
        try {
            await axios.post(`${ACCOUNTS_URL}/logout/`, null, {
                withCredentials: true,
            })

            dispatch(clearRole())
            dispatch(clearImpersonation())
            handleClose()
            navigate('/login')
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                gap={1}
                onClick={handleOpen}
                sx={{
                    cursor: 'pointer',
                    px: 0.75,
                    py: 0.5,
                    borderRadius: '14px',

                    transition: 'background-color .2s ease',

                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                <Avatar
                    src={typeof user.avatar === 'string' ? user.avatar : ''}
                    alt={user.first_name}
                    sx={{
                        width: 38,
                        height: 38,
                        fontSize: 15,
                        fontWeight: 700,
                    }}
                >
                    {user.first_name?.slice(0, 1)}
                </Avatar>

                <Stack
                    sx={{
                        display: {
                            xs: 'none',
                            mdl: 'flex',
                        },
                    }}
                >
                    <Typography fontSize={14} fontWeight={700} lineHeight={1.3} noWrap>
                        {user.first_name}
                    </Typography>

                    <Typography fontSize={11} color="text.secondary" lineHeight={1.3}>
                        حساب کاربری
                    </Typography>
                </Stack>

                <KeyboardArrowDownRoundedIcon
                    sx={{
                        fontSize: 20,
                        color: 'text.secondary',
                        transition: 'transform .2s ease',
                        transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                />
            </Stack>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            mt: 1,
                            minWidth: 250,
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 12px 35px rgba(0,0,0,.10)',
                            overflow: 'hidden',
                        },
                    },
                }}
            >
                {/* PROFILE HEADER */}
                <Stack direction="row" alignItems="center" gap={1.5} px={2} py={1.75}>
                    <Avatar
                        src={typeof user.avatar === 'string' ? user.avatar : ''}
                        sx={{
                            width: 44,
                            height: 44,
                        }}
                    >
                        {user.first_name?.slice(0, 1)}
                    </Avatar>

                    <Stack minWidth={0}>
                        <Typography fontSize={14} fontWeight={700} noWrap>
                            {`${user.first_name}  ${user.last_name}`}
                        </Typography>

                        <Typography fontSize={12} color="text.secondary" noWrap>
                            {user.phone}
                        </Typography>
                    </Stack>
                </Stack>

                <Divider />

                <MenuItem
                    onClick={handleProfile}
                    sx={{
                        mx: 0.75,
                        my: 0.5,
                        borderRadius: '10px',
                        py: 1,
                    }}
                >
                    <ListItemIcon>
                        <AccountCircleRoundedIcon fontSize="small" />
                    </ListItemIcon>

                    <Typography fontSize={13}>پروفایل</Typography>
                </MenuItem>

                <MenuItem
                    onClick={handleSettings}
                    sx={{
                        mx: 0.75,
                        my: 0.5,
                        borderRadius: '10px',
                        py: 1,
                    }}
                >
                    <ListItemIcon>
                        <SettingsRoundedIcon fontSize="small" />
                    </ListItemIcon>

                    <Typography fontSize={13}>تنظیمات</Typography>
                </MenuItem>

                <Divider sx={{my: 0.5}} />

                <MenuItem
                    onClick={handleLogout} disabled={exiting || pending}
                    sx={{
                        mx: 0.75,
                        mb: 0.75,
                        borderRadius: '10px',
                        py: 1,
                        color: 'error.main',

                        '&:hover': {
                            backgroundColor: 'error.lighter',
                        },
                    }}
                >
                    <ListItemIcon
                        sx={{
                            color: 'error.main',
                        }}
                    >
                        <LogoutRoundedIcon fontSize="small" />
                    </ListItemIcon>

                    <Typography fontSize={13} fontWeight={600}>
                        {session?.active ? 'بازگشت به حساب مدیر' : 'خروج از حساب'}
                    </Typography>
                </MenuItem>
            </Menu>
        </>
    )
}

export default AppbarProfile

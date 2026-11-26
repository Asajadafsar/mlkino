import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded'
import HomeIcon from '@mui/icons-material/Home'

import {
    Box,
    Button,
    Divider,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material'

import {useState} from 'react'
import {useSelector} from 'react-redux'
import {selectRole} from '../../redux/RoleSlice'
import {useNavigate} from 'react-router-dom'

const addOptions = [
    {
        title: 'کاربر جدید',
        description: 'ایجاد حساب کاربری',
        link: 'users/create',
        icon: <PersonAddAltRoundedIcon />,
    },
        {
        title: 'ثبت فایل',
        description: 'ایجاد فایل جدید',
        link: 'files/create',
        icon: <HomeIcon  />,
    },
]

const NewActivity = () => {
    const role=useSelector(selectRole)
    const [anchorEl, setAnchorEl] =
        useState<null | HTMLElement>(null)

    const navigate = useNavigate()

    const open = Boolean(anchorEl)

    const handleOpen = (
        event: React.MouseEvent<HTMLElement>,
    ) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleNavigate = (link: string) => {
        navigate(`/${link}`)
        handleClose()
    }

    return (
        <>
            <Button variant="contained"
                onClick={handleOpen}
                startIcon={
                    <AddRoundedIcon
                        sx={{
                            fontSize: '20px !important',
                        }}
                    />
                }
                className="panel-header-new"
                aria-label="ایجاد جدید"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open?'panel-create-menu':undefined}
            >
                <span className="button-text">
                    جدید
                </span>
            </Button>

            <Menu
                id="panel-create-menu"
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
                            width: 310,
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow:
                                '0 14px 40px rgba(0,0,0,.10)',
                            overflow: 'hidden',
                        },
                    },
                }}
            >
                <Box px={2} pt={1.75} pb={1.25}>
                    <Typography
                        fontSize={15}
                        fontWeight={700}
                    >
                        ایجاد سریع
                    </Typography>

                    <Typography
                        fontSize={12}
                        color="text.secondary"
                        mt={0.5}
                    >
                        چیزی که می‌خواهید ایجاد کنید را انتخاب کنید
                    </Typography>
                </Box>

                <Divider />

                <Stack p={0.75}>
                    {addOptions.filter(item=>item.link==='users/create'?role==='superadmin':['agency','expert'].includes(role||'')).map((item) => (
                        <MenuItem
                            key={item.link}
                            onClick={() =>
                                handleNavigate(item.link)
                            }
                            sx={{
                                borderRadius: '12px',
                                px: 1,
                                py: 1.1,
                                gap: 1.25,

                                '&:hover': {
                                    backgroundColor:
                                        'action.hover',

                                    '& .quick-arrow': {
                                        opacity: 1,
                                        transform:
                                            'translateX(-2px)',
                                    },
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    flexShrink: 0,
                                    borderRadius: '11px',

                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',

                                    color: 'primary.main',
                                    backgroundColor:
                                        'primary.lighter',
                                }}
                            >
                                {item.icon}
                            </Box>

                            <Stack
                                flex={1}
                                minWidth={0}
                            >
                                <Typography
                                    fontSize={13}
                                    fontWeight={700}
                                >
                                    {item.title}
                                </Typography>

                                <Typography
                                    fontSize={11}
                                    color="text.secondary"
                                    mt={0.25}
                                >
                                    {item.description}
                                </Typography>
                            </Stack>

                            <ArrowBackIosRoundedIcon
                                className="quick-arrow"
                                sx={{
                                    fontSize: 13,
                                    color: 'text.disabled',
                                    opacity: 0,
                                    transition:
                                        'all .2s ease',
                                }}
                            />
                        </MenuItem>
                    ))}
                </Stack>
            </Menu>
        </>
    )
}

export default NewActivity
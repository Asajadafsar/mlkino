// Components/Table/UserCard.tsx
import {Avatar, Box, Button, Chip, Divider, Grid, IconButton, Paper, Stack, Typography} from '@mui/material'
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import CakeRoundedIcon from '@mui/icons-material/CakeRounded'
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import MarkunreadMailboxRoundedIcon from '@mui/icons-material/MarkunreadMailboxRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import {useState} from 'react'
import {useDispatch} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {DataProvider} from '../../Core/DataProvider'
import {setUtil} from '../../redux/UtilSlice'
import profileImage from '../../Images/user.png'
import { BaseModal } from '../../Components/Modal/BaseModal'

export type BaseUserCardData = {
    id: string
    firstName?: string | null
    lastName?: string | null
    phoneNumber?: string | null
    profileImage?: string | null
    logo?: string | null
    role?: string | null
    agencyName?: string | null
    city?: string | null
    address?: string | null
    homeAddress?: string | null
    workAddress?: string | null
    nationalId?: string | null
    birthDate?: string | null
    postalCode?: string | null
    maritalStatus?: string | null
    officePropertyStatus?: string | null
}

const roleLabels: Record<string, string> = {
    regular_user: 'کاربر عادی',
    super_user: 'سوپر ادمین',
    real_estate_agency: 'املاک',
    real_estate_expert: 'مشاور املاک',
    accountant: 'حسابدار',
    secretary: 'منشی',
}

const roleColors: Record<string, string> = {
    regular_user: '#3B82F6',
    super_user: '#8B5CF6',
    real_estate_agency: '#F59E0B',
    real_estate_expert: '#10B981',
    accountant: '#EF4444',
    secretary: '#06B6D4',
}

const maritalStatusLabels: Record<string, string> = {
    married: 'متأهل',
    single: 'مجرد',
}

const officePropertyStatusLabels: Record<string, string> = {
    owner: 'مالک',
    tenant: 'مستأجر',
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value?: string | null
}) {
    if (!value) return null
    return (
        <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '8px',
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Box sx={{minWidth: 0}}>
                <Typography variant="caption" color="text.disabled" sx={{lineHeight: 1}}>
                    {label}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    noWrap
                    sx={{lineHeight: 1.4}}
                >
                    {value}
                </Typography>
            </Box>
        </Stack>
    )
}

function UserCard({
    item,
    onClick,
    resource,
    getList,
    noEdit,
    noDelete,
    noEnterPanel,
    panelPath,
    title,
}: {
    item: BaseUserCardData
    onClick?: () => void
    resource: string
    getList: () => void
    noEdit?: boolean
    noDelete?: boolean
    noEnterPanel?: boolean
    panelPath?: (item: BaseUserCardData) => string
    title: string
}) {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [open, setOpen] = useState(false)

    const fullName =
        [item.firstName, item.lastName].filter(Boolean).join(' ') || '--'
    const avatarSrc = item.logo || item.profileImage || profileImage
    const accentColor = (item.role && roleColors[item.role]) || '#6366F1'

    function handleEditClick(e: React.MouseEvent) {
        e.stopPropagation()
        navigate(`${item.id}`, {state: {row: item}})
    }

    function handleEnterPanelClick(e: React.MouseEvent) {
        e.stopPropagation()
        navigate(panelPath ? panelPath(item) : `${item.id}/panel`, {state: {row: item}})
    }

    async function handleDelete() {
        dispatch(setUtil({loading: true}))
        try {
            await DataProvider.delete(`${resource}/${item.id}/`)
            getList()
        } catch (error: any) {
            dispatch(setUtil({open: true, message: error.message, severity: 'error'}))
        }
        dispatch(setUtil({loading: false}))
        setOpen(false)
    }

    return (
        <>
            <Paper
                onClick={onClick}
                elevation={0}
                sx={{
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                    height: '100%',
                    cursor: onClick ? 'pointer' : 'default',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all .25s ease',
                    '&:hover': onClick
                        ? {
                              boxShadow: '0 12px 28px -8px rgba(0,0,0,0.18)',
                              transform: 'translateY(-4px)',
                              borderColor: accentColor,
                          }
                        : undefined,
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)`,
                        pt: 3,
                        pb: 6,
                        px: 2,
                        position: 'relative',
                    }}
                >
                    {item.role && (
                        <Chip
                            label={roleLabels[item.role] || item.role}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 12,
                                insetInlineStart: 12,
                                bgcolor: 'rgba(255,255,255,0.25)',
                                color: '#fff',
                                fontWeight: 600,
                                backdropFilter: 'blur(4px)',
                            }}
                        />
                    )}

                    {/* Edit / Delete actions */}
                    {(!noEdit || !noDelete) && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                                position: 'absolute',
                                top: 12,
                                insetInlineEnd: 12,
                            }}
                        >
                            {!noEdit && (
                                <IconButton
                                    size="small"
                                    onClick={handleEditClick}
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '8px',
                                        color: 'primary.main',
                                        backgroundColor: '#fff',
                                        border: '1px solid',
                                        borderColor: 'primary.main',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                        '&:hover': {
                                            backgroundColor: 'primary.main',
                                            color: '#fff',
                                        },
                                    }}
                                >
                                    <EditIcon sx={{fontSize: 16}} />
                                </IconButton>
                            )}
                            {!noDelete && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpen(true)
                                    }}
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '8px',
                                        color: 'error.main',
                                        backgroundColor: '#fff',
                                        border: '1px solid',
                                        borderColor: 'error.main',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                        '&:hover': {
                                            backgroundColor: 'error.main',
                                            color: '#fff',
                                        },
                                    }}
                                >
                                    <DeleteIcon sx={{fontSize: 16}} />
                                </IconButton>
                            )}
                        </Stack>
                    )}
                </Box>

                {/* Avatar overlapping header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: '-48px',
                    }}
                >
                    <Avatar
                        src={avatarSrc}
                        alt={fullName}
                        sx={{
                            width: 88,
                            height: 88,
                            border: '4px solid',
                            borderColor: 'background.paper',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                        }}
                    />
                </Box>

                {/* Name */}
                <Stack alignItems="center" spacing={0.25} sx={{px: 2, mt: 1}}>
                    <Typography variant="subtitle1" fontWeight={700} textAlign="center">
                        {item.agencyName || fullName}
                    </Typography>
                    {item.agencyName && (
                        <Typography variant="body2" color="text.secondary">
                            {fullName}
                        </Typography>
                    )}
                    {item.phoneNumber && (
                        <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            sx={{color: 'text.secondary', mt: 0.5}}
                        >
                            <PhoneIphoneRoundedIcon sx={{fontSize: 15}} />
                            <Typography variant="caption" dir="ltr">
                                {item.phoneNumber}
                            </Typography>
                        </Stack>
                    )}
                </Stack>

                <Divider sx={{my: 2}} />

                {/* Details grid */}
                <Stack spacing={1.5} sx={{px: 2.5, pb: 2.5}}>
                    <InfoRow icon={<BadgeRoundedIcon sx={{fontSize: 17}} />} label="کد ملی" value={item.nationalId} />
                    <InfoRow icon={<CakeRoundedIcon sx={{fontSize: 17}} />} label="تاریخ تولد" value={item.birthDate} />
                    <InfoRow icon={<LocationCityRoundedIcon sx={{fontSize: 17}} />} label="شهر" value={item.city} />
                    <InfoRow icon={<MarkunreadMailboxRoundedIcon sx={{fontSize: 17}} />} label="کد پستی" value={item.postalCode} />
                    <InfoRow icon={<HomeRoundedIcon sx={{fontSize: 17}} />} label="آدرس منزل" value={item.homeAddress} />
                    <InfoRow icon={<WorkRoundedIcon sx={{fontSize: 17}} />} label="آدرس محل کار" value={item.workAddress} />
                    <InfoRow
                        icon={<FavoriteRoundedIcon sx={{fontSize: 17}} />}
                        label="وضعیت تأهل"
                        value={
                            item.maritalStatus
                                ? maritalStatusLabels[item.maritalStatus] || item.maritalStatus
                                : undefined
                        }
                    />
                    <InfoRow
                        icon={<ApartmentRoundedIcon sx={{fontSize: 17}} />}
                        label="وضعیت ملک دفتر"
                        value={
                            item.officePropertyStatus
                                ? officePropertyStatusLabels[item.officePropertyStatus] ||
                                  item.officePropertyStatus
                                : undefined
                        }
                    />
                    {item.address && (
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 30,
                                    height: 30,
                                    borderRadius: '8px',
                                    bgcolor: 'action.hover',
                                    color: 'text.secondary',
                                    flexShrink: 0,
                                }}
                            >
                                <PlaceRoundedIcon sx={{fontSize: 17}} />
                            </Box>
                            <Box sx={{minWidth: 0}}>
                                <Typography variant="caption" color="text.disabled" sx={{lineHeight: 1}}>
                                    آدرس
                                </Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    sx={{
                                        lineHeight: 1.4,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {item.address}
                                </Typography>
                            </Box>
                        </Stack>
                    )}
                </Stack>

                {/* ورود به پنل کاربری */}
                {!noEnterPanel && (
                    <Box sx={{px: 2.5, pb: 2.5}}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LoginRoundedIcon />}
                            onClick={handleEnterPanelClick}
                            sx={{
                                height: 42,
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '13px',
                                borderColor: accentColor,
                                color: accentColor,
                                '&:hover': {
                                    borderColor: accentColor,
                                    backgroundColor: `${accentColor}14`,
                                },
                            }}
                        >
                            ورود به پنل کاربری
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Delete confirm modal */}
            <BaseModal
                open={open}
                setOpen={setOpen}
                title={`حذف ${title}`}
                style={{maxWidth: 'sm'}}
            >
                <Stack spacing={2.5}>
                    <Stack
                        alignItems="center"
                        textAlign="center"
                        spacing={1.5}
                        sx={{pt: 1, px: 2}}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'error.lighter',
                                border: '1px solid',
                                borderColor: 'error.light',
                            }}
                        >
                            <ReportProblemRoundedIcon sx={{color: 'error.main', fontSize: 32}} />
                        </Box>

                        <Typography sx={{fontSize: '18px', fontWeight: 700, color: 'text.primary'}}>
                            آیا از حذف این {title} مطمئن هستید؟
                        </Typography>

                        <Typography sx={{fontSize: '13px', color: 'text.secondary', lineHeight: 1.8}}>
                            با حذف این {title}، اطلاعات آن برای همیشه حذف خواهد شد
                            <br />
                            و این عملیات قابل بازگشت نیست.
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.5} sx={{pt: 1, px: 1}}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            onClick={handleDelete}
                            sx={{
                                height: 46,
                                borderRadius: '11px',
                                fontSize: '14px',
                                fontWeight: 600,
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: 'none',
                                    backgroundColor: 'error.dark',
                                },
                            }}
                        >
                            حذف {title}
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setOpen(false)}
                            sx={{
                                height: 46,
                                borderRadius: '11px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'text.primary',
                                borderColor: 'divider',
                                '&:hover': {
                                    borderColor: 'text.secondary',
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            انصراف
                        </Button>
                    </Stack>
                </Stack>
            </BaseModal>
        </>
    )
}

export function UserCardGrid<T extends BaseUserCardData>({
    rows,
    onItemClick,
    resource,
    getList,
    noEdit,
    noDelete,
    noEnterPanel,
    panelPath,
    title,
}: {
    rows: T[]
    onItemClick?: (item: T) => void
    resource: string
    getList: () => void
    noEdit?: boolean
    noDelete?: boolean
    noEnterPanel?: boolean
    panelPath?: (item: T) => string
    title: string
}) {
    return (
        <Grid container spacing={2.5} px={1}>
            {rows.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <UserCard
                        item={item}
                        onClick={onItemClick ? () => onItemClick(item) : undefined}
                        resource={resource}
                        getList={getList}
                        noEdit={noEdit}
                        noDelete={noDelete}
                        noEnterPanel={noEnterPanel}
                        panelPath={panelPath as any}
                        title={title}
                    />
                </Grid>
            ))}
        </Grid>
    )
}
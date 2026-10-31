
import type { ReactNode } from 'react'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import GroupIcon from '@mui/icons-material/Group'
import StorefrontIcon from '@mui/icons-material/Storefront'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import { Dashboard, WorkspacePremium } from '@mui/icons-material'
import CampaignIcon from '@mui/icons-material/Campaign'
import DiamondIcon from '@mui/icons-material/Diamond'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import HomeIcon from '@mui/icons-material/Home'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import HandshakeIcon from '@mui/icons-material/Handshake'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import PaymentIcon from '@mui/icons-material/Payment'
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket'
import VisibilityIcon from '@mui/icons-material/Visibility'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import { UserRole } from '../../redux/RoleSlice'


export type DrawerRole = UserRole | 'all'

export type DrawerItemType = {
    title: string
    link: string
    role: DrawerRole | DrawerRole[]
    icon: ReactNode
    disabled?: boolean
    groupId?: string
}

export type DrawerGroupType = {
    id: string
    title: string
    icon: ReactNode
}

export const canAccessDrawerItem = (
    item: DrawerItemType,
    currentRole: UserRole | null
): boolean => {
    if (!currentRole) return false

    const allowedRoles = Array.isArray(item.role)
        ? item.role
        : [item.role]

    return allowedRoles.some(
        role => role === 'all' || role === currentRole
    )
}

const iconStyle = { fontSize: '1.9rem !important' }
const groupIconStyle = { fontSize: '1.6rem !important' }

export const drawerGroups: DrawerGroupType[] = [
    {
        id: 'darineh-store',
        title: 'فروشگاه دارینه',
        icon: <StorefrontIcon sx={groupIconStyle} />,
    },
    {
        id: 'darineh-orders',
        title: 'سفارش‌های طلا',
        icon: <DiamondIcon sx={groupIconStyle} />,
    },
    {
        id: 'darineh-guarantee',
        title: 'تضمین قیمت',
        icon: <WorkspacePremium sx={groupIconStyle} />,
    },
    {
        id: 'darineh-investment',
        title: 'سرمایه‌گذاری طلا',
        icon: <TrendingUpIcon sx={groupIconStyle} />,
    },
    {
        id: 'darineh-finance',
        title: 'واریز و برداشت',
        icon: <CreditCardIcon sx={groupIconStyle} />,
    },
    {
        id: 'darineh-content',
        title: 'محتوا و اطلاع‌رسانی',
        icon: <CampaignIcon sx={groupIconStyle} />,
    },
    {
        id: 'silver-store',
        title: 'فروشگاه نقرینه',
        icon: <StorefrontIcon sx={groupIconStyle} />,
    },
    {
        id: 'silver-orders',
        title: 'سفارش‌های نقره',
        icon: <DiamondIcon sx={groupIconStyle} />,
    },
    {
        id: 'silver-finance',
        title: 'واریز و برداشت',
        icon: <CreditCardIcon sx={groupIconStyle} />,
    },
    {
        id: 'silver-content',
        title: 'محتوا و اطلاع‌رسانی',
        icon: <CampaignIcon sx={groupIconStyle} />,
    },
]

export const drawerItems: DrawerItemType[] = [
    {
        title: 'پیشخوان',
        link: 'dashboard',
        role: 'all',
        icon: <Dashboard sx={iconStyle} />,
    },
    {
        title: 'اطلاعیه ها',
        link: 'announcements',
        role: UserRole.SUPERADMIN,
        icon: <CampaignIcon sx={iconStyle} />,
    },
    {
        title: 'کاربران',
        link: 'users',
        role: UserRole.SUPERADMIN,
        icon: <GroupIcon sx={iconStyle} />,
    },
    {title: 'کارشناسان من', link: 'users/expert', role: UserRole.AGENCY, icon: <GroupIcon sx={iconStyle} />},
    {
        title: 'خریداران',
        link: 'customers',
        role: 'all',
        icon: <HandshakeIcon sx={iconStyle} />,
    },
    {
        title: 'مالکین',
        link: 'owners',
        role: 'all',
        icon: <HomeWorkOutlinedIcon sx={iconStyle} />,
    },
    {
        title: 'موجر و مستاجر',
        link: 'landlord-tenant',
        role: 'all',
        icon: <VpnKeyIcon sx={iconStyle} />,
    },
    {
        title: 'فایل ها',
        link: 'files',
        role: 'all',
        icon: <HomeIcon sx={iconStyle} />,
    },
    {
        title: 'درخواست ها',
        link: 'requests',
        role: 'all',
        icon: <AddCircleOutlineIcon sx={iconStyle} />,
    },
    {
        title: 'درخواست مشتریان',
        link: 'customers-requests',
        role: 'all',
        icon: <ShoppingBasketIcon sx={iconStyle} />,
    },
    {
        title: 'درخواست مالکین',
        link: 'owners-requests',
        role: 'all',
        icon: <PaymentIcon sx={iconStyle} />,
    },
    {
        title: 'یادآوری ها',
        link: 'reminders',
        role: 'all',
        icon: <NotificationsActiveIcon sx={iconStyle} />,
    },
    {
        title: 'بازدید ها',
        link: 'views',
        role: 'all',
        icon: <VisibilityIcon sx={iconStyle} />,
    },
    {
        title: 'پیگیری ها',
        link: 'follow-ups',
        role: 'all',
        icon: <TrackChangesIcon sx={iconStyle} />,
    },
    {
        title: 'قراردادها',
        link: 'contracts',
        role: 'all',
        icon: <DescriptionOutlinedIcon sx={iconStyle} />,
    },
    {
        title: 'بایگانی ها',
        link: 'archives',
        role: 'all',
        icon: <ArchiveOutlinedIcon sx={iconStyle} />,
    },
    {
        title: 'کارهای مهم امروز',
        link: 'tasks',
        role: 'all',
        icon: <AssignmentTurnedInIcon sx={iconStyle} />,
    },
    {
        title: 'چت و تماس',
        link: 'chats',
        role: 'all',
        icon: <ForumOutlinedIcon sx={iconStyle} />,
    },
    {
        title: 'دیوارکوب',
        link: 'advertisements',
        role: 'all',
        icon: <LocalOfferIcon sx={iconStyle} />,
    },
    {
        title: 'تنظیمات',
        link: 'settings',
        role: UserRole.SUPERADMIN,
        icon: <SettingsRoundedIcon sx={iconStyle} />,
    },
    {
        title: 'پروفایل',
        link: 'profile',
        role: 'all',
        icon: <AccountCircleRoundedIcon sx={iconStyle} />,
    },
    {
        title: 'لاگ',
        link: 'logs',
         role: UserRole.SUPERADMIN,
        icon: <AssignmentIcon sx={iconStyle} />,
    },
    {
        title: 'تیکت‌ها',
        link: 'tickets',
        role: 'all',
        icon: <SupportAgentIcon sx={iconStyle} />,
    },
]

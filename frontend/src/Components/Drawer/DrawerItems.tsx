
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
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined'
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
    {id:'estate',title:'فایل و درخواست',icon:<HomeWorkOutlinedIcon sx={groupIconStyle}/>},
    {id:'crm',title:'اشخاص و ارتباطات',icon:<GroupIcon sx={groupIconStyle}/>},
    {id:'operations',title:'عملیات و پیگیری',icon:<BusinessCenterOutlinedIcon sx={groupIconStyle}/>},
    {id:'management',title:'مدیریت دفتر',icon:<ManageAccountsOutlinedIcon sx={groupIconStyle}/>},
    {id:'content',title:'محتوا و اطلاع‌رسانی',icon:<CampaignIcon sx={groupIconStyle}/>},
    {id:'account',title:'حساب و پشتیبانی',icon:<AccountCircleRoundedIcon sx={groupIconStyle}/>},
]

export const drawerItems: DrawerItemType[] = [
    {
        title: 'پیشخوان',
        link: 'dashboard',
        role: 'all',
        icon: <Dashboard sx={iconStyle} />,
    },
    {title:'فایل‌های ملکی',link:'files',role:'all',groupId:'estate',icon:<HomeIcon sx={iconStyle}/>},
    {title:'درخواست فایل',link:'requests',role:'all',groupId:'estate',icon:<AddCircleOutlineIcon sx={iconStyle}/>},
    {title:'درخواست فروشندگان',link:'seller-requests',role:[UserRole.SUPERADMIN,UserRole.AGENCY,UserRole.EXPERT],groupId:'estate',icon:<FolderSpecialOutlinedIcon sx={iconStyle}/>},
    {title:'کارتابل ارجاع‌ها',link:'assignments',role:[UserRole.SUPERADMIN,UserRole.AGENCY,UserRole.EXPERT],groupId:'estate',icon:<TrackChangesIcon sx={iconStyle}/>},
    {title:'علاقه‌مندی‌ها',link:'favorites',role:'all',groupId:'estate',icon:<HomeIcon sx={iconStyle}/>},
    {title:'مالکین',link:'owners',role:[UserRole.SUPERADMIN,UserRole.AGENCY,UserRole.EXPERT],groupId:'crm',icon:<HomeWorkOutlinedIcon sx={iconStyle}/>},
    {title:'خریداران',link:'customers',role:[UserRole.SUPERADMIN,UserRole.AGENCY,UserRole.EXPERT],groupId:'crm',icon:<HandshakeIcon sx={iconStyle}/>},
    {title:'موجران و مستأجران',link:'landlord-tenant',role:[UserRole.SUPERADMIN,UserRole.AGENCY,UserRole.EXPERT],groupId:'crm',icon:<VpnKeyIcon sx={iconStyle}/>},
    {title:'چت و تماس',link:'chats',role:'all',groupId:'crm',icon:<ForumOutlinedIcon sx={iconStyle}/>},
    {title:'بازدیدها',link:'visits',role:'all',groupId:'operations',icon:<VisibilityIcon sx={iconStyle}/>},
    {title:'پیگیری‌ها',link:'follow-ups',role:'all',groupId:'operations',icon:<TrackChangesIcon sx={iconStyle}/>},
    {title:'قراردادها',link:'contracts',role:'all',groupId:'operations',icon:<DescriptionOutlinedIcon sx={iconStyle}/>},
    {title:'یادآوری‌ها',link:'reminders',role:'all',groupId:'operations',icon:<NotificationsActiveIcon sx={iconStyle}/>},
    {title:'کارهای مهم امروز',link:'tasks',role:'all',groupId:'operations',icon:<AssignmentTurnedInIcon sx={iconStyle}/>},
    {title:'بایگانی‌ها',link:'archives',role:'all',groupId:'operations',icon:<ArchiveOutlinedIcon sx={iconStyle}/>},
    {title:'مرکز عملیات',link:'workflows',role:'all',groupId:'management',icon:<AssignmentTurnedInIcon sx={iconStyle}/>},
    {title:'گزارش‌های مدیریتی',link:'reports',role:[UserRole.SUPERADMIN,UserRole.AGENCY],groupId:'management',icon:<TrendingUpIcon sx={iconStyle}/>},
    {title:'کارشناسان من',link:'users/expert',role:UserRole.AGENCY,groupId:'management',icon:<GroupIcon sx={iconStyle}/>},
    {title:'کاربران',link:'users',role:UserRole.SUPERADMIN,groupId:'management',icon:<GroupIcon sx={iconStyle}/>},
    {title:'مالی و حسابداری',link:'finance',role:[UserRole.SUPERADMIN,UserRole.AGENCY],groupId:'management',icon:<CreditCardIcon sx={iconStyle}/>},
    {title:'تنظیمات مالی',link:'financial-settings',role:[UserRole.SUPERADMIN,UserRole.AGENCY],groupId:'management',icon:<PaymentIcon sx={iconStyle}/>},
    {title:'نقش‌های دفاتر',link:'workspace-roles',role:UserRole.SUPERADMIN,groupId:'management',icon:<GroupIcon sx={iconStyle}/>},
    {title:'اطلاعیه‌ها',link:'announcements',role:UserRole.SUPERADMIN,groupId:'content',icon:<CampaignIcon sx={iconStyle}/>},
    {title:'دیوارکوب — به‌زودی',disabled:true,link:'advertisements',role:'all',groupId:'content',icon:<LocalOfferIcon sx={iconStyle}/>},
    {title:'تنظیمات',link:'settings',role:UserRole.SUPERADMIN,groupId:'account',icon:<SettingsRoundedIcon sx={iconStyle}/>},
    {title:'پروفایل',link:'profile',role:'all',groupId:'account',icon:<AccountCircleRoundedIcon sx={iconStyle}/>},
    {title:'لاگ سامانه',link:'logs',role:UserRole.SUPERADMIN,groupId:'account',icon:<AssignmentIcon sx={iconStyle}/>},
    {title:'تیکت‌های پشتیبانی',link:'tickets',role:'all',groupId:'account',icon:<SupportAgentIcon sx={iconStyle}/>},
]

import type {ComponentType} from 'react'
import type {SvgIconProps} from '@mui/material'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import VillaRoundedIcon from '@mui/icons-material/VillaRounded'
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded'
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'

const ICON_BY_PROPERTY_TYPE: Record<string, ComponentType<SvgIconProps>> = {
    'آپارتمان': ApartmentRoundedIcon,
    'ویلایی': VillaRoundedIcon,
    'زمین': TerrainRoundedIcon,
    'پیش فروش': HomeWorkRoundedIcon,
    'تجاری': StorefrontRoundedIcon,
    'سوله': WarehouseRoundedIcon,
}

export function getPropertyTypeIcon(propertyType?: string, props?: SvgIconProps) {
    const Icon = (propertyType && ICON_BY_PROPERTY_TYPE[propertyType]) || HomeRoundedIcon
    return <Icon {...props} />
}
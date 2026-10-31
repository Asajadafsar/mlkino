import {Avatar, Chip, Stack, Typography} from '@mui/material'
import TableCell from '@mui/material/TableCell'
import type {ReactNode} from 'react'
import {createCardField} from '../../Components/Card/CustomCard'
import type {CommonUserType} from './UserTypes'
import profileImage from '../../Images/user.png'

export type UserListField<T> = {
    name: keyof T & string
    label: string
    render?: (row: T) => ReactNode
}

export const userFullName = (row: CommonUserType) =>
    row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || '--'

export function UserIdentity({user}: {user: CommonUserType}) {
    return (
        <Stack direction="row" gap={1} alignItems="center">
            <Avatar
                src={typeof user.avatar === 'string' ? user.avatar : profileImage}
                alt={userFullName(user)}
                sx={{width: 36, height: 36}}
            />
            <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>
                {userFullName(user)}
            </Typography>
        </Stack>
    )
}

export function AccountStatus({user}: {user: CommonUserType}) {
    const labels: Record<string, string> = {active: 'فعال', inactive: 'غیرفعال', suspended: 'مسدود'}
    return (
        <Chip
            size="small" variant="outlined"
            label={user.account_status_display || labels[user.account_status] || user.account_status || '--'}
            color={user.account_status === 'active' ? 'success' : user.account_status === 'suspended' ? 'error' : 'default'}
        />
    )
}

export function VerificationStatus({status, label}: {status: string; label?: string}) {
    const labels: Record<string, string> = {
        not_started: 'شروع نشده', pending: 'در انتظار بررسی', verified: 'تأیید شده',
        rejected: 'رد شده', unverified: 'تأیید نشده',
    }
    return (
        <Chip
            size="small" variant="outlined"
            label={label || labels[status] || status || '--'}
            color={status === 'verified' ? 'success' : status === 'rejected' ? 'error' : status === 'pending' ? 'warning' : 'default'}
        />
    )
}

function fieldValue<T>(field: UserListField<T>, row: T): ReactNode {
    if (field.render) return field.render(row)
    const value: unknown = row[field.name]
    if (value == null || value === '') return '--'
    if (typeof value === 'boolean') return value ? 'بله' : 'خیر'
    return String(value)
}

export function UserListCells<T>({fields, row, action}: {fields: UserListField<T>[]; row: T; action?: ReactNode}) {
    return <>{fields.map((field) => (
        <TableCell key={field.name} sx={{overflowWrap: 'anywhere'}}>
            {fieldValue(field, row)}
        </TableCell>
    ))}{action !== undefined && <TableCell>{action}</TableCell>}</>
}

export function userCardFields<T>(fields: UserListField<T>[]) {
    return fields
        .filter(({name}) => name !== 'full_name' && name !== 'agency_name' && name !== 'account_status')
        .map((field) => createCardField(field.label, field.name, {
            render: (row: T) => fieldValue(field, row),
        }))
}

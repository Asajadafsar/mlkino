import {FormControlLabel, Stack, Switch} from '@mui/material'
import type {Dispatch, SetStateAction} from 'react'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {Users} from '../User/Users'
import {commonUserDefaults, type CommonUserType} from '../User/UserTypes'

export interface SuperUserType extends CommonUserType {
    role: 'superadmin'
    admin_level: string | null
    is_staff: boolean
    is_superuser: boolean
}

export type UsersType = SuperUserType

export const superUserDefaults: SuperUserType = {
    ...commonUserDefaults, role: 'superadmin', admin_level: null,
    is_staff: true, is_superuser: false,
}

export function SuperUser({users, setUsers, resource, editMode = true}: {
    users: SuperUserType
    setUsers: Dispatch<SetStateAction<SuperUserType>>
    resource: string
    editMode?: boolean
}) {
    return (
        <Stack spacing={2}>
            <Users users={users} setUsers={setUsers} resource={resource} editMode={editMode} />
            <GridProducer data={[
                <CustomTextField key="admin_level" name="admin_level" label="سطح مدیریت" value={users.admin_level ?? ''} change={(event) => setUsers((prev) => ({...prev, admin_level: event.target.value || null}))} />,
                ...([
                    ['is_staff', 'دسترسی پنل مدیریت'],
                    ['is_superuser', 'دسترسی کامل Django'],
                ] as const).map(([name, label]) => (
                    <FormControlLabel key={name} label={label} control={<Switch checked={users[name] ?? false} onChange={(_, checked) => setUsers((prev) => ({...prev, [name]: checked}))} />} />
                )),
            ]} />
        </Stack>
    )
}

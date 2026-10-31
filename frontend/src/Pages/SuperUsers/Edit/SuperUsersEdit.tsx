import {buildUserRequestData} from '../../User/UserRequestData'
import {Alert, CircularProgress} from '@mui/material'
import {useUserDetails} from '../../../Core/useUserDetails'
import {EditPage} from '../../../Components/Table/EditPage'
import type {SuperUserType as UsersType} from '../SuperUsers'
import { SuperUser } from '../SuperUsers'

const resource = 'users'

export function SuperUsersEdit() {
    const {data: superUsers, setData: setSuperUsers, initial, error} = useUserDetails<UsersType>()
    if (error) return <Alert severity="error">{error}</Alert>
    if (!superUsers || !initial) return <CircularProgress aria-label="دریافت کاربر" />

    return (
        <EditPage
            resource={resource}
            title="جزئیات سوپر ادمین "
            formDetails={superUsers}
            initialData={initial}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'superadmin')}
            redirect={'users/super-users'}
        >
            <SuperUser
                users={superUsers}
                setUsers={setSuperUsers}
                resource={resource}
            />
        </EditPage>
    )
}

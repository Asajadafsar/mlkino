import {buildUserRequestData} from '../UserRequestData'
import {Alert, CircularProgress} from '@mui/material'
import {useUserDetails} from '../../../Core/useUserDetails'
import {EditPage} from '../../../Components/Table/EditPage'

import {Users,UsersType} from '../Users'
const resource = 'users'

export function UsersEdit() {
    const {data: users, setData: setUsers, initial, error} = useUserDetails<UsersType>()
    if (error) return <Alert severity="error">{error}</Alert>
    if (!users || !initial) return <CircularProgress aria-label="دریافت کاربر" />

    return (
        <EditPage
            resource={resource}
            title="جزئیات کاربر "
            formDetails={users}
            initialData={initial}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'user')}
            redirect={'users/user'}
        >
            <Users users={users} setUsers={setUsers} resource={resource} />
        </EditPage>
    )
}

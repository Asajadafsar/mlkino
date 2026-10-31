import {commonUserDefaults} from '../UserTypes'
import {buildUserRequestData} from '../UserRequestData'
import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import { Users } from '../Users'

const resource = 'users'

export function UsersCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    const formValues = {...commonUserDefaults, ...data, role: commonUserDefaults.role}
    return (
        <CreatePage
            title={'افزودن کاربر عادی'}
            resource={resource + '/'}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'user', false, true)}
            redirect={'users/user'}
            formDetails={formValues}
            
        >
            <Users users={formValues} setUsers={setData} resource={resource} editMode={false} />
        </CreatePage>
    )
}

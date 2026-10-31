import {superUserDefaults} from '../SuperUsers'
import {buildUserRequestData} from '../../User/UserRequestData'
import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import { SuperUser } from '../SuperUsers'

const resource = 'users'

export function SuperUsersCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    const formValues = {...superUserDefaults, ...data, role: superUserDefaults.role}
    return (
        <CreatePage
            title={'افزودن سوپر ادمین'}
            resource={resource + '/'}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'superadmin', false, true)}
            
            redirect={'users/super-users'}
            formDetails={formValues}
        >
            <SuperUser users={formValues} setUsers={setData} resource={resource} editMode={false} />
        </CreatePage>
    )
}

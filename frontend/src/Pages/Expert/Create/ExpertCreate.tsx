import {expertDefaults} from '../Expert'
import {buildUserRequestData} from '../../User/UserRequestData'
import React, {useContext} from 'react'
import {CurrentUserContext} from '../../../Core/CurrentUser'
import {CreatePage} from '../../../Components/Table/CreatePage'
import { Expert } from '../Expert'

const resource = 'users'

export function ExpertCreate({
    data,
    setData,
    title,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
    title:string
}) {
    const {user} = useContext(CurrentUserContext)
    const formValues = {...expertDefaults, ...data, role: expertDefaults.role, ...(user.role === 'agency' ? {agency_id: user.id} : {})}
    return (
        <CreatePage
            title={title}
            resource={resource + '/'}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'expert', false, true)}
            redirect={'users/expert'}
            formDetails={formValues}
        >
            <Expert expert={formValues} setExpert={setData} resource={resource} editMode={false} />
        </CreatePage>
    )
}

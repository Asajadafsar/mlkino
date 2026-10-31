import {useSelector} from 'react-redux'
import {selectIsSuperAdmin} from '../../../redux/RoleSlice'
import {agencyDefaults} from '../Agency'
import {buildUserRequestData, isAgencyValid} from '../../User/UserRequestData'
import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import {Agency} from '../Agency'

const resource = 'users'

export function AgencyCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    const formValues = {...agencyDefaults, ...data, role: agencyDefaults.role}
    return (
        <CreatePage
            title={'افزودن املاکی'}
            resource={resource + '/'}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'agency', isSuperAdmin, true)}
            disabled={!isAgencyValid(formValues)}
            redirect={'users/agencies'}
            formDetails={formValues}
        >
            <Agency agency={formValues} setAgency={setData} resource={resource} editMode={false} />
        </CreatePage>
    )
}

import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'

import {Tenants, TenantsType} from '../Tenants'
const resource = 'tenants'

export function TenantsEdit() {
    const state = useLocation().state as {row: TenantsType}
    const [tenants, setTenants] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات مستاجر"
            formDetails={tenants}
            initialData={state.row}
            isFormData={true}
            redirect={'/landlord-tenant/tenants'}
        >
            <Tenants tenants={tenants} setTenants={setTenants} resource={resource} editMode />
        </EditPage>
    )
}

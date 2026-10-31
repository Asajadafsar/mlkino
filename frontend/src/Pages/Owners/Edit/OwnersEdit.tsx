import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'
import {Owners, OwnersType} from '../Owners'

const resource = 'owners'

export function OwnersEdit() {
    const state = useLocation().state as {row: OwnersType}
    const [owners, setOwners] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات مالک"
            formDetails={owners}
            initialData={state.row}
            isFormData={true}
        >
            <Owners
                editMode
                owners={owners}
                setOwners={setOwners}
                resource={resource}
            />
        </EditPage>
    )
}

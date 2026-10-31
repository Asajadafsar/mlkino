import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'

import { Lessors, LessorsType } from '../Lessors'
const resource = 'lessors'

export function LessorsEdit() {
    const state = useLocation().state as {row: LessorsType}
    const [lessors, setLessors] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات موجر"
            formDetails={lessors}
            initialData={state.row}
            isFormData={true}
            redirect={'/landlord-tenant/lessors'}
        >
            <Lessors lessors={lessors} setLessors={setLessors} resource={resource} editMode  />
        </EditPage>
    )
}

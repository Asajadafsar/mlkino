import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'

import { PartnersType, Partners} from '../Partners'
const resource = 'announcements'

export function PartnersEdit() {
    const state = useLocation().state as {row: PartnersType}
    const [partners, setPartners] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات درخواست املاک"
            formDetails={partners}
            initialData={state.row}
            isFormData={true}
        >
            <Partners
                partners={partners}
                setPartners={setPartners}
                resource={resource}
            />
        </EditPage>
    )
}

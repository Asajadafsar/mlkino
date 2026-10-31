import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'
import { PropertyRecordForm, PropertyType } from '../../../Components/PropertyRecordForm'

const resource = 'advertisements'

export function AdvertisementsEdit() {
    const state = useLocation().state as {row: PropertyType}
    const [property, setProperty] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات دیوارکوب"
            formDetails={property}
            initialData={state.row}
            isFormData={true}
        >
            <PropertyRecordForm mode='ad' property={property} setProperty={setProperty} resource={resource}  />
        </EditPage>
    )
}

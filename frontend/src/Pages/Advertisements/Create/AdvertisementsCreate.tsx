import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import { PropertyRecordForm } from '../../../Components/PropertyRecordForm'

const resource = 'advertisements'

export function AdvertisementsCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    return (
        <CreatePage
            title={'دیوارکوب'}
            resource={resource + '/'}
            isFormData={true}
            redirect={resource}
            formDetails={data}
            buttonText={'ذخیره'}
        >
            <PropertyRecordForm mode='ad' property={data} setProperty={setData} resource={resource} />
        </CreatePage>
    )
}

import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import { PropertyRecordForm } from '../../../Components/PropertyRecordForm'

const resource = 'requests'

export function RequestCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    return (
        <CreatePage
            title={'درخواست جدید'}
            resource={resource + '/'}
            isFormData={true}
            redirect={resource}
            formDetails={data}
            buttonText={'ذخیره'}
        >
            <PropertyRecordForm mode='request' property={data} setProperty={setData} resource={resource} />
        </CreatePage>
    )
}

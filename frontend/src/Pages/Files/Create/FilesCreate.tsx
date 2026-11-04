import {recordPayload} from '../../../Components/PropertyRecordForm/payload'
import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import { PropertyRecordForm } from '../../../Components/PropertyRecordForm'

const resource = 'files'

export function FilesCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    return (
        <CreatePage
            title={'افزودن فایل'}
            resource={resource + '/'}
            buildRequestData={recordPayload}
            redirect={resource}
            formDetails={data}
            buttonText={'ذخیره'}
        >
            <PropertyRecordForm mode='file'  property={data} setProperty={setData} resource={resource} />
        </CreatePage>
    )
}

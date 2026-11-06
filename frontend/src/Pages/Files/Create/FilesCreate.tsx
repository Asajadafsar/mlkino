import {recordPayload} from '../../../Components/PropertyRecordForm/payload'
import React,{useContext} from 'react'
import {CurrentUserContext} from '../../../Core/CurrentUser'
import {OwnersRequestCreate} from '../../OwnersRequest/Create/OwnersRequestCreate'
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
    const {user}=useContext(CurrentUserContext)
    if(user.role==='user')return <OwnersRequestCreate data={data} setData={setData}/>
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

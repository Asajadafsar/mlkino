import {useState} from 'react'
import {useLocation} from 'react-router-dom'

import {EditPage} from '../../../Components/Table/EditPage'
import {Archives, ArchivesType} from '../Archives'

const resource = 'archives'

export function ArchivesEdit() {
    const state = useLocation().state as {
        row: ArchivesType
    }

    const [archives, setArchives] = useState<ArchivesType>(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات بایگانی"
            formDetails={archives}
            initialData={state.row}
            isFormData={true}
        >
            <Archives
                archives={archives}
                setArchives={setArchives}
                resource={resource}
            />
        </EditPage>
    )
}
import {useState} from 'react'
import {useLocation} from 'react-router-dom'

import {EditPage} from '../../../Components/Table/EditPage'
import {Contracts, ContractsType} from '../Contracts'

const resource = 'contracts'

export function ContractsEdit() {
    const state = useLocation().state as {
        row: ContractsType
    }

    const [contracts, setContracts] = useState<ContractsType>(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات قرارداد"
            formDetails={contracts}
            initialData={state.row}
            isFormData={true}
        >
            <Contracts
                contracts={contracts}
                setContracts={setContracts}
                resource={resource}
            />
        </EditPage>
    )
}
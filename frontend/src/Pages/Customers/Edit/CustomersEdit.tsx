import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'
import { Customers, CustomersType } from '../Customers'

const resource = 'customers'

export function CustomersEdit() {
    const state = useLocation().state as {row: CustomersType}
    const [customers, setCustomers] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات مشتری"
            formDetails={customers}
            initialData={state.row}
            isFormData={true}
        >
            <Customers
            editMode
                customers={customers}
                setCustomers={setCustomers}
                resource={resource}
            />
        </EditPage>
    )
}

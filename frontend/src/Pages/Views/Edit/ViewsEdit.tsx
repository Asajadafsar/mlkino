import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'
import {Views, ViewsType} from '../Views'

const resource = 'views'

export function ViewsEdit() {
    const state = useLocation().state as {row: ViewsType}
    const [views, setViews] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات بازدید"
            formDetails={views}
            initialData={state.row}
            isFormData={true}
        >
            <Views  views={views} setViews={setViews} resource={resource} />
        </EditPage>
    )
}

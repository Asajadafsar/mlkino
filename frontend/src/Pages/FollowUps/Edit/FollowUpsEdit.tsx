import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'
import { FollowUps, FollowUpsType } from '../FollowUps'

const resource = 'follow-ups'

export function FollowUpsEdit() {
    const state = useLocation().state as {row: FollowUpsType}
    const [followUps, setFollowUps] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات پیگیری"
            formDetails={followUps}
            initialData={state.row}
            isFormData={true}
        >
            <FollowUps followUps={followUps} setFollowUps={setFollowUps} resource={resource} />
        </EditPage>
    )
}

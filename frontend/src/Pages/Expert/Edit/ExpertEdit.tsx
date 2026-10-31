import {buildUserRequestData} from '../../User/UserRequestData'
import {Alert, CircularProgress} from '@mui/material'
import {useUserDetails} from '../../../Core/useUserDetails'
import {EditPage} from '../../../Components/Table/EditPage'
import {Expert, ExpertType} from '../Expert'

const resource = 'users'

export function ExpertEdit({title}: {title: string}) {
    const {data: expert, setData: setExpert, initial, error} = useUserDetails<ExpertType>()
    if (error) return <Alert severity="error">{error}</Alert>
    if (!expert || !initial) return <CircularProgress aria-label="دریافت کاربر" />

    return (
        <EditPage
            resource={resource}
            title={title}
            formDetails={expert}
            initialData={initial}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'expert')}
            redirect={'users/expert'}
        >
            <Expert expert={expert} setExpert={setExpert} resource={resource} />
        </EditPage>
    )
}

import {Alert} from '@mui/material'
import {useSelector} from 'react-redux'
import {selectIsSuperAdmin} from '../../../redux/RoleSlice'
import type {Dispatch, SetStateAction} from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import {Tickets, ticketCreateDefaults, isTicketCreateValid, type TicketCreateInput} from '../Tickets'

const resource = 'tickets'

export function TicketsCreate({data, setData, onSuccess}: {
    onSuccess?: () => void | Promise<void>
    data: Partial<TicketCreateInput>
    setData: Dispatch<SetStateAction<any>>
}) {
    const isAdmin = useSelector(selectIsSuperAdmin)
    if (isAdmin) return <Alert severity="info">سوپرادمین از بخش تیکت‌ها درخواست‌های کاربران را مشاهده و پاسخ می‌دهد.</Alert>
    const formValues: TicketCreateInput = {
        category: data.category ?? ticketCreateDefaults.category,
        subject: data.subject ?? '',
        message: data.message ?? '',
        attachment: data.attachment ?? null,
    }
    return (
        <CreatePage
            title="ثبت تیکت"
            onSuccess={onSuccess}
            resource={`${resource}/`}
            isFormData={formValues.attachment instanceof File}
            redirect={resource}
            disabled={!isTicketCreateValid(formValues)}
            buttonText="ثبت تیکت"
            formDetails={{
                category: formValues.category,
                subject: formValues.subject.trim(),
                message: formValues.message.trim(),
                ...(formValues.attachment instanceof File && {attachment: formValues.attachment}),
            }}
        >
            <Tickets tickets={formValues} setTickets={setData} resource={resource} />
        </CreatePage>
    )
}

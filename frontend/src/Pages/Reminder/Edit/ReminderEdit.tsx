import {useState} from 'react'
import {useLocation} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'
import { Reminder, ReminderType } from '../Reminder'

const resource = 'reminders'

export function ReminderEdit() {
    const state = useLocation().state as {row: ReminderType}
    const [reminders, setReminders] = useState(state.row)

    return (
        <EditPage
            resource={resource}
            title="جزئیات یادآوری"
            formDetails={{title: reminders.title, description: reminders.description, remind_at: reminders.remind_at, is_done: reminders.is_done}}
            disabled={!reminders.title.trim() || !reminders.remind_at}
            initialData={state.row}
            isFormData={false}
        >
            <Reminder
            editMode
                reminders={reminders}
                setReminders={setReminders}
                resource={resource}
            />
        </EditPage>
    )
}

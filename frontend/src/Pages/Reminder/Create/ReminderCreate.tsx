import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import {Reminder, reminderDefaults} from '../Reminder'

const resource = 'reminders'

export function ReminderCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    const formValues = {...reminderDefaults, ...data}
    return (
        <CreatePage
            title={'افزودن یادآوری'}
            resource={resource + '/'}
            isFormData={false}
            redirect={resource}
            formDetails={{title: formValues.title, description: formValues.description, remind_at: formValues.remind_at, is_done: formValues.is_done}}
            disabled={!formValues.title.trim() || !formValues.remind_at}
        >
            <Reminder reminders={formValues} setReminders={setData} resource={resource} />
        </CreatePage>
    )
}

import {FormControlLabel, Stack, Switch} from '@mui/material'
import type {Dispatch, SetStateAction} from 'react'
import moment from 'moment'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {formatDate} from '../../Core/FormatDate'

export type ReminderType = {
    id: number
    title: string
    description: string
    remind_at: string
    is_done: boolean
    created_at: string
    updated_at: string
}

export const reminderDefaults: ReminderType = {
    id: 0, title: '', description: '', remind_at: '', is_done: false,
    created_at: '', updated_at: '',
}

export function Reminder({reminders, setReminders, resource, editMode = false}: {
    reminders: ReminderType
    setReminders: Dispatch<SetStateAction<ReminderType>>
    resource: string
    editMode?: boolean
}) {
    return (
        <Stack>
            {reminders && <GridProducer
                sx={{marginBottom: '16px'}}
                data={[
                    ...(editMode ? [
                        <CustomTextField key="id" label="شناسه" value={reminders.id} disabled />,
                    ] : []),
                    <CustomTextField key="title" name="title" setData={setReminders} data-resource={resource} label="عنوان" value={reminders.title} />,
                    <CustomTextField key="description" name="description" setData={setReminders} data-resource={resource} label="توضیحات" value={reminders.description} multiline minRows={4} />,
                    <DatePickerFilter
                        key="remind_at" mode="controlled"
                        item={{field: 'remind_at', label: 'تاریخ و ساعت یادآوری'}}
                        value={reminders.remind_at ? moment(reminders.remind_at).format('YYYY-MM-DD HH:mm') : ''}
                        onChange={(value) => {
                            const date = value ? moment(value, 'YYYY-MM-DD HH:mm', true) : null
                            setReminders((prev) => ({...prev, remind_at: date?.isValid() ? date.toISOString(true) : ''}))
                        }}
                        withTime
                    />,
                    <FormControlLabel key="is_done" label="انجام شده" control={
                        <Switch checked={reminders.is_done ?? false} onChange={(_, checked) => setReminders((prev) => ({...prev, is_done: checked}))} />
                    } />,
                    ...(editMode ? [
                        <CustomTextField key="created_at" label="تاریخ ایجاد" value={formatDate(reminders.created_at)} disabled />,
                        <CustomTextField key="updated_at" label="آخرین ویرایش" value={formatDate(reminders.updated_at)} disabled />,
                    ] : []),
                ]}
            />}
        </Stack>
    )
}

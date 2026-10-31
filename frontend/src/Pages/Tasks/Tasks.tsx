import {Stack} from '@mui/material'
import type {Dispatch, SetStateAction} from 'react'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {formatDate} from '../../Core/FormatDate'

export type TasksType = {
    id: number
    title: string
    status: 'pending' | 'in_progress' | 'done'
    description: string
    due_date: string
    created_by: string
    created_by_id?: number
    created_at: string
    updated_at: string
    assignments: {id:number; assignee:number; full_name:string; status:'pending'|'in_progress'|'done';completed_at:string|null}[]
}

export const taskStatusOptions: {label: string; value: TasksType['status']}[] = [
    {label: 'در انتظار', value: 'pending'},
    {label: 'در حال انجام', value: 'in_progress'},
    {label: 'انجام شده', value: 'done'},
]

export function Tasks({
    tasks,
    setTasks,
    resource,
    editMode = false,
}: {
    tasks: TasksType
    setTasks: Dispatch<SetStateAction<TasksType>>
    resource: string
    editMode?: boolean
}) {
    return (
        <Stack>
            {tasks && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        ...(editMode ? [
                            <CustomTextField
                                key="id"
                                name="id"
                                data-resource={resource}
                                label="شناسه"
                                value={tasks.id}
                                disabled
                            />,
                        ] : []),
                        <CustomTextField
                            key="title"
                            name="title"
                            setData={setTasks}
                            data-resource={resource}
                            label="عنوان"
                            value={tasks.title}
                        />,
                        <CustomSelectField
                            key="status"
                            name="status"
                            setData={setTasks}
                            resource={resource}
                            label="وضعیت"
                            value={tasks.status}
                            disabled
                            options={taskStatusOptions}
                        />,
                        <CustomTextField
                            key="description"
                            name="description"
                            setData={setTasks}
                            data-resource={resource}
                            label="توضیحات"
                            value={tasks.description}
                            multiline
                            minRows={3}
                        />,
                        <CustomTextField
                            key="due_date"
                            name="due_date"
                            setData={setTasks}
                            data-resource={resource}
                            label="تاریخ سررسید"
                            value={tasks.due_date}
                            type="date"
                            InputLabelProps={{shrink: true}}
                        />,
                        ...(editMode ? [
                            <CustomTextField
                                key="created_by"
                                name="created_by"
                                data-resource={resource}
                                label="شناسه ایجادکننده"
                                value={tasks.created_by}
                                disabled
                            />,
                            <CustomTextField
                                key="created_at"
                                name="created_at"
                                data-resource={resource}
                                label="تاریخ ایجاد"
                                value={formatDate(tasks.created_at)}
                                disabled
                            />,
                            <CustomTextField
                                key="updated_at"
                                name="updated_at"
                                data-resource={resource}
                                label="آخرین ویرایش"
                                value={formatDate(tasks.updated_at)}
                                disabled
                            />,
                            <CustomTextField
                                key="assignments"
                                name="assignments"
                                data-resource={resource}
                                label="تخصیص‌ها"
                                value={tasks.assignments.length ? JSON.stringify(tasks.assignments, null, 2) : 'بدون تخصیص'}
                                multiline
                                disabled
                            />,
                        ] : []),
                    ]}
                />
            )}
        </Stack>
    )
}

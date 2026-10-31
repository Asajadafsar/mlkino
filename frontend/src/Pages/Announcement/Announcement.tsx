import React from 'react'
import {Stack} from '@mui/material'

import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {formatDate} from '../../Core/FormatDate'

export type AnnouncementType = {
    id: number
    title: string
    description: string
    link: string
    status: 'draft' | 'published' | 'archived'
    status_display: string
    created_by_name: string
    created_by_role: string
    created_by_role_display: string
    updated_by_name: string
    updated_by_role: string
    updated_by_role_display: string
    created_at: string
    updated_at: string
}

type AnnouncementProps = {
    announcement: AnnouncementType
    setAnnouncement: React.Dispatch<React.SetStateAction<AnnouncementType>>
    resource: string
    editMode?: boolean
}

export function Announcement({
    announcement,
    setAnnouncement,
    resource,
    editMode = true,
}: AnnouncementProps) {
    const updateAnnouncement: React.Dispatch<React.SetStateAction<AnnouncementType>> = (value) => {
        setAnnouncement((previous) => {
            if (!previous) return previous

            return typeof value === 'function' ? value(previous) : value
        })
    }

    return (
        <Stack>
            <GridProducer
                sx={{marginBottom: '16px'}}
                data={[
                    ...(editMode
                        ? [
                              <CustomTextField
                                  key="id"
                                  name="id"
                                  setData={updateAnnouncement}
                                  resource={resource}
                                  label="شناسه"
                                  value={announcement.id ?? ''}
                                  disabled
                              />,
                          ]
                        : []),

                    <CustomTextField
                        key="title"
                        name="title"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="عنوان"
                        value={announcement.title ?? ''}
                    />,

                   

                    <CustomTextField
                        key="link"
                        name="link"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="لینک"
                        value={announcement.link ?? ''}
                    />,

                    <CustomSelectField
                        key="status"
                        name="status"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="وضعیت"
                        value={announcement.status ?? ''}
                        options={[
                            {key: 'draft', label: 'پیش‌نویس'},
                            {key: 'published', label: 'منتشر شده'},
                            {key: 'archived', label: 'بایگانی شده'},
                        ]}
                    />,
                     <CustomTextField
                        key="description"
                        name="description"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="توضیحات"
                        value={announcement.description ?? ''}
                        multiline
                        minRows={4}
                    />,

                   ...(editMode ? [
                     <CustomTextField
                        key="created_by_name"
                        name="created_by_name"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="ایجاد کننده"
                        value={announcement.created_by_name ?? ''}
                        disabled
                    />,

                    <CustomTextField
                        key="created_by_role_display"
                        name="created_by_role_display"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="نقش ایجاد کننده"
                        value={announcement.created_by_role_display ?? ''}
                        disabled
                    />,

                    <CustomTextField
                        key="updated_by_name"
                        name="updated_by_name"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="آخرین ویرایش کننده"
                        value={announcement.updated_by_name ?? ''}
                        disabled
                    />,

                    <CustomTextField
                        key="created_at"
                        name="created_at"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="تاریخ ایجاد"
                        defaultValue={formatDate(announcement.created_at) ?? ''}
                        disabled
                    />,

                    <CustomTextField
                        key="updated_at"
                        name="updated_at"
                        setData={updateAnnouncement}
                        resource={resource}
                        label="تاریخ آخرین ویرایش"
                        defaultValue={formatDate(announcement.updated_at) ?? ''}
                        disabled
                    />,
                   ]:[])
                ]}
            />
        </Stack>
    )
}

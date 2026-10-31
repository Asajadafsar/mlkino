import React from 'react'
import {CreatePage} from '../../../Components/Table/CreatePage'
import {Announcement} from '../Announcement'

const resource = 'announcements'

export function AnnouncementCreate({
    data,
    setData,
}: {
    data: any
    setData: React.Dispatch<React.SetStateAction<any>>
}) {
    const values = {title: '', description: '', link: '', status: 'draft', ...data}
    return (
        <CreatePage
            title={'افزودن اطلاعیه'}
            resource={resource + '/'}
            isFormData={false}
            redirect="announcements"
            formDetails={values}
        >
            <Announcement
                announcement={values}
                setAnnouncement={setData}
                resource={resource}
                editMode={false}
            />
        </CreatePage>
    )
}
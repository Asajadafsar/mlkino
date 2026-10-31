
import {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import {EditPage} from '../../../Components/Table/EditPage'

import {Announcement, AnnouncementType} from '../Announcement'
import {DataProvider} from '../../../Core/DataProvider'

const resource = 'announcements'

export function AnnouncementEdit() {
    const [announcement, setAnnouncement] = useState<AnnouncementType>(
        {} as AnnouncementType
    )

    const [initialData, setInitialData] = useState<AnnouncementType>(
        {} as AnnouncementType
    )

    const [dataLoaded, setDataLoaded] = useState(false)

    const {id} = useParams<{id: string}>()

    useEffect(() => {
        let active = true

        const getAnnouncement = async () => {
            if (!id) return

            setDataLoaded(false)

            try {
                const response = await DataProvider.get<AnnouncementType>(
                    `${resource}/${id}/`
                )

                if (!active) return

                setAnnouncement({...response.data})
                setInitialData({...response.data})
                setDataLoaded(true)
            } catch (error) {
                console.error('Error fetching announcement:', error)
            }
        }

        getAnnouncement()

        return () => {
            active = false
        }
    }, [id])

    return (
        <EditPage
            key={id}
            resource={resource}
            title="جزئیات اطلاعیه"
            formDetails={announcement}
            initialData={initialData}
            isFormData={false}
        >
            {dataLoaded && (
                <Announcement
                    announcement={announcement}
                    setAnnouncement={setAnnouncement}
                    resource={resource}
                />
            )}
        </EditPage>
    )
}

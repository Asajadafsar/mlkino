import {Stack} from '@mui/material'

import DatePickerFilter from '../../Components/Filter/DatePicker'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'

export type ArchiveVisitStatus =
    | 'visited_liked'
    | 'visited_not_liked'
    | 'not_visited'

export type ArchiveNextStatus =
    | 'revisit'
    | 'expert_meeting'
    | 'contract'
    | 'cancelled'

export type ArchivesType = {
    id: number
    file_name: string
    full_name: string
    phone_number: string
    date: string
    description: string

    visit_status: ArchiveVisitStatus
    next_status: ArchiveNextStatus | ''
    status_description: string
    archive: boolean
}

export const visitStatusOptions = [
    {
        label: 'مشتری آمده بازدید و پسند کرده',
        value: 'visited_liked',
    },
    {
        label: 'مشتری آمده بازدید ولی نپسندیده',
        value: 'visited_not_liked',
    },
    {
        label: 'مشتری نیامده بازدید',
        value: 'not_visited',
    },
]

export const nextStatusOptions = [
    {
        label: 'بازدید مجدد',
        value: 'revisit',
    },
    {
        label: 'جلسه با کارشناس',
        value: 'expert_meeting',
    },
    {
        label: 'ثبت قرارداد',
        value: 'contract',
    },
    {
        label: 'کنسل شده',
        value: 'cancelled',
    },
]

export function getVisitStatusLabel(
    status: ArchiveVisitStatus,
): string {
    switch (status) {
        case 'visited_liked':
            return 'مشتری آمده بازدید و پسند کرده'

        case 'visited_not_liked':
            return 'مشتری آمده بازدید ولی نپسندیده'

        case 'not_visited':
            return 'مشتری نیامده بازدید'

        default:
            return '--'
    }
}

export function getNextStatusLabel(
    status: ArchiveNextStatus,
): string {
    switch (status) {
        case 'revisit':
            return 'بازدید مجدد'

        case 'expert_meeting':
            return 'جلسه با کارشناس'

        case 'contract':
            return 'ثبت قرارداد'

        case 'cancelled':
            return 'کنسل شده'

        default:
            return '--'
    }
}

export function Archives({
    archives,
    setArchives,
    resource,
}: {
    archives: ArchivesType
    setArchives: React.Dispatch<React.SetStateAction<ArchivesType>>
    resource: string
}) {
    const handleVisitStatusChange = (
        value: ArchiveVisitStatus,
    ) => {
        setArchives((prev) => ({
            ...prev,
            visit_status: value,
            next_status:
                value === 'visited_liked'
                    ? prev.next_status
                    : '',
            status_description:
                value === 'visited_liked'
                    ? prev.status_description
                    : '',
            archive:
                value === 'visited_not_liked'
                    ? prev.archive
                    : value === 'not_visited'
                      ? prev.archive
                      : prev.archive,
        }))
    }

    return (
        <Stack>
            {archives && (
                <GridProducer
                    sx={{
                        marginBottom: '16px',
                    }}
                    data={[
                        <CustomTextField
                            key="id"
                            name="id"
                            setData={setArchives}
                            resource={resource}
                            label="شناسه"
                            defaultValue={archives.id}
                            disabled
                        />,

                        <CustomTextField
                            key="file_name"
                            name="file_name"
                            setData={setArchives}
                            resource={resource}
                            label="نام فایل"
                            defaultValue={archives.file_name}
                            disabled
                        />,

                        <CustomTextField
                            key="full_name"
                            name="full_name"
                            setData={setArchives}
                            resource={resource}
                            label="نام و نام خانوادگی"
                            defaultValue={archives.full_name}
                            disabled
                        />,

                        <CustomTextField
                            key="phone_number"
                            name="phone_number"
                            setData={setArchives}
                            resource={resource}
                            label="شماره تماس"
                            defaultValue={archives.phone_number}
                            disabled
                        />,

                        <DatePickerFilter
                            key="date"
                            mode="controlled"
                            item={{
                                label: 'تاریخ و ساعت',
                            }}
                            value={archives.date}
                            onChange={(value) =>
                                setArchives((prev) => ({
                                    ...prev,
                                    date: value ?? '',
                                }))
                            }
                            withTime
                        />,

                        <CustomTextField
                            key="description"
                            name="description"
                            setData={setArchives}
                            resource={resource}
                            label="توضیحات"
                            defaultValue={archives.description}
                            multiline
                            minRows={4}
                        />,

                        <CustomSelectField
                            key="visit_status"
                            name="visit_status"
                            setData={setArchives}
                            resource={resource}
                            label="وضعیت بازدید"
                            defaultValue={archives.visit_status}
                            options={visitStatusOptions}
                            onChange={(event) =>
                                handleVisitStatusChange(
                                    event.target.value as ArchiveVisitStatus,
                                )
                            }
                        />,

                        archives.visit_status ===
                            'visited_liked' && (
                            <CustomSelectField
                                key="next_status"
                                name="next_status"
                                setData={setArchives}
                                resource={resource}
                                label="وضعیت بعدی"
                                defaultValue={archives.next_status}
                                options={nextStatusOptions}
                            />
                        ),

                        archives.visit_status ===
                            'visited_liked' && (
                            <CustomTextField
                                key="status_description"
                                name="status_description"
                                setData={setArchives}
                                resource={resource}
                                label="توضیحات وضعیت"
                                defaultValue={
                                    archives.status_description
                                }
                                multiline
                                minRows={4}
                            />
                        ),

                        archives.visit_status ===
                            'visited_not_liked' && (
                            <CustomTextField
                                key="archive"
                                name="archive"
                                setData={setArchives}
                                resource={resource}
                                label="وضعیت بایگانی"
                                defaultValue={
                                    archives.archive
                                        ? 'بایگانی شده'
                                        : 'بایگانی نشده'
                                }
                                disabled
                            />
                        ),
                    ]}
                />
            )}
        </Stack>
    )
}
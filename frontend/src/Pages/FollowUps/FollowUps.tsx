import {Stack} from '@mui/material'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import DatePickerFilter from '../../Components/Filter/DatePicker'

export type FollowUpsType = {
    id: number
    file_name: string
    full_name: string
    phone_number: string
    date: string
    description: string
}

export function FollowUps({
    followUps,
    setFollowUps,
    resource,
}: {
    followUps: FollowUpsType
    setFollowUps: React.Dispatch<
        React.SetStateAction<FollowUpsType>
    >
    resource: string
}) {
    return (
        <Stack>
            {followUps && (
                <GridProducer
                    sx={{
                        marginBottom: '16px',
                    }}
                    data={[
                        <CustomTextField
                            key="id"
                            name="id"
                            setData={setFollowUps}
                            resource={resource}
                            label="شناسه"
                            defaultValue={followUps.id}
                            disabled
                        />,

                        <CustomTextField
                            key="file_name"
                            name="file_name"
                            setData={setFollowUps}
                            resource={resource}
                            label="نام فایل"
                            defaultValue={followUps.file_name}
                        />,

                        <CustomTextField
                            key="full_name"
                            name="full_name"
                            setData={setFollowUps}
                            resource={resource}
                            label="نام و نام خانوادگی"
                            defaultValue={followUps.full_name}
                        />,

                        <CustomTextField
                            key="phone_number"
                            name="phone_number"
                            setData={setFollowUps}
                            resource={resource}
                            label="شماره تماس"
                            defaultValue={followUps.phone_number}
                        />,

                        <DatePickerFilter
                            key="date"
                            mode="controlled"
                            item={{
                                label: 'تاریخ و ساعت',
                            }}
                            value={followUps.date}
                            onChange={(value) =>
                                setFollowUps((prev) => ({
                                    ...prev,
                                    date: value ?? '',
                                }))
                            }
                            withTime
                        />,

                        <CustomTextField
                            key="description"
                            name="description"
                            setData={setFollowUps}
                            resource={resource}
                            label="توضیحات"
                            defaultValue={followUps.description}
                            multiline
                            minRows={4}
                        />,
                    ]}
                />
            )}
        </Stack>
    )
}
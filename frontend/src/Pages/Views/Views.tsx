import {Stack} from '@mui/material'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import DatePickerFilter from '../../Components/Filter/DatePicker'

export type ViewsType = {
    id: number
    file_name: string
    full_name: string
    phone_number: string
    date: string
    description: string
}

export function Views({
    views,
    setViews,
    resource,
}: {
    views: ViewsType
    setViews: React.Dispatch<React.SetStateAction<ViewsType>>
    resource: string
}) {
    return (
        <Stack>
            {views && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        <CustomTextField
                            key="id"
                            name="id"
                            setData={setViews}
                            resource={resource}
                            label="شناسه"
                            defaultValue={views.id}
                            disabled
                        />,
                        <CustomTextField
                            key="file_name"
                            name="file_name"
                            setData={setViews}
                            resource={resource}
                            label="نام فایل"
                            defaultValue={views.file_name}
                        />,
                        <CustomTextField
                            key="full_name"
                            name="full_name"
                            setData={setViews}
                            resource={resource}
                            label="نام و نام خانوادگی"
                            defaultValue={views.full_name}
                        />,
                        <CustomTextField
                            key="phone_number"
                            name="phone_number"
                            setData={setViews}
                            resource={resource}
                            label="شماره تماس"
                            defaultValue={views.phone_number}
                        />,

                        <DatePickerFilter
                            key="date"
                            mode="controlled"
                            item={{label: 'تاریخ'}}
                            value={views.date}
                            onChange={(value) =>
                                setViews((prev) => ({
                                    ...prev,
                                    date: value ?? '',
                                }))
                            }
                            withTime
                        />,
                        <CustomTextField
                            key="description"
                            name="description"
                            setData={setViews}
                            resource={resource}
                            label="توضیحات"
                            defaultValue={views.description}
                            multiline
                            minRows={4}
                        />,
                    ]}
                />
            )}
        </Stack>
    )
}

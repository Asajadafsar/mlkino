import {Stack} from '@mui/material'
import type {Dispatch, SetStateAction} from 'react'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {toSelectOptions} from '../../Components/PropertyRecordForm/utils'

export type LessorsType = {
    id: number
    full_name: string
    phone_number: string
    cities: string
    neighborhoods: string
    occupancyStatus:string
}

export function Lessors({
    lessors,
    setLessors,
    resource,
    editMode = false,
}: {
    lessors: LessorsType
    setLessors: Dispatch<SetStateAction<LessorsType>>
    resource: string
    editMode?: boolean
}) {
    return (
        <Stack>
            {lessors && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        ...(editMode
                            ? [
                                  <CustomTextField
                                      key="id"
                                      name="id"
                                      setData={setLessors}
                                      resource={resource}
                                      label="شناسه"
                                      defaultValue={lessors.id}
                                      disabled
                                  />,
                              ]
                            : []),

                        <CustomTextField
                            key="full_name"
                            name="full_name"
                            setData={setLessors}
                            resource={resource}
                            label="نام و نام خانوادگی"
                            defaultValue={lessors.full_name}
                        />,

                        <CustomTextField
                            key="phone_number"
                            name="phone_number"
                            setData={setLessors}
                            resource={resource}
                            label="تلفن"
                            defaultValue={lessors.phone_number}
                        />,

                        <CustomSelectField
                            key="cities"
                            name="cities"
                            setData={setLessors}
                            resource={resource}
                            label="شهر"
                            defaultValue={lessors.cities}
                            options={toSelectOptions(['قم'])}
                        />,

                        <CustomSelectField
                            key="neighborhoods"
                            name="neighborhoods"
                            setData={setLessors}
                            resource={resource}
                            label="محله"
                            defaultValue={lessors.neighborhoods}
                            options={toSelectOptions(['زنبیل آباد', 'آزادگان'])}
                        />,

                        <CustomSelectField
                            key="occupancyStatus"
                            name="occupancyStatus"
                            setData={setLessors}
                            resource={resource}
                            label="وضعیت سکونت"
                            defaultValue={lessors.occupancyStatus}
                            options={toSelectOptions(['تخلیه', 'تاریخ تخلیه'])}
                        />,
                    ]}
                />
            )}
        </Stack>
    )
}

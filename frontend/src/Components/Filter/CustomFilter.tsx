import {Grid, Stack} from '@mui/material'
import {Box} from '@mui/system'
import React from 'react'
import {CustomAutocomplete} from '../Input/CustomAutoComplete'
import {CustomTextField} from '../Input/CustomTextField'
import DatePickerFilter from './DatePicker'

export interface FilterType {
    date?: {}
}

export interface ParamType {
    filter: FilterType
    date?: {}
}

interface CustomFilterProps {
    filtersData: any
    params: ParamType
    setParams: React.Dispatch<React.SetStateAction<ParamType>>
}
export function CustomFilter({filtersData, setParams, params}: CustomFilterProps) {
    // const {filtersData, setParams, params} = props
    const handleChange = (event, item) => {
        setParams((params) => {
            return {
                ...params,
                [item.field]: event.target.value,
            }
        })
    }
    const handleChangeAutocomplete = (value: any, item: any) => {
        const hasZeroId = item?.choice?.some((choice) => choice.id === 0)
        setParams((params) => {
            return {
                ...params,

                [item.field]: hasZeroId ? value?.label : value?.id,
            }
        })
    }
    return (
        <Stack mb={2}>
            <Grid container spacing={1.5}>
                {filtersData.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} xl={3} key={item.field}>
                        {item.type === 'choice' ? (
                            <CustomAutocomplete
                                options={item?.choice?.map((itemChoice) => {
                                    return {label: itemChoice.label, id: itemChoice.id}
                                })}
                                value={params?.filter ? params.filter[item.field] : null}
                                onChange={(e, value) => {
                                    handleChangeAutocomplete(value, item)
                                }}
                                label={item.label}
                            />
                        ) : item.type === 'date' ? (
                            <Box width={'100%'}>
                                <DatePickerFilter setParams={setParams} item={item} />
                            </Box>
                        ) : (
                            <CustomTextField
                                value={params?.filter ? params?.filter[item.field] : null}
                                onChange={(e) => handleChange(e, item)}
                                label={item.label}
                                sx={{
                                    flexGrow: 1,
                                    borderRadius:10
                                }}
                            />
                        )}
                        {filtersData.length - 1 !== index && <Box width="8px" />}
                    </Grid>
                ))}
            </Grid>
        </Stack>
    )
}

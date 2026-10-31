import React, {useState} from 'react'
import DatePicker from '@mui/lab/DatePicker'
import {LocalizationProvider} from '@mui/lab'
import AdapterMoment from '@mui/lab/AdapterMoment'
import {CustomTextField} from './CustomTextField'
import flat from 'flat'
import {ParamType} from '../Filter/CustomFilter'

interface DateFilterProps {
    setParams: React.Dispatch<React.SetStateAction<ParamType>>
    noFilter?: boolean
    label: string
    field: string
    defaultValue?: string
    onChange?: (event) => void
}

export function DateFilter({
    setParams,
    noFilter,
    label,
    field,
    defaultValue,
    onChange,
}: DateFilterProps) {
    const [selectedDate, setSelectedDate] = useState(defaultValue ?? null)

    const handleDate = (newValue) => {
        if (!noFilter) {
            console.log('re')
            // setParams((filter) => {
            //   let date = flat.flatten(filter.date ?? {})
            //   let retValue = { ...filter, date: { ...date } }
            //   if (newValue) {
            //     retValue.date = {
            //       ...flat.unflatten({ ...date, [field]: newValue }),
            //     }
            //   }
            //   return retValue
            // })
        } else if (onChange) {
            onChange(newValue)
        }
        console.log(newValue)
        setSelectedDate(newValue)
    }

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
                value={selectedDate}
                mask="____/__/__"
                onChange={handleDate}
                label={label}
                clearable
                clearText="پاک کردن"
                renderInput={(params) => (
                    <CustomTextField
                        {...params}
                        sx={{
                            flexGrow: 1,
                        }}
                    />
                )}
            />
        </LocalizationProvider>
    )
}

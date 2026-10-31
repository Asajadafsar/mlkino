import {useEffect, useMemo, useState} from 'react'
import DatePicker, {DateObject} from 'react-multi-date-picker'
import TimePicker from 'react-multi-date-picker/plugins/time_picker'

import {Box, TextField} from '@mui/material'

import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import gregorian from 'react-date-object/calendars/gregorian'
import gregorian_en from 'react-date-object/locales/gregorian_en'

import type {ParamType} from './CustomFilter'
import './datePicker.css'

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm'

type DatePickerFilterBaseProps = {
    item: {
        field?: string
        label: string
    }
    withTime?: boolean
}
type DatePickerFilterParamsModeProps = DatePickerFilterBaseProps & {
    mode?: 'params'
    setParams: React.Dispatch<React.SetStateAction<ParamType>>
    initialValue?: string
}

type DatePickerFilterControlledModeProps = DatePickerFilterBaseProps & {
    mode: 'controlled'
    value: string | null
    onChange: (value: string | null) => void
}

type DatePickerFilterProps = DatePickerFilterParamsModeProps | DatePickerFilterControlledModeProps

// Convert Gregorian string to Persian DateObject
const toPersianDate = (value: string | null | undefined, format: string): DateObject | null => {
    if (!value || !value.trim()) {
        return null
    }

    try {
        const date = new DateObject({
            date: value,
            format,
            calendar: gregorian,
            locale: gregorian_en,
        })

        if (!date.isValid) {
            return null
        }

        return date.convert(persian, persian_fa)
    } catch {
        return null
    }
}

// Convert Persian string to DateObject
const parsePersianDate = (value: string | null | undefined, format: string): DateObject | null => {
    if (!value || !value.trim()) {
        return null
    }

    try {
        const date = new DateObject({
            date: value,
            format,
            calendar: persian,
            locale: persian_fa,
        })

        return date.isValid ? date : null
    } catch {
        return null
    }
}

export default function DatePickerFilter(props: DatePickerFilterProps) {
    const {item, withTime = false} = props

    const format = withTime ? DATE_TIME_FORMAT : DATE_FORMAT

    const isControlled = props.mode === 'controlled'

    const controlledValue = props.mode === 'controlled' ? props.value : undefined

    const initialValue = props.mode !== 'controlled' ? props.initialValue : undefined

    const [internalValue, setInternalValue] = useState<DateObject | null>(null)

    const [focused, setFocused] = useState(false)

    // Sync initial value in params mode
    useEffect(() => {
        if (isControlled) {
            return
        }

        setInternalValue(parsePersianDate(initialValue, format))
    }, [isControlled, initialValue, format])

    // Sync controlled value from parent
    const externalDate = useMemo(() => {
        if (!isControlled) {
            return null
        }

        return toPersianDate(controlledValue, format)
    }, [isControlled, controlledValue, format])

    // In controlled mode, the parent is the source of truth.
    const selectedDate = isControlled ? externalDate : internalValue

    // Handle selected date

    const handleChange = (date: DateObject | null) => {
        const fieldName = item.field

        if (!date || !date.isValid) {
            if (props.mode === 'controlled') {
                props.onChange(null)
            } else {
                setInternalValue(null)

                if (fieldName) {
                    props.setParams((prev) => {
                        const updated = {...prev}
                        delete updated[fieldName]
                        return updated
                    })
                }
            }

            return
        }

        const persianDate = new DateObject(date).convert(persian, persian_fa)

        const gregorianDate = new DateObject(date).convert(gregorian, gregorian_en).format(format)

        if (props.mode === 'controlled') {
            props.onChange(gregorianDate)
        } else {
            setInternalValue(persianDate)

            if (fieldName) {
                props.setParams((prev) => ({
                    ...prev,
                    [fieldName]: gregorianDate,
                }))
            }
        }
    }

    const displayValue = selectedDate ? selectedDate.format(format) : ''

    const active = focused || !!selectedDate

    return (
        <Box
            sx={{
                width: '100%',
                minWidth: 0,
                position: 'relative',
            }}
        >
            <DatePicker
                calendar={persian}
                locale={persian_fa}
                format={format}
                value={selectedDate}
                onChange={handleChange}
                onOpenPickNewDate={false}
                onOpen={() => setFocused(true)}
                onClose={() => setFocused(false)}
                className="blue"
                calendarPosition="bottom-right"
                containerStyle={{
                    width: '100%',
                }}
                plugins={withTime ? [<TimePicker key="time-picker" hideSeconds />] : []}
                render={(_, openCalendar) => (
                    <TextField
                        fullWidth
                        label={item.label}
                        value={displayValue}
                        variant="outlined"
                        onClick={openCalendar}
                        onFocus={() => setFocused(true)}
                        InputProps={{
                            readOnly: true,
                        }}
                        InputLabelProps={{
                            shrink: active,
                        }}
                        inputProps={{
                            style: {
                                cursor: 'pointer',
                                direction: 'ltr',
                                textAlign: 'right',
                            },
                        }}
                        sx={{
                            width: '100%',
                            minWidth: 0,

                            '& .MuiOutlinedInput-root': {
                                cursor: 'pointer',
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                            },

                            '& .MuiInputBase-input': {
                                cursor: 'pointer',
                                fontSize: '14px',
                            },

                            '& .MuiInputLabel-root': {
                                color: '#B0B0B0',
                                fontSize: '15px',
                            },

                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#E2E7DF',
                            },
                        }}
                    />
                )}
            />
        </Box>
    )
}

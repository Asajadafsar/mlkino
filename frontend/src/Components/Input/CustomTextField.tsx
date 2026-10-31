import React from 'react'
import {Box, IconButton, InputAdornment, TextField, TextFieldProps} from '@mui/material'
import {styled} from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import {NumericFormat} from 'react-number-format'

type CustomTextFieldProps<T = Record<string, unknown>> = {
    setData?: React.Dispatch<React.SetStateAction<T>>
    change?: (event: React.ChangeEvent<HTMLInputElement>) => void
    register?: Record<string, unknown>
    endIcon?: React.ReactNode
    thousandSeparator?: boolean
    inputType?: 'text' | 'number'
    type?: React.HTMLInputTypeAttribute
    defaultNumber?: number
    min?: number
    max?: number
    step?: number
} & Omit<TextFieldProps, 'type'>

export function CustomTextField<T = Record<string, unknown>>(props: CustomTextFieldProps<T>) {
    const {
        setData,
        change,
        register,
        endIcon,
        thousandSeparator,
        onChange,
        InputProps,
        inputProps,
        inputType = 'text',
        type = 'text',
        defaultNumber = 0,
        min,
        max,
        step = 1,
        value,
        defaultValue,
        name,
        ...rest
    } = props

    const getInitialNumber = (): number => {
        const initial = value ?? defaultValue ?? defaultNumber
        const parsed = Number(initial)
        return Number.isFinite(parsed) ? parsed : defaultNumber
    }

    const [numberValue, setNumberValue] = React.useState<number>(getInitialNumber)

    React.useEffect(() => {
        if (inputType !== 'number') return

        const initial = value ?? defaultValue ?? defaultNumber
        const parsed = Number(initial)

        if (Number.isFinite(parsed)) {
            setNumberValue(parsed)
        }
    }, [value, defaultValue, defaultNumber, inputType])

    const updateFormData = (newValue: string | number) => {
        if (!change && setData && name) {
            setData(
                (prev) =>
                    ({
                        ...prev,
                        [name]: newValue,
                    }) as T,
            )
        }
    }

    const emitChange = (newValue: string, originalEvent?: React.ChangeEvent<HTMLInputElement>) => {
        const syntheticEvent = {
            ...originalEvent,
            target: {
                ...originalEvent?.target,
                name: name ?? '',
                value: newValue,
            },
            currentTarget: {
                ...originalEvent?.currentTarget,
                name: name ?? '',
                value: newValue,
            },
        } as React.ChangeEvent<HTMLInputElement>

        if (change) {
            change(syntheticEvent)
        }

        onChange?.(syntheticEvent)
    }

    const changeField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value.replace(/,/g, '')

        if (inputType === 'number') {
            const parsed = Number(rawValue)

            if (Number.isFinite(parsed)) {
                setNumberValue(parsed)
                updateFormData(parsed)
            }
        } else {
            updateFormData(rawValue)
        }

        emitChange(rawValue, event)
    }

    const updateNumber = (newValue: number) => {
        let finalValue = newValue

        if (min !== undefined) {
            finalValue = Math.max(finalValue, min)
        }

        if (max !== undefined) {
            finalValue = Math.min(finalValue, max)
        }

        setNumberValue(finalValue)
        updateFormData(finalValue)
        emitChange(String(finalValue))
    }

    const increaseNumber = () => {
        updateNumber(numberValue + step)
    }

    const decreaseNumber = () => {
        updateNumber(numberValue - step)
    }

    if (inputType === 'number') {
        return (
            <Custom
                {...rest}
                name={name}
                type={type}
                value={numberValue}
                onChange={changeField}
                InputProps={{
                    ...InputProps,
                    endAdornment: (
                        <InputAdornment position="end">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                }}
                            >
                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={decreaseNumber}
                                    disabled={
                                        rest.disabled || (min !== undefined && numberValue <= min)
                                    }
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={increaseNumber}
                                    disabled={
                                        rest.disabled || (max !== undefined && numberValue >= max)
                                    }
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </InputAdornment>
                    ),
                }}
                inputProps={{
                    ...inputProps,
                    min,
                    max,
                    step,
                }}
                variant="outlined"
                fullWidth
                {...register}
            />
        )
    }

    if (thousandSeparator) {
        const numericValue = typeof value === 'string' || typeof value === 'number' ? value : ''

        const numericDefaultValue =
            typeof defaultValue === 'string' || typeof defaultValue === 'number' ? defaultValue : ''

        return (
            <NumericFormat
                {...rest}
                name={name}
                customInput={Custom}
                thousandSeparator=","
                valueIsNumericString
                {...(value !== undefined
                    ? {value: numericValue}
                    : {defaultValue: numericDefaultValue})}
                onValueChange={(values, sourceInfo) => {
                    if (sourceInfo.source !== 'event') return

                    const rawValue = values.value

                    updateFormData(rawValue)
                    emitChange(rawValue)
                }}
                InputProps={{
                    endAdornment: endIcon,
                    ...InputProps,
                }}
                inputProps={inputProps}
                variant="outlined"
                fullWidth
                {...register}
            />
        )
    }

    return (
        <Custom
            {...rest}
            name={name}
            type={type}
            {...(value !== undefined ? {value: value ?? ''} : {defaultValue: defaultValue ?? ''})}
            onChange={changeField}
            InputProps={{
                endAdornment: endIcon,
                ...InputProps,
            }}
            inputProps={inputProps}
            variant="outlined"
            fullWidth
            {...register}
        />
    )
}

const Custom = styled(TextField)(({theme}) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '11px',

        '& fieldset': {
            borderRadius: '11px',
        },

        '&.Mui-disabled': {
            backgroundColor: theme.palette.action.disabledBackground,
            opacity: 0.6,
        },

        '&:hover fieldset': {
            borderColor: `${theme.palette.primary.light} !important`,
        },
    },

    '& .MuiOutlinedInput-input': {
        fontSize: '15px',
    },

    '& .MuiInputLabel-root': {
        fontSize: 15,

        '&.Mui-disabled': {
            color: theme.palette.text.disabled,
            opacity: 0.7,
        },
    },

    '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button':
        {
            WebkitAppearance: 'none',
            margin: 0,
        },

    '& input[type=number]': {
        MozAppearance: 'textfield',
    },

    '& .MuiInputAdornment-root': {
        margin: 0,
    },

    '& .MuiIconButton-root': {
        padding: '5px',
    },
}))

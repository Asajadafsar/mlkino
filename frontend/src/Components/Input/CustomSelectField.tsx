
import React from 'react'
import {MenuItem, TextField, TextFieldProps} from '@mui/material'
import {styled} from '@mui/material/styles'

export type SelectOption =
    | {
          key: string
          label: string
          value?: string
      }
    | {
          value: string
          label: string
          key?: string
      }

type CustomSelectFieldProps<T = Record<string, unknown>> = {
    name: string
    setData: React.Dispatch<React.SetStateAction<T>>
    resource: string
    label: string
    defaultValue?: string
    value?: string
    options: SelectOption[]
    disabled?: boolean
} & Omit<
    TextFieldProps,
    'name' | 'label' | 'defaultValue' | 'value' | 'disabled'
>

export function CustomSelectField<T = Record<string, unknown>>({
    name,
    setData,
    resource,
    label,
    defaultValue,
    value,
    options,
    disabled,
    onChange,
    ...rest
}: CustomSelectFieldProps<T>) {
    const normalizedOptions = React.useMemo(
        () =>
            options.map((option) => ({
                value: option.key ?? option.value ?? '',
                label: option.label,
            })),
        [options],
    )

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const selectedValue = event.target.value

        setData((prev) => ({
            ...prev,
            [name]: selectedValue,
        }) as T)

        onChange?.(event)
    }

    return (
        <Custom
            {...rest}
            select
            fullWidth
            name={name}
            label={label}
            {...(value !== undefined
                ? {value: value ?? ''}
                : {defaultValue: defaultValue ?? ''})}
            disabled={disabled}
            onChange={handleChange}
            data-resource={resource}
            variant="outlined"
        >
            {normalizedOptions.map((option) => (
                <MenuItem
                    key={option.value}
                    value={option.value}
                >
                    {option.label}
                </MenuItem>
            ))}
        </Custom>
    )
}

const Custom = styled(TextField)(({theme}) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '15px',

        '& fieldset': {
            borderRadius: '15px',
        },

        '&.Mui-disabled': {
            backgroundColor:
                theme.palette.action.disabledBackground,
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
}))

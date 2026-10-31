import React, {useState} from 'react'
import {
    Autocomplete,
    Chip,
    SxProps,
    Theme,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {CustomTextField} from './CustomTextField'

type CustomAutocompleteProps<
    T,
    D = Record<string, unknown>,
> = {
    options: T[]
    defaultValue?: T | T[] | null
    value?: T | T[] | null
    label?: string
    name?: string

    setData?: React.Dispatch<
        React.SetStateAction<D>
    >

    optionValue?: keyof T
    optionLabel?: keyof T

    onChange?: (
        event: React.SyntheticEvent,
        value: T | T[] | null,
    ) => void

    sx?: SxProps<Theme>
    multiple?: boolean
    maxSelections?: number
}

export function CustomAutocomplete<
    T,
    D = Record<string, unknown>,
>({
    options,
    defaultValue,
    label,
    name,
    setData,
    optionValue,
    optionLabel,
    onChange,
    value,
    sx,
    multiple = false,
    maxSelections = 10,
}: CustomAutocompleteProps<T, D>) {
    const [inputValue, setInputValue] =
        useState<T | T[] | null>(
            defaultValue ??
                (multiple ? [] : null),
        )

    const currentValue =
        value !== undefined
            ? value
            : inputValue

    function getOptionValue(
        option: T,
    ): unknown {
        if (
            optionValue &&
            typeof option === 'object' &&
            option !== null
        ) {
            return (
                option as Record<
                    string,
                    unknown
                >
            )[optionValue as string]
        }

        if (
            typeof option === 'object' &&
            option !== null
        ) {
            const objectOption =
                option as Record<
                    string,
                    unknown
                >

            if ('id' in objectOption) {
                return objectOption.id
            }

            if ('value' in objectOption) {
                return objectOption.value
            }
        }

        return option
    }

    function getOptionLabel(
        option: T,
    ): string {
        if (
            optionLabel &&
            typeof option === 'object' &&
            option !== null
        ) {
            const value =
                (
                    option as Record<
                        string,
                        unknown
                    >
                )[
                    optionLabel as string
                ]

            return String(
                value ?? '',
            )
        }

        if (
            typeof option === 'object' &&
            option !== null
        ) {
            const objectOption =
                option as Record<
                    string,
                    unknown
                >

            if ('label' in objectOption) {
                return String(
                    objectOption.label ??
                        '',
                )
            }
        }

        return String(
            option ?? '',
        )
    }

    function changeField(
        event: React.SyntheticEvent,
        newValue: T | T[] | null,
    ) {
        if (multiple) {
            const selectedValues =
                Array.isArray(newValue)
                    ? newValue.slice(
                          0,
                          maxSelections,
                      )
                    : []

            setInputValue(
                selectedValues,
            )

            if (
                setData &&
                name
            ) {
                setData(
                    (prev) =>
                        ({
                            ...prev,
                            [name]:
                                selectedValues.map(
                                    (item) =>
                                        getOptionValue(
                                            item,
                                        ),
                                ),
                        }) as D,
                )
            }

            onChange?.(
                event,
                selectedValues,
            )

            return
        }

        setInputValue(
            newValue,
        )

        if (
            setData &&
            name
        ) {
            setData(
                (prev) =>
                    ({
                        ...prev,
                        [name]: newValue
                            ? getOptionValue(
                                  newValue as T,
                              )
                            : null,
                    }) as D,
            )
        }

        onChange?.(
            event,
            newValue,
        )
    }

    return (
        <Autocomplete
            multiple={multiple}
            value={
                (currentValue ??
                    (multiple
                        ? []
                        : null)) as
                    | T
                    | T[]
                    | null
            }
            options={options ?? []}
            onChange={
                changeField
            }
            getOptionLabel={
                getOptionLabel
            }
            isOptionEqualToValue={(
                option,
                selected,
            ) =>
                getOptionValue(
                    option,
                ) ===
                getOptionValue(
                    selected,
                )
            }
            popupIcon={
                <ExpandMoreIcon color="disabled" />
            }
            disableCloseOnSelect={
                multiple
            }
            limitTags={3}
            renderTags={
                multiple
                    ? (
                          tagValue,
                          getTagProps,
                      ) =>
                          tagValue.map(
                              (
                                  option,
                                  index,
                              ) => (
                                  <Chip
                                      {...getTagProps(
                                          {
                                              index,
                                          },
                                      )}
                                      key={`${String(
                                          getOptionValue(
                                              option,
                                          ),
                                      )}-${index}`}
                                      label={getOptionLabel(
                                          option,
                                      )}
                                      size="small"
                                  />
                              ),
                          )
                    : undefined
            }
            renderInput={(
                params,
            ) => (
                <CustomTextField
                    {...params}
                    name={name}
                    label={label}
                    inputType="text"
                    type="text"
                    placeholder={
                        multiple
                            ? 'جستجو و انتخاب محله'
                            : undefined
                    }
                />
            )}
            sx={{
                '& .MuiOutlinedInput-input':
                    {
                        fontSize:
                            '14px',
                    },

                '& .MuiAutocomplete-tag':
                    {
                        margin:
                            '3px',
                    },

                ...sx,
            }}
            slotProps={{
                paper: {
                    sx: {
                        '& .MuiAutocomplete-listbox':
                            {
                                fontSize:
                                    '15px',
                            },

                        '& .MuiAutocomplete-option':
                            {
                                py: '12px !important',
                            },
                    },
                },
            }}
        />
    )
}

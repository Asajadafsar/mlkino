import React, {
    useCallback,
    useEffect,
    useState,
} from 'react'

import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
} from '@mui/material'

import {SettingsSection} from './SettingsSection'

import type {
    PanelSettingsState,
    SettingsSetter,
} from './types'

import {
    CustomTextField,
} from '../../Components/Input/CustomTextField'

import type {
    PanelPreviewRef,
} from './PanelPreview'

interface ThemeSettingsProps {
    settings: PanelSettingsState
    setSettings: SettingsSetter

    previewRef: React.RefObject<
        PanelPreviewRef | null
    >
}

const colorFields: Array<{
    key: keyof PanelSettingsState['theme']
    label: string
}> = [
    {
        key: 'primary',
        label: 'Primary',
    },
    {
        key: 'secondary',
        label: 'Secondary',
    },
    {
        key: 'success',
        label: 'Success',
    },
    {
        key: 'warning',
        label: 'Warning',
    },
    {
        key: 'error',
        label: 'Error',
    },
    {
        key: 'background',
        label: 'Background',
    },
    {
        key: 'text',
        label: 'Text',
    },
]

interface ColorPickerFieldProps {
    fieldKey: keyof PanelSettingsState['theme']

    label: string

    value: string

    setSettings: SettingsSetter

    previewRef: React.RefObject<
        PanelPreviewRef | null
    >
}

const ColorPickerField = React.memo(
    function ColorPickerField({
        fieldKey,
        label,
        value,
        setSettings,
        previewRef,
    }: ColorPickerFieldProps) {
        const [
            localColor,
            setLocalColor,
        ] = useState(value)

        /*
         * Sync local color with settings
         */
        useEffect(() => {
            setLocalColor(value)
        }, [value])

        /*
         * ==========================================
         * COLOR PICKER CHANGE
         * ==========================================
         */
        const handleColorChange =
            useCallback(
                (
                    event: React.ChangeEvent<HTMLInputElement>,
                ) => {
                    const newColor =
                        event.target.value

                    setLocalColor(
                        newColor,
                    )

                    /*
                     * آپدیت لحظه‌ای Preview
                     */
                    previewRef.current?.updateColor(
                        fieldKey,
                        newColor,
                    )
                },
                [
                    fieldKey,
                    previewRef,
                ],
            )

        /*
         * ==========================================
         * COLOR PICKER BLUR
         * ==========================================
         */
        const handleColorBlur =
            useCallback(() => {
                if (
                    localColor ===
                    value
                ) {
                    return
                }

                setSettings(
                    prev => ({
                        ...prev,

                        theme: {
                            ...prev.theme,

                            [fieldKey]:
                                localColor,
                        },
                    }),
                )
            }, [
                fieldKey,
                localColor,
                setSettings,
                value,
            ])

        /*
         * ==========================================
         * TEXT FIELD CHANGE
         * ==========================================
         *
         * به جای setData از change استفاده شده.
         */
        const handleTextChange =
            useCallback(
                (
                    event: React.ChangeEvent<
                        HTMLInputElement |
                            HTMLTextAreaElement
                    >,
                ) => {
                    const newColor =
                        event.target
                            .value

                    setLocalColor(
                        newColor,
                    )

                    /*
                     * Preview لحظه‌ای
                     */
                    previewRef.current?.updateColor(
                        fieldKey,
                        newColor,
                    )

                    /*
                     * ذخیره در settings
                     */
                    setSettings(
                        prev => ({
                            ...prev,

                            theme: {
                                ...prev.theme,

                                [fieldKey]:
                                    newColor,
                            },
                        }),
                    )
                },
                [
                    fieldKey,
                    previewRef,
                    setSettings,
                ],
            )

        return (
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
            >
                {/* ==================================
                    COLOR PICKER
                =================================== */}

                <Box
                    component="input"
                    type="color"
                    value={
                        localColor
                    }
                    onChange={
                        handleColorChange
                    }
                    onBlur={
                        handleColorBlur
                    }
                    sx={{
                        width: 42,
                        height: 42,

                        flexShrink: 0,

                        padding: 0,

                        border:
                            '1px solid',

                        borderColor:
                            'divider',

                        borderRadius:
                            2,

                        cursor:
                            'pointer',

                        backgroundColor:
                            'transparent',

                        '&::-webkit-color-swatch-wrapper':
                            {
                                padding: 0,
                            },

                        '&::-webkit-color-swatch':
                            {
                                border:
                                    'none',

                                borderRadius:
                                    1.5,
                            },

                        '&::-moz-color-swatch':
                            {
                                border:
                                    'none',

                                borderRadius:
                                    1.5,
                            },
                    }}
                />

                {/* ==================================
                    TEXT FIELD
                =================================== */}

                <CustomTextField
                    key={String(
                        fieldKey,
                    )}
                    name={String(
                        fieldKey,
                    )}
                    label={label}
                    resource=""
                    value={
                        localColor
                    }
                    change={
                        handleTextChange
                    }
                />
            </Stack>
        )
    },
)

export function ThemeSettings({
    settings,
    setSettings,
    previewRef,
}: ThemeSettingsProps) {
    /*
     * ==========================================
     * MODE CHANGE
     * ==========================================
     */
    const handleModeChange = (
        event: SelectChangeEvent,
    ) => {
        const mode =
            event.target
                .value as PanelSettingsState['theme']['mode']

        /*
         * ذخیره در settings
         */
        setSettings(
            prev => ({
                ...prev,

                theme: {
                    ...prev.theme,
                    mode,
                },
            }),
        )

        /*
         * آپدیت Preview
         */
        previewRef.current?.updateMode(
            mode,
        )
    }

    return (
        <SettingsSection
            title="تنظیمات تم"
            description="حالت نمایش و رنگ‌های اصلی پنل را تعیین کنید."
        >
            <Stack spacing={3}>
                {/* ==================================
                    MODE
                =================================== */}

                <FormControl fullWidth>
                    <InputLabel>
                        حالت نمایش
                    </InputLabel>

                    <Select
                        label="حالت نمایش"
                        value={
                            settings
                                .theme
                                .mode
                        }
                        onChange={
                            handleModeChange
                        }
                        sx={{
                            borderRadius:
                                '15px',

                            '& .MuiOutlinedInput-notchedOutline':
                                {
                                    borderRadius:
                                        '15px',
                                },
                        }}
                    >
                        <MenuItem value="light">
                            روشن
                        </MenuItem>

                        <MenuItem value="dark">
                            تاریک
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* ==================================
                    COLORS
                =================================== */}

                <Box
                    sx={{
                        display:
                            'grid',

                        gridTemplateColumns:
                            {
                                xs: '1fr',

                                sm: 'repeat(2, 1fr)',

                                lg: 'repeat(3, 1fr)',
                            },

                        gap: 2,
                    }}
                >
                    {colorFields.map(
                        field => (
                            <ColorPickerField
                                key={String(
                                    field.key,
                                )}
                                fieldKey={
                                    field.key
                                }
                                label={
                                    field.label
                                }
                                value={
                                    settings
                                        .theme[
                                        field.key
                                    ]
                                }
                                setSettings={
                                    setSettings
                                }
                                previewRef={
                                    previewRef
                                }
                            />
                        ),
                    )}
                </Box>
            </Stack>
        </SettingsSection>
    )
}

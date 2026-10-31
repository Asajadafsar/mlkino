import React, {
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect,
} from 'react'

import {
    Box,
    Button,
    Chip,
    Divider,
    Stack,
    Typography,
} from '@mui/material'

import type {
    PanelSettingsState,
} from './types'

export interface PanelPreviewRef {
    updateColor: (
        key: keyof PanelSettingsState['theme'],
        value: string,
    ) => void

    updateMode: (
        mode: PanelSettingsState['theme']['mode'],
    ) => void

    reset: (
        theme: PanelSettingsState['theme'],
    ) => void
}

interface PanelPreviewProps {
    settings: PanelSettingsState
}

export const PanelPreview = React.memo(
    forwardRef<
        PanelPreviewRef,
        PanelPreviewProps
    >(function PanelPreview(
        { settings },
        ref,
    ) {
        /*
         * Preview theme مستقل است.
         */
        const [previewTheme, setPreviewTheme] =
            useState<
                PanelSettingsState['theme']
            >(settings.theme)

        /*
         * ==========================================
         * IMPERATIVE API
         * ==========================================
         */
        useEffect(() => {setPreviewTheme(settings.theme)}, [settings.theme])

        useImperativeHandle(
            ref,
            () => ({
                /*
                 * تغییر رنگ بدون Parent Render
                 */
                updateColor: (
                    key,
                    value,
                ) => {
                    setPreviewTheme(
                        prev => ({
                            ...prev,

                            [key]:
                                value,
                        }),
                    )
                },

                /*
                 * تغییر Dark / Light
                 */
                updateMode: mode => {
                    setPreviewTheme(
                        prev => ({
                            ...prev,

                            mode,
                        }),
                    )
                },

                /*
                 * Reset
                 */
                reset: theme => {
                    setPreviewTheme(
                        theme,
                    )
                },
            }),
            [],
        )

        const {
            branding,
            general,
        } = settings

        const theme =
            previewTheme

        /*
         * ==========================================
         * DARK MODE
         * ==========================================
         */

        const isDark =
            theme.mode === 'dark'

        const previewBackground =
            isDark
                ? '#121212'
                : theme.background

        const previewText =
            isDark
                ? '#FFFFFF'
                : theme.text

        const previewBorder =
            isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.12)'

        return (
            <Box
                sx={{
                    position:
                        'sticky',

                    top: 24,

                    overflow:
                        'hidden',

                    border:
                        '1px solid',

                    borderColor:
                        previewBorder,

                    borderRadius: 3,

                    backgroundColor:
                        previewBackground,

                    color:
                        previewText,

                    transition:
                        'background-color .15s ease, color .15s ease',
                }}
            >
                {/* ==================================
                    HEADER
                =================================== */}

                <Box
                    sx={{
                        px: 2,
                        py: 1.5,

                        borderBottom:
                            '1px solid',

                        borderColor:
                            previewBorder,

                        backgroundColor:
                            theme.primary,

                        color: '#fff',
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                    >
                        {branding.logo ? (
                            <Box
                                component="img"
                                src={
                                    branding.logo
                                }
                                alt=""
                                sx={{
                                    width: 30,
                                    height: 30,

                                    objectFit:
                                        'contain',
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,

                                    borderRadius:
                                        1.5,

                                    backgroundColor:
                                        'rgba(255,255,255,.2)',
                                }}
                            />
                        )}

                        <Typography
                            fontWeight={
                                700
                            }
                        >
                            {general.shortName ||
                                general.panelName ||
                                'پنل مدیریت'}
                        </Typography>
                    </Stack>
                </Box>

                {/* ==================================
                    CONTENT
                =================================== */}

                <Stack
                    spacing={2}
                    p={2.5}
                >
                    <Box>
                        <Typography
                            variant="titleMd"
                            fontWeight={
                                700
                            }
                        >
                            {general.panelName ||
                                'پنل مدیریت'}
                        </Typography>

                        <Typography
                            variant="bodySm"
                            sx={{
                                opacity:
                                    0.7,

                                display:
                                    'block',

                                mt: 0.5,
                            }}
                        >
                            {general.description ||
                                'پیش‌نمایش تنظیمات پنل'}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* ==================================
                        BUTTONS
                    =================================== */}

                    <Stack
                        direction="row"
                        spacing={1}
                    >
                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                backgroundColor:
                                    theme.primary,

                                '&:hover':
                                    {
                                        backgroundColor:
                                            theme.primary,
                                    },
                            }}
                        >
                            دکمه اصلی
                        </Button>

                        <Button
                            variant="outlined"
                            size="small"
                            sx={{
                                color:
                                    theme.secondary,

                                borderColor:
                                    theme.secondary,

                                '&:hover':
                                    {
                                        borderColor:
                                            theme.secondary,

                                        backgroundColor:
                                            `${theme.secondary}15`,
                                    },
                            }}
                        >
                            بیشتر
                        </Button>
                    </Stack>

                    {/* ==================================
                        STATUS
                    =================================== */}

                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                    >
                        <Chip
                            size="small"
                            label="موفق"
                            sx={{
                                backgroundColor:
                                    theme.success,

                                color:
                                    '#fff',
                            }}
                        />

                        <Chip
                            size="small"
                            label="هشدار"
                            sx={{
                                backgroundColor:
                                    theme.warning,

                                color:
                                    '#fff',
                            }}
                        />

                        <Chip
                            size="small"
                            label="خطا"
                            sx={{
                                backgroundColor:
                                    theme.error,

                                color:
                                    '#fff',
                            }}
                        />
                    </Stack>
                </Stack>
            </Box>
        )
    }),
)
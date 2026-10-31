import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
    Box,
    Checkbox,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import {alpha, useTheme} from '@mui/material/styles'
import React from 'react'

export type CardFieldType = {
    label: string
    name: string
    render?: (row: any, index: number) => React.ReactNode
    hideLabel?: boolean
    fullWidth?: boolean
}

export function createCardField(
    label: string,
    name: string,
    options?: Partial<Omit<CardFieldType, 'label' | 'name'>>,
): CardFieldType {
    return {
        label,
        name,
        ...options,
    }
}

export type CardRenderersType = {
    media?: (row: any, index: number) => React.ReactNode
    title?: (row: any, index: number) => React.ReactNode
    subtitle?: (row: any, index: number) => React.ReactNode
    status?: (row: any, index: number) => React.ReactNode

    /**
     * اکشن سفارشی داخل فوتر کارت
     */
    actions?: (row: any, index: number) => React.ReactNode
}

export function CustomCard({
    row,
    index,
    fields,
    renderers = {},
    selectable,
    selected,
    onSelect,
    onClick,
    onEdit,
    onDelete,
    noEdit,
    noDelete,
    clickable,
}: {
    row: any
    index: number
    fields: CardFieldType[]
    renderers?: CardRenderersType
    selectable?: boolean
    selected?: boolean
    onSelect?: () => void
    onClick?: () => void
    onEdit?: () => void
    onDelete?: () => void
    noEdit?: boolean
    noDelete?: boolean
    clickable?: boolean
}) {
    const theme = useTheme()
    const primary = theme.palette.primary

    const tint = {
        line: alpha(primary.main, 0.14),
        selectedLine: alpha(primary.main, 0.45),
        selectedBg: alpha(primary.main, 0.05),
        labelBg: alpha(primary.light, 0.06),
    }

    const hasFooter =
        !noEdit ||
        !noDelete ||
        Boolean(renderers.actions)

    return (
        <Box
            onClick={clickable ? onClick : undefined}
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: '18px',
                border: '1px solid',
                borderColor: selected
                    ? tint.selectedLine
                    : tint.line,
                bgcolor: selected
                    ? tint.selectedBg
                    : 'background.paper',
                overflow: 'hidden',
                cursor: clickable ? 'pointer' : 'default',
                boxShadow:
                    '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.08)',
                transition:
                    'border-color .2s ease, box-shadow .2s ease, transform .2s ease',

                '&:hover': clickable
                    ? {
                          borderColor: alpha(
                              primary.main,
                              0.32,
                          ),
                          boxShadow:
                              '0 1px 2px rgba(0,0,0,0.04), 0 14px 28px -18px rgba(0,0,0,0.16)',
                          transform: 'translateY(-2px)',
                      }
                    : undefined,

                '&:focus-visible': {
                    outline: `2px solid ${primary.main}`,
                    outlineOffset: 2,
                },
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={{
                    p: 2,
                    pb: 1.5,
                }}
            >
                {selectable && (
                    <Checkbox
                        checked={Boolean(selected)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onSelect?.()}
                        sx={{
                            p: 0.5,
                            borderRadius: '6px',

                            '&.Mui-checked': {
                                color: 'primary.main',
                            },

                            '& .MuiSvgIcon-root': {
                                fontSize: 20,
                            },
                        }}
                    />
                )}

                {renderers.media && (
                    <Box
                        sx={{
                            flexShrink: 0,
                            width: 52,
                            height: 52,
                            borderRadius: '14px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: tint.labelBg,
                            border: '1px solid',
                            borderColor: tint.line,

                            '& img': {
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            },
                        }}
                    >
                        {renderers.media(row, index)}
                    </Box>
                )}

                <Stack
                    spacing={0.3}
                    sx={{
                        minWidth: 0,
                        flexGrow: 1,
                    }}
                >
                    {renderers.title && (
                        <Typography
                            sx={{
                                fontSize: {
                                    xs: '14px',
                                    sm: '15px',
                                },
                                fontWeight: 700,
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {renderers.title(row, index)}
                        </Typography>
                    )}

                    {renderers.subtitle && (
                        <Typography
                            sx={{
                                fontSize: '12.5px',
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {renderers.subtitle(row, index)}
                        </Typography>
                    )}
                </Stack>

                {renderers.status && (
                    <Box sx={{flexShrink: 0}}>
                        {renderers.status(row, index)}
                    </Box>
                )}
            </Stack>

            {/* Body */}
            {fields.length > 0 && (
                <Box
                    sx={{
                        px: 2,
                        pb: 1.5,
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr',
                        },
                        gap: 1.25,
                    }}
                >
                    {fields.map((field) => {
                        const value = field.render
                            ? field.render(row, index)
                            : row?.[field.name] ?? '--'

                        return (
                            <Stack
                                key={field.name}
                                spacing={0.35}
                                sx={{
                                    minWidth: 0,
                                    gridColumn: field.fullWidth
                                        ? '1 / -1'
                                        : 'auto',
                                }}
                            >
                                {!field.hideLabel && (
                                    <Typography
                                        sx={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: 'text.secondary',
                                        }}
                                    >
                                        {field.label}
                                    </Typography>
                                )}

                                <Box
                                    sx={{
                                        fontSize: {
                                            xs: '13px',
                                            sm: '13.5px',
                                        },
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: field.fullWidth
                                            ? 'normal'
                                            : 'nowrap',
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {value === '' ||
                                    value === null ||
                                    value === undefined
                                        ? '--'
                                        : value}
                                </Box>
                            </Stack>
                        )
                    })}
                </Box>
            )}

            {/* Footer */}
            {hasFooter && (
                <Box
                    sx={{
                        mt: 'auto',
                        width: '100%',
                    }}
                >
                    <Divider
                        sx={{
                            borderColor: tint.line,
                        }}
                    />

                    <Box
                        sx={{
                            px: 1.5,
                            py: 1,
                            bgcolor: tint.labelBg,
                        }}
                    >
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                        >
                            {/* اکشن سفارشی */}
                            {renderers.actions ? (
                                <Box
                                    sx={{
                                        minWidth: 0,
                                        flex: 1,
                                    }}
                                >
                                    {renderers.actions(
                                        row,
                                        index,
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{flex: 1}} />
                            )}

                            {/* ویرایش / حذف */}
                            {(!noEdit || !noDelete) && (
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        flexShrink: 0,
                                    }}
                                >
                                    {!noEdit && (
                                        <Tooltip title="ویرایش">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onEdit?.()
                                                }}
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: '10px',
                                                    color: 'primary.main',
                                                    backgroundColor:
                                                        alpha(
                                                            primary.main,
                                                            0.06,
                                                        ),
                                                    border: '1px solid',
                                                    borderColor:
                                                        alpha(
                                                            primary.main,
                                                            0.12,
                                                        ),

                                                    '&:hover': {
                                                        backgroundColor:
                                                            alpha(
                                                                primary.main,
                                                                0.12,
                                                            ),
                                                        borderColor:
                                                            alpha(
                                                                primary.main,
                                                                0.25,
                                                            ),
                                                        color: 'primary.dark',
                                                    },

                                                    '&:active': {
                                                        transform:
                                                            'scale(.96)',
                                                    },
                                                }}
                                            >
                                                <EditIcon
                                                    sx={{
                                                        fontSize: 18,
                                                    }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {!noDelete && (
                                        <Tooltip title="حذف">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDelete?.()
                                                }}
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: '10px',
                                                    color: 'error.main',
                                                    backgroundColor:
                                                        alpha(
                                                            theme.palette
                                                                .error
                                                                .main,
                                                            0.06,
                                                        ),
                                                    border: '1px solid',
                                                    borderColor:
                                                        alpha(
                                                            theme.palette
                                                                .error
                                                                .main,
                                                            0.12,
                                                        ),

                                                    '&:hover': {
                                                        backgroundColor:
                                                            alpha(
                                                                theme.palette
                                                                    .error
                                                                    .main,
                                                                0.12,
                                                            ),
                                                        borderColor:
                                                            alpha(
                                                                theme.palette
                                                                    .error
                                                                    .main,
                                                                0.25,
                                                            ),
                                                        color: 'error.dark',
                                                    },

                                                    '&:active': {
                                                        transform:
                                                            'scale(.96)',
                                                    },
                                                }}
                                            >
                                                <DeleteIcon
                                                    sx={{
                                                        fontSize: 18,
                                                    }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Stack>
                            )}
                        </Stack>
                    </Box>
                </Box>
            )}
        </Box>
    )
}
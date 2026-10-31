import {Box, Paper, Typography} from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'

import {AMENITIES_OPTIONS} from '../constants'

export function AmenitiesGrid({
    value,
    onChange,
    options = AMENITIES_OPTIONS,
}: {
    value: string[]
    onChange: (next: string[]) => void
    // در حالت «آگهی» لیست دیگری از امکانات (بیشتر تبلیغاتی) نمایش داده می‌شود
    options?: string[]
}) {
    const selected = value ?? []

    const toggle = (item: string) => {
        onChange(selected.includes(item) ? selected.filter((v) => v !== item) : [...selected, item])
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(4, 1fr)',
                },
                gap: 1.5,
            }}
        >
            {options.map((item) => {
                const isSelected = selected.includes(item)

                return (
                    <Paper
                        key={item}
                        onClick={() => toggle(item)}
                        elevation={0}
                        sx={{
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            px: 1.75,
                            py: 1.5,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            backgroundColor: isSelected ? 'primary.main' : 'background.paper',
                            color: isSelected ? 'primary.contrastText' : 'text.primary',
                            transition:
                                'border-color .15s ease, background-color .15s ease, transform .1s ease',

                            '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateY(-1px)',
                            },
                        }}
                    >
                        <Typography variant="body2" fontWeight={500}>
                            {item}
                        </Typography>

                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                flexShrink: 0,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid',
                                borderColor: isSelected ? 'primary.contrastText' : 'divider',
                                backgroundColor: 'transparent',
                            }}
                        >
                            {isSelected && (
                                <CheckRoundedIcon
                                    sx={{
                                        fontSize: 14,
                                        color: 'primary.contrastText',
                                    }}
                                />
                            )}
                        </Box>
                    </Paper>
                )
            })}
        </Box>
    )
}

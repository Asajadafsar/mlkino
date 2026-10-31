// SectionTitle.tsx
import { Box, Stack, SxProps, Theme, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

interface SectionTitleProps {
    title: string
    actionLabel?: string
    actionHref?: string
    sx?: SxProps<Theme>
}

export default function SectionTitle({ title, actionLabel, actionHref, sx }: SectionTitleProps) {
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2.5, ...sx }}
        >
            <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                    sx={{
                        width: 4,
                        height: 20,
                        borderRadius: '2px',
                        bgcolor: 'secondary.main',
                    }}
                />
                <Typography
                    sx={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'text.primary',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </Typography>
            </Stack>

            {actionLabel && actionHref && (
                <Typography
                    component={Link}
                    to={actionHref}
                    sx={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'primary.dark',
                        textDecoration: 'none',
                        borderBottom: '1px solid transparent',
                        pb: '1px',
                        transition: 'border-color 0.15s ease',
                        '&:hover': { borderColor: 'primary.dark' },
                    }}
                >
                    {actionLabel}
                </Typography>
            )}
        </Stack>
    )
}
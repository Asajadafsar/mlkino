import { Box, Divider, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface SettingsSectionProps {
    title: string
    description?: string
    children: ReactNode
}

export function SettingsSection({
    title,
    description,
    children,
}: SettingsSectionProps) {
    return (
        <Box
            sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '15px',
                p: { xs: 2, sm: 3 },
            }}
        >
            <Stack spacing={0.75} mb={3}>
                <Typography variant="titleMd" fontWeight={700}>
                    {title}
                </Typography>

                {description && (
                    <Typography variant="bodyMd" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </Stack>

            <Divider sx={{ mb: 3 }} />
            {children}
        </Box>
    )
}

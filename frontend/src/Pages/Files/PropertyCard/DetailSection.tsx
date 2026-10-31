import {Box, Stack, Typography} from '@mui/material'
import {DetailGrid} from './DetailGrid'
import {isFilled} from './propertyCardUtils'
import type {DetailField} from './propertyCardUtils'

export function DetailSection({
    title,
    icon,
    fields,
}: {
    title: string
    icon?: React.ReactNode
    fields: DetailField[]
}) {
    const hasAny = fields.some((field) => isFilled(field.value))
    if (!hasAny) return null

    return (
        <Box sx={{p: 1.75, borderRadius: 2.5, bgcolor: 'background.default'}}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{mb: 0.5, color: 'text.secondary'}}>
                {icon}
                <Typography variant="labelSm" fontWeight={700}>
                    {title}
                </Typography>
            </Stack>
            <DetailGrid fields={fields} />
        </Box>
    )
}
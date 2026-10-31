import {Box, InputAdornment, Paper, Stack, Typography} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'

import {CustomTextField} from '../shared'
import type {StepProps} from '../types'

export function RangeField({
    baseName,
    label,
    unit,
    property,
    setProperty,
    resource,
}: StepProps & {
    baseName: string
    label: string
    unit?: string
}) {
    const fromValue = (property as Record<string, unknown>)[`${baseName}From`] as number
    const toValue = (property as Record<string, unknown>)[`${baseName}To`] as number

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 1.5,
                pt: 1.25,
                borderRadius: 2.5,
                borderColor: 'divider',
            }}
        >
            <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{display: 'block', mb: 0.75, px: 0.5}}
            >
                {label}
                {unit ? ` (${unit})` : ''}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{flex: 1}}>
                    <CustomTextField
                        name={`${baseName}From`}
                        setData={setProperty}
                        resource={resource}
                        label="از"
                        defaultValue={fromValue}
                        thousandSeparator
                        endIcon={unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined}
                    />
                </Box>

                <ArrowBackRoundedIcon
                    sx={{fontSize: 18, color: 'text.disabled', flexShrink: 0}}
                />

                <Box sx={{flex: 1}}>
                    <CustomTextField
                        name={`${baseName}To`}
                        setData={setProperty}
                        resource={resource}
                        label="تا"
                        defaultValue={toValue}
                        thousandSeparator
                        endIcon={unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined}
                    />
                </Box>
            </Stack>
        </Paper>
    )
}

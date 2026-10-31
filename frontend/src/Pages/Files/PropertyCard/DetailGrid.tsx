import {Stack, Typography} from '@mui/material'
import {isFilled} from './propertyCardUtils'
import type {DetailField} from './propertyCardUtils'

/** لیست ردیفی از جفت‌های لیبل/مقدار با جداکننده‌ی ظریف؛ فقط فیلدهای پرشده رندر می‌شوند */
export function DetailGrid({fields}: {fields: DetailField[]}) {
    const visible = fields.filter((field) => isFilled(field.value))
    if (visible.length === 0) return null

    return (
        <Stack>
            {visible.map((field, idx) => (
                <Stack
                    key={field.label}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{
                        py: 1,
                        borderBottom: idx < visible.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="bodySm" color="text.secondary" sx={{flexShrink: 0}}>
                        {field.label}
                    </Typography>
                    <Typography variant="bodySm" fontWeight={700} sx={{textAlign: 'left'}}>
                        {field.value}
                    </Typography>
                </Stack>
            ))}
        </Stack>
    )
}
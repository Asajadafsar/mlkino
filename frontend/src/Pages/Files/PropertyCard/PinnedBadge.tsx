import {Box} from '@mui/material'
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded'

/** نشونگر پین روی گوشه‌ی کارت؛ فقط وقتی پین شده باشه نمایش داده می‌شه */
export function PinnedBadge() {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 8,
                insetInlineStart: 8,
                zIndex: 2,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'warning.main',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                transform: 'rotate(-45deg)',
            }}
        >
            <PushPinRoundedIcon sx={{fontSize: 15}} />
        </Box>
    )
}
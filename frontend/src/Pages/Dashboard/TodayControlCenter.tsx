import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'

const todayDate = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
}).format(new Date())

interface TodayControlCenterProps {
    onRegisterFile?: () => void
    onViewCustomers?: () => void
}

export default function TodayControlCenter({
    onRegisterFile,
    onViewCustomers,
}: TodayControlCenterProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main}14, ${theme.palette.primary.main}05)`,
            }}
        >
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
            >
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        مرکز کنترل امروز
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {todayDate}
                    </Typography>
                </Box>

        
            </Stack>
        </Paper>
    )
}
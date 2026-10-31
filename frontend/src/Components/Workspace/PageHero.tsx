import {Box, Stack, Typography} from '@mui/material'
export function PageHero({title, description, illustration = '/assets/users-3d.png', action, warm = false}: {title: string; description: string; illustration?: string; action?: React.ReactNode; warm?: boolean}) {
    return <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{position: 'relative', minHeight: {xs: 155, md: 200}, px: {xs: 2.5, md: 4}, py: 3, mb: 3, borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: warm ? '#ffe8c0' : '#dfeafe', background: warm ? 'linear-gradient(115deg,#fff7e9,#fff0d8)' : 'linear-gradient(120deg,#f7faff,#eaf2ff)'}}>
        <Box sx={{position: 'relative', zIndex: 1, maxWidth: {xs: '75%', md: '65%'}}}><Typography variant="h1" fontWeight={900} fontSize={{xs: 23, md: 32}} sx={{mb: 1}}>{title}</Typography><Typography color="text.secondary" fontSize={{xs: 12, md: 14}} lineHeight={2}>{description}</Typography>{action && <Box sx={{mt: 2}}>{action}</Box>}</Box>
        <Box component="img" src={illustration} alt="" sx={{position: 'absolute', right: {xs: -25, md: 25}, top: '50%', transform: 'translateY(-50%)', width: {xs: 180, md: 300}, height: {xs: 180, md: 225}, objectFit: 'contain', opacity: {xs: .3, md: 1}, pointerEvents: 'none'}} />
    </Stack>
}

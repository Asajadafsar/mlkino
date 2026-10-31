import {useEffect, useState} from 'react'
import {Alert, Box, Button, Chip, Grid, Paper, Skeleton, Stack, Typography} from '@mui/material'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import {Link, Navigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {selectRole, UserRole} from '../../redux/RoleSlice'
import {DataProvider} from '../../Core/DataProvider'
import {PageHero} from '../../Components/Workspace/PageHero'

const categories = [
    {role: 'agency', title: 'املاکی‌ها', description: 'مشاهده دفاتر، اطلاعات کسب‌وکار و مدیریت املاکی‌ها', path: 'agencies', color: '#e39a22', hue: '150deg', icon: <ApartmentRoundedIcon />},
    {role: 'expert', title: 'کارشناسان', description: 'مدیریت کارشناسان و ارتباط آن‌ها با دفاتر املاک', path: 'expert', color: '#246bfd', hue: '0deg', icon: <GroupsRoundedIcon />},
    {role: 'user', title: 'کاربران عادی', description: 'مشاهده پرونده، اطلاعات و وضعیت حساب کاربران', path: 'user', color: '#19b876', hue: '290deg', icon: <PersonRoundedIcon />},
    {role: 'superadmin', title: 'سوپرادمین‌ها', description: 'مدیریت حساب‌های مدیریتی و دسترسی‌های سامانه', path: 'super-users', color: '#9265ef', hue: '45deg', icon: <AdminPanelSettingsRoundedIcon />},
]
export default function UserPage() {
    const role = useSelector(selectRole)
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (role !== UserRole.SUPERADMIN) return
        let active = true
        DataProvider.get<{results: {role: string; count: number}[]}>('users/groups/').then(response => {if (active) setCounts(Object.fromEntries(response.data.results.map(group => [group.role, group.count])))}).catch(error => {if (active) setError(error.message)}).finally(() => {if (active) setLoading(false)})
        return () => {active = false}
    }, [role])
    if (role === UserRole.AGENCY) return <Navigate to="/users/expert" replace />
    if (role !== UserRole.SUPERADMIN) return <Alert severity="warning">دسترسی به مدیریت کاربران ندارید.</Alert>
    return <Box>
        <PageHero title="مدیریت کاربران" description="برای مشاهده و مدیریت کاربران، دسته‌بندی موردنظر خود را انتخاب کنید." />
        {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
        <Grid container spacing={2.5}>{categories.map(category => <Grid key={category.role} item xs={12} md={6}>
            <Paper variant="outlined" sx={{position: 'relative', minHeight: 245, p: {xs: 2.5, md: 3.5}, borderRadius: '20px', borderColor: `${category.color}20`, background: `linear-gradient(130deg,#ffffff,${category.color}05)`, overflow: 'hidden', transition: 'transform .2s, box-shadow .2s', '&:hover': {transform: 'translateY(-3px)', boxShadow: `0 12px 28px ${category.color}10`}}}>
                <Box component="img" src="/assets/users-3d.png" alt="" sx={{position: 'absolute', right: 4, bottom: 15, width: {xs: 150, lg: 215}, height: 185, objectFit: 'contain', filter: `hue-rotate(${category.hue})`, opacity: .9}} />
                <Stack alignItems="flex-start" sx={{position: 'relative', minHeight: 190, width: {xs: '70%', lg: '65%'}, zIndex: 1}}>
                    <Box sx={{display: 'flex', p: 1.5, bgcolor: `${category.color}10`, color: category.color, borderRadius: '16px', mb: 1.5}}>{category.icon}</Box>
                    <Typography fontSize={23} fontWeight={900}>{category.title}</Typography><Typography variant="body2" color="text.secondary" sx={{mt: .5, mb: 1}}>{category.description}</Typography>
                    {loading ? <Skeleton width={90} /> : <Chip size="small" icon={category.icon} label={`${(counts[category.role] || 0).toLocaleString('fa-IR')} حساب`} sx={{color: category.color, bgcolor: `${category.color}10`, '& .MuiChip-icon': {color: 'inherit'}}} />}
                    <Button component={Link} to={`/users/${category.path}`} endIcon={<ArrowBackRoundedIcon />} fullWidth sx={{mt: 2, bgcolor: `${category.color}10`, color: category.color, justifyContent: 'space-between'}}>مشاهده {category.title}</Button>
                </Stack>
            </Paper>
        </Grid>)}</Grid>
    </Box>
}

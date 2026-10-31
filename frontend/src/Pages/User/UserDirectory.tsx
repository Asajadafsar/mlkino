import {useContext, useEffect, useState} from 'react'
import {Alert, Avatar, Box, Button, Chip, Grid, InputAdornment, MenuItem, Pagination, Paper, Skeleton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import {Link} from 'react-router-dom'
import {DataProvider} from '../../Core/DataProvider'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {ImpersonateButton} from '../../Components/Impersonation/ImpersonateButton'
import {PageHero} from '../../Components/Workspace/PageHero'
import {formatDate} from '../../Core/FormatDate'

export type DirectoryRole = 'user' | 'agency' | 'expert' | 'superadmin'
const groups = {
    user: {title: 'کاربران عادی', single: 'کاربر', path: 'user', color: '#19b876'},
    agency: {title: 'املاکی‌ها', single: 'املاکی', path: 'agencies', color: '#e39a22'},
    expert: {title: 'کارشناسان', single: 'کارشناس', path: 'expert', color: '#246bfd'},
    superadmin: {title: 'سوپرادمین‌ها', single: 'سوپرادمین', path: 'super-users', color: '#9265ef'},
}
export function UserDirectory({role}: {role: DirectoryRole}) {
    const {user} = useContext(CurrentUserContext)
    const group = groups[role]
    const [rows, setRows] = useState<any[]>([])
    const [count, setCount] = useState(0)
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const [cards, setCards] = useState(true)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    useEffect(() => {
        let active = true
        setLoading(true); setError('')
        const timer = setTimeout(() => {
            DataProvider.get<{results: any[]; total_results: number}>(`users/?group=${role}&search=${encodeURIComponent(query)}&account_status=${status}&page=${page}&page_size=12`).then(response => {
                if (active) {setRows(response.data.results); setCount(response.data.total_results)}
            }).catch(error => {if (active) setError(error.message || 'فهرست دریافت نشد')}).finally(() => {if (active) setLoading(false)})
        }, 200)
        return () => {active = false; clearTimeout(timer)}
    }, [role, query, status, page, attempt])
    return <Stack spacing={2.5}>
        <PageHero title={user.role === 'agency' ? 'کارشناسان دفتر شما' : `مدیریت ${group.title}`} description={user.role === 'agency' ? 'فقط کارشناسان مرتبط با دفتر خودتان را مشاهده، اضافه و ویرایش کنید.' : `پرونده ${group.title} را مشاهده کنید و اطلاعات آن‌ها را به‌روز نگه دارید.`} action={<Button component={Link} to={`/users/${group.path}/create`} variant="contained" startIcon={<AddRoundedIcon />}>افزودن {group.single} جدید</Button>} />
        <Stack direction={{xs: 'column', sm: 'row'}} gap={1.5} alignItems="center" justifyContent="space-between">
            <TextField placeholder="جستجو بر اساس نام، شماره یا ایمیل…" value={query} onChange={event => {setQuery(event.target.value); setPage(1)}} inputProps={{'aria-label': 'جستجوی کاربران'}} sx={{width: {xs: '100%', sm: 360}, bgcolor: 'background.paper'}} InputProps={{startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>}} />
            <Stack direction="row" gap={1} sx={{width: {xs: '100%', sm: 'auto'}}}><TextField select SelectProps={{displayEmpty: true}} size="small" value={status} onChange={event => {setStatus(event.target.value); setPage(1)}} sx={{minWidth: 175, bgcolor: 'background.paper'}} inputProps={{'aria-label': 'وضعیت کاربران'}}><MenuItem value="">همه وضعیت‌ها</MenuItem><MenuItem value="active">فعال</MenuItem><MenuItem value="inactive">غیرفعال</MenuItem><MenuItem value="suspended">مسدود</MenuItem></TextField><ToggleButtonGroup exclusive value={cards} onChange={(_, value) => {if (value !== null) setCards(value)}} size="small"><ToggleButton value={true} aria-label="نمای کارت"><GridViewRoundedIcon fontSize="small" /></ToggleButton><ToggleButton value={false} aria-label="نمای فهرست"><ViewAgendaOutlinedIcon fontSize="small" /></ToggleButton></ToggleButtonGroup></Stack>
        </Stack>
        <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary" fontSize={12}>{count.toLocaleString('fa-IR')} {group.single}</Typography><Button size="small" onClick={() => setAttempt(value => value + 1)}>به‌روزرسانی فهرست</Button></Stack>
        {error && <Alert severity="error" action={<Button onClick={() => setAttempt(value => value + 1)}>تلاش مجدد</Button>}>{error}</Alert>}
        {loading ? <Grid container spacing={2}>{[1,2,3].map(id => <Grid key={id} item xs={12} md={cards ? 6 : 12} xl={cards ? 4 : 12}><Skeleton variant="rounded" height={250} /></Grid>)}</Grid> : rows.length ? <Grid container spacing={2}>{rows.map(row => <Grid key={row.id} item xs={12} md={cards ? 6 : 12} xl={cards ? 4 : 12}>
            <Paper variant="outlined" sx={{p: 2.5, borderRadius: '18px', height: '100%', position: 'relative', overflow: 'hidden', '&:hover': {borderColor: `${group.color}55`, boxShadow: '0 8px 24px #1a448409'}}}>
                <Box sx={{position: 'absolute', top: 0, right: 0, left: 0, height: 65, background: `linear-gradient(120deg,${group.color}12,transparent)`}} />
                <Stack direction="row" gap={1.5} alignItems="center" sx={{position: 'relative'}}><Avatar src={row.avatar || undefined} sx={{width: 58, height: 58, bgcolor: `${group.color}15`, color: group.color, border: '3px solid white', fontWeight: 700}}>{(row.full_name || row.first_name || group.single)[0]}</Avatar><Box sx={{flex: 1, minWidth: 0}}><Typography fontWeight={700} noWrap>{row.full_name || [row.first_name,row.last_name].filter(Boolean).join(' ') || `حساب #${row.id}`}</Typography><Typography variant="caption" color="text.secondary">{row.agency_profile?.agency_name || row.expert_profile?.job_title || row.agency_name || row.job_title || group.single}</Typography></Box><Chip size="small" label={row.account_status_display || (row.is_active ? 'فعال' : 'غیرفعال')} color={row.account_status === 'active' ? 'success' : 'default'} variant="outlined" /></Stack>
                <Stack spacing={1.3} sx={{py: 2.5}}><Stack direction="row" justifyContent="space-between" gap={1}><Typography variant="caption" color="text.secondary"><PhoneOutlinedIcon sx={{fontSize: 14, verticalAlign: 'middle', mr: .5}} />شماره تماس</Typography><Typography fontSize={12} dir="ltr" sx={{direction: 'ltr'}}>{row.phone || '—'}</Typography></Stack><Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary"><BadgeOutlinedIcon sx={{fontSize: 14, verticalAlign: 'middle', mr: .5}} />شناسه پرونده</Typography><Typography fontSize={12}>#{row.id}</Typography></Stack>{row.date_joined && <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary"><CalendarMonthOutlinedIcon sx={{fontSize: 14, verticalAlign: 'middle', mr: .5}} />تاریخ عضویت</Typography><Typography fontSize={10}>{formatDate(row.date_joined)}</Typography></Stack>}</Stack>
                <Stack direction="row" gap={1} alignItems="center" sx={{pt: 1.5, borderTop: '1px solid', borderColor: 'divider'}}><Button fullWidth component={Link} to={`/users/${group.path}/${row.id}`} startIcon={<EditOutlinedIcon fontSize="small" />} sx={{bgcolor: `${group.color}0d`, color: group.color}}>مشاهده و ویرایش پرونده</Button>{user.role === 'superadmin' && <ImpersonateButton target={row} />}</Stack>
            </Paper>
        </Grid>)}</Grid> : !error && <Paper variant="outlined" sx={{p: 4, py: 5, textAlign: 'center', borderRadius: '20px', background: 'linear-gradient(#ffffff,#f9fbff)'}}><Box component="img" src="/assets/users-3d.png" alt="" sx={{width: 220, height: 160, objectFit: 'contain', mb: 1}} /><Typography variant="h5" fontWeight={700}>{query || status ? 'کاربری با این مشخصات پیدا نشد.' : `هنوز ${group.single}ی ثبت نشده است.`}</Typography><Typography color="text.secondary" sx={{mt: 1, mb: 2}}>از همین‌جا پرونده جدید ایجاد کنید یا فیلترهای جستجو را تغییر دهید.</Typography><Button component={Link} to={`/users/${group.path}/create`} variant="contained" startIcon={<AddRoundedIcon />}>افزودن {group.single} جدید</Button></Paper>}
        {count > 12 && <Stack alignItems="center" sx={{py: 2}}><Pagination count={Math.ceil(count / 12)} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" /></Stack>}
    </Stack>
}

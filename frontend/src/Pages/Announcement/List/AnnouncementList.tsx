import {useEffect, useState} from 'react'
import {Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, MenuItem, Pagination, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import {Link} from 'react-router-dom'
import {PageHero} from '../../../Components/Workspace/PageHero'
import {DataProvider} from '../../../Core/DataProvider'
import {formatDate} from '../../../Core/FormatDate'
import type {AnnouncementType} from '../Announcement'

const states = {published: {label: 'منتشر شده', color: 'success'}, draft: {label: 'پیش‌نویس', color: 'warning'}, archived: {label: 'بایگانی شده', color: 'default'}} as const
function Status({value}: {value: AnnouncementType['status']}) {const state = states[value]; return <Chip size="small" color={state?.color || 'default'} label={state?.label || value} sx={{border: 0, fontSize: 10}} />}
function validLink(value?: string) {try {const url = new URL(value || ''); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null} catch {return null}}

export function AnnouncementList() {
    const [rows, setRows] = useState<AnnouncementType[]>([])
    const [count, setCount] = useState(0)
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const [size, setSize] = useState(10)
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [selected, setSelected] = useState<AnnouncementType | null>(null)
    const [cards, setCards] = useState(false)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    const [deleting, setDeleting] = useState<AnnouncementType | null>(null)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
        let active = true
        setLoading(true); setError('')
        const timer = setTimeout(() => {
            DataProvider.get<{results: AnnouncementType[]; total_results: number}>(`announcements/?search=${encodeURIComponent(search)}&status=${status}&page=${page}&page_size=${size}`).then(response => {
                if (!active) return
                setRows(response.data.results); setCount(response.data.total_results)
                setSelectedId(previous => response.data.results.some(row => row.id === previous) ? previous : response.data.results[0]?.id ?? null)
            }).catch(error => {if (active) setError(error.message)}).finally(() => {if (active) setLoading(false)})
        }, 200)
        return () => {active = false; clearTimeout(timer)}
    }, [search, status, page, size, attempt])
    useEffect(() => {
        let active = true
        if (!selectedId) {setSelected(null); return}
        setSelected(null)
        DataProvider.get<AnnouncementType>(`announcements/${selectedId}/`).then(response => {if (active) setSelected(response.data)}).catch(error => {if (active) setError(error.message)})
        return () => {active = false}
    }, [selectedId, attempt])
    const remove = async () => {
        if (!deleting || busy) return
        setBusy(true)
        try {await DataProvider.delete(`announcements/${deleting.id}/`); setDeleting(null); setSelectedId(null); setAttempt(value => value + 1)}
        catch (error: any) {setError(error.message)}
        finally {setBusy(false)}
    }
    return <Stack spacing={2}>
        <PageHero title="مدیریت اطلاعیه‌ها" description="با ارسال اطلاعیه، کاربران خود را از آخرین اخبار و تغییرات مطلع کنید." illustration="/assets/announcement-3d.png" action={<Button component={Link} to="/announcements/create" variant="contained" startIcon={<AddRoundedIcon />}>اطلاعیه جدید</Button>} />
        {error && <Alert severity="error" action={<Button onClick={() => setAttempt(value => value + 1)}>تلاش مجدد</Button>}>{error}</Alert>}
        <Grid container spacing={2} sx={{width: 'calc(100% + 16px) !important', ml: '-16px !important'}}>
            <Grid item xs={12} lg={3.5}>
                <Paper variant="outlined" sx={{p: 2.5, height: '100%', borderRadius: '18px'}}>
                    <Stack direction="row" gap={1} alignItems="center" sx={{mb: 2}}><Box sx={{p: 1, borderRadius: 2, bgcolor: '#edf3ff', color: 'primary.main', display: 'flex'}}><DescriptionOutlinedIcon /></Box><Typography fontSize={17} fontWeight={700}>جزئیات اطلاعیه</Typography></Stack>
                    {selected ? <>
                        <Stack alignItems="flex-start" spacing={1.5} sx={{p: 2.5, background: 'linear-gradient(120deg,#eef4ff,#f7faff)', borderRadius: '15px', mb: 3}}><Box sx={{p: 1.5, color: 'primary.main', bgcolor: '#e3ecff', borderRadius: 3, display: 'flex'}}><CampaignRoundedIcon sx={{fontSize: 30}} /></Box><Typography fontWeight={700}>{selected.title}</Typography><Status value={selected.status} /></Stack>
                        <Stack spacing={2}>{[['شناسه', `#${selected.id}`], ['ایجادکننده', selected.created_by_name || '—'], ['تاریخ ایجاد', formatDate(selected.created_at)], ['آخرین ویرایش', formatDate(selected.updated_at)]].map(([label,value]) => <Stack direction="row" justifyContent="space-between" gap={1} key={label}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography fontSize={11} textAlign="left">{value}</Typography></Stack>)}</Stack>
                        <Typography variant="caption" color="text.secondary" sx={{mt: 2.5, display: 'block'}}>توضیحات</Typography><Typography fontSize={12} sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: .5, mb: 2}}>{selected.description || 'توضیحی ثبت نشده است.'}</Typography>
                        {validLink(selected.link) && <Button component="a" href={validLink(selected.link)!} target="_blank" rel="noopener noreferrer" size="small" startIcon={<LinkRoundedIcon />}>مشاهده لینک اطلاعیه</Button>}
                        <Stack direction="row" gap={1} sx={{pt: 2.5, mt: 2, borderTop: '1px solid', borderColor: 'divider'}}><Button fullWidth component={Link} to={`/announcements/${selected.id}`} variant="outlined" startIcon={<EditOutlinedIcon />}>ویرایش</Button><Button color="error" onClick={() => setDeleting(selected)} startIcon={<DeleteOutlineRoundedIcon />} sx={{bgcolor: '#fff1f3'}}>حذف</Button></Stack>
                    </> : loading || selectedId ? <Skeleton variant="rounded" height={250} /> : <Stack spacing={1} alignItems="center" sx={{py: 5}}><CampaignRoundedIcon sx={{fontSize: 50, color: '#c7d6f0'}} /><Typography variant="body2" color="text.secondary">اطلاعیه‌ای برای نمایش انتخاب نشده است.</Typography></Stack>}
                </Paper>
            </Grid>
            <Grid item xs={12} lg={8.5}>
                <Paper variant="outlined" sx={{p: {xs: 1.5, md: 2.5}, height: '100%', borderRadius: '18px', minHeight: 430}}>
                    <Stack direction={{xs: 'column', md: 'row'}} gap={1.2} sx={{mb: 3}}><TextField value={search} onChange={event => {setSearch(event.target.value); setPage(1)}} placeholder="جستجو در عنوان یا متن اطلاعیه…" sx={{flex: 1}} inputProps={{'aria-label': 'جستجوی اطلاعیه'}} InputProps={{startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>}} /><TextField select SelectProps={{displayEmpty: true}} value={status} onChange={event => {setStatus(event.target.value); setPage(1)}} sx={{minWidth: 170}} inputProps={{'aria-label': 'وضعیت اطلاعیه'}}><MenuItem value="">همه وضعیت‌ها</MenuItem>{Object.entries(states).map(([value,option]) => <MenuItem value={value} key={value}>{option.label}</MenuItem>)}</TextField><ToggleButtonGroup exclusive size="small" value={cards} onChange={(_,value) => {if (value !== null) setCards(value)}}><ToggleButton value={true} aria-label="نمای کارت اطلاعیه"><GridViewRoundedIcon fontSize="small" /></ToggleButton><ToggleButton value={false} aria-label="نمای جدول اطلاعیه"><ViewListRoundedIcon fontSize="small" /></ToggleButton></ToggleButtonGroup></Stack>
                    {loading ? <Skeleton variant="rounded" height={300} /> : rows.length === 0 ? <Stack spacing={1.5} alignItems="center" sx={{py: 5}}><Box component="img" src="/assets/announcement-3d.png" alt="" sx={{width: 150, height: 120, objectFit: 'contain'}} /><Typography color="text.secondary">اطلاعیه‌ای با این مشخصات یافت نشد.</Typography><Button component={Link} to="/announcements/create" variant="contained">ثبت اولین اطلاعیه</Button></Stack> : cards ? <Grid container spacing={1.5}>{rows.map(row => <Grid item xs={12} md={6} key={row.id}><Paper variant="outlined" onClick={() => setSelectedId(row.id)} sx={{p: 2, borderRadius: 3, cursor: 'pointer', borderColor: selectedId === row.id ? 'primary.main' : 'divider', '&:hover': {bgcolor: 'action.hover'}}}><Stack direction="row" alignItems="center" justifyContent="space-between"><CampaignRoundedIcon color="primary" /><Status value={row.status} /></Stack><Typography fontWeight={700} sx={{my: 2}}>{row.title}</Typography><Typography variant="caption" color="text.secondary">{formatDate(row.created_at)}</Typography></Paper></Grid>)}</Grid> : <TableContainer sx={{border: 0}}><Table size="small"><TableHead><TableRow><TableCell padding="checkbox" /><TableCell>#</TableCell><TableCell>عنوان</TableCell><TableCell>وضعیت</TableCell><TableCell>تاریخ ایجاد</TableCell><TableCell>لینک</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead><TableBody>{rows.map(row => <TableRow hover key={row.id} selected={selectedId === row.id} onClick={() => setSelectedId(row.id)} sx={{cursor: 'pointer'}}><TableCell padding="checkbox"><Checkbox checked={selectedId === row.id} size="small" inputProps={{'aria-label': `انتخاب ${row.title}`}} /></TableCell><TableCell>{row.id.toLocaleString('fa-IR')}</TableCell><TableCell sx={{maxWidth: 220}}><Typography fontSize={12} fontWeight={700} noWrap>{row.title}</Typography></TableCell><TableCell><Status value={row.status} /></TableCell><TableCell><Typography fontSize={10} whiteSpace="nowrap">{formatDate(row.created_at)}</Typography></TableCell><TableCell>{validLink(row.link) ? <Tooltip title="مشاهده لینک"><IconButton component="a" href={validLink(row.link)!} target="_blank" rel="noopener noreferrer" size="small" onClick={event => event.stopPropagation()}><LinkRoundedIcon fontSize="small" color="primary" /></IconButton></Tooltip> : '—'}</TableCell><TableCell><Stack direction="row" gap={.6}><IconButton aria-label={`ویرایش ${row.title}`} component={Link} to={`/announcements/${row.id}`} size="small" sx={{bgcolor: '#edf3ff', color: 'primary.main'}} onClick={event => event.stopPropagation()}><EditOutlinedIcon fontSize="small" /></IconButton><IconButton aria-label={`حذف ${row.title}`} size="small" color="error" sx={{bgcolor: '#fff1f3'}} onClick={event => {event.stopPropagation(); setDeleting(row)}}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
                </Paper>
            </Grid>
        </Grid>
        <Paper variant="outlined" sx={{p: 2, borderRadius: '16px'}}><Stack direction={{xs: 'column', sm: 'row'}} gap={2} alignItems="center" justifyContent="space-between"><Stack direction="row" gap={1.5} alignItems="center"><Typography variant="caption" color="text.secondary">تعداد در صفحه:</Typography><TextField select size="small" value={size} onChange={event => {setSize(Number(event.target.value)); setPage(1)}}>{[10,20,50].map(value => <MenuItem key={value} value={value}>{value.toLocaleString('fa-IR')}</MenuItem>)}</TextField><Typography variant="caption">{count.toLocaleString('fa-IR')} اطلاعیه</Typography></Stack><Pagination count={Math.max(1,Math.ceil(count / size))} page={page} onChange={(_,value) => setPage(value)} color="primary" shape="rounded" /></Stack></Paper>
        <Dialog open={Boolean(deleting)} onClose={() => {if (!busy) setDeleting(null)}}><DialogTitle>حذف اطلاعیه</DialogTitle><DialogContent><Typography>اطلاعیه «{deleting?.title}» حذف شود؟</Typography></DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>انصراف</Button><Button disabled={busy} color="error" variant="contained" onClick={remove}>{busy ? 'در حال حذف…' : 'حذف اطلاعیه'}</Button></DialogActions></Dialog>
    </Stack>
}

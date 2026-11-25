import {useEffect, useState} from 'react'
import {Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Pagination, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography} from '@mui/material'
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
import {AuditHero,AuditStats} from '../../../Components/AuditWorkspace/AuditPresentation'
import {DataProvider} from '../../../Core/DataProvider'
import {formatDate} from '../../../Core/FormatDate'
import type {AnnouncementType} from '../Announcement'

const states = {published: {label: 'منتشر شده', color: 'success'}, draft: {label: 'پیش‌نویس', color: 'warning'}, archived: {label: 'بایگانی شده', color: 'default'}} as const
function Status({value}: {value: AnnouncementType['status']}) {const state = states[value]; return <Chip size="small" color={state?.color || 'default'} label={state?.label || value} sx={{border: 0, fontSize: 10}} />}
function validLink(value?: string) {try {const url = new URL(value || ''); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null} catch {return null}}

export function AnnouncementList() {
    const [rows, setRows] = useState<AnnouncementType[]>([])
    const [count, setCount] = useState(0)
    const [totals,setTotals]=useState<Record<string,number>|null>(null)
    const [statsError,setStatsError]=useState('')
    const [selectedError,setSelectedError]=useState('')
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
    useEffect(()=>{let active=true;setTotals(null);setStatsError('');Promise.all(['published','draft','archived'].map(async state=>{const r=await DataProvider.get<{total_results:number}>(`announcements/?status=${state}&page=1&page_size=1`);return [state,r.data.total_results] as const})).then(entries=>{if(active)setTotals(Object.fromEntries(entries))}).catch(()=>{if(active)setStatsError('دریافت آمار اطلاعیه‌ها ناموفق بود.')});return()=>{active=false}},[attempt])
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
        if (!selectedId) {setSelected(null); setSelectedError(''); return}
        setSelected(null);setSelectedError('')
        DataProvider.get<AnnouncementType>(`announcements/${selectedId}/`).then(response => {if (active) setSelected(response.data)}).catch(error => {if (active) setSelectedError(error.message||'جزئیات اطلاعیه دریافت نشد.')})
        return () => {active = false}
    }, [selectedId, attempt])
    const remove = async () => {
        if (!deleting || busy) return
        setBusy(true)
        try {await DataProvider.delete(`announcements/${deleting.id}/`); setDeleting(null); setSelectedId(null); if(rows.length===1&&page>1)setPage(v=>v-1); setAttempt(value => value + 1)}
        catch (error: any) {setError(error.message)}
        finally {setBusy(false)}
    }
    return <Stack spacing={0} className="audit-workspace announcement-workspace">
        <AuditHero action={<Button component={Link} to="/announcements/create" variant="contained" startIcon={<AddRoundedIcon/>}>اطلاعیه جدید</Button>}/>
        <AuditStats items={[{title:'کل اطلاعیه‌ها',value:totals?Object.values(totals).reduce((a,b)=>a+b,0):null,tone:'blue'},{title:'منتشرشده',value:totals?.published??null,tone:'green'},{title:'پیش‌نویس',value:totals?.draft??null,tone:'amber'},{title:'بایگانی‌شده',value:totals?.archived??null,tone:'red'}]}/>
        {statsError&&<Alert severity="warning" action={<Button onClick={()=>setAttempt(v=>v+1)}>تلاش مجدد</Button>}>{statsError}</Alert>}
        {error && <Alert severity="error" action={<Button onClick={() => setAttempt(value => value + 1)}>تلاش مجدد</Button>}>{error}</Alert>}
        <div className="announcement-master-detail announcement-aligned-layout">
            <div className="announcement-detail-column">
                <Paper className="announcement-detail" variant="outlined" sx={{p: 2.5, height: '100%', borderRadius: '18px'}}>
                    <Stack direction="row" gap={1} alignItems="center" sx={{mb: 2}}><Box sx={{p: 1, borderRadius: 2, bgcolor: '#edf3ff', color: 'primary.main', display: 'flex'}}><DescriptionOutlinedIcon /></Box><Typography fontSize={17} fontWeight={700}>جزئیات اطلاعیه</Typography></Stack>
                    {selectedError?<Alert severity="error" action={<Button onClick={()=>setAttempt(v=>v+1)}>تلاش مجدد</Button>}>{selectedError}</Alert>:selected ? <>
                        <Stack className="announcement-detail-summary" alignItems="flex-start" spacing={0} sx={{p: 2.5, background: 'linear-gradient(120deg,#eef4ff,#f7faff)', borderRadius: '15px', mb: 3}}><Box sx={{p: 1.5, color: 'primary.main', bgcolor: '#e3ecff', borderRadius: 3, display: 'flex'}}><CampaignRoundedIcon sx={{fontSize: 30}} /></Box><Typography fontWeight={700}>{selected.title}</Typography><Status value={selected.status} /></Stack>
                        <dl className="announcement-detail-fields">{[['شناسه', `#${selected.id}`], ['ایجادکننده', selected.created_by_name || '—'], ['تاریخ ایجاد', formatDate(selected.created_at)], ['آخرین ویرایش', formatDate(selected.updated_at)]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                        <div className="announcement-description"><Typography variant="caption" color="text.secondary">توضیحات</Typography><Typography fontSize={12} sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{selected.description || 'توضیحی ثبت نشده است.'}</Typography></div>
                        {validLink(selected.link) && <Button component="a" href={validLink(selected.link)!} target="_blank" rel="noopener noreferrer" size="small" startIcon={<LinkRoundedIcon />}>مشاهده لینک اطلاعیه</Button>}
                        <Stack className="announcement-detail-actions" direction="row" gap={1} sx={{pt: 2.5, mt: 2, borderTop: '1px solid', borderColor: 'divider'}}><Button fullWidth component={Link} to={`/announcements/${selected.id}`} variant="outlined" startIcon={<EditOutlinedIcon />}>ویرایش</Button><Button color="error" onClick={() => setDeleting(selected)} startIcon={<DeleteOutlineRoundedIcon />} sx={{bgcolor: '#fff1f3'}}>حذف</Button></Stack>
                    </> : loading || selectedId ? <Skeleton variant="rounded" height={250} /> : <Stack spacing={1} alignItems="center" sx={{py: 5}}><CampaignRoundedIcon sx={{fontSize: 50, color: '#c7d6f0'}} /><Typography variant="body2" color="text.secondary">اطلاعیه‌ای برای نمایش انتخاب نشده است.</Typography></Stack>}
                </Paper>
            </div>
            <div className="announcement-list-column">
                <Paper className="announcement-list-panel" variant="outlined" sx={{p: {xs: 1.5, md: 2.5}, height: '100%', borderRadius: '18px', minHeight: 430}}>
                    <div className="announcement-aligned-toolbar"><TextField value={search} onChange={event => {setSearch(event.target.value); setPage(1)}} placeholder="جستجو در عنوان یا متن اطلاعیه…" sx={{flex: 1}} inputProps={{'aria-label': 'جستجوی اطلاعیه'}} InputProps={{startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>}} /><TextField select SelectProps={{displayEmpty: true}} value={status} onChange={event => {setStatus(event.target.value); setPage(1)}} sx={{minWidth: 170}} inputProps={{'aria-label': 'وضعیت اطلاعیه'}}><MenuItem value="">همه وضعیت‌ها</MenuItem>{Object.entries(states).map(([value,option]) => <MenuItem value={value} key={value}>{option.label}</MenuItem>)}</TextField><ToggleButtonGroup exclusive size="small" value={cards} onChange={(_,value) => {if (value !== null) setCards(value)}}><ToggleButton value={true} aria-label="نمای کارت اطلاعیه"><GridViewRoundedIcon fontSize="small" /></ToggleButton><ToggleButton value={false} aria-label="نمای جدول اطلاعیه"><ViewListRoundedIcon fontSize="small" /></ToggleButton></ToggleButtonGroup></div>
                    {loading ? <Skeleton variant="rounded" height={300} /> : rows.length === 0 ? <Stack spacing={1.5} alignItems="center" sx={{py: 5}}><Box component="img" src="/assets/announcement-3d.webp" alt="" sx={{width: 150, height: 120, objectFit: 'contain'}} /><Typography color="text.secondary">اطلاعیه‌ای با این مشخصات یافت نشد.</Typography><Button component={Link} to="/announcements/create" variant="contained">ثبت اولین اطلاعیه</Button></Stack> : cards ? <div className="announcement-cards-grid">{rows.map(row => <div key={row.id}><Paper role="button" tabIndex={0} aria-label={`مشاهده ${row.title}`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedId(row.id)}}} variant="outlined" onClick={() => setSelectedId(row.id)} sx={{p: 2, borderRadius: 3, cursor: 'pointer', borderColor: selectedId === row.id ? 'primary.main' : 'divider', '&:hover': {bgcolor: 'action.hover'}}}><Stack direction="row" alignItems="center" justifyContent="space-between"><CampaignRoundedIcon color="primary" /><Status value={row.status} /></Stack><Typography fontWeight={700} sx={{my: 2}}>{row.title}</Typography><Typography variant="caption" color="text.secondary">{formatDate(row.created_at)}</Typography></Paper></div>)}</div> : <TableContainer sx={{border: 0}}><Table size="small" className="announcement-aligned-table"><colgroup><col style={{width:38}}/><col style={{width:46}}/><col/><col style={{width:108}}/><col style={{width:150}}/><col style={{width:50}}/><col style={{width:90}}/></colgroup><TableHead><TableRow><TableCell padding="checkbox" /><TableCell>#</TableCell><TableCell>عنوان</TableCell><TableCell>وضعیت</TableCell><TableCell>تاریخ ایجاد</TableCell><TableCell>لینک</TableCell><TableCell>عملیات</TableCell></TableRow></TableHead><TableBody>{rows.map(row => <TableRow hover key={row.id} selected={selectedId === row.id} onClick={() => setSelectedId(row.id)} sx={{cursor: 'pointer'}}><TableCell padding="checkbox"><Checkbox checked={selectedId === row.id} size="small" inputProps={{'aria-label': `انتخاب ${row.title}`}} /></TableCell><TableCell>{row.id.toLocaleString('fa-IR')}</TableCell><TableCell sx={{maxWidth: 220}}><Typography fontSize={12} fontWeight={700} noWrap>{row.title}</Typography></TableCell><TableCell><Status value={row.status} /></TableCell><TableCell><Typography fontSize={10} whiteSpace="nowrap">{formatDate(row.created_at)}</Typography></TableCell><TableCell>{validLink(row.link) ? <Tooltip title="مشاهده لینک"><IconButton component="a" href={validLink(row.link)!} target="_blank" rel="noopener noreferrer" size="small" onClick={event => event.stopPropagation()}><LinkRoundedIcon fontSize="small" color="primary" /></IconButton></Tooltip> : '—'}</TableCell><TableCell><Stack direction="row" gap={.6}><IconButton aria-label={`ویرایش ${row.title}`} component={Link} to={`/announcements/${row.id}`} size="small" sx={{bgcolor: '#edf3ff', color: 'primary.main'}} onClick={event => event.stopPropagation()}><EditOutlinedIcon fontSize="small" /></IconButton><IconButton aria-label={`حذف ${row.title}`} size="small" color="error" sx={{bgcolor: '#fff1f3'}} onClick={event => {event.stopPropagation(); setDeleting(row)}}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
                </Paper>
            </div>
        </div>
        <Paper className="audit-pagination" variant="outlined" sx={{p: 2, borderRadius: '16px'}}><Stack direction={{xs: 'column', sm: 'row'}} gap={2} alignItems="center" justifyContent="space-between"><Stack direction="row" gap={1.5} alignItems="center"><Typography variant="caption" color="text.secondary">تعداد در صفحه:</Typography><TextField select size="small" value={size} onChange={event => {setSize(Number(event.target.value)); setPage(1)}}>{[10,20,50].map(value => <MenuItem key={value} value={value}>{value.toLocaleString('fa-IR')}</MenuItem>)}</TextField><Typography variant="caption">{count.toLocaleString('fa-IR')} اطلاعیه</Typography></Stack><Pagination count={Math.max(1,Math.ceil(count / size))} page={page} onChange={(_,value) => setPage(value)} color="primary" shape="rounded" /></Stack></Paper>
        <Dialog open={Boolean(deleting)} onClose={() => {if (!busy) setDeleting(null)}}><DialogTitle>حذف اطلاعیه</DialogTitle><DialogContent><Typography>اطلاعیه «{deleting?.title}» حذف شود؟</Typography>{error&&<Alert severity="error">{error}</Alert>}</DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>انصراف</Button><Button disabled={busy} color="error" variant="contained" onClick={remove}>{busy ? 'در حال حذف…' : 'حذف اطلاعیه'}</Button></DialogActions></Dialog>
    </Stack>
}

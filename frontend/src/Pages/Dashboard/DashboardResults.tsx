import {Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography} from '@mui/material'
import {Link} from 'react-router-dom'
import type {CityPoint} from './DashboardMap'

export const layerLabels: Record<string, string> = {
    files: 'فایل‌های ملکی', requests: 'درخواست‌ها', contracts: 'قراردادها',
    agencies: 'دفاتر املاک', experts: 'کارشناسان', users: 'کاربران',
}

export default function DashboardResults({rows, demo, total, onSelect}: {rows: CityPoint[]; demo: boolean; total: number; onSelect?: (point:CityPoint)=>void}) {
    if (!rows.length) return <Typography sx={{p: 2}}>موردی با فیلترهای انتخاب‌شده پیدا نشد.</Typography>
    const routeFor = (row: CityPoint) => {
        if (!row.id || demo) return undefined
        if (row.kind === 'files' || row.kind === 'requests') return '/' + row.kind + '?demo=0&detail=' + row.id
        if (row.kind === 'contracts') return '/contracts'
        return undefined
    }
    return <Stack spacing={1}>
        <TableContainer>
            <Table size="small">
                <TableHead><TableRow>{['عنوان', 'نوع', 'محدوده', 'دفتر', 'حضور', 'جزئیات'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
                <TableBody>{rows.map(row => {
                    const route = routeFor(row)
                    return <TableRow key={row.kind + '-' + row.id}>
                        <TableCell>{route ? <Link to={route}>{row.title}</Link> : row.title}</TableCell>
                        <TableCell>{layerLabels[row.kind || '']}</TableCell>
                        <TableCell>{[row.province, row.city, row.district, row.neighborhood].filter(Boolean).join('، ') || 'ثبت نشده'}</TableCell>
                        <TableCell>{row.office || '—'}</TableCell>
                        <TableCell>{row.online === undefined ? '—' : row.online ? 'آنلاین' : 'آفلاین'}</TableCell>
                    <TableCell><Button onClick={()=>onSelect?.(row)} aria-label={'جزئیات '+(row.title||row.city)}>مشاهده جزئیات</Button></TableCell></TableRow>
                })}</TableBody>
            </Table>
        </TableContainer>
        {total > rows.length && <Typography sx={{p: 1}}>برای مشاهدهٔ موارد بیشتر، محدوده را کوچک‌تر کنید.</Typography>}
    </Stack>
}

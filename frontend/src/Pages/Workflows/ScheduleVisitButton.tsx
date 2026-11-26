import {useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack} from '@mui/material'
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {dateTimeIso} from '../../Core/PersianDate'
import {DataProvider} from '../../Core/DataProvider'

export function ScheduleVisitButton({propertyId}: {propertyId: number}) {
    const [open, setOpen] = useState(false)
    const [start, setStart] = useState<string | null>(null)
    const [end, setEnd] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)

    const save = async (event: FormEvent) => {
        event.preventDefault()
        if (saving) return
        const starts_at = dateTimeIso(start || '')
        const ends_at = dateTimeIso(end || '')
        if (!starts_at || !ends_at || +new Date(starts_at) <= Date.now() || +new Date(ends_at) <= +new Date(starts_at)) {
            setError('زمان شروع باید در آینده و زمان پایان بعد از شروع باشد.')
            return
        }
        setSaving(true)
        setError('')
        try {
            await DataProvider.post('workflows/visit-slots/', {data: {property_id: propertyId, starts_at, ends_at}})
            setSaved(true)
            setStart(null)
            setEnd(null)
        } catch (reason: any) {
            setError(reason.message || 'ثبت زمان بازدید انجام نشد.')
        } finally {
            setSaving(false)
        }
    }

    return <>
        <Button variant="outlined" startIcon={<EventAvailableOutlined/>} onClick={() => {setError(''); setSaved(false); setOpen(true)}}>تعیین زمان بازدید</Button>
        <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
            <form onSubmit={save}>
                <DialogTitle>تعیین زمان بازدید</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{pt: 1}}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {saved && <Alert severity="success">زمان بازدید ثبت شد.</Alert>}
                        <DatePickerFilter mode="controlled" item={{label: 'تاریخ و ساعت شروع'}} withTime required value={start} onChange={value => {setSaved(false); setStart(value)}}/>
                        <DatePickerFilter mode="controlled" item={{label: 'تاریخ و ساعت پایان'}} withTime required value={end} onChange={value => {setSaved(false); setEnd(value)}}/>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} component={Link} to={`/visit-slots?property=${propertyId}`}>مشاهده زمان‌های ثبت‌شده</Button>
                    <Button disabled={saving} onClick={() => setOpen(false)}>بستن</Button>
                    <Button disabled={saving || !start || !end} type="submit" variant="contained">ثبت زمان</Button>
                </DialogActions>
            </form>
        </Dialog>
    </>
}

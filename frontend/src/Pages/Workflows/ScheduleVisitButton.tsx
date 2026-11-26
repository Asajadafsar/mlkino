import {useState, useEffect, type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography} from '@mui/material'
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {dateTimeIso} from '../../Core/PersianDate'
import {DataProvider} from '../../Core/DataProvider'

type Slot = {id: number; starts_at: string; ends_at: string}
const visitDate = new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
})
const visitTime = new Intl.DateTimeFormat('fa-IR', {timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit'})

export function ScheduleVisitButton({propertyId}: {propertyId: number}) {
    const [open, setOpen] = useState(false)
    const [start, setStart] = useState<string | null>(null)
    const [end, setEnd] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const [slots, setSlots] = useState<Slot[]>([])
    const [listError, setListError] = useState(false)
    useEffect(() => {
        if (!open) return
        let active = true
        setListError(false)
        DataProvider.get<{results: Slot[]}>(`workflows/visit-slots/?property_id=${propertyId}`)
            .then(response => {if (active) setSlots(response.data.results)})
            .catch(() => {if (active) setListError(true)})
        return () => {active = false}
    }, [open, propertyId, saved])

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
                        {listError && <Alert severity="warning">فهرست زمان‌های ثبت‌شده دریافت نشد.</Alert>}
                        {slots.length > 0 && <Stack gap={0.5} aria-label="زمان‌های آیندهٔ بازدید">
                            <Typography fontWeight={700}>زمان‌های آیندهٔ ثبت‌شده</Typography>
                            {slots.map(slot => <Typography key={slot.id} variant="body2">
                                {visitDate.format(new Date(slot.starts_at))} تا {visitTime.format(new Date(slot.ends_at))}
                            </Typography>)}
                        </Stack>}
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

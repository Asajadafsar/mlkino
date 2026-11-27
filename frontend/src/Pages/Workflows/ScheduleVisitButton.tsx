import {useEffect, useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography} from '@mui/material'
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {dateTimeIso,localDateTime} from '../../Core/PersianDate'
import {DataProvider} from '../../Core/DataProvider'
import {workflowError} from './workflowClient'

type Slot = {id: number; starts_at: string; ends_at: string}
type Day = {key: number; date: string | null; start: string; end: string; endDate?: string}
const emptyDay = (key: number): Day => ({key, date: null, start: '', end: ''})
const zone = 'Asia/Tehran'
const visitDate = new Intl.DateTimeFormat('fa-IR', {
    timeZone: zone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
})

export function ScheduleVisitButton({propertyId}: {propertyId: number}) {
    const [open, setOpen] = useState(false)
    const [days, setDays] = useState([emptyDay(0)])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(0)
    const [editing, setEditing] = useState<number | null>(null)
    const [slots, setSlots] = useState<Slot[]>([])
    const [listError, setListError] = useState(false)
    useEffect(() => {
        if (!open) return
        let active = true
        setListError(false)
        DataProvider.get<{results: Slot[]}>(`workflows/visit-slots/?property_id=${propertyId}&page_size=100`)
            .then(response => {if (active) setSlots(response.data.results)})
            .catch(() => {if (active) setListError(true)})
        return () => {active = false}
    }, [open, propertyId, saved])

    const change = (key: number, patch: Partial<Day>) => {
        setError('')
        setDays(current => current.map(day => day.key === key ? {...day, ...patch} : day))
    }

    const save = async (event: FormEvent) => {
        event.preventDefault()
        if (saving) return
        setError('')
        setSaving(true)
        try {
            const slots = days.map((day, index) => {
                if (!day.date || !day.start || !day.end) throw new Error(`تاریخ و ساعت‌های بازهٔ ${index + 1} را وارد کنید.`)
                const starts_at = dateTimeIso(`${day.date} ${day.start}`, zone)
                const ends_at = dateTimeIso(`${day.endDate || day.date} ${day.end}`, zone)
                if (+new Date(starts_at) <= Date.now() || +new Date(ends_at) <= +new Date(starts_at)) {
                    throw new Error(`بازهٔ ${index + 1}: زمان شروع باید در آینده و پایان بعد از شروع باشد.`)
                }
                return {starts_at, ends_at}
            })
            if (editing) await DataProvider.patch(`workflows/visit-slots/${editing}/`, {data: slots[0]})
            else await DataProvider.post('workflows/visit-slots/', {data: {property_id: propertyId, slots}})
            setEditing(null)
            setSaved(count => count + 1)
            setDays([emptyDay(0)])
        } catch (reason) {
            setError(workflowError(reason))
        } finally {
            setSaving(false)
        }
    }

    const edit = (slot: Slot) => {
        const [date, start] = localDateTime(slot.starts_at, zone).split(' ')
        const [endDate, end] = localDateTime(slot.ends_at, zone).split(' ')
        setDays([{key: 0, date, start, end, endDate: date === endDate ? undefined : endDate}])
        setSaved(0)
        setError('')
        setEditing(slot.id)
    }

    return <>
        <Button variant="outlined" startIcon={<EventAvailableOutlined/>} onClick={() => {setError(''); setSaved(0); setEditing(null); setDays([emptyDay(0)]); setOpen(true)}}>تعیین زمان بازدید</Button>
        <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
            <form onSubmit={save}>
                <DialogTitle>{editing ? 'ویرایش زمان بازدید' : 'تعیین زمان بازدید'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{pt: 1}}>
                        <Typography variant="body2">برای هر روز تاریخ و ساعت شروع و پایان را به وقت تهران وارد کنید. بازه‌ها پس از انتشار فایل در لندینگ قابل رزرو هستند.</Typography>
                        {error && <Alert severity="error">{error}</Alert>}
                        {saved > 0 && !error && <Alert severity="success">زمان‌های بازدید ثبت شدند.</Alert>}
                        {days.map((day, index) => <Stack key={day.key} spacing={1}>
                            <DatePickerFilter mode="controlled" item={{label: `تاریخ بازدید ${index + 1}`}} required value={day.date} onChange={date => change(day.key, {date})}/>
                            {day.endDate && <DatePickerFilter mode="controlled" item={{label: 'تاریخ پایان'}} required value={day.endDate}
                                onChange={endDate => change(day.key, {endDate: endDate || day.date || undefined})}/>}
                            <Stack direction="row" spacing={1}>
                                <TextField type="time" required fullWidth label={`شروع ${index + 1}`} InputLabelProps={{shrink: true}} value={day.start} onChange={event => change(day.key, {start: event.target.value})}/>
                                <TextField type="time" required fullWidth label={`پایان ${index + 1}`} InputLabelProps={{shrink: true}} value={day.end} onChange={event => change(day.key, {end: event.target.value})}/>
                                {days.length > 1 && <Button disabled={saving} onClick={() => setDays(current => current.filter(item => item.key !== day.key))}>حذف</Button>}
                            </Stack>
                        </Stack>)}
                        <Button disabled={Boolean(editing) || saving || days.length >= 30} onClick={() => setDays(current => [...current, emptyDay(current[current.length - 1].key + 1)])}>افزودن روز یا بازهٔ دیگر</Button>
                        {listError && <Alert severity="warning">فهرست زمان‌های ثبت‌شده دریافت نشد.</Alert>}
                        {slots.length > 0 && <Stack gap={0.5} aria-label="زمان‌های آیندهٔ بازدید">
                            <Typography fontWeight={700}>زمان‌های آیندهٔ ثبت‌شده</Typography>
                            {slots.map(slot => <Stack key={slot.id} direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="body2">{visitDate.format(new Date(slot.starts_at))} تا {visitDate.format(new Date(slot.ends_at))}</Typography>
                                <Button type="button" disabled={saving} onClick={() => edit(slot)}>ویرایش بازه</Button>
                            </Stack>)}
                        </Stack>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} component={Link} to={`/visit-slots?property=${propertyId}`}>مشاهده زمان‌های ثبت‌شده</Button>
                    <Button disabled={saving} onClick={() => setOpen(false)}>بستن</Button>
                    <Button disabled={saving} type="submit" variant="contained">{editing ? "ذخیرهٔ ویرایش" : "ثبت زمان‌ها"}</Button>
                </DialogActions>
            </form>
        </Dialog>
    </>
}

import {useState, type FormEvent} from 'react'
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField} from '@mui/material'
import {DataProvider} from '../../Core/DataProvider'
import {apiErrorMessage} from '../../Core/ApiError'

export function ResetUserPasswordButton({userId}: {userId: number}) {
    const [open, setOpen] = useState(false)
    const [adminPassword, setAdminPassword] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const [busy, setBusy] = useState(false)
    const clear = () => {
        setAdminPassword('')
        setPassword('')
        setConfirm('')
        setError('')
        setSaved(false)
    }
    const close = () => {if (!busy) {clear(); setOpen(false)}}
    async function submit(event: FormEvent) {
        event.preventDefault()
        if (busy) return
        if (password !== confirm) {setError('تکرار رمز جدید مطابقت ندارد.'); return}
        setError('')
        setBusy(true)
        try {
            await DataProvider.post(`users/${userId}/password-reset/`, {
                data: {admin_password: adminPassword, new_password: password},
            })
            clear()
            setSaved(true)
        } catch (failure) {
            setError(apiErrorMessage(failure, 'بازنشانی رمز انجام نشد. دوباره تلاش کنید.'))
        } finally {
            setBusy(false)
        }
    }
    return <>
        <Button type="button" color="warning" onClick={() => {clear(); setOpen(true)}}>بازنشانی رمز عبور</Button>
        <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
            <form onSubmit={submit}>
                <DialogTitle>بازنشانی رمز عبور کاربر</DialogTitle>
                <DialogContent>
                    {saved ? <Alert severity="success">رمز جدید ثبت شد. کاربر باید دوباره وارد شود.</Alert> :
                        <Stack spacing={2} sx={{pt: 1}}>
                            <Alert severity="warning">نشست‌های فعال کاربر بسته می‌شوند.</Alert>
                            {error && <Alert severity="error">{error}</Alert>}
                            <TextField label="رمز فعلی سوپرادمین" type="password" autoComplete="current-password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} inputProps={{maxLength: 128}} disabled={busy} required/>
                            <TextField label="رمز جدید کاربر" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} inputProps={{maxLength: 128}} disabled={busy} required/>
                            <TextField label="تکرار رمز جدید" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} inputProps={{maxLength: 128}} disabled={busy} required/>
                        </Stack>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={close} disabled={busy}>بستن</Button>
                    {!saved && <Button variant="contained" type="submit" disabled={busy}>بازنشانی رمز</Button>}
                </DialogActions>
            </form>
        </Dialog>
    </>
}

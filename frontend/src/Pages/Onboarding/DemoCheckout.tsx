import {useState} from 'react'
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography} from '@mui/material'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import api from '../../Core/Request'
import {GatewayOptions, Result, gatewayResults} from '../Settings/GatewaySettings'

type Payment = {result: Result; reference: string | null}

export default function DemoCheckout({gateway, tier, label, amount}: {gateway: GatewayOptions; tier: string; label: string; amount: number}) {
    const [open, setOpen] = useState(false)
    const [result, setResult] = useState<Result>(gateway.default_result)
    const [payment, setPayment] = useState<Payment>()
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const pay = async () => {
        setBusy(true)
        setError('')
        try {
            setPayment((await api.post<Payment>(ACCOUNTS_URL + '/demo-checkout/', {tier, result})).data)
        } catch {
            setError('درگاه آزمایشی در دسترس نیست.')
        } finally {
            setBusy(false)
        }
    }
    return <>
        <Button variant="outlined" onClick={() => {setOpen(true);setPayment(undefined);setError('');setResult(gateway.default_result)}}>تست درگاه پرداخت</Button>
        <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle>{gateway.title}</DialogTitle>
            <DialogContent><Stack spacing={2} sx={{pt: 1}}>
                <Typography>{label} · {amount.toLocaleString('fa-IR')} تومان</Typography>
                <Alert severity="info">پرداخت آزمایشی روی اعتبار اشتراک اثر ندارد.</Alert>
                {error && <Alert severity="error">{error}</Alert>}
                {payment ? <Alert severity={payment.result === 'success' ? 'success' : 'warning'}>
                    {gatewayResults[payment.result]} {payment.reference && <bdi>{payment.reference}</bdi>}
                </Alert> : <TextField select label="شبیه‌سازی نتیجه" value={result} onChange={event => setResult(event.target.value as Result)}>
                    {Object.entries(gatewayResults).map(([key, value]) => <MenuItem key={key} value={key}>{value}</MenuItem>)}
                </TextField>}
            </Stack></DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} disabled={busy}>بستن</Button>
                {!payment && <Button onClick={pay} variant="contained" disabled={busy}>پرداخت آزمایشی</Button>}
            </DialogActions>
        </Dialog>
    </>
}

import {useEffect, useState} from 'react'
import {Alert, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography} from '@mui/material'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import api from '../../Core/Request'

export type GatewayOptions = {enabled: boolean; title: string; default_result: Result}
export type Result = 'success' | 'failure' | 'cancelled'
export const gatewayResults = {success: 'موفق', failure: 'ناموفق', cancelled: 'لغو شده'}
const url = ACCOUNTS_URL + '/gateway-settings/'

export default function GatewaySettings() {
    const [value, setValue] = useState<GatewayOptions>()
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    useEffect(() => {
        const controller = new AbortController()
        api.get<GatewayOptions>(url, {signal: controller.signal}).then(({data}) => setValue(data))
            .catch(() => {if (!controller.signal.aborted) setError('تنظیمات درگاه دریافت نشد.')})
        return () => controller.abort()
    }, [])
    return <Stack spacing={2} component="form" onSubmit={async event => {
        event.preventDefault()
        if (!value || busy) return
        setBusy(true)
        setError('')
        setMessage('')
        try {
            setValue((await api.put<GatewayOptions>(url, value)).data)
            setMessage('تنظیمات درگاه ذخیره شد.')
        } catch {
            setError('ذخیرهٔ تنظیمات درگاه انجام نشد.')
        } finally {
            setBusy(false)
        }
    }}>
        <Typography variant="h6">تنظیمات درگاه پرداخت</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        {value && <>
            <Alert severity="info">درگاه آزمایشی است و مبلغی از حساب‌ها کسر نمی‌کند.</Alert>
            <FormControlLabel label="فعال‌سازی درگاه آزمایشی" control={<Switch checked={value.enabled} onChange={(_, enabled) => setValue({...value, enabled})}/>}/>
            <TextField label="عنوان درگاه" value={value.title} required inputProps={{maxLength: 60}} onChange={event => setValue({...value, title: event.target.value})}/>
            <TextField select label="نتیجهٔ پیش‌فرض پرداخت آزمایشی" value={value.default_result} onChange={event => setValue({...value, default_result: event.target.value as Result})}>
                {Object.entries(gatewayResults).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>
            <Button variant="contained" type="submit" disabled={busy}>ذخیرهٔ تنظیمات درگاه</Button>
        </>}
    </Stack>
}

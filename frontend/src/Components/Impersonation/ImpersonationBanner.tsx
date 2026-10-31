import {Box, Button, Stack, Typography} from '@mui/material'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useDispatch, useSelector, useStore} from 'react-redux'
import {exitImpersonation, getImpersonationStatus, impersonationError, reloadIdentity} from '../../Core/Impersonation'
import {selectImpersonation, setImpersonation, setImpersonationError, setImpersonationPending} from '../../redux/ImpersonationSlice'
import {selectRole, UserRole} from '../../redux/RoleSlice'
import type {RootState} from '../../redux/store'
import {formatDate} from '../../Core/FormatDate'

const labels: Record<UserRole, string> = {superadmin: 'سوپرادمین', user: 'کاربر عادی', agency: 'املاکی', expert: 'کارشناس'}

export function ImpersonationBanner() {
    const {session, error, pending} = useSelector(selectImpersonation)
    const role = useSelector(selectRole)
    const dispatch = useDispatch()
    const reduxStore = useStore<RootState>()
    const checking = useRef(false)
    const [exitError, setExitError] = useState('')

    const refresh = useCallback(async () => {
        if (checking.current || reduxStore.getState().impersonation.pending) return
        checking.current = true
        try {
            const next = await getImpersonationStatus()
            const previous = reduxStore.getState().impersonation.session
            if ((!previous && next.active) || (next.active && reduxStore.getState().role.role !== next.target_role) || (previous && (previous.active !== next.active ||
                (next.active && (previous.target_id !== next.target_id || previous.session_id !== next.session_id))))) {
                reloadIdentity()
                return
            }
            dispatch(setImpersonation({session: next}))
        } catch (error) {
            dispatch(setImpersonationError(impersonationError(error, 'بررسی نشست مدیریتی انجام نشد')))
        } finally {
            checking.current = false
        }
    }, [dispatch, reduxStore])

    useEffect(() => {
        if (!session?.active && role !== UserRole.SUPERADMIN) return
        const interval = window.setInterval(() => {if (!document.hidden) refresh()}, 30000)
        const onFocus = () => refresh()
        window.addEventListener('focus', onFocus)
        const expiry = session?.expires_at ? Date.parse(session.expires_at) - Date.now() : NaN
        const timeout = Number.isFinite(expiry) ? window.setTimeout(refresh, Math.max(100, expiry + 100)) : undefined
        return () => {
            window.clearInterval(interval)
            if (timeout !== undefined) window.clearTimeout(timeout)
            window.removeEventListener('focus', onFocus)
        }
    }, [session?.active, session?.expires_at, role, refresh])

    const exit = async () => {
        if (reduxStore.getState().impersonation.pending) return
        dispatch(setImpersonationPending(true))
        setExitError('')
        try {
            await exitImpersonation()
            reloadIdentity()
        } catch (error) {
            setExitError(impersonationError(error, 'بازگشت به حساب مدیر انجام نشد'))
            dispatch(setImpersonationPending(false))
        }
    }

    if (!session?.active && !error) return null
    if (!session?.active && role !== UserRole.SUPERADMIN) return null
    return (
        <Box sx={{mb: 3, position: 'relative', overflow: 'hidden', borderRadius: '18px', border: '1px solid', borderColor: session?.active ? '#ffe3b0' : 'divider', background: session?.active ? 'linear-gradient(115deg,#fff7e9,#ffedce)' : 'background.paper', p: {xs: 2.5, md: 3.5}, minHeight: session?.active ? 150 : 0}}>
            {session?.active && <Box component="img" src="/assets/users-3d.png" alt="" sx={{position: 'absolute', right: 30, bottom: -10, width: 220, height: 160, objectFit: 'contain', filter: 'hue-rotate(150deg)', opacity: {xs: .12, md: .8}}} />}
            <Stack spacing={1.2} sx={{position: 'relative', maxWidth: {xs: '100%', md: '75%'}}}>
                {session?.active && <>
                    <Typography fontWeight={900} fontSize={17}>ورود مدیریتی فعال است — حساب #{session.target_id} ({role ? labels[role] : ''})</Typography>
                    <Typography fontSize={12} color="text.secondary">مدیر اصلی: #{session.actor_id}{session.expires_at ? ` · پایان اعتبار: ${formatDate(session.expires_at)}` : ''}</Typography>
                </>}
                {error && <Typography color="error" variant="body2">{error}</Typography>}
                {exitError && <Typography variant="body2" color="error">{exitError}</Typography>}
                <Stack direction="row" gap={1} flexWrap="wrap">
                    {session?.active && <Button variant="contained" disabled={pending} onClick={exit} sx={{bgcolor: '#ff9800', '&:hover': {bgcolor: '#ed8700'}, alignSelf: 'flex-start'}}>{pending ? 'در حال بازگشت…' : 'بازگشت به حساب مدیر'}</Button>}
                    {error && <Button disabled={pending} onClick={refresh}>بررسی مجدد وضعیت</Button>}
                </Stack>
            </Stack>
        </Box>
    )
}

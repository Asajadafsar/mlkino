import {Alert, Box, Button, Stack, Typography} from '@mui/material'
import {BaseModal} from '../Modal/BaseModal'
import LoginIcon from '@mui/icons-material/Login'
import {useState} from 'react'
import {useDispatch, useSelector, useStore} from 'react-redux'
import {UserRole, selectRole} from '../../redux/RoleSlice'
import {selectImpersonation, setImpersonationPending} from '../../redux/ImpersonationSlice'
import type {RootState} from '../../redux/store'
import {startImpersonation, impersonationError, reloadIdentity} from '../../Core/Impersonation'

export function ImpersonateButton({target}: {target: {id: number; role: string; full_name?: string; first_name?: string; last_name?: string}}) {
    const role = useSelector(selectRole)
    const {session, checked, error: statusError, pending, actorId} = useSelector(selectImpersonation)
    const dispatch = useDispatch()
    const reduxStore = useStore<RootState>()
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')
    if (role !== UserRole.SUPERADMIN || ![UserRole.USER, UserRole.AGENCY, UserRole.EXPERT].includes(target.role as UserRole) || target.id === actorId || session?.active) return null
    const name = target.full_name || [target.first_name, target.last_name].filter(Boolean).join(' ') || `کاربر #${target.id}`
    const enter = async () => {
        const current = reduxStore.getState()
        if (current.role.role !== UserRole.SUPERADMIN || current.impersonation.pending || !current.impersonation.checked || current.impersonation.session?.active || current.impersonation.actorId === target.id) return
        dispatch(setImpersonationPending(true))
        setError('')
        try {
            await startImpersonation(target.id)
            reloadIdentity()
        } catch (error) {
            setError(impersonationError(error, 'ورود مدیریتی انجام نشد'))
            dispatch(setImpersonationPending(false))
        }
    }
    return <Box onClick={(event) => event.stopPropagation()}>
        <Button size="small" variant="outlined" startIcon={<LoginIcon />} disabled={pending || !checked || Boolean(statusError)}
            onClick={(event) => {event.stopPropagation(); setError(''); setOpen(true)}}>
            ورود مدیریتی
        </Button>
        <BaseModal
            open={open}
            setOpen={setOpen}
            title="ورود مدیریتی به پنل کاربر"
            onClose={() => {if (!pending) setOpen(false)}}
            style={{maxWidth: 480, width: 'calc(100% - 32px)'}}
        >
            <Box sx={{p: 1}}>
                <Typography>ورود به حساب {name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>عملیات شما در این نشست با هویت مدیر ثبت می‌شود. برای بازگشت از نوار ورود مدیریتی استفاده کنید.</Typography>
                {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
            </Box>
            <Stack direction="row" justifyContent="flex-end" gap={1} sx={{p: 1, mt: 2}}>
                <Button disabled={pending} onClick={() => setOpen(false)}>انصراف</Button>
                <Button variant="contained" disabled={pending} onClick={enter}>{pending ? 'در حال ورود…' : 'ورود به پنل کاربر'}</Button>
            </Stack>
        </BaseModal>
    </Box>
}

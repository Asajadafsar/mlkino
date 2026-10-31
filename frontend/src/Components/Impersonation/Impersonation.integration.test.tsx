import {ThemeProvider, createTheme} from '@mui/material/styles'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import roleReducer, {setRole, UserRole} from '../../redux/RoleSlice'
import impersonationReducer, {setImpersonation} from '../../redux/ImpersonationSlice'
import {ImpersonateButton} from './ImpersonateButton'
import {ImpersonationBanner} from './ImpersonationBanner'
import {exitImpersonation, getImpersonationStatus, reloadIdentity, startImpersonation} from '../../Core/Impersonation'

jest.mock('../../Core/Impersonation', () => ({
    startImpersonation: jest.fn(), exitImpersonation: jest.fn(), getImpersonationStatus: jest.fn(), reloadIdentity: jest.fn(),
    impersonationError: (error: Error) => error.message,
}))
const target = {id: 12, role: 'user', full_name: 'کاربر نمونه'}
function setup(role: UserRole, row = target, active = false) {
    const store = configureStore({reducer: {role: roleReducer, impersonation: impersonationReducer}})
    store.dispatch(setRole(role))
    store.dispatch(setImpersonation({session: active ? {active: true, actor_id: 1, target_id: 12, target_role: UserRole.USER, expires_at: new Date(Date.now() + 1000).toISOString()} : {active: false}, actorId: 1}))
    render(<ThemeProvider theme={createTheme()}><Provider store={store}><ImpersonateButton target={row} /><ImpersonationBanner /></Provider></ThemeProvider>)
    return store
}
beforeEach(() => jest.clearAllMocks())

test.each([UserRole.USER, UserRole.AGENCY, UserRole.EXPERT])('caller role %s cannot start impersonation', (role) => {
    setup(role)
    expect(screen.queryByRole('button', {name: 'ورود مدیریتی'})).toBeNull()
})

test('superadmin accounts and own account cannot be impersonation targets', () => {
    setup(UserRole.SUPERADMIN, {...target, role: 'superadmin'})
    expect(screen.queryByRole('button', {name: 'ورود مدیریتی'})).toBeNull()
})

test('current account is excluded even if its target role is malformed', () => {
    setup(UserRole.SUPERADMIN, {...target, id: 1})
    expect(screen.queryByRole('button', {name: 'ورود مدیریتی'})).toBeNull()
})

test('superadmin can start a confirmed transition and the identity is reloaded', async () => {
    ;(startImpersonation as jest.Mock).mockResolvedValue({active: true})
    setup(UserRole.SUPERADMIN)
    fireEvent.click(screen.getByRole('button', {name: 'ورود مدیریتی'}))
    fireEvent.click(screen.getByRole('button', {name: 'ورود به پنل کاربر'}))
    await waitFor(() => expect(startImpersonation).toHaveBeenCalledWith(12))
    await waitFor(() => expect(reloadIdentity).toHaveBeenCalledTimes(1))
})

test('a failed start shows an error and permits retry without changing the Redux role', async () => {
    ;(startImpersonation as jest.Mock).mockRejectedValue(new Error('ورود رد شد'))
    const store = setup(UserRole.SUPERADMIN)
    fireEvent.click(screen.getByRole('button', {name: 'ورود مدیریتی'}))
    fireEvent.click(screen.getByRole('button', {name: 'ورود به پنل کاربر'}))
    expect(await screen.findByText('ورود رد شد')).toBeTruthy()
    expect(store.getState().role.role).toBe(UserRole.SUPERADMIN)
    expect(store.getState().impersonation.pending).toBe(false)
    expect(reloadIdentity).not.toHaveBeenCalled()
})

test('active sessions hide the start action and can exit from the target user role', async () => {
    ;(exitImpersonation as jest.Mock).mockResolvedValue({active: false})
    setup(UserRole.USER, target, true)
    expect(screen.queryByRole('button', {name: 'ورود مدیریتی'})).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'بازگشت به حساب مدیر'}))
    await waitFor(() => expect(exitImpersonation).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(reloadIdentity).toHaveBeenCalledTimes(1))
})

test('expiration asks the server for status before restoring the manager identity', async () => {
    jest.useFakeTimers()
    ;(getImpersonationStatus as jest.Mock).mockResolvedValue({active: false})
    setup(UserRole.USER, target, true)
    await act(async () => {jest.advanceTimersByTime(1200)})
    expect(getImpersonationStatus).toHaveBeenCalled()
    expect(reloadIdentity).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
})

import '@testing-library/jest-dom'
import {fireEvent, render, screen, within} from '@testing-library/react'
import {configureStore} from '@reduxjs/toolkit'
import {Provider} from 'react-redux'
import {MemoryRouter, useLocation} from 'react-router-dom'
import {ThemeProvider} from '@mui/material'
import roleReducer, {UserRole} from '../../redux/RoleSlice'
import {AppTheme} from '../../Theme'
import {AppDrawer} from './AppDrawer'

function Location() { return <output data-testid="current-route">{useLocation().pathname}</output> }
function show(path = '/dashboard', collapsed = false) {
    const store = configureStore({reducer: {role: roleReducer}, preloadedState: {role: {role: UserRole.SUPERADMIN}}})
    return render(<Provider store={store}><ThemeProvider theme={AppTheme}><MemoryRouter initialEntries={[path]}><AppDrawer collapsed={collapsed} setSelectedTitle={() => {}} drawerOpen setDrawerOpen={() => {}}/><Location/></MemoryRouter></ThemeProvider></Provider>)
}
beforeEach(() => localStorage.clear())

test('reference groups start closed, persist expansion and keep the destination selectable', () => {
    show()
    const group = screen.getByRole('button', {name: 'فایل و درخواست'})
    expect(group).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', {name: 'فایل‌های ملکی'})).not.toBeInTheDocument()
    fireEvent.click(group)
    expect(group).toHaveAttribute('aria-expanded', 'true')
    expect(JSON.parse(localStorage.getItem('mlkino:drawer-groups')!)).toContain('estate')
    fireEvent.click(screen.getByRole('button', {name: 'فایل‌های ملکی'}))
    expect(screen.getByTestId('current-route')).toHaveTextContent('/files')
    expect(screen.getByRole('button', {name: 'فایل‌های ملکی'})).toHaveAttribute('aria-current', 'page')
})

test('opening a nested page expands its parent even with malformed saved preferences', () => {
    localStorage.setItem('mlkino:drawer-groups', '{}')
    show('/files/create')
    expect(screen.getByRole('button', {name: 'فایل و درخواست'})).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', {name: 'فایل‌های ملکی'})).toHaveAttribute('aria-current', 'page')
})

test('support card navigates to existing support tickets', () => {
    show()
    fireEvent.click(screen.getByRole('button', {name: 'تماس با پشتیبانی'}))
    expect(screen.getByTestId('current-route')).toHaveTextContent('/tickets')
    expect(screen.getByRole('button', {name: 'حساب و پشتیبانی'})).toHaveAttribute('aria-expanded', 'true')
})

test('collapsed rail retains all permitted links and hides expanded support artwork', () => {
    show('/dashboard', true)
    expect(screen.queryByRole('heading', {name: 'پشتیبانی ملکینو'})).not.toBeInTheDocument()
    const nav = screen.getByRole('navigation', {name: 'بخش‌های پنل'})
    fireEvent.click(within(nav).getByRole('button', {name: 'مدیریت پلن‌ها'}))
    expect(screen.getByTestId('current-route')).toHaveTextContent('/plans')
})

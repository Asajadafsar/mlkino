import '@testing-library/jest-dom'
import {fireEvent, render, screen} from '@testing-library/react'
import {configureStore} from '@reduxjs/toolkit'
import {Provider} from 'react-redux'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {ThemeProvider} from '@mui/material'
import roleReducer, {UserRole} from '../../redux/RoleSlice'
import {AppTheme} from '../../Theme'
import {AppDrawer} from './AppDrawer'
import PlansList from '../../Pages/Plans/PlansList'
import CapabilitiesList from '../../Pages/Plans/CapabilitiesList'

function show(role: UserRole) {
    const store = configureStore({reducer: {role: roleReducer}, preloadedState: {role: {role}}})
    return render(<Provider store={store}><ThemeProvider theme={AppTheme}><MemoryRouter>
        <AppDrawer setSelectedTitle={() => {}} drawerOpen setDrawerOpen={() => {}}/>
        <Routes>
            <Route path="/" element={<div/>}/>
            <Route path="/plans" element={<PlansList/>}/>
            <Route path="/plan-capabilities" element={<CapabilitiesList/>}/>
        </Routes>
    </MemoryRouter></ThemeProvider></Provider>)
}

beforeEach(() => localStorage.clear())

test('superadmin can open the redesigned plans catalog from the actual drawer', async () => {
    show(UserRole.SUPERADMIN)
    fireEvent.click(screen.getByRole('button', {name: 'مدیریت پلن‌ها'}))
    expect(await screen.findByText('مدیریت پلن‌ها و اشتراک‌ها')).toBeVisible()
    expect((await screen.findAllByRole('button', {name: /مشاهده/}))[0]).toBeVisible()
})

test('superadmin can open the capabilities catalog from the actual drawer', async () => {
    show(UserRole.SUPERADMIN)
    fireEvent.click(screen.getByRole('button', {name: 'امکانات پلن‌ها'}))
    expect(await screen.findByRole('button', {name: /قابلیت جدید/})).toBeVisible()
})

test.each([UserRole.USER, UserRole.AGENCY, UserRole.EXPERT])('plan administration stays hidden for %s', role => {
    show(role)
    expect(screen.queryByRole('button', {name: 'مدیریت پلن‌ها'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'امکانات پلن‌ها'})).not.toBeInTheDocument()
})

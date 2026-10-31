import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import roleReducer, {setRole, UserRole} from '../../../redux/RoleSlice'
import utilReducer from '../../../redux/UtilSlice'
import {DataProvider} from '../../../Core/DataProvider'
import {AgencyEdit} from './AgencyEdit'

jest.mock('../../../Core/DataProvider', () => ({DataProvider: {get: jest.fn(), patch: jest.fn()}}))
jest.mock('../Agency', () => ({Agency: ({agency, setAgency}: any) => (
    <input aria-label="نام" value={agency.first_name ?? ''} onChange={(event) => {
        const value = event.target.value
        setAgency((previous: any) => ({...previous, first_name: value}))
    }} />
)}))

function setup(state: any = null) {
    const store = configureStore({reducer: {role: roleReducer, util: utilReducer}})
    store.dispatch(setRole(UserRole.SUPERADMIN))
    render(<Provider store={store}><MemoryRouter initialEntries={[{pathname: '/users/agencies/12', state}]}>
        <Routes><Route path="users/agencies/:id" element={<AgencyEdit />} /><Route path="users/agencies" element={<p>لیست املاکی‌ها</p>} /></Routes>
    </MemoryRouter></Provider>)
}
beforeEach(() => jest.clearAllMocks())

test('loads authoritative detail and saves unrelated fields even with incomplete agency profile', async () => {
    ;(DataProvider.get as jest.Mock).mockResolvedValue({data: {id: 12, first_name: 'نام اصلی', role: 'agency'}})
    ;(DataProvider.patch as jest.Mock).mockResolvedValue({message: 'ذخیره شد'})
    setup({row: {id: 12, first_name: 'اطلاعات لیست'}})
    const input = await screen.findByRole('textbox', {name: 'نام'})
    expect((input as HTMLInputElement).value).toBe('نام اصلی')
    fireEvent.change(input, {target: {value: 'نام جدید'}})
    const save = await screen.findByRole('button', {name: 'ذخیره تغییرات'})
    expect((save as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(save)
    await waitFor(() => expect(DataProvider.patch).toHaveBeenCalledWith('users/12/', {data: {first_name: 'نام جدید'}}))
    expect(await screen.findByText('لیست املاکی‌ها')).toBeTruthy()
})

test('opening detail directly without navigation state loads the route user ID', async () => {
    ;(DataProvider.get as jest.Mock).mockResolvedValue({data: {id: 12, first_name: 'نام اصلی'}})
    setup()
    expect(await screen.findByRole('textbox', {name: 'نام'})).toBeTruthy()
    expect(DataProvider.get).toHaveBeenCalledWith('users/12/')
})

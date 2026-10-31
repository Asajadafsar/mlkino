import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import utilReducer from '../../../redux/UtilSlice'
import {DataProvider} from '../../../Core/DataProvider'
import {UsersEdit} from './UsersEdit'

jest.mock('../../../Core/DataProvider', () => ({DataProvider: {get: jest.fn(), patch: jest.fn()}}))
jest.mock('../Users', () => ({Users: ({users, setUsers}) => <>
    <span>{users.first_name}</span>
    <button onClick={() => setUsers({...users, postal_code: '1234567890', province: 'تهران', city: 'تهران', address: 'نشانی جدید'})}>استعلام آزمایشی</button>
</>}))

test('loads fresh user details instead of a stale row and saves all lookup address fields', async () => {
    ;(DataProvider.get as jest.Mock).mockResolvedValue({data: {id: 17, first_name: 'نام جدید', postal_code: null, province: null, city: null, address: null}})
    ;(DataProvider.patch as jest.Mock).mockResolvedValue({data: {id: 17}, message: 'ذخیره شد'})
    const store = configureStore({reducer: {util: utilReducer}})
    render(<Provider store={store}><MemoryRouter initialEntries={[{pathname: '/users/user/17', state: {row: {id: 17, first_name: 'نام قدیمی'}}}]}><Routes>
        <Route path="/users/user/:id" element={<UsersEdit />} />
        <Route path="/users/user" element={<span>فهرست کاربران</span>} />
    </Routes></MemoryRouter></Provider>)
    expect(await screen.findByText('نام جدید')).toBeTruthy()
    expect(screen.queryByText('نام قدیمی')).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'استعلام آزمایشی'}))
    fireEvent.click(screen.getByRole('button', {name: 'ذخیره تغییرات'}))
    await waitFor(() => expect(DataProvider.patch).toHaveBeenCalledWith('users/17/', {data: {postal_code: '1234567890', province: 'تهران', city: 'تهران', address: 'نشانی جدید'}}))
    expect(await screen.findByText('فهرست کاربران')).toBeTruthy()
})

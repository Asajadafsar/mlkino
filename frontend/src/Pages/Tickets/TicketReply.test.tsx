import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import roleReducer, {setRole, UserRole} from '../../redux/RoleSlice'
import {DataProvider} from '../../Core/DataProvider'
import {TicketReply} from './TicketReply'

jest.mock('../../Core/DataProvider', () => ({DataProvider: {post: jest.fn()}}))
function setup(role: UserRole) {
    const store = configureStore({reducer: {role: roleReducer}})
    store.dispatch(setRole(role))
    const onUpdated = jest.fn()
    render(<Provider store={store}><TicketReply ticketId={7} onUpdated={onUpdated} /></Provider>)
    return onUpdated
}

test('user replies send the API message field and immediately update the conversation', async () => {
    const updated = {id: 7, messages: [{id: 2, body: 'پیام جدید'}]}
    ;(DataProvider.post as jest.Mock).mockResolvedValue({data: updated})
    const onUpdated = setup(UserRole.USER)
    expect(screen.queryByText('یادداشت داخلی پشتیبانی')).toBeNull()
    fireEvent.change(screen.getByLabelText('متن پاسخ'), {target: {value: 'پیام جدید'}})
    fireEvent.click(screen.getByRole('button', {name: 'ارسال پاسخ'}))
    await waitFor(() => expect(DataProvider.post).toHaveBeenCalledWith('tickets/7/replies/', {data: {message: 'پیام جدید', is_internal: false}}))
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated))
})

test('superadmin can choose an internal support note', () => {
    setup(UserRole.SUPERADMIN)
    expect(screen.getByText('یادداشت داخلی پشتیبانی')).toBeTruthy()
})

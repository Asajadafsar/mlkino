import {render, screen} from '@testing-library/react'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
import {DataProvider} from '../../../Core/DataProvider'
import {TasksEdit} from './TasksEdit'

jest.mock('../../../Core/DataProvider', () => ({DataProvider: {get: jest.fn()}}))
jest.mock('../../../Components/Table/EditPage', () => ({EditPage: ({children}) => <div>{children}</div>}))


test('loads task details after opening a direct link without navigation state', async () => {
    ;(DataProvider.get as jest.Mock).mockResolvedValue({data: {id: 17, title: 'کار روزمره'}})
    render(<MemoryRouter initialEntries={['/tasks/17']}><Routes><Route path="/tasks/:id" element={<TasksEdit />} /></Routes></MemoryRouter>)
    expect(await screen.findByRole('heading', {name:'کار روزمره'})).toBeTruthy()
    expect(DataProvider.get).toHaveBeenCalledWith('tasks/17/')
})

test('displays request failures without crashing the page', async () => {
    ;(DataProvider.get as jest.Mock).mockRejectedValue(new Error('سرور در دسترس نیست'))
    render(<MemoryRouter initialEntries={['/tasks/17']}><Routes><Route path="/tasks/:id" element={<TasksEdit />} /></Routes></MemoryRouter>)
    expect((await screen.findByRole('alert')).textContent).toContain('سرور در دسترس نیست')
})

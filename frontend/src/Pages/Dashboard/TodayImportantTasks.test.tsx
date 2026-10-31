import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import TodayImportantTasks from './TodayImportantTasks'
import {DataProvider} from '../../Core/DataProvider'

const mockDispatch = jest.fn()
jest.mock('react-redux', () => ({useDispatch: () => mockDispatch, useSelector: () => 'superadmin'}))
jest.mock('../../Core/DataProvider', () => ({DataProvider: {get: jest.fn(), patch: jest.fn()}}))
const task = {id: 7, title: 'پیگیری درخواست', due_date: '2026-10-29', status: 'pending'}
beforeEach(() => jest.clearAllMocks())

test('loads backend tasks and refreshes their status after toggling the actual task ID', async () => {
    ;(DataProvider.get as jest.Mock)
        .mockResolvedValueOnce({data: {total_results: 1, results: [task]}})
        .mockResolvedValueOnce({data: {total_results: 1, results: [{...task, status: 'done'}]}})
    ;(DataProvider.patch as jest.Mock).mockResolvedValue({})
    render(<TodayImportantTasks />)
    const checkbox = await screen.findByRole('checkbox', {name: `تغییر وضعیت ${task.title}`})
    expect(DataProvider.get).toHaveBeenCalledWith('tasks/?period=today')
    expect((checkbox as HTMLInputElement).checked).toBe(false)
    fireEvent.click(checkbox)
    await waitFor(() => expect(DataProvider.patch).toHaveBeenCalledWith('dashboard/tasks/7/toggle/'))
    await waitFor(() => expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true))
    expect(DataProvider.get).toHaveBeenCalledTimes(2)
})

test('a failed toggle leaves the saved status unchanged and reports the error', async () => {
    ;(DataProvider.get as jest.Mock).mockResolvedValue({data: {total_results: 1, results: [task]}})
    ;(DataProvider.patch as jest.Mock).mockRejectedValue(new Error('تغییر وضعیت انجام نشد'))
    render(<TodayImportantTasks />)
    fireEvent.click(await screen.findByRole('checkbox'))
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({payload: expect.objectContaining({severity: 'error'})})))
    await waitFor(() => expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(false))
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
})

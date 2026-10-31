import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import axios from 'axios'
import APP_URL from '../../Core/APP_URL'
import {TicketAttachment} from './TicketAttachment'

jest.mock('axios')

test('non-image attachments show their filename and only allow downloading', () => {
    render(<TicketAttachment attachment="/media/tickets/report%20one.pdf" />)
    expect(screen.getByText('report one.pdf')).toBeTruthy()
    expect(screen.queryByRole('link', {name: 'مشاهده فایل'})).toBeNull()
    expect(screen.getByRole('button', {name: 'دانلود فایل'})).toBeTruthy()
})

test.each(['photo.png', 'PHOTO.JPG?token=123', 'photo.webp', 'photo.avif'])('images allow viewing and downloading: %s', (filename) => {
    render(<TicketAttachment attachment={`/media/tickets/${filename}`} />)
    expect(screen.getByRole('link', {name: 'مشاهده فایل'}).getAttribute('href')).toBe(`${APP_URL}/media/tickets/${filename}`)
    expect(screen.getByRole('button', {name: 'دانلود فایل'})).toBeTruthy()
})

test('shows an empty state when there is no attachment', () => {
    render(<TicketAttachment attachment={null} />)
    expect(screen.getByText('این تیکت فایل پیوست ندارد.')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
})

test('invalid schemes are not rendered as clickable links', () => {
    render(<TicketAttachment attachment="javascript:alert(1)" />)
    expect(screen.queryByRole('link')).toBeNull()
})

test('downloads the file as a blob with backend credentials', async () => {
    const blob = new Blob(['content'])
    ;(axios.get as jest.Mock).mockResolvedValue({data: blob})
    URL.createObjectURL = jest.fn(() => 'blob:test')
    URL.revokeObjectURL = jest.fn()
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<TicketAttachment attachment={`${APP_URL}/media/report.pdf`} />)
    fireEvent.click(screen.getByRole('button', {name: 'دانلود فایل'}))
    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(axios.get).toHaveBeenCalledWith(`${APP_URL}/media/report.pdf`, {responseType: 'blob', withCredentials: true})
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    click.mockRestore()
})

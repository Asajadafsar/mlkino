import '@testing-library/jest-dom'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {useSelector} from 'react-redux'
import api from '../../Core/Request'
import Onboarding from './Onboarding'

jest.mock('react-redux', () => ({useSelector: jest.fn()}))
jest.mock('../../Core/Request', () => ({__esModule: true, default: {get: jest.fn(), post: jest.fn()}}))

const request = {
    id: 7, name: 'دفتر نمونه', kind: 'office', tier: 'pro', phone: '09120000001',
    created_at: '2026-11-25', details: {monthly_price: 299000},
}
const base = {
    own: [], incoming: [], reviewed: [], plans: [{id: 'pro', label: 'حرفه‌ای', price: 299000, promotions: 3}],
    demo_gateway: {enabled: false, payment_instructions: 'واریز به حساب نمونه', default_result: 'success'},
}

function show(role: string, data: object) {
    (useSelector as jest.Mock).mockReturnValue(role)
    ;(api.get as jest.Mock).mockResolvedValue({data})
    ;(api.post as jest.Mock).mockResolvedValue({})
    render(<MemoryRouter><Onboarding/></MemoryRouter>)
}

beforeEach(() => jest.clearAllMocks())

test('applicant sees payment instructions only in the approved payment stage', async () => {
    show('user', {...base, own: [{...request, status: 'await_pay'}]})
    expect(await screen.findByText('واریز به حساب نمونه')).toBeVisible()
    expect(screen.getByRole('button', {name: 'درخواست املاکی'})).toBeDisabled()
    fireEvent.change(screen.getByLabelText('شناسه پیگیری پرداخت'), {target: {value: 'bank-77'}})
    fireEvent.click(screen.getByRole('button', {name: 'ثبت شناسه پرداخت'}))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/7/payment/'), {payment_reference: 'bank-77'}))
})

test('admin can approve the application without entering a receipt first', async () => {
    show('superadmin', {...base, incoming: [{...request, status: 'pending'}]})
    const approve = await screen.findByRole('button', {name: 'تأیید درخواست'})
    expect(approve).toBeEnabled()
    fireEvent.click(approve)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/7/decision/'), expect.objectContaining({decision: 'approve'})))
})

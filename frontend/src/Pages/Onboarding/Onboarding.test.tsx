import '@testing-library/jest-dom'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {useSelector} from 'react-redux'
import api from '../../Core/Request'
import Onboarding from './Onboarding'
import {CurrentUserContext} from '../../Core/CurrentUser'

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
    render(<CurrentUserContext.Provider value={{user:{first_name:'آرش',last_name:'نمونه',phone:'09120000001'} as any,setUser:jest.fn()}}><MemoryRouter><Onboarding/></MemoryRouter></CurrentUserContext.Provider>)
}

beforeEach(() => jest.clearAllMocks())

test('applicant sees payment instructions only in the approved payment stage', async () => {
    show('user', {...base, own: [{...request, status: 'await_pay'}]})
    expect(await screen.findByText('واریز به حساب نمونه')).toBeVisible()
    expect(screen.getByRole('button', {name: 'درخواست املاکی'})).toBeDisabled()
    fireEvent.change(screen.getByLabelText('شناسه پیگیری پرداخت'), {target: {value: 'bank-77'}})
    fireEvent.click(screen.getByRole('button', {name: 'ثبت شناسه پرداخت'}))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/7/payment/'), {payment_reference: 'bank-77'}))
    expect(await screen.findByText('شناسه پرداخت برای بررسی ارسال شد.')).toBeVisible()
})

test('admin can approve the application without entering a receipt first', async () => {
    show('superadmin', {...base, incoming: [{...request, status: 'pending'}]})
    const approve = await screen.findByRole('button', {name: 'تأیید درخواست'})
    expect(approve).toBeEnabled()
    fireEvent.click(approve)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/7/decision/'), expect.objectContaining({decision: 'approve'})))
    expect(await screen.findByText('درخواست تأیید شد و متقاضی اکنون می‌تواند پرداخت کند.')).toBeVisible()
})

test('expert must confirm the selected office before filling their resume', async () => {
    show('user', base)
    fireEvent.click(await screen.findByRole('button', {name: 'درخواست کارشناسی'}))
    expect(screen.queryByLabelText('نقش در دفتر')).not.toBeInTheDocument()
    ;(api.get as jest.Mock).mockResolvedValueOnce({data: {name: 'املاک پارسیان', address: 'تهران', active_experts: 8}})
    fireEvent.change(screen.getByLabelText('کد دفتر املاک'), {target: {value: 'MK-45872'}})
    fireEvent.click(screen.getByRole('button', {name: 'بررسی کد'}))
    expect(await screen.findByText('املاک پارسیان')).toBeVisible()
    expect(screen.queryByLabelText('نقش در دفتر')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'تأیید دفتر و ادامه'}))
    expect(screen.getByLabelText('نقش در دفتر', {exact: false})).toBeVisible()
    expect(screen.getByLabelText('بارگذاری رزومه و مدارک')).toHaveAttribute('name', 'resume')
    fireEvent.click(screen.getByRole('checkbox', {name: 'مذاکره'}))
    expect(screen.getByRole('checkbox', {name: 'مذاکره'})).toBeChecked()
})

test('office review list supports searching applicants and opening their detail card', async () => {
    show('agency', {...base, incoming: [
        {...request, kind: 'expert', status: 'pending', name: 'علی رضایی'},
        {...request, id: 8, kind: 'expert', status: 'pending', name: 'مریم شریفی'},
    ]})
    await screen.findByRole('button', {name: 'مشاهده درخواست علی رضایی'})
    fireEvent.change(screen.getByLabelText('جستجو در درخواست‌ها'), {target: {value: 'مریم'}})
    expect(screen.queryByRole('button', {name: 'مشاهده درخواست علی رضایی'})).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'مشاهده درخواست مریم شریفی'}))
    expect(screen.getByRole('button', {name: 'تأیید همکاری'})).toBeEnabled()
})

test('office can compare server plans and start renewal', async () => {
    show('agency', {...base, subscription: {office_name: 'دفتر فعال', code: 'MK-1', tier: 'pro', active_tier: 'pro', promoted_files: []}})
    expect(await screen.findByText('پلن فعلی شما')).toBeVisible()
    expect(screen.getByRole('table', {name: 'مقایسه امکانات پلن‌ها'})).toBeVisible()
    fireEvent.click(screen.getByRole('button', {name: 'پرداخت و تمدید اشتراک'}))
    expect(screen.getByRole('group', {name: 'پلن دفتر'})).toBeVisible()
    expect(screen.getByRole('button', {name: 'ارسال درخواست'})).toBeDisabled()
})


test('resume follows reference field order and persists cooperation choices through the existing API', async () => {
    show('user', base)
    fireEvent.click(await screen.findByRole('button', {name: 'درخواست کارشناسی'}))
    ;(api.get as jest.Mock).mockResolvedValueOnce({data: {name: 'دفتر نمونه', address: 'تهران', active_experts: 8}})
    fireEvent.change(screen.getByLabelText('کد دفتر املاک'), {target: {value: 'office-code'}})
    fireEvent.click(screen.getByRole('button', {name: 'بررسی کد'}))
    fireEvent.click(await screen.findByRole('button', {name: 'تأیید دفتر و ادامه'}))
    const form = screen.getByRole('form', {name: 'رزومه کارشناس'})
    expect(within(form).getByLabelText('نام و نام خانوادگی')).toHaveValue('آرش نمونه')
    expect(within(form).getByLabelText('نام و نام خانوادگی')).toHaveAttribute('readonly')
    expect(within(form).getByLabelText('شماره تماس')).toHaveValue('09120000001')
    expect(within(form).getByLabelText('شماره تماس')).toHaveAttribute('readonly')
    const names = Array.from(form.querySelectorAll('[name]')).map(element => element.getAttribute('name'))
    expect(names).toEqual(['job_title','experience_years','cooperation_types','transaction_types','focus_areas','specialties','job_details','resume'])
    expect(within(form).getByLabelText('نقش در دفتر')).toHaveValue('کارشناس')
    fireEvent.click(within(form).getByRole('button', {name: 'تمام‌وقت'}))
    fireEvent.click(within(form).getByRole('button', {name: 'خرید و فروش'}))
    fireEvent.click(within(form).getByRole('checkbox', {name: 'مذاکره'}))
    fireEvent.change(within(form).getByLabelText('توضیحات', {exact: false}), {target: {value: 'سابقه مشاوره املاک'}})
    fireEvent.submit(form)
    expect(await screen.findByText('درخواست برای بررسی ارسال شد. نتیجه در بخش اطلاعیه‌های من اعلام می‌شود.')).toBeVisible()
    const payload = (api.post as jest.Mock).mock.calls[0][1] as FormData
    expect(payload.get('code')).toBe('office-code')
    expect(payload.get('confirm_office')).toBe('true')
    expect(payload.get('specialties')).toBe('مذاکره')
    expect(payload.get('job_details')).toBe('نوع همکاری: تمام‌وقت\nحوزه فعالیت: خرید و فروش\nسابقه مشاوره املاک')
})

test('office application places profile before plan cards, comparison and submission', async () => {
    show('user', base)
    fireEvent.click(await screen.findByRole('button', {name: 'درخواست املاکی'}))
    const form = screen.getByRole('form', {name: 'درخواست دفتر املاک'})
    const profile = within(form).getByLabelText('نام دفتر', {exact: false})
    const plans = within(form).getByRole('group', {name: 'پلن دفتر'})
    const comparison = within(form).getByRole('table', {name: 'مقایسه امکانات پلن‌ها'})
    expect(profile.compareDocumentPosition(plans) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(plans.compareDocumentPosition(comparison) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(form).getByRole('button', {name: 'ارسال درخواست و ارتقای حساب'})).toBeDisabled()
})

test('an older correction note does not replace the status of a newer pending application', async () => {
    show('user', {...base, own: [
        {...request, id: 10, status: 'pending'},
        {...request, id: 7, status: 'fix', details: {review_note: 'اطلاعات قدیمی نیاز به اصلاح دارد'}},
    ]})
    await screen.findByRole('button', {name: 'درخواست املاکی'})
    expect(screen.queryByText('اطلاعات قدیمی نیاز به اصلاح دارد')).not.toBeInTheDocument()
})

test('agency sees completed requests in the list without approval actions on a completed row', async () => {
    show('agency', {...base, reviewed: [{...request, kind: 'expert', status: 'approved', name: 'کارشناس تأییدشده'}]})
    fireEvent.click(await screen.findByRole('button', {name: 'مشاهده درخواست کارشناس تأییدشده'}))
    expect(screen.queryByRole('button', {name: 'تأیید همکاری'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'مشاهده رزومه کامل'})).toBeEnabled()
})

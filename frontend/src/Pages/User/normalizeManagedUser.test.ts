import {normalizeManagedUser} from './normalizeManagedUser'

test('agency profile fields are loaded into the form using the API ownership value', () => {
    const form: any = normalizeManagedUser({id: 7, first_name: 'مدیر', agency_profile: {agency_name: 'دفتر نمونه', occupancy_type: 'owner', office_address: 'تهران'}})
    expect(form.id).toBe(7)
    expect(form.agency_name).toBe('دفتر نمونه')
    expect(form.ownership_type).toBe('owner')
})
test('expert details remain visible when reopening the saved record', () => {
    const form: any = normalizeManagedUser({id: 8, expert_profile: {job_title: 'کارشناس فروش', job_details: 'توضیحات', agency_id: 7}})
    expect(form.job_title).toBe('کارشناس فروش')
    expect(form.bio).toBe('توضیحات')
    expect(form.agency_id).toBe(7)
})

import {buildUserRequestData, isAgencyValid, isAgencyUpdateValid} from './UserRequestData'

test.each(['user', 'agency', 'expert', 'superadmin'] as const)('%s requests preserve address lookup fields in both JSON and multipart', (role) => {
    const values = {province: 'تهران', city: 'تهران', address: 'آدرس', postal_code: '1234567890'}
    expect(buildUserRequestData(values, role)).toEqual(values)
    const avatar = new File(['image'], 'avatar.png', {type: 'image/png'})
    const formData = buildUserRequestData({...values, avatar}, role) as FormData
    expect(formData.get('province')).toBe(values.province)
    expect(formData.get('city')).toBe(values.city)
    expect(formData.get('address')).toBe(values.address)
    expect(formData.get('postal_code')).toBe('1234567890')
    expect(formData.get('avatar')).toBe(avatar)
})

test('JSON requests preserve null, booleans, numeric IDs, and empty specialty lists', () => {
    expect(buildUserRequestData({id: 1, full_name: 'نام', manager_name: 'مدیر', email: null, agency_id: 2, is_staff: false, specialties: []})).toEqual({
        email: null, agency_id: 2, is_staff: false, specialties: [],
    })
})

test('file requests retain actual files and serialize structured fields', () => {
    const file = new File(['document'], 'document.pdf', {type: 'application/pdf'})
    const data = buildUserRequestData({professional_document: file, bio: null, specialties: ['فروش', 'اجاره'], is_active: true}) as FormData
    expect(data.get('professional_document')).toBe(file)
    expect(data.get('job_details')).toBe('')
    expect(data.get('specialties')).toBe(JSON.stringify(['فروش', 'اجاره']))
    expect(data.get('is_active')).toBe('true')
})

test('agency requires both a name and an office address', () => {
    expect(isAgencyValid({agency_name: ' ', office_address: 'تهران'})).toBe(false)
    expect(isAgencyValid({agency_name: 'املاک', office_address: ''})).toBe(false)
    expect(isAgencyValid({agency_name: 'املاک', office_address: 'تهران'})).toBe(true)
})

test('ordinary user requests cannot inherit admin or agency fields from a previous form', () => {
    expect(buildUserRequestData({first_name: 'نام', is_superuser: true, agency_name: 'دفتر'}, 'user')).toEqual({first_name: 'نام'})
})

test('office verification is omitted from agency requests without superadmin permission', () => {
    expect(buildUserRequestData({office_verification_status: 'verified'}, 'agency', false)).toEqual({})
    expect(buildUserRequestData({office_verification_status: 'verified'}, 'agency', true)).toEqual({office_verification_status: 'verified'})
})


test('partial agency updates are allowed when unchanged required profile fields are missing', () => {
    expect(isAgencyUpdateValid({}, {})).toBe(true)
    expect(isAgencyUpdateValid({agency_name: '', office_address: ''}, {agency_name: '', office_address: ''})).toBe(true)
})

test('partial agency updates cannot erase required fields but can fill them', () => {
    expect(isAgencyUpdateValid({agency_name: ' ', office_address: 'تهران'}, {agency_name: 'املاک', office_address: 'تهران'})).toBe(false)
    expect(isAgencyUpdateValid({agency_name: 'املاک', office_address: ''}, {agency_name: 'املاک', office_address: 'تهران'})).toBe(false)
    expect(isAgencyUpdateValid({agency_name: 'املاک'}, {})).toBe(true)
})

test('passwords are sent only for explicit creation, never as an edit side effect', () => {
    const fields = {first_name: 'کارشناس', password: 'initial-password'}
    expect(buildUserRequestData(fields, 'expert', false, true)).toEqual(fields)
    expect(buildUserRequestData(fields, 'expert')).toEqual({first_name: 'کارشناس'})
})

test('role form aliases match backend fields and nullable text is cleared safely', () => {
    expect(buildUserRequestData({ownership_type: 'owner', landline: null}, 'agency')).toEqual({occupancy_type: 'owner', landline: ''})
    expect(buildUserRequestData({bio: null, job_title: 'فروش'}, 'expert')).toEqual({job_details: '', job_title: 'فروش'})
})

// Use JSON unless a new file requires multipart. Keep nulls and arrays intact in JSON.
export function buildUserRequestData(
    data: Record<string, unknown>,
    role?: 'user' | 'agency' | 'expert' | 'superadmin',
    canVerifyOffice = false,
    create = false,
): Record<string, unknown> | FormData {
    const common = [
        ...(create ? ['password'] : []), 'first_name', 'last_name', 'phone', 'email', 'national_code', 'birth_date',
        'avatar', 'province', 'city', 'address', 'postal_code', 'user_type', 'role',
        'account_status', 'verification_status', 'is_active',
    ]
    const specific = {
        user: [],
        agency: ['agency_name', 'marital_status', 'ownership_type', 'lease_end_date', 'logo',
            'has_business_license', 'license_number', 'license_image', 'landline',
            'office_address', 'latitude', 'longitude', 'description',
            ...(canVerifyOffice ? ['office_verification_status'] : [])],
        expert: ['expert_code', 'agency_id', 'job_title', 'job_details', 'specialties', 'experience_years', 'professional_document', 'bio'],
        superadmin: ['admin_level', 'is_staff', 'is_superuser'],
    }
    const allowed = role ? new Set([...common, ...specific[role]]) : null
    const readOnly = new Set([
        'id', 'full_name', 'manager_name', 'phone_verified', 'national_code_verified',
        'has_profile', 'date_joined', 'last_login', 'role_display', 'user_type_display',
        'account_status_display', 'verification_status_display',
    ])
    const entries = Object.entries(data).filter(([key, value]) => !readOnly.has(key) && (!allowed || allowed.has(key)) && value !== undefined)
    const payload = entries.map(([key, value]) => {
        const field = key === 'ownership_type' ? 'occupancy_type' : key === 'bio' ? 'job_details' : key
        const textFields = new Set(['license_number', 'landline', 'description', 'expert_code', 'job_title', 'job_details'])
        return [field, value === null && textFields.has(field) ? '' : value] as [string, unknown]
    })
    if (!payload.some(([, value]) => value instanceof File)) return Object.fromEntries(payload)

    const formData = new FormData()
    payload.forEach(([key, value]) => {
        if (value instanceof File) formData.append(key, value)
        else if (Array.isArray(value)) formData.append(key, JSON.stringify(value))
        else formData.append(key, value === null ? '' : String(value))
    })
    return formData
}

export function isAgencyValid(data: {agency_name?: string; office_address?: string}) {
    return Boolean(data.agency_name?.trim() && data.office_address?.trim())
}

// PATCH validates required fields only when the user actually changes them.
// Missing or incomplete legacy profile fields must not block unrelated edits.
export function isAgencyUpdateValid(
    data: {agency_name?: string; office_address?: string},
    initialData: {agency_name?: string; office_address?: string},
) {
    return (['agency_name', 'office_address'] as const).every((field) =>
        data[field] === initialData[field] || Boolean(data[field]?.trim()),
    )
}

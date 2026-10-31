import {FormControlLabel, Stack, Switch} from '@mui/material'
import {useEffect, type Dispatch, type SetStateAction} from 'react'
import {useSelector} from 'react-redux'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {GridProducer} from '../../Components/Table/GridProducer'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {selectIsSuperAdmin} from '../../redux/RoleSlice'
import {Users} from '../User/Users'
import {commonUserDefaults, type CommonUserType, type UploadValue} from '../User/UserTypes'
import {UploadField} from '../User/UploadField'

export interface AgencyType extends CommonUserType {
    agency_name: string
    manager_name: string
    marital_status: string
    ownership_type: string
    lease_end_date: string | null
    logo: UploadValue
    has_business_license: boolean
    license_number: string | null
    license_image: UploadValue
    landline: string | null
    office_address: string
    latitude: number | null
    longitude: number | null
    description: string | null
    office_verification_status: string
}

export const agencyDefaults: AgencyType = {
    ...commonUserDefaults, role: 'agency', agency_name: '', manager_name: '',
    marital_status: '', ownership_type: '', lease_end_date: null, logo: null,
    has_business_license: false, license_number: null, license_image: null,
    landline: null, office_address: '', latitude: null, longitude: null,
    description: null, office_verification_status: 'not_started',
}

export function Agency({agency, setAgency, resource, editMode = false}: {
    agency: AgencyType
    setAgency: Dispatch<SetStateAction<AgencyType>>
    resource: string
    editMode?: boolean
}) {
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    useEffect(() => {
        setAgency((prev) => {
            const clearLease = prev.ownership_type !== 'tenant' && prev.lease_end_date != null
            const clearLicense = !prev.has_business_license && (prev.license_number != null || prev.license_image != null)
            if (!clearLease && !clearLicense) return prev
            return {
                ...prev,
                ...(clearLease && {lease_end_date: null}),
                ...(clearLicense && {license_number: null, license_image: null}),
            }
        })
    }, [agency.ownership_type, agency.has_business_license, agency.lease_end_date, agency.license_number, agency.license_image, setAgency])

    const text = (name: 'agency_name' | 'license_number' | 'landline' | 'office_address' | 'description', label: string, required = false) => (
        <CustomTextField
            key={name}
            name={name}
            label={label}
            data-resource={resource}
            value={agency[name] ?? ''}
            required={required}
            multiline={name === 'office_address' || name === 'description'}
            change={(event) => setAgency((prev) => ({...prev, [name]: event.target.value || (required ? '' : null)}))}
        />
    )
    return (
        <Stack spacing={2}>
            <Users users={agency} setUsers={setAgency} resource={resource} editMode={editMode} />
            <GridProducer data={[
                text('agency_name', 'نام دفتر املاک', true),
                <CustomTextField key="manager_name" label="مدیر دفتر" value={[agency.first_name, agency.last_name].filter(Boolean).join(' ') || agency.full_name || agency.manager_name || ''} disabled />,
                <CustomSelectField key="marital_status" name="marital_status" setData={setAgency} resource={resource} label="وضعیت تأهل مدیر" value={agency.marital_status ?? ''} options={[
                    {value: 'single', label: 'مجرد'}, {value: 'married', label: 'متأهل'},
                ]} />,
                <CustomSelectField<AgencyType>
                    key="ownership_type" name="ownership_type" resource={resource} label="نوع مالکیت دفتر"
                    value={agency.ownership_type ?? ''}
                    options={[{value: 'owner', label: 'مالک'}, {value: 'tenant', label: 'مستأجر'}]}
                    setData={(update) => setAgency((prev) => {
                        const next = typeof update === 'function' ? update(prev) : update
                        return {...next, lease_end_date: next.ownership_type === 'tenant' ? next.lease_end_date : null}
                    })}
                />,
                ...(agency.ownership_type === 'tenant' ? [
                    <DatePickerFilter key="lease_end_date" mode="controlled" item={{field: 'lease_end_date', label: 'تاریخ پایان اجاره'}} value={agency.lease_end_date ?? null} onChange={(value) => setAgency((prev) => ({...prev, lease_end_date: value || null}))} />,
                ] : []),
                <UploadField key="logo" name="logo" label="لوگوی املاکی" value={agency.logo} onChange={(value) => setAgency((prev) => ({...prev, logo: value}))} />,
                <FormControlLabel key="has_business_license" label="دارای پروانه کسب" control={
                    <Switch checked={agency.has_business_license ?? false} onChange={(_, checked) => setAgency((prev) => ({
                        ...prev, has_business_license: checked,
                        ...(!checked && {license_number: null, license_image: null}),
                    }))} />
                } />,
                ...(agency.has_business_license ? [
                    text('license_number', 'شماره پروانه کسب'),
                    <UploadField key="license_image" name="license_image" label="تصویر پروانه کسب" value={agency.license_image} onChange={(value) => setAgency((prev) => ({...prev, license_image: value}))} />,
                ] : []),
                text('landline', 'تلفن ثابت دفتر'),
                text('office_address', 'آدرس کامل دفتر', true),
                ...(['latitude', 'longitude'] as const).map((name) => (
                    <CustomTextField
                        key={name} name={name} label={name === 'latitude' ? 'عرض جغرافیایی' : 'طول جغرافیایی'}
                        type="number" value={agency[name] ?? ''}
                        inputProps={{step: 'any', min: name === 'latitude' ? -90 : -180, max: name === 'latitude' ? 90 : 180}}
                        change={(event) => {
                            const value = event.target.value === '' ? null : Number(event.target.value)
                            if (value !== null && (!Number.isFinite(value) || Math.abs(value) > (name === 'latitude' ? 90 : 180))) return
                            setAgency((prev) => ({...prev, [name]: value}))
                        }}
                    />
                )),
                text('description', 'توضیحات دفتر'),
                <CustomTextField
                    key="office_verification_status" name="office_verification_status" label="وضعیت تأیید دفتر"
                    value={agency.office_verification_status ?? ''} disabled={!isSuperAdmin}
                    change={(event) => {
                        if (isSuperAdmin) setAgency((prev) => ({...prev, office_verification_status: event.target.value}))
                    }}
                />,
            ]} />
        </Stack>
    )
}

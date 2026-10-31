import {Autocomplete, Stack, TextField} from '@mui/material'
import {useSelector} from 'react-redux'
import {selectIsSuperAdmin} from '../../redux/RoleSlice'
import type {Dispatch, SetStateAction} from 'react'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {Users} from '../User/Users'
import {commonUserDefaults, type CommonUserType, type UploadValue} from '../User/UserTypes'
import {UploadField} from '../User/UploadField'

export interface ExpertType extends CommonUserType {
    expert_code: string
    agency_id: number
    job_title: string
    specialties: string[]
    experience_years: number
    professional_document: UploadValue
    bio: string | null
}

export const expertDefaults: ExpertType = {
    ...commonUserDefaults, role: 'expert', expert_code: '', agency_id: 0,
    job_title: '', specialties: [], experience_years: 0,
    professional_document: null, bio: null,
}

export function Expert({expert, setExpert, resource, editMode = true}: {
    expert: ExpertType
    setExpert: Dispatch<SetStateAction<ExpertType>>
    resource: string
    editMode?: boolean
}) {
    const isAdmin = useSelector(selectIsSuperAdmin)
    return (
        <Stack spacing={2}>
            <Users users={expert} setUsers={setExpert} resource={resource} editMode={editMode} />
            <GridProducer data={[
                ...(['expert_code', 'job_title', 'bio'] as const).map((name) => (
                    <CustomTextField
                        key={name} name={name} data-resource={resource}
                        label={{expert_code: 'کد کارشناسی', job_title: 'عنوان شغلی', bio: 'توضیحات شغلی'}[name]}
                        value={expert[name] ?? ''} multiline={name === 'bio'}
                        change={(event) => setExpert((prev) => ({...prev, [name]: name === 'bio' ? event.target.value || null : event.target.value}))}
                    />
                )),
                ...(['agency_id', 'experience_years'] as const).map((name) => (
                    <CustomTextField
                        key={name} name={name} data-resource={resource}
                        label={name === 'agency_id' ? 'شناسه دفتر املاک مرتبط' : 'سابقه فعالیت (سال)'}
                        type="number" value={expert[name] ?? ''}
                        disabled={name === 'agency_id' && (!isAdmin || editMode)}
                        inputProps={{min: name === 'agency_id' ? 1 : 0, step: 1}}
                        change={(event) => {
                            const value = Number(event.target.value)
                            if (!Number.isInteger(value) || value < (name === 'agency_id' ? 1 : 0)) return
                            setExpert((prev) => ({...prev, [name]: value}))
                        }}
                    />
                )),
                <Autocomplete
                    key="specialties" multiple freeSolo options={[] as string[]}
                    value={expert.specialties ?? []}
                    onChange={(_, values) => setExpert((prev) => ({...prev, specialties: Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))}))}
                    renderInput={(params) => <TextField {...params} label="تخصص‌ها" helperText="برای افزودن هر تخصص، Enter بزنید" />}
                />,
                <UploadField key="professional_document" name="professional_document" label="مدارک حرفه‌ای" accept="image/*,application/pdf" value={expert.professional_document} onChange={(value) => setExpert((prev) => ({...prev, professional_document: value}))} />,
            ]} />
        </Stack>
    )
}

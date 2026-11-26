import {CustomTextField, GridProducer} from '../shared'
import type {RecordMode, StepProps} from '../types'

export function OwnerStep({property, setProperty, resource, mode = 'file'}: StepProps & {mode?: RecordMode}) {
    const request = mode === 'request'
    const rent = property.contractType === 'رهن و اجاره'
    const prefix = request ? 'customer' : 'owner'
    const title = request ? (rent ? 'مستأجر' : 'خریدار') : (rent ? 'موجر' : 'مالک')
    const fields = [
        ['Name', `نام و نام خانوادگی ${title}`],
        ['Phone', 'شماره موبایل'],
        ['Phone2', 'تلفن دوم'],
        ['Job', `شغل ${title}`],
    ] as const

    return <GridProducer sx={{marginBottom: '16px'}} data={fields.map(([suffix, label]) => {
        const name = `${prefix}${suffix}` as const
        return <CustomTextField key={name} name={name} setData={setProperty} resource={resource} label={!request && (suffix === 'Name' || suffix === 'Phone') ? `${label} (الزامی)` : label}
            defaultValue={property[name]} inputProps={suffix.startsWith('Phone') ? {inputMode: 'tel'} : undefined}/>
    })}/>
}

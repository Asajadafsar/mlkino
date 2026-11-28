import {latinDigits} from '../../../Core/PersianDate'
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
        return <CustomTextField key={name} name={name} resource={resource} label={!request && (suffix === 'Name' || suffix === 'Phone') ? `${label} (الزامی)` : label}
            value={property[name] ?? ''} onChange={event => {
                const raw = event.target.value
                const value = suffix === 'Phone' ? latinDigits(raw).replace(/[^0-9]/g, '').slice(0, 11)
                    : suffix === 'Job' ? raw.replace(/\p{Decimal_Number}/gu, '') : raw
                setProperty(previous => ({...previous, [name]: value}))
            }} inputProps={suffix === 'Phone' ? {inputMode: 'numeric', maxLength: 11, pattern: '09[0-9]{9}'}
                : suffix === 'Phone2' ? {inputMode: 'tel'} : undefined}/>
    })}/>
}

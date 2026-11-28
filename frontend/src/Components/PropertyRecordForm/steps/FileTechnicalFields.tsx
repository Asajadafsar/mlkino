import {latinDigits} from '../../../Core/PersianDate'
import {numberToPersianWords} from '../../../Core/numberToPersianWords'
import {Button, Checkbox, FormControlLabel, FormGroup, FormLabel, MenuItem, Stack, TextField} from '@mui/material'
import DatePickerFilter from '../../Filter/DatePicker'
import {BASE_DOCUMENT_TYPES, COOLING_OPTIONS, DIRECTION_OPTIONS, HEATING_OPTIONS} from '../constants'
import type {ModeStepProps, PropertyType} from '../types'

type Field = [key: string, label: string, kind: 'number' | 'integer' | 'boolean' | 'select', options?: string[]]
type Technical = NonNullable<PropertyType['technical']>
const utilityOptions = ['آب', 'برق', 'گاز', 'تلفن', 'فاضلاب']
const structures = ['فلزی', 'تیر آهن', 'بتن', 'سوله', 'بنایی', 'چوبی', 'سایر']
const commercialDocuments = ['تجاری', 'اداری', 'ساختمان یکجا', 'صنعتی', 'زمین', 'پیش فروش']

export function DocumentFields({property, setProperty}: Pick<ModeStepProps, 'property' | 'setProperty'>) {
    const options = [...BASE_DOCUMENT_TYPES]
    if (commercialDocuments.includes(property.propertyType)) options.push('سر قفلی')
    if (property.propertyType === 'پیش فروش') options.push('تعاونی')
    const current = property.documentType
    if (current && current !== 'سایر' && !options.includes(current)) options.push(current)
    return <>
        <TextField select fullWidth label="نوع سند" value={current || ''} onChange={event => setProperty(previous => ({
            ...previous, documentType: event.target.value,
            documentTypeOther: event.target.value === 'سایر' ? previous.documentTypeOther : '',
        }))}>
            <MenuItem value="">انتخاب نشده</MenuItem>
            {[...options, 'سایر'].map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </TextField>
        {current === 'سایر' && <TextField fullWidth label="نوع سند دیگر" value={property.documentTypeOther || ''}
            inputProps={{maxLength: 120}} onChange={event => setProperty(previous => ({...previous, documentTypeOther: event.target.value}))}/>}
    </>
}

const house: Field[] = [
    ['buildingAge', 'قدمت بنا (سال)', 'integer'], ['landArea', 'متراژ زمین', 'number'],
    ['direction', 'جهت', 'select', DIRECTION_OPTIONS], ['totalFloor', 'تعداد طبقات', 'integer'],
    ['renovated', 'بازسازی شده', 'boolean'], ['hasPermit', 'مجوز ساخت', 'boolean'],
    ['density', 'میزان تراکم', 'number'], ['parking', 'پارکینگ', 'boolean'],
    ['storage', 'انباری', 'boolean'], ['terrace', 'بهارخواب یا تراس', 'boolean'],
    ['frontage', 'بر ملک (متر)', 'number'],
]
const commercial: Field[] = [
    ['frontage', 'بر ملک (متر)', 'number'], ['totalFloor', 'تعداد طبقات', 'integer'],
    ['balcony', 'بالکن', 'boolean'], ['commercialUse', 'کاربری تجاری', 'boolean'],
    ['passageWidth', 'عرض گذر (متر)', 'number'],
]
const specs: Record<string, Field[]> = {
    'باغ ویلا': [
        ['landArea', 'متراژ کل زمین', 'number'], ['buildingArea', 'متراژ سازه مسکونی', 'number'],
        ['waterHours', 'سهم آب کشاورزی (ساعت)', 'integer'], ['waterMinutes', 'سهم آب کشاورزی (دقیقه)', 'integer'],
        ['hasPermit', 'مجوز', 'boolean'], ['pool', 'استخر', 'boolean'],
        ['totalFloor', 'تعداد طبقات', 'integer'], ['structureType', 'نوع سازه', 'select', structures],
        ['roomCount', 'تعداد اتاق خواب', 'integer'],
    ],
    'ساختمان کلنگی': house,
    'ساختمان ویلایی': [
        ...house, ['completionCertificate', 'پایان کار', 'boolean'],
        ['facade', 'نما', 'select', ['آجر نما', 'آجر', 'سنگ', 'سرامیک', 'سنگ رومی', 'مدرن']],
        ['passageWidth', 'عرض گذر (متر)', 'number'],
    ],
    'تجاری': commercial,
    'اداری': commercial,
    'ساختمان یکجا': [
        ['totalFloor', 'تعداد طبقات', 'integer'], ['unitCount', 'تعداد واحدها', 'integer'],
        ['unitsPerFloor', 'تعداد واحد در طبقه', 'integer'],
        ['utilityType', 'نوع انشعابات', 'select', ['اشتراکی', 'اختصاصی']],
        ['completionCertificate', 'پایان کار', 'boolean'], ['violationsPaid', 'عدم خلاف پرداخت شده', 'boolean'],
    ],
    'صنعتی': [
        ['structureType', 'نوع سازه', 'select', structures.slice(0, 4)],
        ['ceilingHeight', 'ارتفاع سقف (متر)', 'number'],
        ['electricityType', 'نوع برق', 'select', ['تک فاز', 'سه فاز']],
    ],
    'زمین': [
        ['passageWidth', 'عرض گذر (متر)', 'number'], ['frontage', 'بر ملک (متر)', 'number'],
        ['hasPermit', 'پروانه ساخت', 'boolean'], ['density', 'میزان تراکم', 'number'],
        ['permitType', 'نوع مجوز', 'select', ['کشاورزی', 'تولیدی', 'دامداری', 'صنعتی']],
    ],
    'پیش فروش': [
        ['builderType', 'نوع سازنده', 'select', ['شخصی', 'شرکتی']],
        ['totalFloor', 'تعداد طبقات', 'integer'],
    ],
}
const rootFields = ['direction', 'totalFloor', 'roomCount', 'facade', 'heating', 'cooling']
const climate = ['باغ ویلا', 'ساختمان کلنگی', 'ساختمان ویلایی', 'تجاری', 'اداری']

export function recordedTechnicalFields(property: Partial<PropertyType>) {
    const details = property.technical || {}
    const number = (value: number) => value.toLocaleString('fa-IR')
    const fields = (specs[property.propertyType || ''] || [])
        .filter(([key]) => !rootFields.includes(key))
        .flatMap(([key, label]) => {
            const value = details[key]
            if (typeof value === 'boolean') return [{label, value: value ? 'بله' : 'خیر'}]
            if (typeof value === 'number') return [{label, value: number(value)}]
            return typeof value === 'string' && value.trim() ? [{label, value}] : []
        })
    if (Array.isArray(details.utilities) && details.utilities.length) {
        fields.push({label: 'انشعابات', value: details.utilities.join('، ')})
    }
    if (typeof details.deliveryDate === 'string' && details.deliveryDate) {
        fields.push({label: 'زمان تحویل', value: details.deliveryDate})
    }
    for (const group of (Array.isArray(details.unitAreas) ? details.unitAreas : []) as {area: number; count: number}[]) {
        if (group?.area && group.count) fields.push({label: `واحدهای ${number(group.area)} متری`, value: number(group.count)})
    }
    const prices = Array.isArray(details.floorPrices) ? details.floorPrices as (number | null)[] : []
    prices.forEach((price, index) => {
        if (price) fields.push({label: `قیمت طبقهٔ ${number(index + 1)}`, value: `${number(price)} تومان`})
    })
    return fields
}

export function FileTechnicalFields({property, setProperty, request = false}: Pick<ModeStepProps, 'property' | 'setProperty'> & {request?: boolean}) {
    const persian = (value: unknown) => String(value).replace(/[0-9]/g, digit => String.fromCharCode(1776 + Number(digit)))
    const integer = (value: string) => latinDigits(value).replace(/[^0-9]/g, '').slice(0, 15)
    const type = property.propertyType
    const details = property.technical || {}
    const fields: Field[] = [...(specs[type] || [])]
    if (climate.includes(type)) fields.push(['heating', 'گرمایش', 'select', HEATING_OPTIONS], ['cooling', 'سرمایش', 'select', COOLING_OPTIONS])
    const update = (key: string, value: Technical[string]) => setProperty(previous => ({
        ...previous, technical: {...previous.technical, [key]: value},
    }))
    const utilities = Array.isArray(details.utilities) ? details.utilities as string[] : []
    const villa = type === 'باغ ویلا'
    const wholeBuilding = type === 'ساختمان یکجا'
    const unitAreas = (details.unitAreas || []) as {area: number; count: number}[]
    const prices = (details.floorPrices || []) as (number | null)[]
    const floorCount = Math.min(100, Math.max(0, Math.floor(Number(property.totalFloor) || 0)))
    return <Stack gap={2}>
        <DocumentFields property={property} setProperty={setProperty}/>
        {fields.map(([key, label, kind, options]) => {
            const root = rootFields.includes(key)
            const value = (root ? property[key as keyof PropertyType] : details[key]) ?? ''
            const choices = kind === 'boolean' ? ['true', 'false'] : options
            const put = (raw: string) => {
                if (root) setProperty(previous => ({...previous, [key]: raw}))
                else update(key, kind === 'boolean' && raw !== '' ? raw === 'true' : raw)
            }
            return <TextField key={key} label={label} fullWidth value={choices ? String(value) : persian(value)}
                select={Boolean(choices)}
                inputProps={choices ? undefined : {inputMode: 'numeric'}}
                helperText={!choices && value !== '' ? numberToPersianWords(String(value)) : undefined}
                onChange={event => put(choices ? event.target.value : integer(event.target.value))}>
                {choices && <MenuItem value="">انتخاب نشده</MenuItem>}
                {choices?.map(option => <MenuItem key={option} value={option}>
                    {kind === 'boolean' ? (option === 'true' ? 'بله' : 'خیر') : option}
                </MenuItem>)}
            </TextField>
        })}
        {specs[type] && <FormGroup row>
            <FormLabel component="legend" sx={{width: '100%'}}>انشعابات</FormLabel>
            {(villa ? utilityOptions.slice(0, 3) : utilityOptions).map(option =>
                <FormControlLabel key={option} label={option} control={<Checkbox checked={utilities.includes(option)}
                    onChange={(_, checked) => update('utilities', checked ? [...utilities, option] : utilities.filter(value => value !== option))}/>}/>)}
        </FormGroup>}
        {type === 'پیش فروش' && <DatePickerFilter mode="controlled" item={{label: 'زمان تحویل'}}
            value={typeof details.deliveryDate === 'string' ? details.deliveryDate : null}
            onChange={value => update('deliveryDate', value || '')}/>}
        {wholeBuilding && <>
            {!request && property.contractType === 'فروش' && <TextField fullWidth select label="روش ثبت قیمت ساختمان"
                value={details.priceMode || 'total'} onChange={event => update('priceMode', event.target.value)}>
                <MenuItem value="total">قیمت کل (در اطلاعات مالی)</MenuItem>
                <MenuItem value="floor">قیمت هر طبقه</MenuItem>
            </TextField>}
            {unitAreas.map((row, index) => <Stack key={index} direction={{xs: 'column', sm: 'row'}} gap={1}>
                <TextField fullWidth label={`متراژ گروه ${index + 1}`} type="number" value={row.area || ''}
                    onChange={event => update('unitAreas', unitAreas.map((item, i) => i === index ? {...item, area: Number(event.target.value)} : item))}/>
                <TextField fullWidth label={`تعداد واحد این متراژ ${index + 1}`} type="number" value={row.count || ''}
                    onChange={event => update('unitAreas', unitAreas.map((item, i) => i === index ? {...item, count: Number(event.target.value)} : item))}/>
                <Button onClick={() => update('unitAreas', unitAreas.filter((_, i) => i !== index))}>حذف</Button>
            </Stack>)}
            <Button disabled={unitAreas.length >= 100} onClick={() => update('unitAreas', [...unitAreas, {area: 0, count: 1}])}>افزودن گروه متراژ واحدها</Button>
            {!request && (property.contractType !== 'فروش' || details.priceMode === 'floor') && Array.from({length: floorCount}, (_, index) => <TextField key={index}
                fullWidth label={`قیمت طبقهٔ ${(index + 1).toLocaleString('fa-IR')} (تومان)`}
                type="number" value={prices[index] ?? ''} inputProps={{min: 1, step: 1}}
                onChange={event => update('floorPrices', Array.from({length: floorCount}, (_, floor) =>
                    floor === index ? (event.target.value === '' ? null : Number(event.target.value)) : prices[floor] ?? null))}/>)}
        </>}
    </Stack>
}

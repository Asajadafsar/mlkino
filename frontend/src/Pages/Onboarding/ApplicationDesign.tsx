import {useEffect, useRef, useState} from 'react'
import {Autocomplete, Avatar, Button, Checkbox, Chip, FormControlLabel, IconButton, TextField} from '@mui/material'
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import LockOutlined from '@mui/icons-material/LockOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import PersonOutline from '@mui/icons-material/PersonOutline'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import InsertChartOutlined from '@mui/icons-material/InsertChartOutlined'
import DiamondOutlined from '@mui/icons-material/DiamondOutlined'
import StarOutline from '@mui/icons-material/StarOutline'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import api from '../../Core/Request'
import type {Office, Plan} from './workflowTypes'
import {number} from './workflowTypes'

export function ApplicationHeading({title, subtitle, role, step}: {title: string; subtitle?: string; role?: string; step?: number}) {
    return <header className="onboarding-panel-heading"><div className="workflow-heading-title">{step && <span className="workflow-step">{number(step)}</span>}<div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{role && <Chip size="small" variant="outlined" icon={role === 'املاکی' ? <StorefrontOutlined/> : role === 'سوپرادمین' ? <WorkspacePremiumOutlined/> : <PersonOutline/>} label={role}/>}</header>
}
export function SectionTitle({children, icon = <DescriptionOutlined/>}: {children: React.ReactNode; icon?: React.ReactNode}) {
    return <h3 className="workflow-section-title">{icon}{children}</h3>
}
export function OfficeIdentity({office, compact = false}: {office: Office; compact?: boolean}) {
    return <div className={'workflow-office ' + (compact ? 'compact' : '')}><div className="workflow-office-name"><Avatar variant="rounded" src={office.logo}><StorefrontOutlined/></Avatar><strong>{office.name}</strong></div>{!compact && <div className="workflow-office-facts"><p><LocationOnOutlined/>{office.address}</p><p><GroupsOutlined/>کارشناسان فعال: {number(office.active_experts)} نفر</p><p><LocationOnOutlined/>شهر {office.city || '—'}<span/>منطقه {office.district || '—'}</p></div>}</div>
}
export function DocumentUpload({name, label, accept, required = false, logo = false}: {name: string; label: string; accept: string; required?: boolean; logo?: boolean}) {
    const [file, setFile] = useState<File>()
    const [preview, setPreview] = useState('')
    const [error, setError] = useState('')
    const input = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!file?.type.startsWith('image/')) {setPreview('');return}
        const url = URL.createObjectURL(file)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [file])
    const validate = (selected?: File) => {
        setFile(selected)
        const valid = !selected || (selected.size <= 10 * 1024 * 1024 && (selected.type.startsWith('image/') || (accept.includes('application/pdf') && selected.type === 'application/pdf')))
        const message = valid ? '' : 'فایل باید تصویر یا PDF مجاز و حداکثر ۱۰ مگابایت باشد.'
        setError(message)
        input.current?.setCustomValidity(message)
    }
    return <div className={'application-upload-field ' + (logo ? 'workflow-logo-upload' : '')}><label htmlFor={'upload-' + name}>{label}{required && ' *'}</label><div className={'application-upload ' + (file ? 'has-file' : '')}>
        {preview && logo ? <img src={preview} alt="پیش‌نمایش لوگوی دفتر"/> : <CloudUploadOutlined/>}<span>{logo ? 'بارگذاری لوگوی دفتر' : 'رزومه، مدارک تحصیلی، گواهینامه‌ها و …'}<small>{logo ? 'PNG / JPG' : 'PDF یا تصویر'} · حداکثر ۱۰ مگابایت</small></span>
        <input ref={input} id={'upload-' + name} name={name} aria-label={label} type="file" accept={accept} required={required} onChange={event => validate(event.target.files?.[0])}/>
    </div>{file && <div className="workflow-uploaded-file"><DescriptionOutlined/><div><bdi>{file.name}</bdi><small>{number(Math.round(file.size / 1024))} کیلوبایت</small></div><IconButton size="small" aria-label={'حذف ' + file.name} onClick={() => {if (input.current) input.current.value = '';validate(undefined)}}><DeleteOutline/></IconButton></div>}{error && <span role="alert" className="application-upload-error">{error}</span>}</div>
}
export function ChoiceChips({name, label, choices, required = false}: {name: string; label: string; choices: string[]; required?: boolean}) {
    const [selected, setSelected] = useState<string[]>([])
    return <fieldset className="workflow-chip-field"><legend>{label}{required && <em> *</em>}</legend><input type="hidden" name={name} value={selected.join('، ')}/><div>{choices.map(value => <Chip key={value} label={value} clickable variant="outlined" className={selected.includes(value) ? 'chosen' : ''} icon={selected.includes(value) ? <CheckCircleOutline/> : undefined} onClick={() => setSelected(old => old.includes(value) ? old.filter(item => item !== value) : [...old, value])} aria-pressed={selected.includes(value)}/>)}</div></fieldset>
}
export function ActivityAreas({office}: {office: Office}) {
    const [options, setOptions] = useState<string[]>(office.district ? [office.district] : [])
    useEffect(() => {
        const controller = new AbortController()
        if (office.city) api.get('locations/', {signal: controller.signal, params: {level: 'district', city: office.city, all: true}}).then(({data}) => {if (!controller.signal.aborted && Array.isArray(data?.data?.results)) setOptions(data.data.results.map((row: {name: string}) => row.name))}).catch(() => {})
        return () => controller.abort()
    }, [office.city])
    const [selected, setSelected] = useState<string[]>([])
    return <div className="workflow-areas"><input type="hidden" name="focus_areas" value={selected.join('، ')}/><Autocomplete multiple freeSolo size="small" options={options} value={selected} onChange={(_, value) => setSelected(value)} renderInput={params => <TextField {...params} label="مناطق فعالیت" placeholder="انتخاب یا نوشتن منطقه"/>}/></div>
}
export function ExpertiseFields() {
    const [selected, setSelected] = useState<string[]>([])
    return <fieldset className="workflow-skills"><legend>مهارت‌ها <em>*</em></legend><input type="hidden" name="specialties" value={selected.join('، ')}/><div>{['مذاکره', 'بازاریابی', 'ارزیابی ملک'].map(value => <FormControlLabel key={value} control={<Checkbox size="small" checked={selected.includes(value)} onChange={() => setSelected(old => old.includes(value) ? old.filter(item => item !== value) : [...old, value])}/>} label={value}/>)}</div></fieldset>
}
export function PlanIcon({id}: {id: string}) { return id === 'diamond' ? <DiamondOutlined/> : id === 'free' ? <WorkspacePremiumOutlined/> : <StarOutline/> }
export const planLabel = (plan: Plan) => plan.id === 'free' ? 'پایه' : plan.label
export function PlanCards({plans, selected, active, onSelect, disabled = false, disabledIds = []}: {plans: Plan[]; selected?: string; active?: string; onSelect: (id: string) => void; disabled?: boolean; disabledIds?: string[]}) {
    return <div className="onboarding-plans" role="group" aria-label="پلن دفتر">{plans.map(plan => <Button key={plan.id} className={'onboarding-plan ' + plan.id} aria-pressed={selected === plan.id} disabled={disabled || disabledIds.includes(plan.id)} onClick={() => onSelect(plan.id)}>
        <span className="workflow-plan-name"><PlanIcon id={plan.id}/><strong>{planLabel(plan)}</strong></span><span className="workflow-plan-price">{plan.price ? number(plan.price) + ' تومان / ماه' : 'بدون هزینه'}</span><span className="workflow-plan-caption">{plan.description || (plan.id === 'free' ? 'ویژه شروع فعالیت' : plan.id === 'diamond' ? 'پیشرفته و ویژه' : 'امکانات کامل‌تر')}</span><span className="workflow-plan-action">{active === plan.id ? 'پلن فعلی شما' : selected === plan.id ? 'پلن انتخاب‌شده' : 'انتخاب پلن ' + planLabel(plan)}</span>
    </Button>)}</div>
}
export function PlanComparison({plans}: {plans: Plan[]; active?: string}) {
    if (!plans.length) return null
    const features = Array.from(new Set(plans.flatMap(plan => plan.features || [])))
    return <div className="application-comparison-scroll"><table><caption>مقایسه امکانات پلن‌ها</caption><thead><tr><th>امکانات</th>{plans.map(plan => <th key={plan.id} className={'plan-' + plan.id}>{planLabel(plan)}</th>)}</tr></thead><tbody>
        {features.map(feature => <tr key={feature}><th>{feature}</th>{plans.map(plan => <td key={plan.id}>{plan.features?.includes(feature) ? <CheckCircleOutline aria-label="دارد" className="feature-enabled"/> : <LockOutlined aria-label="ندارد"/>}</td>)}</tr>)}
        <tr><th>فایل ویژه هم‌زمان</th>{plans.map(plan => <td key={plan.id}>{number(plan.promotions)}</td>)}</tr>
        <tr><th>پیشنهاد متن آگهی</th>{plans.map(plan => <td key={plan.id}>{plan.id === 'diamond' ? <CheckCircleOutline aria-label="دارد" className="feature-enabled"/> : <LockOutlined aria-label="ندارد"/>}</td>)}</tr>
    </tbody></table></div>
}
export function WorkflowJourney() {
    return <nav className="application-journey" aria-label="مراحل ارتقای حساب"><strong>جریان کار در یک نگاه:</strong>{[
        {icon: <PersonOutline/>, text: 'درخواست کاربر', detail: 'کارشناسی یا املاکی'},
        {icon: <StorefrontOutlined/>, text: 'ثبت اطلاعات', detail: 'و انتخاب دفتر / پلن'},
        {icon: <WorkspacePremiumOutlined/>, text: 'بررسی و تأیید', detail: 'دفتر / سوپرادمین'},
        {icon: <VerifiedOutlined/>, text: 'فعال‌سازی حساب', detail: 'و شروع همکاری'},
        {icon: <InsertChartOutlined/>, text: 'مدیریت دفتر', detail: 'و اشتراک'},
    ].map(item => <div key={item.text}><span>{item.icon}</span><p><b>{item.text}</b><small>{item.detail}</small></p></div>)}</nav>
}

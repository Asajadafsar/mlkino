import DemoCheckout from './DemoCheckout'
import type {GatewayOptions} from '../Settings/GatewaySettings'
import {FormEvent, useEffect, useState} from 'react'
import {Alert, Avatar, Button, Checkbox, Chip, CircularProgress, Divider, FormControlLabel, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography} from '@mui/material'
import {Link, useSearchParams} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {PageHero} from '../../Components/Workspace/PageHero'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import api from '../../Core/Request'
import {selectRole, UserRole} from '../../redux/RoleSlice'

type Plan = {id: string; label: string; price: number; promotions: number}
type Office = {name: string; logo?: string; address: string; active_experts: number}
type Application = {
    id: number; created_at: string; kind: 'expert' | 'office' | 'upgrade'; status: 'pending' | 'approved' | 'rejected'
    tier: string; name: string; phone: string; office_name?: string; terms_accepted_at?: string
    details: {job_title?: string; specialties?: string[]; experience_years?: number; job_details?: string; monthly_price?: number}
    profile?: Record<string, string | boolean | null>
}
type State = {
    demo_gateway: GatewayOptions; own: Application[]; incoming: Application[]; plans: Plan[]; terms: string
    subscription?: {code: string; tier: string; active_tier: string; paid_until?: string; ai_available: boolean; promoted_files: number[]}
}

const applicationsUrl = ACCOUNTS_URL + '/role-applications/'
const promotionUrl = ACCOUNTS_URL + '/office-promotions/'
const applicationNames = {expert: 'درخواست همکاری', office: 'درخواست دفتر املاک', upgrade: 'تمدید یا ارتقای اشتراک'}
const statuses = {pending: 'در انتظار بررسی', approved: 'تأیید شده', rejected: 'رد شده'}
const profileLabels: Record<string, string> = {
    agency_name: 'نام دفتر', office_address: 'نشانی', occupancy_type: 'نوع مالکیت',
    lease_end_date: 'پایان اجاره', landline: 'تلفن ثابت', office_district: 'منطقه', office_neighborhood: 'محله',
    license_number: 'شماره پروانه', license_expires_at: 'اعتبار پروانه', description: 'توضیحات',
}
const fieldErrors = (value: unknown): string => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.map(fieldErrors).filter(Boolean).join(' ')
    if (value && typeof value === 'object') return Object.entries(value).map(([key, entry]) => {
        const detail = fieldErrors(entry)
        return profileLabels[key] ? profileLabels[key] + '، ' + detail : detail
    }).filter(Boolean).join(' ')
    return ''
}
const number = (value: number) => value.toLocaleString('fa-IR')
const date = (value: string) => new Date(value).toLocaleDateString('fa-IR')

export default function Onboarding() {
    const role = useSelector(selectRole)
    const [params] = useSearchParams()
    const entry = role === UserRole.USER ? params.get('request') : null
    const [section, setSection] = useState<'main'|'history'|'demo'>('main')
    const [state, setState] = useState<State>()
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [busy, setBusy] = useState(false)
    const [mode, setMode] = useState<'expert' | 'office' | 'upgrade' | null>(entry === 'expert' || entry === 'office' ? entry : null)
    const [code, setCode] = useState('')
    const [office, setOffice] = useState<Office>()
    const [confirmed, setConfirmed] = useState(false)
    const [tenant, setTenant] = useState(false)
    const [license, setLicense] = useState(false)
    const [tier, setTier] = useState('free')
    const [terms, setTerms] = useState(false)
    const [reference, setReference] = useState<Record<number, string>>({})
    const [facts, setFacts] = useState('')
    const [copy, setCopy] = useState('')
    const [files, setFiles] = useState<{id: number; title: string}[]>()

    const load = async () => setState((await api.get<State>(applicationsUrl)).data)
    const run = async (action: () => Promise<void>) => {
        setBusy(true)
        setError('')
        setNotice('')
        try {
            await action()
        } catch (reason: any) {
            setError(fieldErrors(reason.response?.data) || 'ارتباط با سامانه برقرار نشد.')
        } finally {
            setBusy(false)
        }
    }
    useEffect(() => { void run(load) }, [role])

    const selectMode = (next: typeof mode) => {
        setMode(next)
        setTerms(false)
        setTier(next === 'upgrade' ? (state?.subscription?.tier === 'free' ? 'pro' : state?.subscription?.tier || 'pro') : 'free')
    }
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (busy) return
        const data = new FormData(event.currentTarget)
        void run(async () => {
            if (mode === 'expert') {
                await api.post(applicationsUrl, {
                    kind: mode, code: code.trim(), confirm_office: confirmed, job_title: data.get('job_title'), job_details: data.get('job_details'),
                    experience_years: data.get('experience_years'), specialties: String(data.get('specialties')).split(/[,،]/).map(v => v.trim()).filter(Boolean),
                })
            } else if (mode === 'office') {
                data.set('kind', mode)
                data.set('tier', tier)
                data.set('accept_terms', String(terms))
                data.set('has_business_license', String(license))
                await api.post(applicationsUrl, data)
            } else {
                await api.post(applicationsUrl, {kind: mode, tier, accept_terms: terms})
            }
            setMode(null)
            setNotice('درخواست برای بررسی ارسال شد.')
            await load()
        })
    }
    const decide = (id: number, decision: string) => run(async () => {
        await api.post(applicationsUrl + id + '/decision/', {decision, payment_reference: reference[id]})
        await load()
        setNotice(decision === 'approve' ? 'درخواست تأیید شد.' : 'درخواست رد شد.')
    })

    const [demoDecision, setDemoDecision] = useState<'pending'|'approved'|'rejected'>('pending')
    const [demoTier, setDemoTier] = useState('pro')
    const selectedDemo = state?.plans.find(plan => plan.id === demoTier)
    const pending = state?.own.some(row => row.status === 'pending')
    const subscription = state?.subscription
    const planName = (id: string) => state?.plans.find(plan => plan.id === id)?.label || id
    const title = role === UserRole.AGENCY ? 'درخواست همکاری و اشتراک دفتر' :
        role === UserRole.SUPERADMIN ? 'درخواست دفتر و اشتراک' : 'ارتقای حساب'
    const formField = (name: string, label: string, required = true) => <TextField name={name} label={label} required={required} fullWidth size="small"/>
    return <Stack spacing={2.5}>
        <PageHero title={title} description={role === UserRole.USER ? 'با یک دفتر همکاری کنید یا برای راه‌اندازی دفتر خود درخواست بدهید.' : 'وضعیت درخواست‌ها و امکانات فعال را بررسی کنید.'}/>
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}
        {!state && busy && <CircularProgress aria-label="دریافت درخواست‌ها"/>}
        {!state && !busy && <Button onClick={() => run(load)}>تلاش دوباره</Button>}
        {state && <Paper variant="outlined" sx={{borderRadius: 3, overflow: 'hidden'}}>
            <Tabs value={section} onChange={(_, value) => setSection(value)} variant="scrollable" allowScrollButtonsMobile>
                <Tab value="main" label={role === UserRole.SUPERADMIN ? 'بررسی درخواست‌ها' : 'ثبت و مدیریت درخواست'}/>
                <Tab value="history" label="درخواست‌های من"/>
                {state.demo_gateway?.enabled && <Tab value="demo" label="محیط آزمایشی"/>}
            </Tabs>
        </Paper>}
        {state && section === 'demo' && selectedDemo && <Paper variant="outlined" sx={{borderRadius: 3, p: 3}}>
            <Stack spacing={2}>
                <Typography variant="h6">پیش‌نمایش درخواست دفتر و پرداخت</Typography>
                <Alert severity="info">دفتر و درخواست زیر نمونه‌اند و وارد صف بررسی نمی‌شوند.</Alert>
                <Typography>دفتر املاک نمونه قم · قم، منطقهٔ ۳، محلهٔ امام خمینی</Typography>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip label={statuses[demoDecision]} color={demoDecision === 'approved' ? 'success' : demoDecision === 'rejected' ? 'error' : 'warning'}/>
                    {demoDecision === 'pending' ? <>
                        <Button onClick={() => setDemoDecision('approved')}>تأیید نمونه</Button>
                        <Button color="error" onClick={() => setDemoDecision('rejected')}>رد نمونه</Button>
                    </> : <Button onClick={() => setDemoDecision('pending')}>شروع مجدد نمونه</Button>}
                </Stack>
                <Divider/>
                <TextField select label="پلن نمونه" value={demoTier} onChange={event => setDemoTier(event.target.value)}>
                    {state.plans.filter(plan => plan.price > 0).map(plan => <MenuItem key={plan.id} value={plan.id}>{plan.label}</MenuItem>)}
                </TextField>
                <DemoCheckout gateway={state.demo_gateway} tier={selectedDemo.id} label={selectedDemo.label} amount={selectedDemo.price}/>
            </Stack>
        </Paper>}
        {state && section === 'main' && <>
            {role === UserRole.USER && <Stack direction="row" gap={1} flexWrap="wrap">
                <Button variant="contained" disabled={pending || busy} onClick={() => selectMode('expert')}>درخواست تبدیل به کارشناس</Button>
                <Button variant="outlined" disabled={pending || busy} onClick={() => selectMode('office')}>درخواست تبدیل به املاکی</Button>
            </Stack>}
            {subscription && <Paper variant="outlined" sx={{p: 2.5, borderRadius: 3}}>
                <Stack spacing={1.5} alignItems="flex-start">
                    <Typography fontWeight={800}>پلن فعال دفتر · {planName(subscription.active_tier)}</Typography>
                    {subscription.paid_until && <Typography>پایان اعتبار {date(subscription.paid_until)}</Typography>}
                    {subscription.tier !== subscription.active_tier && <Alert severity="warning">اعتبار اشتراک پولی تمام شده است. امکانات پایهٔ دفتر فعال‌اند.</Alert>}
                    <TextField label="کد دفتر برای همکاری" value={subscription.code} InputProps={{readOnly: true}} inputProps={{dir: 'ltr'}} fullWidth size="small"/>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                        <Button component={Link} to="/users/expert" variant="text">فهرست کارشناسان</Button>
                        <Button variant="contained" disabled={pending || busy} onClick={() => selectMode('upgrade')}>ارتقا یا تمدید پلن</Button>
                        <Button variant="outlined" disabled={subscription.active_tier === 'free' || busy} onClick={() => run(async () => setFiles((await api.get(promotionUrl)).data))}>مدیریت فایل‌های ویژه</Button>
                    </Stack>
                    {subscription.active_tier === 'diamond' && <Stack spacing={1} sx={{width: '100%'}}>
                        <Typography fontWeight={800}>پیشنهاد متن آگهی با هوش مصنوعی</Typography>
                        {subscription.ai_available ? <>
                            <TextField multiline minRows={2} label="مشخصات عمومی ملک" helperText="نشانی دقیق و اطلاعات تماس را وارد نکنید." value={facts} onChange={event => setFacts(event.target.value)} inputProps={{maxLength: 1500}}/>
                            <Button disabled={busy || !facts.trim()} onClick={() => run(async () => {
                                setCopy('')
                                setCopy((await api.post(ACCOUNTS_URL + '/diamond-ad-copy/', {facts})).data.copy)
                            })}>پیشنهاد متن</Button>
                            {copy && <TextField multiline minRows={3} label="متن پیشنهادی" value={copy} onChange={event => setCopy(event.target.value)}/>}
                        </> : <Typography color="text.secondary">سرویس هوش مصنوعی در انتظار راه‌اندازی است.</Typography>}
                    </Stack>}
                    {files && subscription.active_tier !== 'free' && <>
                        {!files.length && <Typography>دفتر فایل منتشرشده ندارد.</Typography>}
                        {files.map(file => <Button key={file.id} disabled={busy} onClick={() => run(async () => {
                            await api.post(promotionUrl, {file_id: file.id})
                            await load()
                        })}>{subscription.promoted_files.includes(file.id) ? 'حذف از ویژه‌ها' : 'ویژه کردن'} · {file.title}</Button>)}
                    </>}
                </Stack>
            </Paper>}
            {mode && !pending && <Paper variant="outlined" sx={{p: 2.5, borderRadius: 3}}>
                <Stack spacing={2} component="form" onSubmit={submit}>
                    <Typography variant="h6">{applicationNames[mode]}</Typography>
                    {mode === 'expert' ? <>
                        <Stack direction={{xs: 'column', sm: 'row'}} gap={1}>
                            <TextField label="کد دفتر املاک" disabled={busy} value={code} onChange={event => {
                                setCode(event.target.value)
                                setOffice(undefined)
                                setConfirmed(false)
                            }} size="small" fullWidth inputProps={{dir: 'ltr'}}/>
                            <Button disabled={!code.trim() || busy} variant="outlined" onClick={() => run(async () => {
                                setConfirmed(false)
                                setOffice((await api.get<Office>(ACCOUNTS_URL + '/office-lookup/', {params: {code: code.trim()}})).data)
                            })}>بررسی کد</Button>
                        </Stack>
                        {office && <>
                            <Stack direction="row" alignItems="center" gap={2}>
                                <Avatar src={office.logo || undefined}>{office.name[0]}</Avatar>
                                <Stack>
                                    <Typography fontWeight={800}>{office.name}</Typography>
                                    <Typography>{office.address}</Typography>
                                    <Typography>{number(office.active_experts)} کارشناس فعال</Typography>
                                </Stack>
                            </Stack>
                            <FormControlLabel control={<Checkbox checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>} label="دفتر را بررسی کردم و انتخابم را تأیید می‌کنم."/>
                        </>}
                        {confirmed && <>
                            {formField('job_title', 'عنوان شغلی')}
                            {formField('specialties', 'تخصص‌ها (جداشده با ویرگول)')}
                            <TextField name="experience_years" label="سابقه به سال" type="number" required inputProps={{min: 0, max: 80, step: 1}}/>
                            <TextField name="job_details" label="رزومه و سوابق کاری" multiline minRows={4} required inputProps={{maxLength: 4000}}/>
                        </>}
                    </> : <>
                        {mode === 'office' && <>
                            {formField('agency_name', 'نام دفتر')}
                            {formField('landline', 'تلفن ثابت')}
                            {formField('office_address', 'نشانی دفتر')}
                            {formField('office_district', 'منطقه')}
                            {formField('office_neighborhood', 'محله')}
                            <TextField select name="occupancy_type" label="نوع مالکیت" value={tenant ? 'tenant' : 'owner'} onChange={event => setTenant(event.target.value === 'tenant')}>
                                <MenuItem value="owner">ملکی</MenuItem><MenuItem value="tenant">اجاره‌ای</MenuItem>
                            </TextField>
                            {tenant && <TextField name="lease_end_date" label="تاریخ پایان اجاره" type="date" required InputLabelProps={{shrink: true}}/>}
                            <TextField name="logo" label="لوگوی دفتر" type="file" required InputLabelProps={{shrink: true}} inputProps={{accept: 'image/*'}}/>
                            <FormControlLabel control={<Checkbox checked={license} onChange={event => setLicense(event.target.checked)}/>} label="دفتر پروانه کسب دارد"/>
                            {license && <>
                                {formField('license_number', 'شماره پروانه')}
                                <TextField name="license_expires_at" label="تاریخ اعتبار پروانه" type="date" required InputLabelProps={{shrink: true}}/>
                                <TextField name="license_image" label="تصویر پروانه" type="file" required InputLabelProps={{shrink: true}} inputProps={{accept: 'image/*'}}/>
                            </>}
                            <TextField name="description" label="معرفی دفتر" multiline minRows={3}/>
                        </>}
                        <TextField select label="پلن دفتر" value={tier} onChange={event => setTier(event.target.value)}>
                            {state.plans.filter(plan => mode !== 'upgrade' || plan.id !== 'free').map(plan =>
                                <MenuItem key={plan.id} value={plan.id}>{plan.label} · {plan.price ? number(plan.price) + ' تومان در ماه' : 'بدون هزینه'}</MenuItem>)}
                        </TextField>
                        {state.plans.find(plan => plan.id === tier)?.promotions ? <Typography>سقف فایل ویژهٔ هم‌زمان {number(state.plans.find(plan => plan.id === tier)!.promotions)}</Typography> : null}
                        <Typography color="text.secondary">{state.terms}</Typography>
                        <FormControlLabel control={<Checkbox checked={terms} onChange={event => setTerms(event.target.checked)}/>} label="قوانین ملکینو را می‌پذیرم."/>
                    </>}
                    <Stack direction="row" gap={1}>
                        <Button type="submit" variant="contained" disabled={busy || (mode === 'expert' ? !confirmed : !terms)}>ارسال درخواست</Button>
                        <Button disabled={busy} onClick={() => setMode(null)}>انصراف</Button>
                    </Stack>
                </Stack>
            </Paper>}
            {(role === UserRole.AGENCY || role === UserRole.SUPERADMIN) && <>
                {role === UserRole.SUPERADMIN && <Paper variant="outlined" sx={{p: 2.5, borderRadius: 3}}>
                    <Typography fontWeight={800}>تعرفهٔ فعلی اشتراک دفتر</Typography>
                    {state.plans.map(plan => <Typography key={plan.id}>{plan.label} · {plan.price ? number(plan.price) + ' تومان در ماه' : 'بدون هزینه'}</Typography>)}
                </Paper>}
                <Typography variant="h6">{role === UserRole.AGENCY ? 'درخواست‌های همکاری' : 'در صف بررسی'}</Typography>
                {!state.incoming.length && <Typography color="text.secondary">درخواست بررسی‌نشده‌ای وجود ندارد.</Typography>}
                {state.incoming.map(row => <Paper key={row.id} variant="outlined" sx={{p: 2.5}}>
                    <Stack spacing={1.5} alignItems="flex-start">
                        <Typography fontWeight={800}>{applicationNames[row.kind]} · {row.name} · {row.phone}</Typography>
                        {row.kind === 'expert' ? <>
                            <Typography>{row.details.job_title} · {number(row.details.experience_years || 0)} سال سابقه</Typography>
                            <Typography>{row.details.specialties?.join('، ')}</Typography>
                            <Typography sx={{whiteSpace: 'pre-wrap'}}>{row.details.job_details}</Typography>
                        </> : <>
                            <Typography>پلن {planName(row.tier)} · {number(row.details.monthly_price || 0)} تومان ماهانه</Typography>
                            {row.terms_accepted_at && <Typography>پذیرش قوانین در {date(row.terms_accepted_at)}</Typography>}
                            {row.profile?.logo && <Avatar src={String(row.profile.logo)}/>}
                            {Object.entries(profileLabels).map(([key, label]) => row.profile?.[key] ?
                                <Typography key={key}>{label} · {String(row.profile[key])}</Typography> : null)}
                            {row.profile?.license_image && <Button component="a" href={String(row.profile.license_image)} target="_blank" rel="noopener noreferrer">مدرک پروانه کسب</Button>}
                        </>}
                        {row.tier !== 'free' && <TextField label="شناسه پرداخت تأییدشده" size="small" value={reference[row.id] || ''} onChange={event => setReference({...reference, [row.id]: event.target.value})}/>}
                        <Stack direction="row" gap={1}>
                            <Button variant="contained" disabled={busy || (row.tier !== 'free' && !reference[row.id]?.trim())} onClick={() => decide(row.id, 'approve')}>تأیید درخواست</Button>
                            <Button color="error" disabled={busy} onClick={() => decide(row.id, 'reject')}>رد درخواست</Button>
                        </Stack>
                    </Stack>
                </Paper>)}
            </>}
        </>}
        {state && section === 'history' && <Paper variant="outlined" sx={{borderRadius: 3, p: 3}}>
            {!state.own.length && <Typography>درخواستی ثبت نشده است.</Typography>}
            {state.own.length > 0 && <Stack spacing={1}>
                <Typography variant="h6">درخواست‌های من</Typography>
                {state.own.map(row => <Stack key={row.id} direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography>{applicationNames[row.kind]} {row.office_name} · {date(row.created_at)}</Typography>
                    <Chip label={statuses[row.status]} size="small" color={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'default'}/>
                </Stack>)}
            </Stack>}
        </Paper>}
    </Stack>
}

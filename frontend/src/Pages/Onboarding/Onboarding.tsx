import {useContext} from 'react'
import {CurrentUserContext} from '../../Core/CurrentUser'
import PersonAddAltRounded from '@mui/icons-material/PersonAddAltRounded'
import StorefrontRounded from '@mui/icons-material/StorefrontRounded'
import './onboarding.css'
import OfficeLocation from './OfficeLocation'
import DemoCheckout from './DemoCheckout'
import type {GatewayOptions} from '../Settings/GatewaySettings'
import {FormEvent, useEffect, useState} from 'react'
import {Alert, Avatar, Button, Checkbox, Chip, CircularProgress, Divider, FormControlLabel, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Step, StepLabel, Stepper, Tab, Tabs, TextField, Typography} from '@mui/material'
import {Link, useSearchParams} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {PageHero} from '../../Components/Workspace/PageHero'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import api from '../../Core/Request'
import {selectRole, UserRole} from '../../redux/RoleSlice'

type Plan = {id: string; label: string; price: number; promotions: number; color?: string; description?: string; features?: string[]}
type Office = {name: string; logo?: string; address: string; active_experts: number; city?: string; district?: string}
type Application = {
    id: number; created_at: string; kind: 'expert' | 'office' | 'upgrade'; status: 'pending' | 'await_pay' | 'fix' | 'approved' | 'rejected'
    tier: string; resume_url?: string; name: string; phone: string; office_name?: string; terms_accepted_at?: string
    details: {job_title?: string; specialties?: string[]; experience_years?: number; job_details?: string; monthly_price?: number; review_note?: string; payment_reference?: string; focus_areas?: string; property_types?: string}
    profile?: Record<string, string | boolean | null>
}
type State = {
    demo_gateway: GatewayOptions; own: Application[]; incoming: Application[]; reviewed: Application[]; plans: Plan[]; terms: string
    subscription?: {office_name?: string; logo?: string; code: string; tier: string; active_tier: string; paid_until?: string; ai_available: boolean; promoted_files: number[]}
}

const applicationsUrl = ACCOUNTS_URL + '/role-applications/'
const promotionUrl = ACCOUNTS_URL + '/office-promotions/'
const applicationNames = {expert: 'درخواست همکاری', office: 'درخواست دفتر املاک', upgrade: 'تمدید یا ارتقای اشتراک'}
const statuses = {pending: 'در انتظار بررسی', await_pay: 'تأیید شده، در انتظار پرداخت', fix: 'نیاز به اصلاح', approved: 'تأیید شده', rejected: 'رد شده'}
const profileLabels: Record<string, string> = {
    agency_name: 'نام دفتر', office_province: 'استان', office_city: 'شهر', office_address: 'نشانی', occupancy_type: 'نوع مالکیت',
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
    const {user} = useContext(CurrentUserContext)
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
    const [reviewFilter, setReviewFilter] = useState('all')
    const [reviewQuery, setReviewQuery] = useState('')
    const [selectedReview, setSelectedReview] = useState<number>()
    const [reviewNote, setReviewNote] = useState('')
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
                data.set('kind', mode)
                data.set('code', code.trim())
                data.set('confirm_office', String(confirmed))
                data.set('specialties', String(data.get('specialties')).split(/[,،]/).map(value => value.trim()).filter(Boolean).join('|'))
                const resume = data.get('resume')
                if (resume instanceof File && !resume.size) data.delete('resume')
                await api.post(applicationsUrl, data)
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
    const decide = (row: Application, decision: string) => run(async () => {
        await api.post(applicationsUrl + row.id + '/decision/', {
            decision, payment_reference: row.details.payment_reference, review_note: reviewNote,
        })
        setReviewNote('')
        await load()
        setNotice(decision === 'approve' && row.tier !== 'free' ? 'درخواست تأیید شد و متقاضی اکنون می‌تواند پرداخت کند.' : 'نتیجهٔ بررسی ثبت شد.')
    })
    const sendPayment = (row: Application) => run(async () => {
        await api.post(applicationsUrl + row.id + '/payment/', {payment_reference: reference[row.id]?.trim()})
        await load()
        setNotice('شناسه پرداخت برای بررسی ارسال شد.')
    })

    const [demoDecision, setDemoDecision] = useState<'pending'|'approved'|'rejected'>('pending')
    const [demoPaid, setDemoPaid] = useState(false)
    const [demoTier, setDemoTier] = useState('pro')
    const selectedDemo = state?.plans.find(plan => plan.id === demoTier)
    const pending = state?.own.some(row => row.status === 'pending' || row.status === 'await_pay')
    const awaiting = state?.own.find(row => row.status === 'await_pay')
    const correction = state?.own[0]?.status === 'fix' ? state.own[0] : undefined
    const reviews = (state?.incoming || []).filter(row => (reviewFilter === 'all' || reviewFilter === row.status)
        && [row.name, row.profile?.agency_name, row.phone].join(' ').includes(reviewQuery.trim()))
    const reviewed = reviews.find(row => row.id === selectedReview) || reviews[0]
    const subscription = state?.subscription
    const planName = (id: string) => state?.plans.find(plan => plan.id === id)?.label || id
    const title = role === UserRole.AGENCY ? 'درخواست همکاری و اشتراک دفتر' :
        role === UserRole.SUPERADMIN ? 'درخواست دفتر و اشتراک' : 'ارتقای حساب'
    const formField = (name: string, label: string, required = true) => <TextField name={name} label={label} required={required} fullWidth size="small"/>
    return <Stack spacing={2.5} className="onboarding-page">
        <PageHero title={title} illustration="/assets/estate-hero-v1.webp" description={role === UserRole.USER ? 'با یک دفتر همکاری کنید یا برای راه‌اندازی دفتر خود درخواست بدهید.' : 'وضعیت درخواست‌ها و امکانات فعال را بررسی کنید.'}/>
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}
        {!state && busy && <CircularProgress aria-label="دریافت درخواست‌ها"/>}
        {!state && !busy && <Button onClick={() => run(load)}>تلاش دوباره</Button>}
        {state && <Paper variant="outlined" sx={{borderRadius: 3, overflow: 'hidden'}}>
            <Tabs value={section} onChange={(_, value) => setSection(value)} variant="scrollable" allowScrollButtonsMobile>
                <Tab value="main" label={role === UserRole.SUPERADMIN ? 'بررسی درخواست‌ها' : 'ثبت و مدیریت درخواست'}/>
                <Tab value="history" label={role === UserRole.USER ? "درخواست‌های من" : "تاریخچه بررسی"}/>
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
                    </> : <Button onClick={() => {setDemoDecision('pending');setDemoPaid(false)}}>شروع مجدد نمونه</Button>}
                </Stack>
                <Divider/>
                <TextField select label="پلن نمونه" value={demoTier} onChange={event => setDemoTier(event.target.value)}>
                    {state.plans.filter(plan => plan.price > 0).map(plan => <MenuItem key={plan.id} value={plan.id}>{plan.label}</MenuItem>)}
                </TextField>
                {demoDecision === 'approved' && <DemoCheckout gateway={state.demo_gateway} tier={selectedDemo.id} label={selectedDemo.label} amount={selectedDemo.price}
                    onResult={result => setDemoPaid(result === 'success')}/>}
                {demoPaid && <Alert severity="success">اشتراک در سناریوی آزمایشی فعال شد.</Alert>}
            </Stack>
        </Paper>}
        {state && section === 'main' && <>
            {role === UserRole.USER && <>
                <Paper className="onboarding-identity" variant="outlined">
                    <Avatar src={typeof user.avatar === "string" ? user.avatar : undefined}>{user.first_name?.[0]}</Avatar>
                    <Typography fontWeight={800}>سلام {user.first_name} {user.last_name}</Typography>
                    <Chip label="کاربر عادی" size="small" color="success"/>
                </Paper>
                {!mode && <div className="onboarding-choices">
                    <Paper className="onboarding-choice expert" variant="outlined">
                        <PersonAddAltRounded/><Typography variant="h6">درخواست تبدیل به کارشناس</Typography>
                        <Typography color="text.secondary">همکاری به‌عنوان کارشناس در یک دفتر املاک معتبر</Typography>
                        <Button variant="contained" disabled={pending || busy} onClick={() => selectMode('expert')}>درخواست کارشناسی</Button>
                    </Paper>
                    <Paper className="onboarding-choice office" variant="outlined">
                        <StorefrontRounded/><Typography variant="h6">درخواست تبدیل به املاکی</Typography>
                        <Typography color="text.secondary">ایجاد دفتر املاک و مدیریت آگهی‌ها و کارشناسان</Typography>
                        <Button variant="contained" disabled={pending || busy} onClick={() => selectMode('office')}>درخواست املاکی</Button>
                    </Paper>
                </div>}
            </>}
            {correction && <Alert severity="warning">{correction.details.review_note} · فرم اصلاح‌شده را دوباره ارسال کنید.</Alert>}
            {awaiting && <Paper className="onboarding-identity" variant="outlined">
                <Stack spacing={1.5} sx={{width:'100%'}}>
                    <Typography fontWeight={800}>درخواست تأیید شد · پرداخت اشتراک {planName(awaiting.tier)}</Typography>
                    <Typography>{number(awaiting.details.monthly_price || 0)} تومان</Typography>
                    <Typography sx={{whiteSpace:'pre-wrap'}}>{state.demo_gateway?.payment_instructions || 'برای دریافت روش واریز، با پشتیبانی ملکینو در تماس باشید.'}</Typography>
                    {awaiting.details.payment_reference && <Alert severity="info">شناسه برای بررسی ثبت شده است.</Alert>}
                    <TextField label="شناسه پیگیری پرداخت" size="small" value={reference[awaiting.id] ?? awaiting.details.payment_reference ?? ''} onChange={event => setReference({...reference,[awaiting.id]:event.target.value})}/>
                    <Button variant="contained" disabled={busy || !reference[awaiting.id]?.trim()} onClick={() => sendPayment(awaiting)}>ثبت شناسه پرداخت</Button>
                </Stack>
            </Paper>}
            {subscription && <Paper variant="outlined" sx={{p: 2.5, borderRadius: 3}}>
                <Stack spacing={1.5} alignItems="flex-start">
                    <Stack direction="row" alignItems="center" gap={1.5}>
                        <Avatar src={subscription.logo || undefined}><StorefrontRounded/></Avatar>
                        <Typography fontWeight={800}>{subscription.office_name}</Typography>
                    </Stack>
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
                    <div className="onboarding-panel-heading"><Typography variant="h6">{applicationNames[mode]}</Typography><Chip size="small" label={role==='agency'?'املاکی':'کاربر عادی'}/></div>
                    {mode === 'expert' ? <>
                        <Stepper alternativeLabel activeStep={confirmed ? 2 : office ? 1 : 0} sx={{py: 2}}>
                            {['ورود کد دفتر','تأیید دفتر املاک','تکمیل رزومه'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                        </Stepper>
                        {!confirmed && <Stack direction={{xs: 'column', sm: 'row'}} gap={1}>
                            <TextField label="کد دفتر املاک" disabled={busy} value={code} onChange={event => {
                                setCode(event.target.value)
                                setOffice(undefined)
                                setConfirmed(false)
                            }} size="small" fullWidth inputProps={{dir: 'ltr'}}/>
                            <Button disabled={!code.trim() || busy} variant="outlined" onClick={() => run(async () => {
                                setConfirmed(false)
                                setOffice((await api.get<Office>(ACCOUNTS_URL + '/office-lookup/', {params: {code: code.trim()}})).data)
                            })}>بررسی کد</Button>
                        </Stack>}
                        {office && <>
                            <Stack direction="row" alignItems="center" gap={2}>
                                <Avatar src={office.logo || undefined}>{office.name[0]}</Avatar>
                                <Stack>
                                    <Typography fontWeight={800}>{office.name}</Typography>
                                    <Typography>{office.address}</Typography>
                                    <Typography>{number(office.active_experts)} کارشناس فعال · {[office.city,office.district].filter(Boolean).join(" / ")}</Typography>
                                </Stack>
                            </Stack>
                            {!confirmed ? <Button variant="contained" onClick={() => setConfirmed(true)}>تأیید دفتر و ادامه</Button> : <Button onClick={() => {setConfirmed(false);setOffice(undefined)}}>انتخاب دفتر دیگر</Button>}
                        </>}
                        {confirmed && <>
                            <TextField label="متقاضی" value={[user.first_name,user.last_name,user.phone].filter(Boolean).join(' · ')} InputProps={{readOnly:true}}/>
                            {formField('focus_areas', 'مناطق فعالیت', false)}
                            {formField('property_types', 'تخصص نوع ملک', false)}
                            <TextField name="resume" label="فایل رزومه (PDF یا تصویر)" type="file" InputLabelProps={{shrink:true}} inputProps={{accept:'application/pdf,image/*'}}/>
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
                            <OfficeLocation initial={correction?.profile}/>
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
                        <Typography fontWeight={800}>انتخاب پلن همکاری</Typography>
                        <div className="onboarding-plans" role="group" aria-label="پلن دفتر">
                            {state.plans.filter(plan => mode !== 'upgrade' || plan.id !== 'free').map(plan =>
                                <Button style={{"--plan-accent":plan.color || "#246bfd"} as React.CSSProperties} key={plan.id} className={'onboarding-plan ' + plan.id} variant={tier === plan.id ? 'contained' : 'outlined'}
                                    aria-pressed={tier === plan.id} onClick={() => setTier(plan.id)}>
                                    <Stack spacing={.5}><strong>{plan.id==="free"?"♧":plan.id==="diamond"?"♢":"☆"} {plan.label}</strong><span>{plan.price ? number(plan.price) + ' تومان در ماه' : 'بدون هزینه'}</span>
                                    <span>{plan.description}</span>
                                    <span>{plan.promotions ? number(plan.promotions) + ' فایل ویژهٔ هم‌زمان' : 'مدیریت پایه دفتر'}</span>
                                    {(plan.features || []).map(feature => <span key={feature}>✓ {feature}</span>)}
                                    {plan.id === 'diamond' && <span>پیشنهاد متن آگهی با هوش مصنوعی</span>}</Stack>
                                </Button>)}
                        </div>
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
                {role === UserRole.SUPERADMIN && <Button component={Link} to="/plans" sx={{alignSelf:'flex-start'}}>مدیریت پلن‌ها و تعرفه‌ها</Button>}
                <Typography variant="h6">{role === UserRole.AGENCY ? 'درخواست‌های همکاری' : 'در صف بررسی'}</Typography>
                <div className="onboarding-review">
                    <Paper variant="outlined" className="onboarding-review-list">
                        <Stack direction={{xs:'column',sm:'row'}} gap={1}>
                            <TextField size="small" label="جست‌وجوی درخواست" value={reviewQuery} onChange={event => setReviewQuery(event.target.value)}/>
                            <TextField select size="small" label="وضعیت" value={reviewFilter} onChange={event => setReviewFilter(event.target.value)}>
                                <MenuItem value="all">همه</MenuItem><MenuItem value="pending">{statuses.pending}</MenuItem><MenuItem value="await_pay">{statuses.await_pay}</MenuItem>
                            </TextField>
                        </Stack>
                        {!reviews.length && <Typography sx={{p: 2}}>درخواستی برای نمایش وجود ندارد.</Typography>}
                        <TableContainer>
                            <Table size="small">
                                <TableHead><TableRow>{['متقاضی / دفتر','نوع درخواست','تاریخ','وضعیت',''].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
                                <TableBody>{reviews.map(row => <TableRow key={row.id} hover selected={reviewed?.id === row.id}
                                    onClick={() => {setSelectedReview(row.id);setReviewNote('')}} sx={{cursor:'pointer'}}>
                                    <TableCell><Stack direction="row" alignItems="center" gap={1}>
                                        <Avatar src={String(row.profile?.logo || '')} sx={{width:32,height:32}}>{row.name[0]}</Avatar>
                                        <Typography fontSize={13} fontWeight={700}>{String(row.profile?.agency_name || row.name)}</Typography>
                                    </Stack></TableCell>
                                    <TableCell>{applicationNames[row.kind]}</TableCell>
                                    <TableCell sx={{whiteSpace:'nowrap'}}>{date(row.created_at)}</TableCell>
                                    <TableCell><Chip size="small" label={statuses[row.status]} color={row.status==='await_pay'?'success':'warning'}/></TableCell>
                                    <TableCell><Button aria-label={'مشاهده درخواست '+row.name}>‹</Button></TableCell>
                                </TableRow>)}</TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                    {reviewed && [reviewed].map(row => <Paper key={row.id} className="onboarding-review-detail" variant="outlined">
                        <Stack spacing={1.5} alignItems="flex-start">
                        <Typography variant="h6">جزئیات درخواست</Typography>
                        <div className="onboarding-review-progress">
                            <strong>{Math.round((row.profile ? Object.values(row.profile).filter(Boolean).length / Object.keys(row.profile).length : 1) * 100).toLocaleString('fa-IR')}٪</strong>
                            <span>اطلاعات ثبت‌شده برای بررسی</span>
                        </div>
                        <Typography fontWeight={800}>{applicationNames[row.kind]} · {row.name} · {row.phone}</Typography>
                        {row.kind === 'expert' ? <>
                            <Typography>{row.details.job_title} · {number(row.details.experience_years || 0)} سال سابقه</Typography>
                            <Typography>{row.details.specialties?.join('، ')}</Typography>
                            <Typography sx={{whiteSpace: 'pre-wrap'}}>{row.details.job_details}</Typography>
                            <Typography>{[row.details.focus_areas,row.details.property_types].filter(Boolean).join(' · ')}</Typography>
                            {row.resume_url && <Button component="a" href={row.resume_url} target="_blank" rel="noopener noreferrer">دانلود رزومه</Button>}
                        </> : <>
                            <Typography>پلن {planName(row.tier)} · {number(row.details.monthly_price || 0)} تومان ماهانه</Typography>
                            {row.terms_accepted_at && <Typography>پذیرش قوانین در {date(row.terms_accepted_at)}</Typography>}
                            {row.profile?.logo && <Avatar src={String(row.profile.logo)}/>}
                            {Object.entries(profileLabels).map(([key, label]) => row.profile?.[key] ?
                                <Typography key={key}>{label} · {key === 'occupancy_type' ? (row.profile[key] === 'owner' ? 'ملکی' : 'اجاره‌ای') : String(row.profile[key])}</Typography> : null)}
                            {row.profile?.license_image && <Button component="a" href={String(row.profile.license_image)} target="_blank" rel="noopener noreferrer">مدرک پروانه کسب</Button>}
                        </>}
                        {row.status === 'await_pay' && <Alert severity="info">
                            {row.details.payment_reference ? 'شناسه پرداخت ثبت‌شده · ' + row.details.payment_reference : 'متقاضی هنوز شناسه پرداخت ثبت نکرده است.'}
                        </Alert>}
                        <TextField label="توضیح اصلاحات" size="small" value={reviewNote} onChange={event => setReviewNote(event.target.value)}/>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                            {row.status === 'pending' ? <Button variant="contained" disabled={busy} onClick={() => decide(row, 'approve')}>تأیید درخواست</Button>
                                : <Button variant="contained" disabled={busy || !row.details.payment_reference} onClick={() => decide(row, 'confirm_payment')}>تأیید دریافت وجه و فعال‌سازی</Button>}
                            <Button color="warning" disabled={busy || !reviewNote.trim()} onClick={() => decide(row, 'fix')}>نیاز به اصلاح</Button>
                            <Button color="error" disabled={busy} onClick={() => decide(row, 'reject')}>رد درخواست</Button>
                        </Stack>
                        </Stack>
                    </Paper>)}
                </div>
            </>}
        </>}
        {state && section === 'history' && <Paper variant="outlined" sx={{borderRadius: 3, p: 3}}>
            {(state.reviewed || []).map(row => <Stack key={row.id} direction="row" gap={1} alignItems="center" sx={{mb:1}}>
                <Typography>{row.name} · {applicationNames[row.kind]} · {date(row.created_at)}</Typography>
                <Chip label={statuses[row.status]} size="small"/>
            </Stack>)}
            {!state.own.length && !state.reviewed?.length && <Typography>درخواستی ثبت نشده است.</Typography>}
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

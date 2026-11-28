import {FormEvent, useContext, useEffect, useState} from 'react'
import {Alert, Avatar, Button, Checkbox, Chip, CircularProgress, FormControlLabel, MenuItem, Paper, Step, StepLabel, Stepper, TextField} from '@mui/material'
import {Link, useSearchParams} from 'react-router-dom'
import {useSelector} from 'react-redux'
import PersonAddAltRounded from '@mui/icons-material/PersonAddAltRounded'
import StorefrontRounded from '@mui/icons-material/StorefrontRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import SendOutlined from '@mui/icons-material/SendOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {ACCOUNTS_URL} from '../../Core/APP_URL'
import api from '../../Core/Request'
import {selectRole, UserRole} from '../../redux/RoleSlice'
import {SidebarBrandMark} from '../../Components/Drawer/SidebarArtwork'
import {ActivityAreas, ApplicationHeading, ChoiceChips, DocumentUpload, ExpertiseFields, OfficeIdentity, PlanCards, PlanComparison, SectionTitle, WorkflowJourney} from './ApplicationDesign'
import {Application, Office, WorkflowState, applicationNames, date, number, profileLabels, statuses} from './workflowTypes'
import OfficeLocation from './OfficeLocation'
import DemoCheckout from './DemoCheckout'
import './onboarding.css'

const applicationsUrl = ACCOUNTS_URL + '/role-applications/'
const promotionUrl = ACCOUNTS_URL + '/office-promotions/'
const fieldErrors = (value: unknown): string => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.map(fieldErrors).filter(Boolean).join(' ')
    if (value && typeof value === 'object') return Object.entries(value).map(([key, entry]) => (profileLabels[key] ? profileLabels[key] + ': ' : '') + fieldErrors(entry)).join(' ')
    return ''
}
const Status = ({status}: {status: Application['status']}) => <Chip className={'workflow-status status-' + status} size="small" label={statuses[status]}/>

export default function Onboarding() {
    const {user} = useContext(CurrentUserContext)
    const role = useSelector(selectRole)
    const [params] = useSearchParams()
    const entry = params.get('request')
    const canApply = (kind: string) => kind === 'expert'
        ? role === UserRole.USER || role === UserRole.AGENCY
        : role === UserRole.USER || role === UserRole.EXPERT
    const [mode, setMode] = useState<'expert' | 'office' | 'upgrade' | null>((entry === 'expert' || entry === 'office') && canApply(entry) ? entry : null)
    const [section, setSection] = useState('main')
    const [state, setState] = useState<WorkflowState>()
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [code, setCode] = useState('')
    const [office, setOffice] = useState<Office>()
    const [confirmed, setConfirmed] = useState(false)
    const [tier, setTier] = useState('')
    const [terms, setTerms] = useState(false)
    const [tenant, setTenant] = useState(false)
    const [license, setLicense] = useState(false)
    const [reviewHistory, setReviewHistory] = useState(false)
    const [reviewQuery, setReviewQuery] = useState('')
    const [reviewFilter, setReviewFilter] = useState('all')
    const [reviewKind, setReviewKind] = useState('all')
    const [selectedReview, setSelectedReview] = useState<number>()
    const [reviewNote, setReviewNote] = useState('')
    const [reference, setReference] = useState<Record<number, string>>({})
    const [expandedResume, setExpandedResume] = useState(false)
    const [files, setFiles] = useState<{id: number; title: string}[]>()
    const [facts, setFacts] = useState('')
    const [copy, setCopy] = useState('')
    const [demoTier, setDemoTier] = useState('pro')
    const load = async () => setState((await api.get<WorkflowState>(applicationsUrl)).data)
    const run = async (action: () => Promise<void>) => {
        setBusy(true);setError('');setNotice('')
        try { await action() } catch (reason: any) {setError(fieldErrors(reason.response?.data) || 'ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.')} finally {setBusy(false)}
    }
    useEffect(() => {void run(load)}, [role])
    const selectMode = (next: typeof mode) => {
        setMode(next);setTerms(false)
        const plans = state?.plans || []
        const paidPlans = plans.filter(plan => plan.id !== 'free' && plan.price > 0)
        const activePlan = next === 'upgrade' ? paidPlans.find(plan => plan.id === state?.subscription?.active_tier) : undefined
        setTier(activePlan?.id || (next === 'office' ? plans.find(plan => !['pro-plus', 'pro-max'].includes(plan.id))?.id : paidPlans[0]?.id) || '')
    }
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (busy) return
        const data = new FormData(event.currentTarget)
        if (mode === 'expert' && !String(data.get('specialties') || '').trim()) {setError('حداقل یک مهارت را انتخاب کنید.');return}
        void run(async () => {
            if (mode === 'expert') {
                data.set('kind', 'expert');data.set('code', code.trim());data.set('confirm_office', String(confirmed))
                data.set('specialties', String(data.get('specialties')).split(/[,،]/).map(value => value.trim()).filter(Boolean).join('|'))
                // Preserve these choices in the API's existing, reviewer-visible resume text.
                const extra = [['نوع همکاری', data.get('cooperation_types')], ['حوزه فعالیت', data.get('transaction_types')]].filter(([, value]) => value).map(([label, value]) => label + ': ' + value)
                data.set('job_details', [...extra, String(data.get('job_details') || '')].filter(Boolean).join('\n'))
                data.delete('cooperation_types');data.delete('transaction_types')
                const resume = data.get('resume')
                if (resume instanceof File && !resume.size) data.delete('resume')
                await api.post(applicationsUrl, data)
            } else if (mode === 'office') {
                data.set('kind', 'office');data.set('tier', tier);data.set('accept_terms', String(terms));data.set('has_business_license', String(license))
                await api.post(applicationsUrl, data)
            } else {
                await api.post(applicationsUrl, {kind: 'upgrade', tier, accept_terms: terms})
            }
            setMode(null);await load();setNotice('درخواست برای بررسی ارسال شد. نتیجه در بخش اطلاعیه‌های من اعلام می‌شود.')
        })
    }
    const decide = (row: Application, decision: string) => run(async () => {
        if ((decision === 'fix' || (decision === 'reject' && row.kind === 'office')) && !reviewNote.trim()) {
            setError('علت رد یا توضیح اصلاح را وارد کنید.');return
        }
        await api.post(applicationsUrl + row.id + '/decision/', {decision, payment_reference: row.details.payment_reference, review_note: reviewNote})
        setReviewNote('');await load()
        setNotice(decision === 'approve' && row.kind !== 'expert' && row.tier !== 'free' ? 'درخواست تأیید شد و متقاضی اکنون می‌تواند پرداخت کند.' : 'نتیجهٔ بررسی ثبت شد.')
    })
    const pending = state?.own.some(row => row.status === 'pending' || row.status === 'await_pay')
    const awaiting = state?.own.find(row => row.status === 'await_pay')
    const correction = state?.own[0]?.status === 'fix' ? state.own[0] : undefined
    const subscription = state?.subscription
    const officePlans = (state?.plans || []).filter(plan => !['pro-plus', 'pro-max'].includes(plan.id))
    const planName = (id?: string) => state?.plans.find(plan => plan.id === id)?.label || (id === 'free' ? 'رایگان' : id || '—')
    const rows = (reviewHistory ? state?.reviewed || [] : role === UserRole.AGENCY ? [...(state?.incoming || []), ...(state?.reviewed || [])] : state?.incoming || []).filter(row => (reviewFilter === 'all' || row.status === reviewFilter) && (reviewKind === 'all' || row.kind === reviewKind) && [row.name, row.phone, row.profile?.agency_name, row.profile?.office_city].join(' ').includes(reviewQuery.trim()))
    const reviewed = rows.find(row => row.id === selectedReview) || rows[0]
    const ownHistory = <section className="workflow-history"><SectionTitle>وضعیت درخواست‌های قبلی شما</SectionTitle>{state?.own.length ? state.own.map(row => <div className="workflow-history-row" key={row.id}><PersonAddAltRounded/><strong>{applicationNames[row.kind]}</strong><time>{date(row.created_at)}</time><Status status={row.status}/></div>) : <p className="workflow-empty">هنوز درخواستی ثبت نشده است.</p>}</section>
    const chooseTier = (id: string) => {setTier(id);setMode('upgrade');setTerms(false)}
    const formField = (name: string, label: string, required = true, initial?: string | boolean | null) => <TextField name={name} label={label} required={required} defaultValue={typeof initial === 'string' ? initial : undefined} size="small" fullWidth/>
    const hero = <header className="workflow-hero" style={{'--workflow-hero-image': "url('/assets/estate-hero-v1.webp')"} as React.CSSProperties}><div className="workflow-hero-brand"><SidebarBrandMark/><div><strong>ملکینو</strong><small>پلتفرم جامع مدیریت املاک</small></div></div><div className="workflow-hero-copy"><h1>جریان کامل ارتقای نقش و مدیریت همکاری در ملکینو</h1><p>از درخواست کاربر تا تأیید مدیر املاک، مدیریت کارشناسان و اشتراک املاک</p></div></header>
    const reviewPanel = (row: Application) => {
        const profile = row.profile || {}
        const actionable = !reviewHistory && !(role === UserRole.AGENCY && row.details.office_approved) && (row.status === 'pending' || row.status === 'await_pay')
        const required = ['agency_name', 'logo', 'landline', 'office_address', 'office_province', 'office_city', 'office_district', 'office_neighborhood']
        const completeness = row.kind === 'expert' ? Math.round(['job_title', 'specialties', 'experience_years', 'job_details'].filter(key => row.details[key as keyof typeof row.details] !== undefined && row.details[key as keyof typeof row.details] !== '').length / 4 * 100) : Math.round(required.filter(key => profile[key]).length / required.length * 100)
        return <section className={'workflow-review-detail ' + (row.kind === 'expert' ? 'expert-detail' : '')} key={row.id}>
            <SectionTitle>{row.kind === 'expert' ? 'جزئیات درخواست همکاری' : 'جزئیات درخواست دفتر املاک'}</SectionTitle>
            <div className="workflow-review-detail-body"><div className="workflow-review-copy"><div className="workflow-review-person"><Avatar src={String(profile.logo || '')}>{row.name[0]}</Avatar><div><strong>{String(profile.agency_name || row.name)}</strong><span>درخواست: <Chip size="small" label={row.kind === 'expert' ? 'کارشناس املاک' : planName(row.tier)}/></span></div></div><div className="workflow-review-contact"><bdi>{row.phone}</bdi>{profile.email && <bdi>{String(profile.email)}</bdi>}</div>
            {row.kind === 'expert' ? <><SectionTitle icon={<EditOutlined/>}>خلاصه رزومه</SectionTitle><p className="workflow-resume-summary">{row.details.job_details || 'توضیحی ثبت نشده است.'}</p><div className="workflow-review-tags"><b>مهارت‌ها:</b>{row.details.specialties?.map(value => <Chip size="small" key={value} label={value}/>)}</div><dl className="workflow-review-facts"><div><dt>مناطق فعالیت:</dt><dd>{row.details.focus_areas || '—'}</dd></div><div><dt>سابقه فعالیت:</dt><dd>{number(row.details.experience_years || 0)} سال</dd></div><div><dt>وضعیت درخواست:</dt><dd><Status status={row.status}/></dd></div></dl></> : <><div className="workflow-progress-box"><strong style={{'--progress': completeness + '%'} as React.CSSProperties}>{number(completeness)}٪</strong><span>تکمیل اطلاعات دفتر</span></div><dl className="workflow-review-facts"><div><dt>پلن انتخابی:</dt><dd>{planName(row.tier)}</dd></div><div><dt>شهر:</dt><dd>{String(profile.office_city || '—')}</dd></div><div><dt>منطقه:</dt><dd>{String(profile.office_district || '—')}</dd></div><div><dt>کد درخواست:</dt><dd><bdi>REQ-{row.id}</bdi></dd></div></dl><div className="workflow-documents"><SectionTitle>مدارک و مستندات</SectionTitle><p><CheckCircleRounded/>اطلاعات دفتر {profile.agency_name ? 'ثبت شده' : 'تکمیل نشده'}</p>{profile.license_image && <a href={String(profile.license_image)} target="_blank" rel="noopener noreferrer"><DescriptionOutlined/>مشاهده پروانه کسب</a>}{profile.logo && <a href={String(profile.logo)} target="_blank" rel="noopener noreferrer"><DescriptionOutlined/>مشاهده لوگوی دفتر</a>}</div></>}
            </div><aside className="workflow-review-aside">{row.kind === 'expert' ? <><span className="workflow-aside-icon"><PersonAddAltRounded/></span><p>با تأیید این درخواست، نقش کاربر به «کارشناس» تغییر داده شده و به دفتر املاک شما افزوده می‌شود.</p></> : <><SectionTitle>نتیجه بررسی</SectionTitle>{[['اطلاعات دفتر', !!profile.agency_name], ['نشانی دفتر', !!profile.office_address], ['لوگوی دفتر', !!profile.logo], ['پذیرش قوانین', !!row.terms_accepted_at]].map(([label, present]) => <p key={String(label)} className={present ? 'document-present' : ''}>{present ? <CheckCircleRounded/> : <DescriptionOutlined/>}{label}</p>)}</>}</aside></div>
            {row.kind !== 'expert' && <Alert severity="success">با تأیید این درخواست، دفتر املاک با پلن {planName(row.tier)} {row.status === 'await_pay' ? 'پس از تأیید پرداخت فعال می‌شود.' : 'وارد مرحله بعدی فعال‌سازی می‌شود.'}</Alert>}
            {row.status === 'await_pay' && <Alert severity="info">{row.details.payment_reference ? 'شناسه پرداخت: ' + row.details.payment_reference : 'متقاضی هنوز شناسه پرداخت ثبت نکرده است.'}</Alert>}
            {expandedResume && <div className="workflow-expanded-resume"><p>{row.details.job_title} · {number(row.details.experience_years || 0)} سال سابقه</p><p>{row.details.job_details}</p>{Object.entries(profileLabels).map(([key,label]) => profile[key] ? <p key={key}>{label}: {String(profile[key])}</p> : null)}</div>}
            {actionable && <TextField className="workflow-review-note" label="علت رد یا توضیح اصلاحات" value={reviewNote} onChange={event => setReviewNote(event.target.value)} multiline minRows={1} size="small" fullWidth/>}
            <div className="workflow-review-actions">{actionable && <><Button variant="contained" startIcon={<CheckRounded/>} disabled={busy || (row.status === 'await_pay' && !row.details.payment_reference)} onClick={() => decide(row, row.status === 'await_pay' ? 'confirm_payment' : 'approve')}>{row.status === 'await_pay' ? 'تأیید دریافت وجه و فعال‌سازی' : row.kind === 'expert' ? 'تأیید همکاری' : 'تأیید درخواست'}</Button><Button className="workflow-danger" startIcon={<CloseRounded/>} disabled={busy} onClick={() => decide(row,'reject')}>رد درخواست</Button>{row.kind !== 'expert' && <Button className="workflow-warning" startIcon={<EditOutlined/>} disabled={busy || !reviewNote.trim()} onClick={() => decide(row,'fix')}>بازگشت برای اصلاح</Button>}</>}{row.kind === 'expert' && <Button variant="outlined" startIcon={<VisibilityOutlined/>} onClick={() => setExpandedResume(value => !value)}>{expandedResume ? 'بستن رزومه کامل' : 'مشاهده رزومه کامل'}</Button>}{row.resume_url && <Button component="a" href={row.resume_url} target="_blank" rel="noopener noreferrer" startIcon={<DescriptionOutlined/>}>دانلود رزومه</Button>}</div>
        </section>
    }
    return <div className="onboarding-page">
        {hero}
        {error && <Alert severity="error" role="alert">{error}</Alert>}{notice && <Alert severity="success">{notice}</Alert>}
        {!state && (busy ? <div className="workflow-loading"><CircularProgress aria-label="دریافت درخواست‌ها"/></div> : <Button onClick={() => run(load)}>تلاش دوباره</Button>)}
        {state && <>
            {section !== 'main' && <Button sx={{alignSelf:'flex-start'}} onClick={() => setSection('main')}>بازگشت به درخواست‌ها</Button>}
            {section === 'main' && <>
                {(role === UserRole.USER || role === UserRole.EXPERT || role === UserRole.AGENCY) && <div className={'workflow-applicant-grid ' + (mode === 'expert' ? confirmed ? 'has-resume' : 'has-lookup' : mode === 'office' ? 'has-office' : '')}>
                    <Paper component="section" className="workflow-panel workflow-user-panel" variant="outlined"><ApplicationHeading step={1} title="پنل کاربر عادی / ارتقای حساب" subtitle="درخواست ارتقای حساب و همکاری حرفه‌ای در ملکینو" role="کاربر عادی"/><div className="workflow-panel-body"><section className="workflow-user-identity"><SectionTitle>اطلاعات کاربر و همکاری</SectionTitle><div><Avatar src={typeof user.avatar === 'string' ? user.avatar : undefined}>{user.first_name?.[0]}</Avatar><div><strong>سلام {[user.first_name,user.last_name].filter(Boolean).join(' ')}</strong><small>حساب شما در حال حاضر کاربر عادی است.</small></div><Chip className="workflow-role-chip" size="small" label="کاربر عادی"/></div></section><div className="workflow-choice-grid"><section className={'workflow-choice expert ' + (mode === 'expert' ? 'is-chosen' : '')}><span><PersonAddAltRounded/></span><h3>درخواست تبدیل به کارشناس</h3><p>همکاری حرفه‌ای در دفتر املاک و دریافت کد دفتر املاک</p><Button disabled={pending || busy || !canApply('expert')} onClick={() => selectMode('expert')}>درخواست کارشناسی</Button></section><section className={'workflow-choice office ' + (mode === 'office' ? 'is-chosen' : '')}><span><StorefrontRounded/></span><h3>درخواست تبدیل به املاکی</h3><p>ایجاد دفتر املاک و مدیریت آگهی‌ها، کارشناسان و قراردادها</p><Button disabled={pending || busy || !canApply('office')} onClick={() => selectMode('office')}>درخواست املاکی</Button></section></div>{ownHistory}</div></Paper>
                    {mode === 'expert' && !pending && <Paper component="section" className="workflow-panel workflow-lookup-panel" variant="outlined"><ApplicationHeading step={2} title="درخواست تبدیل به کارشناس / ورود کد دفتر املاک" subtitle="انتخاب دفتر املاک و ثبت درخواست همکاری به‌عنوان کارشناس" role="کاربر عادی"/><div className="workflow-panel-body"><Stepper alternativeLabel activeStep={confirmed ? 2 : office ? 1 : 0}>{['ورود کد دفتر','تأیید دفتر املاک','تکمیل رزومه'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper><section className="workflow-code-section"><SectionTitle icon={<StorefrontRounded/>}>ورود کد دفتر املاک</SectionTitle><p>کد اختصاصی دفتر املاک را از مدیر دفتر دریافت و وارد کنید.</p><TextField label="کد دفتر املاک" disabled={busy || confirmed} value={code} onChange={event => {setCode(event.target.value);setOffice(undefined);setConfirmed(false)}} fullWidth size="small" inputProps={{dir:'ltr'}}/>{!office && <Button startIcon={<SearchRounded/>} variant="outlined" disabled={busy || !code.trim()} onClick={() => run(async () => {setOffice((await api.get<Office>(ACCOUNTS_URL + '/office-lookup/', {params:{code:code.trim()}})).data)})}>بررسی کد</Button>}</section>{office && <><OfficeIdentity office={office}/><Alert severity="success">آیا این دفتر املاک را تأیید می‌کنید؟</Alert><div className="workflow-lookup-actions"><Button variant="contained" startIcon={<CheckRounded/>} disabled={confirmed} onClick={() => setConfirmed(true)}>تأیید دفتر و ادامه</Button><Button variant="outlined" startIcon={<SearchRounded/>} disabled={busy} onClick={() => {setOffice(undefined);setConfirmed(false)}}>جستجوی مجدد</Button></div></>}</div></Paper>}
                    {mode === 'expert' && confirmed && office && !pending && <Paper component="section" className="workflow-panel workflow-resume-panel" variant="outlined"><ApplicationHeading step={3} title="تکمیل رزومه کارشناس" subtitle="ثبت اطلاعات حرفه‌ای و ارسال درخواست همکاری" role="کاربر عادی"/><form aria-label="رزومه کارشناس" className="workflow-panel-body workflow-resume-form" onSubmit={submit}><SectionTitle>اطلاعات حرفه‌ای و همکاری</SectionTitle><div className="workflow-resume-identity"><div className="workflow-resume-basic"><TextField label="نام و نام خانوادگی" value={user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ")} InputProps={{readOnly:true}} size="small"/><TextField label="نقش در دفتر" name="job_title" value="کارشناس" InputProps={{readOnly:true}} size="small"/><TextField label="سابقه فعالیت" name="experience_years" type="number" required defaultValue={0} inputProps={{min:0,max:80,step:1}} InputProps={{endAdornment:<small>سال</small>}} size="small"/><TextField label="شماره تماس" value={user.phone || ''} InputProps={{readOnly:true}} inputProps={{dir:'ltr'}} size="small"/></div><div className="workflow-resume-office"><Chip size="small" className="workflow-role-chip" label="کاربر عادی"/><OfficeIdentity office={office} compact/></div></div><ChoiceChips name="cooperation_types" label="نوع همکاری" choices={['تمام‌وقت','پاره‌وقت','مشاوره ملکی']}/><ChoiceChips name="transaction_types" label="حوزه فعالیت" choices={['خرید و فروش','رهن و اجاره']}/><ActivityAreas office={office}/><ExpertiseFields/><TextField label="توضیحات" name="job_details" required multiline minRows={2} inputProps={{maxLength:3400}} fullWidth size="small"/><DocumentUpload name="resume" label="بارگذاری رزومه و مدارک" accept="application/pdf,image/*"/><Button type="submit" variant="contained" fullWidth startIcon={<SendOutlined/>} disabled={busy}>ارسال درخواست همکاری</Button></form></Paper>}
                    {mode === 'office' && !pending && <Paper component="section" className="workflow-panel workflow-office-panel" variant="outlined"><ApplicationHeading step={5} title="درخواست تبدیل به املاکی / پروفایل و انتخاب پلن" subtitle="تکمیل اطلاعات دفتر املاک و انتخاب پلن اشتراک" role="کاربر عادی"/><form aria-label="درخواست دفتر املاک" className="workflow-panel-body workflow-office-form" onSubmit={submit} onInvalidCapture={event => {const details = (event.target as HTMLElement).closest('details');if (details) details.open = true}}><SectionTitle>اطلاعات دفتر املاک</SectionTitle><div className="workflow-office-profile"><DocumentUpload name="logo" label="لوگوی دفتر" accept="image/*" required logo/><div>{formField('agency_name','نام دفتر',true,correction?.profile?.agency_name)}{formField('description','نوع فعالیت',false,correction?.profile?.description)}<OfficeLocation initial={correction?.profile}/></div></div><details className="workflow-office-more"><summary>نشانی و مدارک دفتر</summary><div className="workflow-office-more-fields">{formField('landline','تلفن ثابت',true,correction?.profile?.landline)}{formField('office_address','نشانی دفتر',true,correction?.profile?.office_address)}<TextField select name="occupancy_type" label="نوع مالکیت" value={tenant ? 'tenant' : 'owner'} onChange={event => setTenant(event.target.value === 'tenant')} size="small"><MenuItem value="owner">ملکی</MenuItem><MenuItem value="tenant">اجاره‌ای</MenuItem></TextField>{tenant && <TextField name="lease_end_date" label="تاریخ پایان اجاره" type="date" required InputLabelProps={{shrink:true}} size="small"/>}<FormControlLabel control={<Checkbox checked={license} onChange={event => setLicense(event.target.checked)}/>} label="دفتر پروانه کسب دارد"/>{license && <>{formField('license_number','شماره پروانه')}<TextField name="license_expires_at" label="تاریخ اعتبار پروانه" type="date" required InputLabelProps={{shrink:true}} size="small"/><DocumentUpload name="license_image" label="تصویر پروانه کسب" accept="image/*" required/></>}</div></details><Alert severity="error">نتیجه در بخش اطلاعیه‌های من اعلام می‌شود. دسترسی دفتر پس از پرداخت و تأیید دریافت وجه فعال می‌شود.</Alert><SectionTitle icon={<CreditCardOutlined/>}>انتخاب پلن اشتراک</SectionTitle><PlanCards plans={officePlans} selected={tier} onSelect={setTier}/><SectionTitle>مقایسه امکانات پلن‌ها</SectionTitle><PlanComparison plans={state.plans}/><FormControlLabel className="workflow-terms" control={<Checkbox checked={terms} onChange={event => setTerms(event.target.checked)}/>} label="قوانین ملکینو را می‌پذیرم."/><small className="workflow-terms-copy">{state.terms}</small><Button type="submit" variant="contained" fullWidth startIcon={<SendOutlined/>} disabled={busy || !terms || !tier}>ارسال درخواست و ارتقای حساب</Button></form></Paper>}
                </div>}
                {correction && <Alert severity="warning">{correction.details.review_note || 'اطلاعات درخواست نیاز به اصلاح دارد.'}</Alert>}
                {awaiting && <Paper className="workflow-panel workflow-payment"><SectionTitle icon={<CreditCardOutlined/>}>درخواست تأیید شد · پرداخت اشتراک {planName(awaiting.tier)}</SectionTitle><strong>{number(awaiting.details.monthly_price || 0)} تومان</strong><p>{state.demo_gateway?.payment_instructions || 'برای دریافت روش واریز، با پشتیبانی ملکینو در تماس باشید.'}</p><TextField label="شناسه پیگیری پرداخت" size="small" value={reference[awaiting.id] ?? awaiting.details.payment_reference ?? ''} onChange={event => setReference({...reference,[awaiting.id]:event.target.value})}/><Button variant="contained" disabled={busy || !reference[awaiting.id]?.trim()} onClick={() => run(async () => {await api.post(applicationsUrl + awaiting.id + '/payment/', {payment_reference:reference[awaiting.id]?.trim()});await load();setNotice('شناسه پرداخت برای بررسی ارسال شد.')})}>ثبت شناسه پرداخت</Button></Paper>}
                {(role === UserRole.AGENCY || role === UserRole.SUPERADMIN) && <Paper component="section" className="workflow-panel workflow-review-panel"><ApplicationHeading step={role === UserRole.AGENCY ? 4 : 6} title={role === UserRole.AGENCY ? 'پنل املاکی / درخواست‌های همکاری کارشناسان' : 'پنل سوپرادمین / بررسی درخواست املاکی'} subtitle={role === UserRole.AGENCY ? 'مدیریت و بررسی درخواست‌های همکاری کارشناسان در دفتر املاک' : 'بررسی، تأیید یا رد درخواست‌های تبدیل به دفتر املاک'} role={role === UserRole.AGENCY ? 'املاکی' : 'سوپرادمین'}/><div className="workflow-review-grid"><div className="workflow-review-list"><div className="workflow-review-tabs"><Button variant={!reviewHistory ? 'outlined' : 'text'} onClick={() => {setReviewHistory(false);setSelectedReview(undefined)}}>{role === UserRole.AGENCY ? 'درخواست‌های همکاری' : 'درخواست‌های املاکی'} ({number(state.incoming.length + (role === UserRole.AGENCY ? state.reviewed.length : 0))})</Button>{role === UserRole.SUPERADMIN && <Button variant={reviewHistory ? 'outlined' : 'text'} onClick={() => {setReviewHistory(true);setSelectedReview(undefined)}}>تاریخچه ({number(state.reviewed.length)})</Button>}{role === UserRole.AGENCY && <Button component={Link} to="/users/expert">کارشناسان دفتر</Button>}</div><div className="workflow-review-filters"><TextField select label="وضعیت" size="small" value={reviewFilter} onChange={event => setReviewFilter(event.target.value)}><MenuItem value="all">همه وضعیت‌ها</MenuItem>{Object.entries(statuses).map(([key,label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>{role === UserRole.SUPERADMIN && <TextField select label="نوع درخواست" size="small" value={reviewKind} onChange={event => setReviewKind(event.target.value)}><MenuItem value="all">همه درخواست‌ها</MenuItem><MenuItem value="office">درخواست دفتر</MenuItem><MenuItem value="upgrade">ارتقای اشتراک</MenuItem></TextField>}<TextField label="جستجو در درخواست‌ها" size="small" value={reviewQuery} onChange={event => setReviewQuery(event.target.value)} InputProps={{endAdornment:<SearchRounded/>}}/></div><div className="workflow-table-scroll"><table className="workflow-table"><thead><tr>{(role === UserRole.AGENCY ? ['کاربر / متقاضی','نقش درخواست','کد دفتر','تاریخ درخواست','وضعیت',''] : ['دفتر / متقاضی','پلن انتخابی','شهر','تاریخ','وضعیت','']).map((label,index) => <th key={index}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className={reviewed?.id === row.id ? 'is-selected' : ''} onClick={() => {setSelectedReview(row.id);setReviewNote('');setExpandedResume(false)}}><td><div className="workflow-table-person"><Avatar src={String(row.profile?.logo || '')}>{row.name[0]}</Avatar><strong>{String(row.profile?.agency_name || row.name)}</strong></div></td><td><Chip size="small" label={row.kind === 'expert' ? 'کارشناس' : planName(row.tier)}/></td><td>{role === UserRole.AGENCY ? <bdi className="workflow-office-code" title={subscription?.code}>{subscription?.code || '—'}</bdi> : String(row.profile?.office_city || '—')}</td><td><time>{date(row.created_at)}</time></td><td><Status status={row.status}/></td><td><Button aria-label={'مشاهده درخواست ' + row.name}>‹</Button></td></tr>)}</tbody></table></div>{!rows.length && <p className="workflow-empty">درخواستی برای نمایش وجود ندارد.</p>}</div>{reviewed ? reviewPanel(reviewed) : <div className="workflow-review-placeholder"><DescriptionOutlined/><p>برای مشاهده جزئیات، یک درخواست انتخاب کنید.</p></div>}</div>{role === UserRole.SUPERADMIN && <Button className="workflow-plan-admin" component={Link} to="/plans">مدیریت پلن‌ها و تعرفه‌ها</Button>}</Paper>}
                {subscription && <Paper component="section" className="workflow-panel workflow-subscription-panel"><ApplicationHeading step={7} title="پنل املاکی / ارتقای پلن و مدیریت اشتراک" subtitle="مشاهده وضعیت اشتراک، ارتقا و پرداخت تمدید" role="املاکی"/><div className="workflow-panel-body"><SectionTitle icon={<CreditCardOutlined/>}>وضعیت اشتراک فعلی</SectionTitle><section className="workflow-current-subscription"><Avatar variant="rounded" src={subscription.logo}><StorefrontRounded/></Avatar><div><strong>{subscription.office_name}</strong><dl><div><dt>پلن فعلی:</dt><dd>{planName(subscription.active_tier)}</dd></div><div><dt>تاریخ شروع:</dt><dd>{date(subscription.started_at)}</dd></div><div><dt>تاریخ پایان:</dt><dd>{date(subscription.paid_until)}</dd></div></dl></div><Chip className="workflow-role-chip" size="small" label={subscription.tier === subscription.active_tier ? 'فعال' : 'نیاز به تمدید'}/></section><Button variant="contained" fullWidth startIcon={<CreditCardOutlined/>} disabled={busy || pending} onClick={() => selectMode('upgrade')}>پرداخت و تمدید اشتراک</Button><SectionTitle icon={<CreditCardOutlined/>}>ارتقای پلن اشتراک</SectionTitle><PlanCards plans={state.plans} active={subscription.active_tier} selected={mode === 'upgrade' ? tier : undefined} onSelect={chooseTier} disabledIds={['free', subscription.active_tier]} disabled={busy || pending}/><SectionTitle>مقایسه امکانات پلن‌ها</SectionTitle><PlanComparison plans={state.plans} active={subscription.active_tier}/>{mode === 'upgrade' && !pending && <form className="workflow-renew-form" onSubmit={submit}><FormControlLabel control={<Checkbox checked={terms} onChange={event => setTerms(event.target.checked)}/>} label="قوانین ملکینو را می‌پذیرم."/><small>{state.terms}</small><Button variant="contained" type="submit" disabled={busy || !terms || !tier || tier === 'free'} fullWidth>ارسال درخواست</Button></form>}<details className="workflow-subscription-management"><summary>مدیریت اشتراک و پرداخت‌ها</summary><TextField label="کد دفتر برای همکاری" value={subscription.code} InputProps={{readOnly:true}} size="small" fullWidth/><Button disabled={busy} onClick={() => {
                    if (window.confirm('کد قبلی برای درخواست‌های جدید غیرفعال شود؟')) run(async () => {
                        await api.post(ACCOUNTS_URL + '/office-code/')
                        await load()
                        setNotice('کد همکاری جدید ساخته شد.')
                    })
                }}>ساخت کد همکاری جدید</Button><Button component={Link} to="/users/expert">فهرست کارشناسان</Button><Button variant="outlined" disabled={subscription.active_tier === 'free' || busy} onClick={() => run(async () => setFiles((await api.get(promotionUrl)).data))}>مدیریت فایل‌های ویژه</Button>{files && (!files.length ? <p>دفتر فایل منتشرشده ندارد.</p> : files.map(file => <Button key={file.id} disabled={busy} onClick={() => run(async () => {await api.post(promotionUrl,{file_id:file.id});await load()})}>{subscription.promoted_files.includes(file.id) ? 'حذف از ویژه‌ها' : 'ویژه کردن'} · {file.title}</Button>))}{subscription.active_tier === 'diamond' && <section><SectionTitle>پیشنهاد متن آگهی با هوش مصنوعی</SectionTitle>{subscription.ai_available ? <><TextField label="مشخصات عمومی ملک" inputProps={{maxLength:1500}} value={facts} onChange={event => setFacts(event.target.value)} fullWidth multiline minRows={2} helperText="نشانی دقیق و اطلاعات تماس را وارد نکنید."/><Button disabled={busy || !facts.trim()} onClick={() => run(async () => setCopy((await api.post(ACCOUNTS_URL + '/diamond-ad-copy/', {facts})).data.copy))}>پیشنهاد متن</Button>{copy && <TextField value={copy} onChange={event => setCopy(event.target.value)} label="متن پیشنهادی" fullWidth multiline/>}</> : <p>سرویس هوش مصنوعی در انتظار راه‌اندازی است.</p>}</section>}</details></div></Paper>}
            </>}
            {section === 'history' && <Paper className="workflow-panel"><div className="workflow-panel-body">{ownHistory}</div></Paper>}
            {section === 'demo' && state.demo_gateway?.enabled && <Paper className="workflow-panel"><div className="workflow-panel-body"><SectionTitle>پیش‌نمایش پرداخت اشتراک</SectionTitle><Alert severity="info">این پرداخت آزمایشی است و روی اعتبار اشتراک واقعی اثر ندارد.</Alert><TextField select label="پلن نمونه" value={demoTier} onChange={event => setDemoTier(event.target.value)}>{state.plans.filter(plan => plan.price > 0).map(plan => <MenuItem key={plan.id} value={plan.id}>{plan.label}</MenuItem>)}</TextField>{state.plans.filter(plan => plan.id === demoTier).map(plan => <DemoCheckout key={plan.id} gateway={state.demo_gateway} tier={plan.id} label={plan.label} amount={plan.price}/>)}</div></Paper>}
        </>}
        <WorkflowJourney/>
        {state?.demo_gateway?.enabled && section === 'main' && <Button sx={{alignSelf:'flex-start'}} onClick={() => setSection('demo')}>محیط آزمایشی</Button>}
    </div>
}

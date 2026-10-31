import {Box, Button, Chip, Divider, Grid, Paper, Stack, Typography} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import type {Dispatch, SetStateAction} from 'react'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {formatDate} from '../../Core/FormatDate'
import {TicketAttachment} from './TicketAttachment'

export type TicketStatus =
    | 'open'
    | 'in_progress'
    | 'waiting_user'
    | 'answered'
    | 'closed'

export const TICKET_STATUSES = [
    {value: 'open', label: 'باز', color: 'info'},
    {value: 'in_progress', label: 'در حال بررسی', color: 'warning'},
    {value: 'waiting_user', label: 'در انتظار پاسخ کاربر', color: 'secondary'},
    {value: 'answered', label: 'پاسخ داده شده', color: 'success'},
    {value: 'closed', label: 'بسته شده', color: 'default'},
] as const

export const TICKET_CATEGORIES = [
    {value: 'complaint', label: 'شکایت'},
    {value: 'technical', label: 'سوالات فنی درمورد ملکینو'},
    {value: 'other', label: 'متفرقه'},
] as const

export type TicketCategory = typeof TICKET_CATEGORIES[number]['value']

export type TicketsType = {
    attachment?: string | null
    id: number
    creator: number
    creator_name?: string
    assigned_to: number | null
    assigned_to_name?: string | null
    category: TicketCategory
    category_display?: string
    subject: string
    status: TicketStatus
    status_display?: string
    created_at: string
    updated_at: string
    closed_at: string | null
    messages?: SupportTicketMessage[]
    messages_count?: number
}

export const ticketDefaults: TicketsType = {
    id: 0, creator: 0, creator_name: '', assigned_to: null, assigned_to_name: null,
    category: 'other', category_display: '', subject: '', status: 'open', status_display: '',
    created_at: '', updated_at: '', closed_at: null, messages_count: 0,
}

export type SupportTicketMessage = {
    id: number
    ticket?: number
    author_name?: string
    attachment?: string | null
    author: number
    body: string
    is_internal: boolean
    created_at: string
}

export type TicketCreateInput = {
    category: TicketCategory
    subject: string
    message: string
    attachment?: File | null
}

export const ticketCreateDefaults: TicketCreateInput = {category: 'other', subject: '', message: ''}

export function isTicketCreateValid(data: TicketCreateInput) {
    const subjectLength = data.subject.trim().length
    const messageLength = data.message.trim().length
    return TICKET_CATEGORIES.some(({value}) => value === data.category) &&
        subjectLength >= 3 && subjectLength <= 200 && messageLength >= 2 && messageLength <= 20000
}

type TicketFormValues = Partial<Omit<TicketsType, 'attachment'>> & Pick<TicketsType, 'subject' | 'category'> & {message?: string; attachment?: File | string | null}

export function Tickets<T extends TicketFormValues>({tickets, setTickets, resource, editMode = false}: {
    tickets: T
    setTickets: Dispatch<SetStateAction<T>>
    resource: string
    editMode?: boolean
}) {
    if (!tickets) return null
    const subjectLength = (tickets.subject ?? '').trim().length
    const messageLength = (tickets.message ?? '').trim().length
    const status = TICKET_STATUSES.find(({value}) => value === tickets.status)
    return (
        <Paper variant="outlined" sx={{borderRadius: 3, overflow: 'hidden'}}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}
                sx={{px: {xs: 2, sm: 3}, py: 2.5, bgcolor: 'action.hover'}}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>{editMode ? `تیکت #${tickets.id}` : 'تیکت جدید'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                        {editMode ? 'اطلاعات و وضعیت رسیدگی به درخواست' : 'موضوع را انتخاب کنید و درخواست خود را با جزئیات بنویسید.'}
                    </Typography>
                </Box>
                {editMode && <Chip label={status?.label ?? tickets.status} color={status?.color ?? 'default'} size="small" />}
            </Stack>
            <Box sx={{p: {xs: 2, sm: 3}}}>
                <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={editMode ? 6 : 12}>
                        <CustomSelectField
                            name="category" label="دسته‌بندی" resource={resource} required
                            disabled={editMode} value={tickets.category} setData={setTickets} options={[...TICKET_CATEGORIES]}
                        />
                    </Grid>
                    {editMode && <Grid item xs={12} sm={6}>
                        <CustomSelectField
                            name="status" label="وضعیت رسیدگی" resource={resource}
                            disabled value={tickets.status ?? 'open'} setData={setTickets} options={[...TICKET_STATUSES]}
                        />
                    </Grid>}
                    <Grid item xs={12}>
                        <CustomTextField
                            name="subject" label="موضوع تیکت" data-resource={resource} required
                            disabled={editMode} value={tickets.subject ?? ''} setData={setTickets}
                            inputProps={{minLength: 3, maxLength: 200}}
                            error={subjectLength > 0 && (subjectLength < 3 || subjectLength > 200)}
                            helperText={`${subjectLength.toLocaleString('fa-IR')} از ۲۰۰ کاراکتر؛ حداقل ۳ کاراکتر`}
                        />
                    </Grid>
                    {!editMode && <Grid item xs={12}>
                        <CustomTextField
                            name="message" label="متن درخواست" data-resource={resource} required
                            value={tickets.message ?? ''} setData={setTickets}
                            multiline minRows={7} inputProps={{minLength: 2, maxLength: 20000}}
                            error={messageLength > 0 && (messageLength < 2 || messageLength > 20000)}
                            helperText={`${messageLength.toLocaleString('fa-IR')} از ۲۰٬۰۰۰ کاراکتر؛ حداقل ۲ کاراکتر`}
                        />
                    </Grid>}
                    {!editMode && <Grid item xs={12}>
                        <Stack spacing={1.5} sx={{p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2}}>
                            <Typography variant="subtitle2">فایل پیوست (اختیاری)</Typography>
                            {tickets.attachment instanceof File && (
                                <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>
                                    {tickets.attachment.name}
                                </Typography>
                            )}
                            <Stack direction="row" gap={1}>
                                <Button component="label" variant="outlined" startIcon={<AttachFileIcon />}>
                                    {tickets.attachment ? 'تغییر فایل' : 'انتخاب فایل'}
                                    <input
                                        hidden type="file" name="attachment" aria-label="فایل پیوست"
                                        onChange={(event) => {
                                            const attachment = event.target.files?.[0]
                                            if (attachment) setTickets((prev) => ({...prev, attachment}))
                                            event.target.value = ''
                                        }}
                                    />
                                </Button>
                                {tickets.attachment && <Button color="error" onClick={() => setTickets((prev) => ({...prev, attachment: null}))}>حذف فایل</Button>}
                            </Stack>
                        </Stack>
                    </Grid>}
                </Grid>
                {editMode && <>
                    <Box sx={{mt: 3}}>
                        <TicketAttachment attachment={typeof tickets.attachment === 'string' ? tickets.attachment : null} />
                    </Box>
                    <Divider sx={{my: 3}} />
                    <Typography variant="subtitle2" color="text.secondary" sx={{mb: 2}}>اطلاعات ثبت و پیگیری</Typography>
                    <Grid container spacing={2}>
                        {[
                            ['شناسه ثبت‌کننده', tickets.creator],
                            ['ثبت‌کننده', tickets.creator_name],
                            ['شناسه مسئول رسیدگی', tickets.assigned_to],
                            ['مسئول رسیدگی', tickets.assigned_to_name],
                            ['تعداد پیام‌ها', tickets.messages_count],
                            ['تاریخ ثبت', tickets.created_at ? formatDate(tickets.created_at) : null],
                            ['آخرین ویرایش', tickets.updated_at ? formatDate(tickets.updated_at) : null],
                            ['تاریخ بسته شدن', tickets.closed_at ? formatDate(tickets.closed_at) : null],
                        ].map(([label, value]) => (
                            <Grid item xs={12} sm={6} md={4} key={String(label)}>
                                <CustomTextField label={String(label)} value={value ?? '--'} disabled />
                            </Grid>
                        ))}
                    </Grid>
                </>}
            </Box>
        </Paper>
    )
}

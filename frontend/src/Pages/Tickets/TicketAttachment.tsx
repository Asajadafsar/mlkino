import {Alert, Button, Stack, Typography} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import axios from 'axios'
import {useState} from 'react'
import APP_URL from '../../Core/APP_URL'

export function TicketAttachment({attachment}: {attachment?: string | null}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    let url: URL | null = null
    try {
        if (attachment) {
            const candidate = new URL(attachment, `${new URL(APP_URL).origin}/`)
            if (['https:', 'http:'].includes(candidate.protocol)) url = candidate
        }
    } catch {
        // Invalid attachment URLs must not become clickable links.
    }
    const attachmentUrl = url?.href
    let filename = 'attachment'
    if (url) {
        const lastSegment = url.pathname.split('/').pop()
        if (lastSegment) {
            try { filename = decodeURIComponent(lastSegment) } catch { filename = lastSegment }
        }
    }
    const isImage = /\.(png|jpe?g|gif|webp|avif|bmp|svg|ico|apng)$/i.test(filename)

    const download = async () => {
        if (!attachmentUrl || loading) return
        setLoading(true)
        setError('')
        try {
            const response = await axios.get<Blob>(attachmentUrl, {
                responseType: 'blob',
                withCredentials: new URL(attachmentUrl).origin === new URL(APP_URL).origin,
            })
            const blobUrl = URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
        } catch {
            setError(isImage
                ? 'دانلود فایل انجام نشد. دوباره تلاش کنید یا از گزینه مشاهده فایل استفاده کنید.'
                : 'دانلود فایل انجام نشد. دوباره تلاش کنید.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Stack spacing={2} sx={{p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2}}>
            <Stack direction="row" gap={1} alignItems="center">
                <AttachFileIcon color="action" />
                <Typography variant="subtitle2">فایل پیوست</Typography>
            </Stack>
            {attachmentUrl ? <>
                <Typography variant="body2" sx={{overflowWrap: 'anywhere'}}>{filename}</Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                    {isImage && <Button component="a" href={attachmentUrl} target="_blank" rel="noopener noreferrer" variant="outlined" startIcon={<OpenInNewIcon />}>مشاهده فایل</Button>}
                    <Button onClick={download} disabled={loading} variant="contained" startIcon={<DownloadIcon />}>
                        {loading ? 'در حال دانلود…' : 'دانلود فایل'}
                    </Button>
                </Stack>
                {error && <Alert severity="error">{error}</Alert>}
            </> : <Typography variant="body2" color="text.secondary">
                {attachment ? 'آدرس فایل پیوست معتبر نیست.' : 'این تیکت فایل پیوست ندارد.'}
            </Typography>}
        </Stack>
    )
}

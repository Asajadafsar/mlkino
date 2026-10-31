import {Alert, Box, Button, Chip, Grid, Paper, Skeleton, Stack, Typography} from '@mui/material'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {useCallback, useEffect, useState} from 'react'
import {useDispatch} from 'react-redux'
import {DataProvider} from '../../Core/DataProvider'
import {formatDate} from '../../Core/FormatDate'
import {setUtil} from '../../redux/UtilSlice'
import type {AnnouncementType} from '../Announcement/Announcement'
import SectionTitle from './SectionTitle'

type AnnouncementCollection = AnnouncementType[] | {results: AnnouncementType[]}
type DashboardResponse = AnnouncementType[] | {
    announcements?: AnnouncementCollection
    results?: AnnouncementType[]
}

function announcementLink(link: string) {
    try {
        const url = new URL(link)
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null
    } catch {
        return null
    }
}

export default function DashboardAnnouncements() {
    const dispatch = useDispatch()
    const [announcements, setAnnouncements] = useState<AnnouncementType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const getAnnouncements = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const response = await DataProvider.get<DashboardResponse>('dashboard/')
            const data = response.data
            const collection = Array.isArray(data) ? data : data.announcements ?? data.results ?? []
            setAnnouncements(Array.isArray(collection) ? collection : collection.results)
        } catch (error: any) {
            const message = error.message || 'خطا در دریافت اطلاعیه‌ها'
            setError(message)
            dispatch(setUtil({open: true, message, severity: 'error'}))
        } finally {
            setLoading(false)
        }
    }, [dispatch])

    useEffect(() => {
        getAnnouncements()
    }, [getAnnouncements])

    return (
        <Box component="section" aria-label="اطلاعیه‌ها">
            <SectionTitle title="اطلاعیه‌ها" />
            {loading ? (
                <Grid container spacing={2}>
                    {[0, 1].map((key) => <Grid item xs={12} md={6} key={key}>
                        <Skeleton variant="rectangular" height={190} sx={{borderRadius: 3}} />
                    </Grid>)}
                </Grid>
            ) : error ? (
                <Alert severity="error" action={<Button color="inherit" onClick={getAnnouncements}>تلاش مجدد</Button>}>{error}</Alert>
            ) : announcements.length === 0 ? (
                <Paper variant="outlined" sx={{p: 3, borderRadius: 3, textAlign: 'center'}}>
                    <CampaignOutlinedIcon color="disabled" sx={{fontSize: 32, mb: 1}} />
                    <Typography variant="body2" color="text.secondary">اطلاعیه‌ای برای نمایش وجود ندارد.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {announcements.map((announcement) => {
                        const link = announcementLink(announcement.link)
                        return (
                            <Grid item xs={12} md={6} xl={4} key={announcement.id}>
                                <Paper variant="outlined" sx={{p: 2.5, borderRadius: 3, height: '100%', boxSizing: 'border-box', borderTop: '3px solid', borderTopColor: 'primary.main'}}>
                                    <Stack spacing={2} sx={{height: '100%'}}>
                                        <Stack direction="row" alignItems="flex-start" gap={1.5}>
                                            <CampaignOutlinedIcon color="primary" sx={{mt: 0.25}} />
                                            <Typography component="h3" variant="subtitle1" fontWeight={700} sx={{flex: 1, overflowWrap: 'anywhere'}}>{announcement.title}</Typography>
                                            <Chip size="small" color={announcement.status === 'published' ? 'success' : 'default'} variant="outlined" label={announcement.status_display || announcement.status} />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 2, flex: 1}}>{announcement.description}</Typography>
                                        <Stack spacing={0.5}>
                                            <Typography variant="caption" color="text.secondary">
                                                {[announcement.created_by_name, announcement.created_by_role_display].filter(Boolean).join(' · ')}
                                            </Typography>
                                            <Typography component="time" dateTime={announcement.created_at} variant="caption" color="text.secondary">{formatDate(announcement.created_at)}</Typography>
                                        </Stack>
                                        {link && <Button component="a" href={link} target="_blank" rel="noopener noreferrer" variant="outlined" endIcon={<OpenInNewIcon />} sx={{alignSelf: 'flex-start'}}>مشاهده لینک اطلاعیه</Button>}
                                    </Stack>
                                </Paper>
                            </Grid>
                        )
                    })}
                </Grid>
            )}
        </Box>
    )
}

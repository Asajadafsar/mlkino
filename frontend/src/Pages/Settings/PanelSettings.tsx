import {useEffect, useRef, useState} from 'react'
import {Alert, Box, Button, LinearProgress, Stack, Typography, Paper, List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material'

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import {PageHero} from '../../Components/Workspace/PageHero'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import {useSelector} from 'react-redux'
import {selectIsSuperAdmin} from '../../redux/RoleSlice'
import type {PanelSettingsState} from './types'

import {GeneralSettings} from './GeneralSettings'
import {BrandingSettings} from './BrandingSettings'
import {ThemeSettings} from './ThemeSettings'
import {SeoSettings} from './SeoSettings'
import {PanelPreview, type PanelPreviewRef} from './PanelPreview'
import { ContactSettings } from './ContactSettings'

export default function PanelSettings() {
    const {settings: saved, loading, error, save} = usePanelSettings()
    const isAdmin = useSelector(selectIsSuperAdmin)
    const [settings, setSettings] = useState<PanelSettingsState>(saved)
    const [section, setSection] = useState('general')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [saveError, setSaveError] = useState('')
    useEffect(() => {setSettings(saved)}, [saved])
    const saveChanges = async () => {
        setSaving(true); setMessage(''); setSaveError('')
        try {await save(settings); setMessage('تنظیمات ذخیره و روی پنل اعمال شد.')}
        catch (error: any) {setSaveError(error.response?.data?.message || error.message || 'ذخیره انجام نشد')}
        finally {setSaving(false)}
    }

    /*
     * مهم:
     *
     * Preview با ref کنترل می‌شود.
     *
     * بنابراین هنگام Drag کردن Color Picker
     * نیازی به setState در این کامپوننت نداریم.
     */
    const previewRef = useRef<PanelPreviewRef>(null)

    const resetSettings = () => {
        setSettings(saved)

        /*
         * Reset کردن Preview
         */
        previewRef.current?.reset(saved.theme)
    }

    const categories = [
        {id:'general',title:'تنظیمات عمومی',description:'نام پنل، زبان و زمان',icon:<SettingsOutlinedIcon/>},
        {id:'branding',title:'لوگو و هویت بصری',description:'لوگو، نسخه موبایل و آیکون',icon:<ImageOutlinedIcon/>},
        {id:'theme',title:'رنگ و ظاهر',description:'رنگ‌های اصلی و پیش‌نمایش',icon:<PaletteOutlinedIcon/>},
        {id:'seo',title:'موتورهای جستجو',description:'عنوان، توضیحات و اشتراک‌گذاری',icon:<SearchOutlinedIcon/>},
        {id:'contact',title:'اطلاعات تماس',description:'آدرس و شبکه‌های اجتماعی',icon:<ContactMailOutlinedIcon/>},
    ]
    return <Stack spacing={2.5}>
        <PageHero title="تنظیمات سامانه" description="هویت، ظاهر و تنظیمات ملکینو را از یک جای مشخص مدیریت کنید." illustration="/assets/settings-3d.png" />
        {loading && <LinearProgress/>}
        {(error || saveError) && <Alert severity="error">{saveError || error}</Alert>}
        {message && <Alert severity="success" onClose={()=>setMessage('')}>{message}</Alert>}
        {!isAdmin && <Alert severity="info">تغییر تنظیمات عمومی توسط سوپرادمین انجام می‌شود.</Alert>}
        <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'260px minmax(0,1fr)'},gap:2.5,alignItems:'start'}}>
            <Paper variant="outlined" sx={{p:1.5,borderRadius:4,minWidth:0,maxWidth:'100%'}}><List sx={{display:{xs:'flex',md:'block'},overflowX:'auto',maxWidth:'100%',gap:1}}>{categories.map(item=><ListItemButton key={item.id} selected={section===item.id} onClick={()=>{setSection(item.id);setMessage('')}} sx={{borderRadius:2.5,mb:{md:.75},minWidth:{xs:180,md:0},'&.Mui-selected':{background:'linear-gradient(100deg,#eaf2ff,#f4f8ff)',color:'primary.main'}}}><ListItemIcon sx={{minWidth:38,color:section===item.id?'primary.main':'text.secondary'}}>{item.icon}</ListItemIcon><ListItemText primary={item.title} secondary={item.description} primaryTypographyProps={{fontWeight:700,fontSize:14}} secondaryTypographyProps={{fontSize:11,mt:.5}}/></ListItemButton>)}</List><Box sx={{p:2,borderTop:'1px solid',borderColor:'divider'}}><Typography variant="caption" color="text.secondary">تغییرات پس از ذخیره در سراسر پنل اعمال می‌شوند.</Typography></Box></Paper>
            <Stack spacing={2.5} sx={{minWidth:0}}>
                <Stack component="fieldset" disabled={!isAdmin || saving || loading} sx={{border:0,p:0,m:0,minWidth:0}}>
                    {section==='general' && <GeneralSettings settings={settings} setSettings={setSettings}/>}
                    {section==='branding' && <BrandingSettings settings={settings} setSettings={setSettings}/>}
                    {section==='theme' && <ThemeSettings settings={settings} setSettings={setSettings} previewRef={previewRef}/>}
                    {section==='seo' && <SeoSettings settings={settings} setSettings={setSettings}/>}
                    {section==='contact' && <ContactSettings settings={settings} setSettings={setSettings}/>}
                </Stack>
                {section==='theme' && <PanelPreview ref={previewRef} settings={settings}/>}
                <Paper variant="outlined" sx={{p:2,borderRadius:3}}><Stack direction="row" justifyContent="flex-end" gap={1}><Button variant="outlined" onClick={resetSettings} disabled={saving||loading}>بازگرداندن فرم</Button>{isAdmin&&<Button variant="contained" startIcon={<SaveOutlinedIcon/>} onClick={saveChanges} disabled={saving||loading}>{saving?'در حال ذخیره…':'ذخیره تنظیمات'}</Button>}</Stack></Paper>
            </Stack>
        </Box>
    </Stack>
}

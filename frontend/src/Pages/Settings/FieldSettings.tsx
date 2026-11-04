import {Box, Chip, FormControlLabel, Stack, Switch, Typography} from '@mui/material'
import {SettingsSection} from './SettingsSection'
import type {PanelSettingsState, SettingsSetter} from './types'
import options from './fieldOptions.json'
const groups = {file:'فایل‌های ملکی', request:'درخواست ملک', agency:'دفتر املاکی', user:'اطلاعات کاربران'}
export function FieldSettings({settings,setSettings}:{settings:PanelSettingsState;setSettings:SettingsSetter}) {
 return <SettingsSection title="فیلدهای فرم‌ها" description="نمایش فیلدهای اختیاری هر بخش را جداگانه تنظیم کنید. پنهان‌کردن فیلد، اطلاعات قبلی را حذف نمی‌کند. فیلدهای ضروری ثبت حساب و نشانی دفتر همیشه فعال هستند.">
 <Stack spacing={3}>{Object.entries(groups).map(([scope,title])=><Box key={scope}><Stack direction="row" gap={1} alignItems="center" mb={1.5}><Typography fontWeight={700}>{title}</Typography><Chip size="small" label={`${options.filter(x=>x.scope===scope).length} فیلد`}/></Stack><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'},gap:1}}>{options.filter(x=>x.scope===scope).map(option=>{const key=`${scope}.${option.key}`;return <FormControlLabel key={key} sx={{m:0,px:1.5,py:.5,border:'1px solid',borderColor:'divider',borderRadius:2}} label={option.label} control={<Switch checked={settings.fields?.[key]!==false} onChange={(_,checked)=>setSettings(prev=>({...prev,fields:{...prev.fields,[key]:checked}}))}/>}/>})}</Box></Box>)}</Stack>
 </SettingsSection>
}

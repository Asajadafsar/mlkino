import {FormControlLabel, Stack, Switch} from '@mui/material'
import {SettingsSection} from './SettingsSection'
import type {PanelSettingsState, SettingsSetter} from './types'

const options: {key: keyof PanelSettingsState['features']; label: string; description: string}[] = [
    {key: 'views', label: 'بازدیدها', description: 'نمایش بخش ثبت و پیگیری بازدیدها در منوی پنل.'},
    {key: 'advertisements', label: 'دیوارکوب', description: 'نمایش بخش آگهی‌ها و دیوارکوب در منوی پنل.'},
    {key: 'landlordTenant', label: 'موجر و مستأجر', description: 'نمایش پرونده‌های موجر و مستأجر در منوی پنل.'},
    {key: 'chats', label: 'چت و تماس', description: 'نمایش گفت‌وگوها و تماس‌ها در منو و نوار بالا.'},
]

export function FeatureSettings({settings, setSettings}: {settings: PanelSettingsState; setSettings: SettingsSetter}) {
    return <SettingsSection title="نمایش بخش‌های پنل" description="بخش‌های غیرضروری را از منوی پنل پنهان کنید. این تنظیم برای همه سوپرادمین‌ها اعمال می‌شود.">
        <Stack spacing={1.5}>{options.map(option => <Stack key={option.key} direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{py: 1.5, borderBottom: '1px solid', borderColor: 'divider'}}><Stack><strong>{option.label}</strong><span style={{fontSize: 12, opacity: .7}}>{option.description}</span></Stack><FormControlLabel sx={{m:0}} label="نمایش" control={<Switch checked={settings.features[option.key]} onChange={(_, checked) => setSettings(current => ({...current, features: {...current.features, [option.key]: checked}}))}/>} /></Stack>)}</Stack>
    </SettingsSection>
}

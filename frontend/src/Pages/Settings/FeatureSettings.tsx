import {FormControlLabel, Stack, Switch} from '@mui/material'
import {SettingsSection} from './SettingsSection'
import type {PanelSettingsState, SettingsSetter} from './types'

import options from './featureOptions.json'

export function FeatureSettings({settings, setSettings}: {settings: PanelSettingsState; setSettings: SettingsSetter}) {
    return <SettingsSection title="نمایش بخش‌های پنل" description="بخش‌های غیرضروری را از منوی پنل پنهان کنید. این تنظیم برای همه نقش‌ها اعمال می‌شود؛ مجوزهای هر نقش حفظ می‌شوند و تنظیمات همیشه در دسترس است.">
        <Stack spacing={1.5}>{options.map(option => <Stack key={option.key} direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{py: 1.5, borderBottom: '1px solid', borderColor: 'divider'}}><Stack><strong>{option.label}</strong><span style={{fontSize: 12, opacity: .7}}>{`نمایش ${option.label} در سایدبار پنل.`}</span></Stack><FormControlLabel sx={{m:0}} label="نمایش" control={<Switch checked={settings.features[option.key]} onChange={(_, checked) => setSettings(current => ({...current, features: {...current.features, [option.key]: checked}}))}/>} /></Stack>)}</Stack>
    </SettingsSection>
}

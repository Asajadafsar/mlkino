import {Stack} from '@mui/material'
import {SettingsSection} from './SettingsSection'
import type {
    PanelSettingsState,
    SettingsSetter,
} from './types'
import {CustomTextField} from '../../Components/Input/CustomTextField'

interface ContactSettingsProps {
    settings: PanelSettingsState
    setSettings: SettingsSetter
}

type ContactField =
    | 'phone'
    | 'email'
    | 'address'
    | 'instagram'
    | 'telegram'
    | 'linkedin'
    | 'whatsapp'

export function ContactSettings({
    settings,
    setSettings,
}: ContactSettingsProps) {
    const handleChange = (
        field: ContactField,
        value: string,
    ) => {
        setSettings((prev) => ({
            ...prev,
            contact: {
                ...prev.contact,
                [field]: value,
            },
        }))
    }

    return (
        <SettingsSection
            title="اطلاعات تماس و شبکه‌های اجتماعی"
            description="راه‌های ارتباطی و لینک شبکه‌های اجتماعی سایت را مدیریت کنید."
        >
            <Stack spacing={2.5}>
                <CustomTextField
                    name="phone"
                    label="شماره تماس"
                    resource=""
                    value={settings.contact.phone}
                    change={(event) => {
                        handleChange(
                            'phone',
                            event.target.value,
                        )
                    }}
                    placeholder="02112345678"
                />

                <CustomTextField
                    name="email"
                    label="ایمیل"
                    resource=""
                    value={settings.contact.email}
                    change={(event) => {
                        handleChange(
                            'email',
                            event.target.value,
                        )
                    }}
                    placeholder="info@example.com"
                />

                <CustomTextField
                    name="address"
                    label="نشانی"
                    resource=""
                    value={settings.contact.address}
                    change={(event) => {
                        handleChange(
                            'address',
                            event.target.value,
                        )
                    }}
                    multiline
                    minRows={3}
                    placeholder="نشانی محل کسب‌وکار"
                />

                <CustomTextField
                    name="instagram"
                    label="لینک اینستاگرام"
                    resource=""
                    value={settings.contact.instagram}
                    change={(event) => {
                        handleChange(
                            'instagram',
                            event.target.value,
                        )
                    }}
                    placeholder="https://instagram.com/your-page"
                />

                <CustomTextField
                    name="telegram"
                    label="لینک تلگرام"
                    resource=""
                    value={settings.contact.telegram}
                    change={(event) => {
                        handleChange(
                            'telegram',
                            event.target.value,
                        )
                    }}
                    placeholder="https://t.me/your-page"
                />

                <CustomTextField
                    name="linkedin"
                    label="لینک لینکدین"
                    resource=""
                    value={settings.contact.linkedin}
                    change={(event) => {
                        handleChange(
                            'linkedin',
                            event.target.value,
                        )
                    }}
                    placeholder="https://linkedin.com/company/your-page"
                />

                <CustomTextField
                    name="whatsapp"
                    label="لینک واتساپ"
                    resource=""
                    value={settings.contact.whatsapp}
                    change={(event) => {
                        handleChange(
                            'whatsapp',
                            event.target.value,
                        )
                    }}
                    placeholder="https://wa.me/989121234567"
                />
            </Stack>
        </SettingsSection>
    )
}

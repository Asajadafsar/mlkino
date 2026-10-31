import type { Dispatch, SetStateAction } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface PanelSettingsState {
    general: {
        panelName: string
        shortName: string
        description: string
        language: string
        timezone: string
        dateFormat: string
        maintenanceMode: boolean
    }
    branding: {
        logo: string
        mobileLogo: string
        favicon: string
    }
    theme: {
        mode: ThemeMode
        primary: string
        secondary: string
        success: string
        warning: string
        error: string
        background: string
        text: string
    }
    seo: {
        title: string
        description: string
        keywords: string
        ogImage: string
        robots: string
    }

    contact: {
        phone: string
        email: string
        address: string
        instagram: string
        telegram: string
        linkedin: string
        whatsapp: string
    }
}

export type SettingsSetter = Dispatch<SetStateAction<PanelSettingsState>>

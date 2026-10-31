import type {PanelSettingsState} from './types'

export const SETTINGS_DEFAULTS: PanelSettingsState = {
    general: {
        panelName: 'ملکینو',
        shortName: 'ملکینو',
        description: 'سیستم مدیریت و کنترل پنل',
        language: 'fa-IR',
        timezone: 'Asia/Tehran',
        dateFormat: 'YYYY/MM/DD',
        maintenanceMode: false,
    },

    branding: {
        logo: '',
        mobileLogo: '',
        favicon: '',
    },

    theme: {
        mode: 'light',
        primary: '#246BFD',
        secondary: '#FAAE3A',
        success: '#2E7D32',
        warning: '#ED6C02',
        error: '#B3261E',
        background: '#F5F7FB',
        text: '#1E1E1E',
    },

    seo: {
        title: 'پنل مدیریت',
        description: 'پنل مدیریت سیستم',
        keywords: 'admin, dashboard, panel',
        ogImage: '',
        robots: 'index, follow',
    },
    contact: {
        phone: '',
        email: '',
        address: '',
        instagram: '',
        telegram: '',
        linkedin: '',
        whatsapp: '',
    },
}


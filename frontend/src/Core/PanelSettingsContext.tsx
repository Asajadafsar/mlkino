import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {createTheme, ThemeProvider, useMediaQuery} from '@mui/material'
import api from './Request'
import type {PanelSettingsState} from '../Pages/Settings/types'
import {SETTINGS_DEFAULTS} from '../Pages/Settings/defaults'
import {AppTheme} from '../Theme'

const Context = createContext({settings: SETTINGS_DEFAULTS, loading: false, error: '', save: async (_settings: PanelSettingsState) => {}})
export const usePanelSettings = () => useContext(Context)

export function PanelSettingsProvider({children}: {children: React.ReactNode}) {
    const [settings, setSettings] = useState(SETTINGS_DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const dark = useMediaQuery('(prefers-color-scheme: dark)')
    useEffect(() => {
        let active = true
        api.get('settings/').then(response => {if (active) setSettings(response.data.data)}).catch(error => {if (active) setError(error.message || 'دریافت تنظیمات انجام نشد')}).finally(() => {if (active) setLoading(false)})
        return () => {active = false}
    }, [])
    useEffect(() => {
        document.documentElement.lang = settings.general.language || 'fa'
        document.title = settings.seo.title || settings.general.panelName
        const meta = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`)
            if (!element) {element = document.createElement('meta'); element.setAttribute('name', name); document.head.appendChild(element)}
            element.setAttribute('content', content)
        }
        meta('description', settings.seo.description)
        meta('keywords', settings.seo.keywords)
        meta('robots', settings.seo.robots)
        let og = document.querySelector('meta[property="og:image"]')
        if (!og) {og=document.createElement('meta');og.setAttribute('property','og:image');document.head.appendChild(og)}
        og.setAttribute('content',settings.seo.ogImage)
        window.localStorage.setItem('mlkino:date-settings',JSON.stringify({timezone:settings.general.timezone,dateFormat:settings.general.dateFormat}))
        if (settings.branding.favicon) {
            let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
            if (!icon) {icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon)}
            icon.href = settings.branding.favicon
        }
    }, [settings])
    const theme = useMemo(() => {
        const mode = settings.theme.mode === 'system' ? (dark ? 'dark' : 'light') : settings.theme.mode
        return createTheme(AppTheme, {palette: {mode, primary: {main: settings.theme.primary}, secondary: {main: settings.theme.secondary},
            success: {main: settings.theme.success}, warning: {main: settings.theme.warning}, error: {main: settings.theme.error},
            background: {default: mode === 'dark' ? '#111827' : settings.theme.background, paper: mode === 'dark' ? '#1e293b' : '#ffffff', main: mode === 'dark' ? '#111827' : settings.theme.background},
            text: {primary: mode === 'dark' ? '#f1f5f9' : settings.theme.text, secondary: mode === 'dark' ? '#a8b6c8' : '#7b8498'}, divider: mode === 'dark' ? '#334155' : '#e7ecf4'}})
    }, [settings.theme, dark])
    const save = async (value: PanelSettingsState) => {
        const response = await api.patch('settings/', value)
        setSettings(response.data.data)
        setError('')
    }
    return <Context.Provider value={{settings, loading, error, save}}><ThemeProvider theme={theme}>{children}</ThemeProvider></Context.Provider>
}

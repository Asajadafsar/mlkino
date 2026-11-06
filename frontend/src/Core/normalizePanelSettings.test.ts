import {normalizePanelSettings} from './normalizePanelSettings'
import {SETTINGS_DEFAULTS} from '../Pages/Settings/defaults'
test('partial and malformed appearance cannot remove defaults or switch panel language',()=>{
 const settings=normalizePanelSettings({theme:{primary:'#123456',text:undefined},general:{language:'en',timezone:'not-a-zone'},seo:null,branding:{logo:'/logo.webp'},features:{chats:false}})
 expect(settings.general.language).toBe('fa-IR');expect(settings.general.timezone).toBe('Asia/Tehran');expect(settings.theme.primary).toBe('#123456');expect(settings.theme.text).toBe(SETTINGS_DEFAULTS.theme.text);expect(settings.seo.title).toBe(SETTINGS_DEFAULTS.seo.title);expect(settings.branding.logo).toBe('/logo.webp');expect(settings.branding.favicon).toBe('');expect(settings.features.chats).toBe(false)
})
test('invalid color and null appearance use renderable defaults',()=>{expect(normalizePanelSettings(null)).toEqual(SETTINGS_DEFAULTS);expect(normalizePanelSettings({theme:{primary:'undefined',mode:'invalid'}}).theme.primary).toBe(SETTINGS_DEFAULTS.theme.primary)})

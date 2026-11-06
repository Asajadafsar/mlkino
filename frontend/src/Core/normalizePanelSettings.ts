import {SETTINGS_DEFAULTS} from '../Pages/Settings/defaults'
import type {PanelSettingsState} from '../Pages/Settings/types'
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
/** Appearance responses may be partial. Never replace a complete group with null. */
export function normalizePanelSettings(value:unknown):PanelSettingsState {
 const incoming=object(value)?value:{}
 const merged:any={}
 for(const [group,defaults] of Object.entries(SETTINGS_DEFAULTS)){
  const source=object(incoming[group])?incoming[group] as Record<string,unknown>:{}
  merged[group]={...defaults}
  for(const [key,fallback] of Object.entries(defaults))if(typeof source[key]===typeof fallback)merged[group][key]=source[key]
  if(group==='features'||group==='fields')for(const [key,entry] of Object.entries(source))if(typeof entry==='boolean')merged[group][key]=entry
 }
 merged.general.language='fa-IR';merged.general.dateFormat='YYYY/MM/DD'
 try{new Intl.DateTimeFormat('fa-IR',{timeZone:merged.general.timezone}).format()}catch{merged.general.timezone='Asia/Tehran'}
 if(!['light','dark','system'].includes(merged.theme.mode))merged.theme.mode='light'
 for(const key of ['primary','secondary','success','warning','error','background','text'])if(!/^#[0-9a-f]{6}$/i.test(merged.theme[key]))merged.theme[key]=(SETTINGS_DEFAULTS.theme as any)[key]
 return merged
}

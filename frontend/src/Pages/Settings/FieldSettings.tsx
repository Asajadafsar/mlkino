import {useState} from 'react'
import {Box,Chip,FormControlLabel,Stack,Switch,Typography,TextField,MenuItem} from '@mui/material'
import {SettingsSection} from './SettingsSection'
import type {PanelSettingsState,SettingsSetter} from './types'
import options from './fieldOptions.json'
const groups:Record<string,string>={'file.sale':'فایل فروش','file.rent':'فایل رهن و اجاره','request.sale':'درخواست خرید','request.rent':'درخواست رهن و اجاره',agency:'دفتر املاکی',user:'اطلاعات کاربران'}
export function FieldSettings({settings,setSettings}:{settings:PanelSettingsState;setSettings:SettingsSetter}) {
 const [scope,setScope]=useState('file.rent')
 const fields=options.filter(x=>x.scope===scope.split('.')[0]&&(!scope.endsWith('.sale')||!['monthlyCharge','mortgageTerms','occupancyStatus'].includes(x.key)))
 return <SettingsSection title="فیلدهای فرم‌ها" description="برای فایل فروش، فایل اجاره، درخواست خرید و درخواست اجاره تنظیم مستقل ثبت کنید. اطلاعات قبلی با پنهان‌کردن فیلد حذف نمی‌شود. شارژ ماهانه فقط در اجاره کاربرد دارد.">
 <Stack gap={2}><TextField select label="فرم موردنظر" value={scope} onChange={e=>setScope(e.target.value)}>{Object.entries(groups).map(([key,title])=><MenuItem value={key} key={key}>{title}</MenuItem>)}</TextField><Stack direction="row" gap={1}><Typography fontWeight={700}>{groups[scope]}</Typography><Chip size="small" label={`${fields.length} فیلد`}/></Stack><Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'},gap:1}}>{fields.map(option=>{const key=`${scope}.${option.key}`;return <FormControlLabel key={key} sx={{m:0,p:1,border:'1px solid',borderColor:'divider',borderRadius:2}} label={option.label} control={<Switch checked={(settings.fields[key]??settings.fields[`${option.scope}.${option.key}`])!==false} onChange={(_,checked)=>setSettings(prev=>({...prev,fields:{...prev.fields,[key]:checked}}))}/>}/>})}</Box></Stack>
 </SettingsSection>
}

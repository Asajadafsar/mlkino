import {useState} from 'react'
import {Alert,Box,Button,Chip,Dialog,DialogActions,DialogContent,DialogTitle,Paper,Stack,Typography} from '@mui/material'
import {CustomTextField,GridProducer} from '../shared'
import type {RecordMode,StepProps} from '../types'
import api from '../../../Core/Request'

type Existing={id:number;name:string;phone:string;national_code?:string;property_records?:Array<{id:number;kind:string;title:string;contractType?:string;city?:string;publication_state?:string}>}
const digits=(value:string)=>String(value||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/\D/g,'')

export function OwnerStep({property,setProperty,resource,mode='file'}:StepProps&{mode?:RecordMode}){
 const request=mode==='request',rent=property.contractType==='رهن و اجاره',prefix=request?'customer':'owner'
 const title=request?(rent?'مستأجر':'خریدار'):(rent?'موجر':'مالک')
 const [checking,setChecking]=useState(false),[error,setError]=useState(''),[existing,setExisting]=useState<Existing|null>(null)
 const field=(suffix:string)=>(prefix+suffix) as keyof typeof property
 const lookup=async()=>{const national=digits(String(property[field('NationalId')]||''));if(national.length!==10)return;setChecking(true);setError('');try{const response=await api.get('workflows/contacts/',{params:{national_code:national}});const rows=response.data.data?.results||[];if(rows[0])setExisting(rows[0])}catch(reason:any){setError(reason.response?.data?.message||'بررسی سوابق مخاطب انجام نشد.')}finally{setChecking(false)}}
 const useContact=()=>{if(!existing)return;setProperty(old=>({...old,[field('Name')]:existing.name,[field('Phone')]:existing.phone,[field('NationalId')]:existing.national_code||old[field('NationalId')],partyContactId:existing.id}));setExisting(null)}
 return <Stack spacing={2}>
  <Alert severity="info">کد ملی معیار تشخیص پرونده تکراری است. اگر این {title} قبلاً ثبت شده باشد، فایل‌ها یا درخواست‌های قبلی او قبل از ذخیره نمایش داده می‌شود.</Alert>
  {error&&<Alert severity="warning">{error}</Alert>}
  <GridProducer sx={{marginBottom:'16px'}} data={[
   <CustomTextField key="name" name={field('Name') as string} setData={setProperty} resource={resource} label={`نام و نام خانوادگی ${title}`} defaultValue={property[field('Name')] as any}/>,
   <CustomTextField key="phone" name={field('Phone') as string} setData={setProperty} resource={resource} label="شماره موبایل" defaultValue={property[field('Phone')] as any} inputProps={{inputMode:'tel'}}/>,
   <CustomTextField key="phone2" name={field('Phone2') as string} setData={setProperty} resource={resource} label="تلفن دوم" defaultValue={property[field('Phone2')] as any} inputProps={{inputMode:'tel'}}/>,
   <CustomTextField key="job" name={field('Job') as string} setData={setProperty} resource={resource} label={`شغل ${title}`} defaultValue={property[field('Job')] as any}/>,
   <CustomTextField key="national" name={field('NationalId') as string} setData={setProperty} resource={resource} label="کد ملی" defaultValue={property[field('NationalId')] as any} disabled={checking} onBlur={lookup} inputProps={{inputMode:'numeric',maxLength:10}} helperText={checking?'در حال بررسی سوابق…':'پس از ورود ۱۰ رقم، سوابق بررسی می‌شود.'}/>,
  ]}/>
  <Dialog open={Boolean(existing)} onClose={()=>setExisting(null)} fullWidth maxWidth="sm"><DialogTitle>{title} قبلاً در این دفتر ثبت شده است</DialogTitle><DialogContent><Typography color="text.secondary" mb={2}>می‌توانید همین مخاطب را به پرونده جدید متصل کنید یا پس از بررسی سوابق، ثبت را ادامه دهید؛ مخاطب تکراری ساخته نمی‌شود.</Typography><Paper variant="outlined" sx={{p:2,borderRadius:3}}><Typography fontWeight={900}>{existing?.name}</Typography><Typography>{existing?.phone}</Typography><Stack gap={1} mt={2}>{existing?.property_records?.length?existing.property_records.map(row=><Box key={row.id} sx={{p:1.25,borderRadius:2,bgcolor:'#f5f8ff'}}><Stack direction="row" justifyContent="space-between"><Typography fontWeight={800}>{row.title}</Typography><Chip size="small" label={row.kind==='file'?'فایل':'درخواست'}/></Stack><Typography variant="caption" color="text.secondary">{[row.contractType,row.city,`#${row.id}`].filter(Boolean).join(' · ')}</Typography></Box>):<Typography color="text.secondary">پرونده قبلی فعالی برای این مخاطب ثبت نشده است.</Typography>}</Stack></Paper></DialogContent><DialogActions><Button onClick={()=>setExisting(null)}>ثبت پرونده جدید</Button><Button variant="contained" onClick={useContact}>اتصال به همین {title}</Button></DialogActions></Dialog>
 </Stack>
}

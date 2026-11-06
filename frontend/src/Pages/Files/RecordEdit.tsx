import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {Alert,Box,Button,CircularProgress,Paper,Stack,Typography} from '@mui/material'
import {DataProvider} from '../../Core/DataProvider'
import {EditPage} from '../../Components/Table/EditPage'
import {PropertyRecordForm,PropertyType} from '../../Components/PropertyRecordForm'
import {recordPayload} from '../../Components/PropertyRecordForm/payload'
import {PropertyActions} from '../Workflows/PropertyActions'
import {persianNumber} from '../Workflows/workflowClient'
export function RecordEdit({mode}:{mode:'file'|'request'}) {
 const {id}=useParams();const resource=mode==='file'?'files':'requests'
 const [initial,setInitial]=useState<PropertyType|null>(null),[value,setValue]=useState<PropertyType|null>(null),[error,setError]=useState(''),[readOnly,setReadOnly]=useState(false)
 useEffect(()=>{let active=true;setError('');setInitial(null);setValue(null);setReadOnly(false);const load=async()=>{try{let response;try{response=await DataProvider.get<PropertyType>(`${resource}/${id}/`)}catch(e:any){if(e.response?.status!==404)throw e;response=await DataProvider.get<PropertyType>(`public/catalog/${id}/`);if(active)setReadOnly(true)}if(active){setInitial(response.data);setValue(response.data)}}catch(e:any){if(active)setError(e.message||'دریافت پرونده انجام نشد.')}};void load();return()=>{active=false}},[resource,id])
 if(error)return <Alert severity="error" action={<Button component={Link} to={'/'+resource}>بازگشت به فهرست</Button>}>{error}</Alert>
 if(!value||!initial)return <Stack alignItems="center" p={6}><CircularProgress aria-label="دریافت جزئیات پرونده"/></Stack>
 if(readOnly)return <Stack gap={2}>{mode==='file'?<PropertyActions property={value}/>:<Button component={Link} to={'/offers?request='+id} variant="contained">پیشنهاد ملک برای این درخواست</Button>}<Paper sx={{p:{xs:2,md:4},borderRadius:3}}><Typography component="h1" variant="h4" fontWeight={900}>{(value as any).title||[value.propertyType,value.contractType,value.city].filter(Boolean).join(' · ')}</Typography><Typography color="text.secondary" sx={{my:2}}>{[value.province,value.city,value.district,Array.isArray(value.neighborhood)?value.neighborhood.join('، '):value.neighborhood].filter(Boolean).join('، ')}</Typography><Typography fontWeight={800}>متراژ: {persianNumber(value.area)} مترمربع · قیمت: {persianNumber(value.totalPrice||value.mortgagePrice)} تومان</Typography><Stack direction="row" gap={1.5} flexWrap="wrap" sx={{my:3}}>{(value.images||[]).filter(x=>typeof x==='string').map((image,index)=><Box key={index} component="img" src={image as string} alt="تصویر ملک" loading="lazy" sx={{width:{xs:'100%',sm:240},aspectRatio:'4/3',objectFit:'cover',borderRadius:2}}/>)}</Stack><Typography sx={{whiteSpace:'pre-wrap'}}>{value.description}</Typography>{(value as any).expert?.work_phone&&<Button component="a" href={'tel:'+(value as any).expert.work_phone}>تماس با کارشناس</Button>}</Paper></Stack>
 return <>{mode==='file'&&<PropertyActions property={value} canManage={(value as any).can_manage!==false}/>}<EditPage resource={resource} title={mode==='file'?'جزئیات فایل':'جزئیات درخواست'} formDetails={value} initialData={initial} hasChange={false} buildRequestData={recordPayload}><PropertyRecordForm editMode mode={mode} property={value} setProperty={setValue as any} resource={resource}/></EditPage></>
}

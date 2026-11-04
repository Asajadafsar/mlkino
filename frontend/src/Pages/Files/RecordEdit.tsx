import {useEffect,useState} from 'react'
import {useParams} from 'react-router-dom'
import {Alert,CircularProgress} from '@mui/material'
import {DataProvider} from '../../Core/DataProvider'
import {EditPage} from '../../Components/Table/EditPage'
import {PropertyRecordForm,PropertyType} from '../../Components/PropertyRecordForm'
import {recordPayload} from '../../Components/PropertyRecordForm/payload'
export function RecordEdit({mode}:{mode:'file'|'request'}) {
 const {id}=useParams();const resource=mode==='file'?'files':'requests'
 const [initial,setInitial]=useState<PropertyType|null>(null),[value,setValue]=useState<PropertyType|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;DataProvider.get<PropertyType>(`${resource}/${id}/`).then(response=>{if(active){setInitial(response.data);setValue(response.data)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[resource,id])
 if(error)return <Alert severity="error">{error}</Alert>
 if(!value||!initial)return <CircularProgress/>
 return <EditPage resource={resource} title={mode==='file'?'جزئیات فایل':'جزئیات درخواست'} formDetails={value} initialData={initial} hasChange={false} buildRequestData={recordPayload}><PropertyRecordForm editMode mode={mode} property={value} setProperty={setValue as any} resource={resource}/></EditPage>
}

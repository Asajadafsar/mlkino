import {useEffect,useState} from 'react'
import {useParams} from 'react-router-dom'
import {Alert,CircularProgress,Stack} from '@mui/material'
import {DataProvider} from '../../Core/DataProvider'
import {EstateActivityList,ActivityRow} from './EstateActivityList'
export function ActivityDetail({kind}:{kind:'contracts'|'follow-ups'}){const{id}=useParams(),[row,setRow]=useState<ActivityRow|null>(null),[error,setError]=useState('');useEffect(()=>{let active=true;DataProvider.get<ActivityRow>(`${kind}/${id}/`).then(r=>{if(active)setRow(r.data)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[kind,id]);if(error)return <Alert severity="error">{error}</Alert>;if(!row)return <Stack alignItems="center" p={5}><CircularProgress aria-label="دریافت پرونده"/></Stack>;return <EstateActivityList kind={kind} rows={[row]} onSave={async draft=>{const saved=await DataProvider.patch<ActivityRow>(`${kind}/${id}/`,{data:draft});setRow(saved.data);return saved.data}}/>}

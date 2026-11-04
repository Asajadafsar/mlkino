import {useEffect,useState} from 'react'
import {useParams} from 'react-router-dom'
import {Alert,CircularProgress} from '@mui/material'
import {DataProvider} from '../../Core/DataProvider'
import {EditPage} from '../Table/EditPage'
import {Contracts} from '../../Pages/Contracts/Contracts'
import {FollowUps} from '../../Pages/FollowUps/FollowUps'
export function EstateActivityEdit({kind}:{kind:'contracts'|'follow-ups'}) {
 const {id}=useParams();const [initial,setInitial]=useState<any>(null),[value,setValue]=useState<any>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;DataProvider.get(`${kind}/${id}/`).then(response=>{if(active){setInitial(response.data);setValue(response.data)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[id,kind])
 if(error)return <Alert severity="error">{error}</Alert>
 if(!value||!initial)return <CircularProgress/>
 return <EditPage resource={kind} title={kind==='contracts'?'جزئیات قرارداد':'جزئیات پیگیری'} formDetails={value} initialData={initial}>{kind==='contracts'?<Contracts contracts={value} setContracts={setValue} resource={kind}/>:<FollowUps followUps={value} setFollowUps={setValue} resource={kind}/>}</EditPage>
}

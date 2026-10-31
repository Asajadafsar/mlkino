import {useEffect,useState} from 'react'
import {useParams,useNavigate} from 'react-router-dom'
import {Alert,CircularProgress,Paper,Stack} from '@mui/material'
import {DataProvider} from '../../../Core/DataProvider'
import {PageHero} from '../../../Components/Workspace/PageHero'
import {ReminderEditor} from '../ReminderEditor'
import type {ReminderType} from '../Reminder'
export function ReminderEdit(){const {id}=useParams(),navigate=useNavigate(),[row,setRow]=useState<ReminderType|null>(null),[error,setError]=useState('');useEffect(()=>{let active=true;DataProvider.get<ReminderType>(`reminders/${id}/`).then(r=>{if(active)setRow(r.data)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[id]);if(error)return <Alert severity="error">{error}</Alert>;if(!row)return <CircularProgress/>;return <Stack spacing={2}><PageHero title="ویرایش یادآوری من" description="این یادداشت فقط متعلق به شماست." illustration="/assets/reminders-3d.png"/><Paper variant="outlined" sx={{p:3,borderRadius:4}}><ReminderEditor initial={row} onSaved={()=>navigate('/reminders')}/></Paper></Stack>}

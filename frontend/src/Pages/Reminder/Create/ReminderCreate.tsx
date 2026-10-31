import {Paper,Stack} from '@mui/material'
import {useNavigate} from 'react-router-dom'
import {PageHero} from '../../../Components/Workspace/PageHero'
import {ReminderEditor} from '../ReminderEditor'
export function ReminderCreate(_props:any){const navigate=useNavigate();return <Stack spacing={2}><PageHero title="یادآوری شخصی جدید" description="یادداشتی فقط برای خودتان بنویسید." illustration="/assets/reminders-3d.png"/><Paper variant="outlined" sx={{p:3,borderRadius:4}}><ReminderEditor onSaved={()=>navigate('/reminders')}/></Paper></Stack>}

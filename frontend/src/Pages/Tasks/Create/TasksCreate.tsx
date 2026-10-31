import {Paper, Stack} from '@mui/material'
import {useNavigate} from 'react-router-dom'
import {PageHero} from '../../../Components/Workspace/PageHero'
import {TaskComposer} from '../TaskComposer'
export function TasksCreate({onSuccess}: {data?:any;setData?:any;onSuccess?:()=>void|Promise<void>}) {
 const navigate=useNavigate()
 return <Stack><PageHero title="ثبت وظیفه جدید" description="عنوان، تاریخ و دریافت‌کنندگان کار را مشخص کنید." illustration="/assets/tasks-3d.png"/><Paper variant="outlined" sx={{p:{xs:2,md:4},borderRadius:4}}><TaskComposer onSaved={()=>{if(onSuccess)onSuccess();else navigate('/tasks')}}/></Paper></Stack>
}

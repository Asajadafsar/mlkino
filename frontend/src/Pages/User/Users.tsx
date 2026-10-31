import {Stack, Typography} from '@mui/material'
import type {Dispatch,SetStateAction} from 'react'
import type {CommonUserType} from './UserTypes'
import {ProfileDetailsForm,ProfileIdentityHero} from '../Profile/ProfileDetailsForm'
import {ImpersonateButton} from '../../Components/Impersonation/ImpersonateButton'
export interface UsersType extends CommonUserType {}
export function Users<T extends UsersType>({users,setUsers,resource,editMode=true}:{users:T;setUsers:Dispatch<SetStateAction<T>>;resource:string;editMode?:boolean}){
 const change=(value:T)=>setUsers(value)
 return <Stack spacing={3}>
  <ProfileIdentityHero value={users} onChange={change} title={editMode?'پرونده کاربری':'ایجاد حساب جدید'} description="اطلاعات شخصی و مشخصات حساب را با دقت تکمیل کنید."/>
  {editMode&&<ImpersonateButton target={users}/>}
  <Typography fontWeight={700} fontSize={18}>اطلاعات شخصی</Typography>
  <ProfileDetailsForm value={users} onChange={change} mode={editMode?'manage':'create'}/>
 </Stack>
}

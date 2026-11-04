import {useContext} from 'react'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {useCallback,useEffect,useRef,useState} from 'react'
import {DataProvider} from '../../Core/DataProvider'
import type {ActivityRow} from './EstateActivityList'
export function useEstateActivities(kind:'follow-ups'|'contracts') {
 const {user}=useContext(CurrentUserContext)
 const canWrite=['superadmin','agency','expert'].includes(user.role)
 const [rows,setRows]=useState<ActivityRow[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const version=useRef(0)
 const reload=useCallback(async()=>{const id=++version.current;setLoading(true);setError('');try{const response=await DataProvider.get<{results:ActivityRow[]}>(`${kind}/`);if(id===version.current)setRows(response.data.results)}catch(e:any){if(id===version.current)setError(e.message||'دریافت اطلاعات انجام نشد.')}finally{if(id===version.current)setLoading(false)}},[kind])
 useEffect(()=>{reload();return()=>{version.current++}},[reload])
 const save=async(row:Partial<ActivityRow>)=>{
  const {id,created_at,updated_at,...data}=row as any
  const response=id?await DataProvider.patch<ActivityRow>(`${kind}/${id}/`,{data}):await DataProvider.post<ActivityRow>(`${kind}/`,{data})
  version.current++;setLoading(false)
  const saved=response.data;setRows(prev=>prev.some(r=>r.id===saved.id)?prev.map(r=>r.id===saved.id?saved:r):[saved,...prev]);setError('')
 }
 return {rows,loading,error,reload,save,canWrite}
}

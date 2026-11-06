"use client";
import {useState} from 'react';
import {useLandingSession} from '../../Core/Session';
import {PANEL_ORIGIN} from '../../Core/panel';
import {publicApiOrigin} from '../../Core/catalog';
export function ContactButton({id,label='تماس'}:{id:number;label?:string}){const {user}=useLandingSession();const [busy,setBusy]=useState(false),[error,setError]=useState('');const login=()=>window.location.assign(PANEL_ORIGIN+'/login?next='+encodeURIComponent('/files/'+id));const call=async()=>{if(!user){login();return}setBusy(true);setError('');try{const response=await fetch(publicApiOrigin()+`/panel/workflows/properties/${id}/contact/`,{credentials:'include',cache:'no-store'});if(response.status===401){login();return}const result=await response.json();if(!response.ok)throw Error(result.message||'شماره تماس دریافت نشد.');window.location.href='tel:'+result.data.phone}catch(e){setError(e instanceof Error?e.message:'ارتباط برقرار نشد.')}finally{setBusy(false)}};return <span><button type="button" onClick={call} disabled={busy}>{busy?'دریافت شماره…':label}</button>{error&&<small role="alert">{error}</small>}</span>}

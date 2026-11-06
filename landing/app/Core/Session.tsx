"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
export type LandingUser={id:number;full_name:string;avatar:string|null;role_display:string;role?:string};
type Session={user:LandingUser|null;loading:boolean};
const SessionContext=createContext<Session>({user:null,loading:true});
export function apiOrigin(){
 const url=new URL(process.env.NEXT_PUBLIC_API_URL||(process.env.NODE_ENV==='development'?'http://localhost:8000':'https://api.mlkino.com'));
 if(typeof window!=='undefined'&&['localhost','127.0.0.1'].includes(url.hostname)&&['localhost','127.0.0.1'].includes(window.location.hostname))url.hostname=window.location.hostname;
 return url.origin;
}
export function LandingSessionProvider({children}:{children:ReactNode}){
 const [session,setSession]=useState<Session>({user:null,loading:true});
 const load=useCallback(async(signal:AbortSignal)=>{
  try{
   const origin=apiOrigin();
   const options:RequestInit={credentials:'include',cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])};
   let response=await fetch(origin+'/accounts/session/',options);
   if(response.status===401){
    const refresh=await fetch(origin+'/accounts/token/refresh/',{...options,method:'POST'});
    if(signal.aborted)return;
    if(refresh.status===401||refresh.status===403){setSession({user:null,loading:false});return}
    if(!refresh.ok)throw Error('refresh unavailable');
    response=await fetch(origin+'/accounts/session/',options);
   }
   if(signal.aborted)return;
   if(response.status===401||response.status===403){setSession({user:null,loading:false});return}
   if(!response.ok)throw Error('session unavailable');
   const data=await response.json();
   if(!signal.aborted)setSession({user:data.data,loading:false});
  }catch{if(!signal.aborted)setSession(previous=>({...previous,loading:false}))}
 },[]);
 useEffect(()=>{
  let controller:AbortController|null=null;
  const update=()=>{controller?.abort();controller=new AbortController();void load(controller.signal)};
  const visible=()=>{if(document.visibilityState==='visible')update()};
  update();window.addEventListener('focus',update);window.addEventListener('pageshow',update);document.addEventListener('visibilitychange',visible);
  return()=>{controller?.abort();window.removeEventListener('focus',update);window.removeEventListener('pageshow',update);document.removeEventListener('visibilitychange',visible)};
 },[load]);
 return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
export const useLandingSession=()=>useContext(SessionContext);

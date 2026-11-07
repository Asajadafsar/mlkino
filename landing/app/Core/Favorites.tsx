"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from 'react';
import {authenticatedFetch} from './authenticatedFetch';
import {useLandingSession} from './Session';
import type {PublicConfig} from './catalog';
import {usePublic} from '../Components/Catalog/usePublic';
type State={ids:Set<number>;loading:boolean;toggle:(id:number)=>Promise<void>};
const EMPTY=new Set<number>();
const Context=createContext<State>({ids:EMPTY,loading:true,toggle:async()=>{throw Error('حساب کاربری آماده نیست.')}});
export function LandingFavoritesProvider({children}:{children:ReactNode}){
 const {user}=useLandingSession(),{data:config,loading}=usePublic<PublicConfig>('config/');
 return <AccountFavorites key={user?.id||'guest'} userId={user?.id} enabled={!loading&&config?.features?.favorites!==false}>{children}</AccountFavorites>;
}
function AccountFavorites({children,userId,enabled}:{children:ReactNode;userId?:number;enabled:boolean}){
 const [ids,setIds]=useState<Set<number>>(EMPTY),[loading,setLoading]=useState(false);
 const reload=useCallback(async(signal:AbortSignal)=>{
  if(!userId||!enabled)return;setLoading(true);
  try{
   const r=await authenticatedFetch('/panel/workflows/favorites/?ids=true',{signal});
   if(r.ok&&!signal.aborted){const body=await r.json();if(!signal.aborted)setIds(new Set((body.data?.ids||body.data?.results?.map((x:{property_id:number})=>x.property_id)||[]).map(Number)))}
  }finally{if(!signal.aborted)setLoading(false)}
 },[userId,enabled]);
 useEffect(()=>{
  const controller=new AbortController(),listener=()=>void reload(controller.signal).catch(()=>{});
  const timer=setTimeout(listener,0);window.addEventListener('focus',listener);
  return()=>{clearTimeout(timer);controller.abort();window.removeEventListener('focus',listener)};
 },[reload]);
 const toggle=async(id:number)=>{
  if(!userId)throw Error('برای ذخیره ملک وارد حساب شوید.');if(!enabled)throw Error('علاقه‌مندی‌ها غیرفعال است.');
  const exists=ids.has(id),r=await authenticatedFetch('/panel/workflows/favorites/'+(exists?id+'/':''),{method:exists?'DELETE':'POST',headers:{'Content-Type':'application/json'},...(exists?{}:{body:JSON.stringify({property_id:id})})});
  if(!r.ok){const raw=await r.json().catch(()=>({}));throw Error(raw.message||'ذخیره علاقه‌مندی انجام نشد.')}
  setIds(current=>{const next=new Set(current);if(exists)next.delete(id);else next.add(id);return next});
 };
 return <Context.Provider value={{ids:enabled?ids:EMPTY,loading,toggle}}>{children}</Context.Provider>;
}
export const useLandingFavorites=()=>useContext(Context);

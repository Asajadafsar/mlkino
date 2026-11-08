"use client";
import dynamic from 'next/dynamic';
import {usePublic} from '../Catalog/usePublic';
import {useState} from 'react';
import type {PublicProperty} from '../../Core/catalog';
const PublicMap=dynamic(()=>import('../Catalog/PublicMap'),{ssr:false});
export default function MapPreview(){const {data,error,loading,retry}=usePublic<{results:PublicProperty[]}>('map/');const [layers,setLayers]=useState(['file','request','agency']);return <section style={{marginBlock:24,minWidth:0}}><div style={{display:'flex',flexWrap:'wrap',gap:18,padding:18,background:'#fff',borderRadius:18}}>{[['file','فایل‌های ملکی'],['request','درخواست‌ها'],['agency','دفترهای املاک']].map(([key,label])=><label key={key}><input type="checkbox" checked={layers.includes(key)} onChange={e=>setLayers(old=>e.target.checked?[...old,key]:old.filter(x=>x!==key))}/>{label}</label>)}</div>{loading?<p role="status">در حال دریافت اطلاعات نقشه…</p>:error?<p role="alert">{error}<button onClick={retry}>تلاش دوباره</button></p>:<PublicMap rows={(data?.results||[]).filter(row=>layers.includes(row.kind||'file'))}/>}</section>}

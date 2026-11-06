"use client";
import dynamic from 'next/dynamic';
import {usePublic} from '../Catalog/usePublic';
import type {CatalogPage} from '../../Core/catalog';
const PublicMap=dynamic(()=>import('../Catalog/PublicMap'),{ssr:false});
export default function MapPreview(){const {data,error,loading,retry}=usePublic<CatalogPage>('catalog/?kind=file');return <section>{loading?<p role="status">در حال دریافت املاک روی نقشه…</p>:error?<p role="alert">{error}<button onClick={retry}>تلاش دوباره</button></p>:<PublicMap rows={data?.results||[]}/>}</section>}

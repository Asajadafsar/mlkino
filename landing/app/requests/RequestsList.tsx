"use client";
import PublicCatalog from '../Components/Catalog/PublicCatalog';
export default function RequestsList({query=''}:{query?:string}){return <PublicCatalog kind="request" query={query}/>}

import {notFound} from 'next/navigation';
import PublicPropertyDetails from '../../Components/Catalog/PublicPropertyDetails';
export default async function PropertyPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^\d+$/.test(id)||Number(id)<1)notFound();return <PublicPropertyDetails id={Number(id)}/>}

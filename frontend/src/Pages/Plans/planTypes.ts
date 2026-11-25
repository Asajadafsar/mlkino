import {PlanDemoStore as DataProvider} from './planApi'
export type Capability={id:number;name:string;code:string;category:string;access_type:'toggle'|'limit';description:string;is_active:boolean;order:number}
export type Access={capability:number;enabled:boolean;limit:number|null}
export type Plan={id?:number;name:string;subtitle:string;description:string;icon:string;color:string;monthly_price:number|null;annual_price:number|null;is_active:boolean;recommended:boolean;order:number;accesses:Access[]}
export const emptyPlan:Plan={name:'',subtitle:'',description:'',icon:'diamond',color:'#0755ff',monthly_price:0,annual_price:0,is_active:true,recommended:false,order:0,accesses:[]}
export const price=(value:number|null)=>value===null?'سفارشی':value===0?'رایگان':value.toLocaleString('fa-IR')+' تومان'
export function planError(error:any):string{const data=error.response?.data;if(data?.message)return data.message;if(data){const first=Object.values(data)[0];if(typeof first==='string')return first;if(Array.isArray(first)&&typeof first[0]==='string')return first[0]}return error.message||'عملیات انجام نشد.'}
export async function capabilityCatalog(){let page=1,rows:Capability[]=[];while(true){const r=await DataProvider.get<{results:Capability[];total_results:number}>(`plan-capabilities/?page_size=100&page=${page}`);rows=rows.concat(r.data.results);if(rows.length>=r.data.total_results||!r.data.results.length)return rows;page++}}

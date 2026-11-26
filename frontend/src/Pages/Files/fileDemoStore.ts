import {demoFiles} from './fileDemoData'
import type {FileRecord} from './filePresentation'
const key='mlkino:file-design:v1'
export const FILE_DEMO_CHANGED='mlkino:file-demo-changed'
export type FileVisit={id:number;visitor_name:string;starts_at:string;status:string;notes?:string}
type Store={files:FileRecord[];favorites:number[];visits:Record<string,FileVisit[]>}
let memory:Store|undefined
function initial():Store{const files=demoFiles();return {files,favorites:[files[0].id,files[2].id],visits:{[files[0].id]:[{id:1,visitor_name:'متقاضی نمایشی',starts_at:'2026-11-22T10:00:00+03:30',status:'confirmed',notes:'بازدید نمونهٔ واحد'}]}}}
function read():Store{try{const value=localStorage.getItem(key);if(value){const parsed=JSON.parse(value);if(Array.isArray(parsed.files)&&Array.isArray(parsed.favorites)&&parsed.visits)return parsed}}catch{}return memory||initial()}
function validate(file:FileRecord){if(!file.title?.trim()||!file.city?.trim())throw new Error('عنوان و شهر فایل الزامی هستند.');for(const field of ['area','roomCount','totalFloor','floor','totalPrice','mortgagePrice','monthlyRent']){const value=file[field];if(value!==undefined&&(!Number.isFinite(Number(value))||(field!=='floor'&&Number(value)<0)))throw new Error('مقادیر عددی باید معتبر و نامنفی باشند.')}}
function write(value:Store){memory=value;try{localStorage.setItem(key,JSON.stringify(value))}catch{}window.dispatchEvent(new Event(FILE_DEMO_CHANGED))}
const normalize=(value:unknown)=>String(value??'').replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632))).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').trim().toLowerCase()
const number=(value:unknown)=>Number(normalize(value).replace(/,/g,''))
export const fileDemoStore={
 list(query:Record<string,string>){const all=read().files;let rows=all.filter(file=>{
 for(const field of ['propertyType','contractType','province','city','district','neighborhood','roomCount','buildYear','totalFloor','floor','landUse','status']){const wanted=normalize(query[field]);if(wanted&&normalize(file[field])!==wanted)return false}
 if(query.recordId&&file.id!==number(query.recordId))return false
 if(query.creatorRoles&&!query.creatorRoles.split('|').includes(file.creatorRole||''))return false
 if(query.search&&!normalize([file.title,file.id,file.propertyType,file.city,file.neighborhood,file.description].join(' ')).includes(normalize(query.search)))return false
 for(const prefix of ['area','price']){const value=prefix==='area'?file.area:file.contractType==='رهن و اجاره'?file.mortgagePrice:file.totalPrice;for(const suffix of ['From','To'])if(query[prefix+suffix]){if(value===undefined)return false;const bound=number(query[prefix+suffix]);if(suffix==='From'?Number(value)<bound:Number(value)>bound)return false}}
 return true
 });rows.sort((a,b)=>(new Date(a.created_at!).getTime()-new Date(b.created_at!).getTime())*(query.ordering==='created_at'?1:-1));const size=Number(query.page_size)||24,max=Math.max(1,Math.ceil(rows.length/size)),page=Math.min(max,Math.max(1,Number(query.page)||1));return {results:rows.slice((page-1)*size,page*size),total_results:rows.length,page,stats:{total:all.length,active:all.filter(f=>f.status==='فعال'&&!f.archived).length,pending:all.filter(f=>(f.status||'').includes('انتظار')).length,archived:all.filter(f=>f.archived).length}}},
 create(values:Partial<FileRecord>){const store=read(),id=Math.max(900000,...store.files.map(f=>f.id))+1;const file={...demoFiles()[0],...values,id,demo:true,created_at:new Date().toISOString(),updated_at:new Date().toISOString()} as FileRecord;validate(file);store.files.unshift(file);write(store);return file},
 get(id:number){const file=read().files.find(f=>f.id===id);if(!file)throw new Error('فایل نمونه پیدا نشد.');return file},
 update(id:number,patch:Partial<FileRecord>){const store=read(),index=store.files.findIndex(f=>f.id===id);if(index<0)throw new Error('فایل نمونه پیدا نشد.');const file={...store.files[index],...patch,id,demo:true,updated_at:new Date().toISOString()};validate(file);store.files[index]=file;write(store);return file},
 favorites(){return read().favorites},
 toggleFavorite(id:number){this.get(id);const store=read();store.favorites=store.favorites.includes(id)?store.favorites.filter(value=>value!==id):[...store.favorites,id];write(store)},
 visits(id:number){return read().visits[id]||[]},
 addVisit(id:number,visit:Omit<FileVisit,'id'|'status'>){this.get(id);const store=read(),rows=store.visits[id]||[];const value={...visit,id:Date.now(),status:'pending'};store.visits[id]=[value,...rows];write(store);return value},
 locations(level:string,values:Record<string,string>){const fields={province:'province',city:'city',district:'district',neighborhood:'neighborhood'};const field=fields[level]||level;return Array.from(new Set(read().files.filter(file=>(!values.province||file.province===values.province)&&(!['district','neighborhood'].includes(level)||!values.city||file.city===values.city)&&(level!=='neighborhood'||!values.district||file.district===values.district)).map(file=>String(file[field]||'')).filter(Boolean)))},
 reset(){memory=undefined;try{localStorage.removeItem(key)}catch{}window.dispatchEvent(new Event(FILE_DEMO_CHANGED))}
}

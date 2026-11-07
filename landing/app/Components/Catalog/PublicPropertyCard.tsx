"use client";
import Image from 'next/image';
import Link from 'next/link';
import {FavoriteButton} from './FavoriteButton';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import ApartmentRounded from '@mui/icons-material/ApartmentRounded';
import {useState} from 'react';
import {ContactButton} from './ContactButton';
import {PANEL_ORIGIN} from '../../Core/panel';
import {faDate,faNumber,propertyTitle,safeExternal,type PublicConfig,type PublicProperty} from '../../Core/catalog';
import {usePublic} from './usePublic';
import styles from './catalog.module.css';
import {CatalogVisitButton} from './CatalogVisitButton';
export default function PublicPropertyCard({row}:{row:PublicProperty}){const {data:config}=usePublic<PublicConfig>('config/');const image=row.images?.find(x=>!!safeExternal(x)||x.startsWith('/')&&!x.startsWith('//')&&!x.includes('\\')),[failed,setFailed]=useState(false);return <article className={styles.card}>
 <Link prefetch={false} className={styles.cover} href={'/property/'+row.id}>{image&&!failed?<picture><source srcSet={(row.image_variants?.[image]||[]).filter(v=>v.mime==='image/webp'&&safeExternal(v.url)).map(v=>`${v.url} ${v.width}w`).join(', ')||undefined} sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw"/><Image src={image} alt={propertyTitle(row)} fill sizes="(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw" loading="lazy" onError={()=>setFailed(true)}/></picture>:<span className={styles.noImage}><ApartmentRounded/><small>تصویر ثبت نشده</small></span>}{row.featured&&<span className={styles.featured}>ویژه ملکینو</span>}</Link>
 <div className={styles.cardBody}><Link prefetch={false} href={'/property/'+row.id}><h3>{propertyTitle(row)}</h3></Link><p className={styles.muted}>{[row.province,row.city,Array.isArray(row.neighborhood)?row.neighborhood.join('، '):row.neighborhood].filter(Boolean).join('، ')}</p><div className={styles.facts}><span>{faNumber(row.area??row.areaFrom)} متر{row.areaTo?' تا '+faNumber(row.areaTo):''}</span><span>{row.roomCount!=null?faNumber(row.roomCount)+' اتاق':row.propertyType}</span></div><strong className={styles.price}>{row.contractType==='رهن و اجاره'?`رهن ${faNumber(row.mortgagePrice)} · اجاره ${faNumber(row.monthlyRent)}`:row.totalPrice!=null?faNumber(row.totalPrice):row.totalPriceFrom!=null?faNumber(row.totalPriceFrom)+' تا '+faNumber(row.totalPriceTo):'قیمت ثبت نشده'}<small> تومان</small></strong><small className={styles.muted}>{row.office?.name||row.expert?.name||'فایل منتشرشده ملکینو'}</small>
 {row.created_at&&<time className={styles.muted} dateTime={row.created_at}>ثبت {faDate(row.created_at)}</time>}<div className={styles.actions}>{config?.features?.favorites!==false&&<FavoriteButton id={row.id} title={propertyTitle(row)}/>}{config?.features?.chats!==false&&<Link prefetch={false} href={PANEL_ORIGIN+'/chats?property='+row.id} aria-label={'چت درباره '+propertyTitle(row)}><ChatBubbleOutlineRounded/></Link>}<ContactButton id={row.id}/>{config?.features?.visits!==false&&<CatalogVisitButton propertyId={row.id}/>}</div></div>
 </article>}

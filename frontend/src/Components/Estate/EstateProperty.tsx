import {Alert,Box,Button,IconButton,Menu,MenuItem,Stack,Typography} from '@mui/material'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import SquareFootRoundedIcon from '@mui/icons-material/SquareFootRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded'
import {useState} from 'react'
import {useFavorites} from '../../Core/FavoritesContext'
import type {PropertyType} from '../PropertyRecordForm'
import {PropertyDetailDialog} from '../../Pages/Files/PropertyCard/PropertyDetailDialog'
import {useDerivedPropertyInfo} from '../../Pages/Files/PropertyCard/propertyCardUtils'
import {estateDate} from './estateFormat'
import {useNavigate} from 'react-router-dom'
import api from '../../Core/Request'
export function EstateProperty({item,mode,layout}:{item:Partial<PropertyType>;mode:'file'|'request';layout:'card'|'list'}) {
 const navigate=useNavigate();const [detail,setDetail]=useState(false),[anchor,setAnchor]=useState<HTMLElement|null>(null)
 const [pinned,setPinned]=useState(Boolean((item as any).pinned)),[pinBusy,setPinBusy]=useState(false)
 const togglePin=async()=>{if(!item.id||pinBusy)return;setPinBusy(true);const next=!pinned;setPinned(next);try{if(next)await api.post(`workflows/properties/${item.id}/pin/`,{});else await api.delete(`workflows/properties/${item.id}/pin/`)}catch{setPinned(!next)}finally{setPinBusy(false)}}
 const {ids,toggle,loading:favoriteLoading}=useFavorites(),favorite=ids.has(Number(item.id));const [favoriteBusy,setFavoriteBusy]=useState(false),[favoriteError,setFavoriteError]=useState('');const favoriteClick=async()=>{if(!item.id||favoriteBusy)return;setFavoriteBusy(true);setFavoriteError('');try{await toggle(Number(item.id))}catch(error:any){setFavoriteError(error.response?.data?.message||error.message||'ذخیره علاقه‌مندی انجام نشد.')}finally{setFavoriteBusy(false)}}
 const {location,priceMain,priceSecondary,areaText}=useDerivedPropertyInfo(item)
 const image=typeof item.images?.[0]==='string'?item.images[0]:null
 const status=mode==='request'?item.requestStatus||'در انتظار بررسی':item.status||'فعال'
 const tone=status.includes('انتظار')||status.includes('بررسی')?'orange':status==='فعال'||status.includes('تایید')?'green':status.includes('کنسل')||status.includes('غیرفعال')?'red':'blue'
 const menu=<><IconButton aria-label={`عملیات ${mode==='file'?'فایل':'درخواست'} ${item.id}`} className="estate-round-action" onClick={e=>setAnchor(e.currentTarget)}><MoreVertRoundedIcon fontSize="small"/></IconButton><Menu anchorEl={anchor} open={!!anchor} onClose={()=>setAnchor(null)}><MenuItem onClick={()=>{setAnchor(null);setDetail(true)}}>مشاهده جزئیات</MenuItem><MenuItem onClick={()=>navigate(`/${mode==='file'?'files':'requests'}/${item.id}`)}>ویرایش</MenuItem></Menu></>
 const statusChip=<span className={`estate-status estate-${tone}`}>● {status}</span>
 const heading=mode==='request'?`درخواست ${item.contractType==='رهن و اجاره'?'رهن و اجاره':'خرید'} ${item.propertyType||'ملک'}${location?' در '+(Array.isArray(item.neighborhood)?item.neighborhood.join('، '):item.neighborhood||location):''}`:item.propertyType||'ملک'
 const landing=(item as any).source==='landing'
 return <><Box className={layout==='list'?`estate-row estate-${tone}`:'estate-card'} sx={{borderInlineStart:`4px solid ${landing?'#22c55e':'#246bfd'}`}}>
 {layout==='list'?<>
 <Box onClick={()=>setDetail(true)} sx={{cursor:'pointer',flexShrink:0}}>{image?<img className="estate-row-thumb" src={image} alt={item.propertyType||'تصویر ملک'} loading="lazy" decoding="async"/>:<Box className="estate-row-thumb" sx={{display:'grid',placeItems:'center',color:'primary.main'}}><ApartmentRoundedIcon/></Box>}</Box>
 <Box className="estate-row-title" onClick={()=>setDetail(true)} sx={{cursor:'pointer'}}><Typography className="estate-title" sx={{fontSize:'14px!important'}}>{heading}</Typography><Typography className="estate-subtitle"><PersonOutlineRoundedIcon sx={{fontSize:14,verticalAlign:'middle'}}/> {item.requesterName||item.ownerName||location||`پرونده ${item.id}`}</Typography></Box>
 <Box className="estate-row-fact"><ApartmentRoundedIcon fontSize="small"/>{item.contractType}</Box><Box className="estate-row-fact"><BedOutlinedIcon fontSize="small"/>{item.roomCount!=null?`${Number(item.roomCount).toLocaleString('fa-IR')} خواب`:'تعداد اتاق مشخص نشده'}</Box><Box className="estate-row-fact"><SquareFootRoundedIcon fontSize="small"/>{areaText||'متراژ مشخص نشده'}</Box>
 <Box className="estate-row-status">{statusChip}<div className="estate-row-date">{estateDate((item as any).created_at)}</div></Box>{mode==='file'&&<IconButton aria-label={pinned?'برداشتن پین فایل':'پین فایل'} disabled={pinBusy} onClick={togglePin}>{pinned?<PushPinRoundedIcon color="primary"/>:<PushPinOutlinedIcon/>}</IconButton>}{menu}
 </>:<>
 <Box className="estate-card-cover"><Box onClick={()=>setDetail(true)} sx={{position:'absolute',inset:0,overflow:'hidden',cursor:'pointer',display:'grid',placeItems:'center',color:'#a3b6df','& img':{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}}>{image?<img src={image} alt={item.propertyType||'تصویر ملک'} loading="lazy" decoding="async"/>:<ApartmentRoundedIcon sx={{fontSize:52}}/>}</Box><Stack direction="row-reverse" justifyContent="space-between" sx={{position:'absolute',top:10,left:12,right:12,pointerEvents:'none','> *':{pointerEvents:'auto'}}}>{menu}<Stack direction="row">{mode==='file'&&<IconButton className="estate-round-action" aria-label={pinned?'برداشتن پین فایل':'پین فایل'} disabled={pinBusy} onClick={togglePin}>{pinned?<PushPinRoundedIcon color="primary" fontSize="small"/>:<PushPinOutlinedIcon fontSize="small"/>}</IconButton>}<IconButton className="estate-round-action" aria-label={favorite?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'} disabled={favoriteLoading||favoriteBusy} onClick={favoriteClick}>{favorite?<FavoriteRoundedIcon color="primary" fontSize="small"/>:<FavoriteBorderRoundedIcon fontSize="small"/>}</IconButton></Stack></Stack>{statusChip}<span style={{position:'absolute',bottom:10,right:12,padding:'3px 8px',borderRadius:10,background:landing?'#dcfce7':'#dbeafe',color:landing?'#15803d':'#1d4ed8',fontSize:10,fontWeight:800}}>{landing?'ثبت از لندینگ':'ثبت دستی'}</span></Box>
 <Stack direction="row" gap={1.3} className="estate-card-body" alignItems="center" onClick={()=>setDetail(true)} sx={{cursor:'pointer'}}><Box className="estate-icon-box"><ApartmentRoundedIcon/></Box><Box minWidth={0}><Typography className="estate-title">{heading}</Typography><Typography className="estate-subtitle" noWrap><PlaceRoundedIcon sx={{fontSize:13,verticalAlign:'middle'}}/> {location||'موقعیت ثبت نشده'}</Typography></Box></Stack>
 <Box className="estate-card-footer"><span className="estate-meta"><SquareFootRoundedIcon/>{areaText||'—'}</span><Box textAlign="left"><div className="estate-price">{priceMain||'توافقی'} {priceMain&&<small style={{fontSize:10,color:'#627197'}}>تومان</small>}</div>{priceSecondary&&<Typography fontSize={10} color="text.secondary">{priceSecondary}</Typography>}</Box></Box>
 </>}
 </Box>{favoriteError&&<Alert severity="error">{favoriteError}</Alert>}<PropertyDetailDialog open={detail} onClose={()=>setDetail(false)} item={item} mode={mode}/></>
}

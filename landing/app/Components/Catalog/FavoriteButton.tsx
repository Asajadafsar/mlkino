"use client";
import {useState} from 'react';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import {useLandingFavorites} from '../../Core/Favorites';
import {useLandingSession} from '../../Core/Session';
import {PANEL_ORIGIN} from '../../Core/panel';
export function FavoriteButton({id,title,showLabel=false}:{id:number;title:string;showLabel?:boolean}){
 const {user,loading:sessionLoading}=useLandingSession(),{ids,loading,toggle}=useLandingFavorites(),[busy,setBusy]=useState(false),[error,setError]=useState(''),saved=ids.has(id);
 const act=async()=>{if(!user){window.location.assign(PANEL_ORIGIN+'/login?next='+encodeURIComponent('/files/'+id));return}setBusy(true);setError('');try{await toggle(id)}catch(e){setError(e instanceof Error?e.message:'ذخیره نشد.')}finally{setBusy(false)}};
 return <span><button type="button" aria-label={(saved?'حذف از علاقه‌مندی ':'علاقه‌مندی ')+title} aria-pressed={saved} disabled={busy||loading||sessionLoading} onClick={act}>{saved?<FavoriteRounded/>:<FavoriteBorderRounded/>}{showLabel&&(saved?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها')}</button>{error&&<small role="alert">{error}</small>}</span>;
}

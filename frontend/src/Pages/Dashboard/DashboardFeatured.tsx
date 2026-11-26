import {useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {IconButton} from '@mui/material'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import WorkspacePremiumOutlined from '@mui/icons-material/WorkspacePremiumOutlined'
import BedOutlined from '@mui/icons-material/BedOutlined'
import SquareFoot from '@mui/icons-material/SquareFoot'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import {useFavorites} from '../../Core/FavoritesContext'
import {FileRecord,fileTitle} from '../Files/filePresentation'
export default function DashboardFeatured({files,error}:{files:FileRecord[];error:string}){
 const track=useRef<HTMLDivElement>(null),favorites=useFavorites(),[notice,setNotice]=useState(''),[busy,setBusy]=useState<number>()
 return <article className="dashboard-card dash-featured"><h2 className="dashboard-panel-title"><WorkspacePremiumOutlined/>ملک‌های ویژه</h2><div className="dash-featured-track" ref={track}>{files.map(file=>{const price=file.contractType==='رهن و اجاره'?file.mortgagePrice:file.totalPrice;return <div className="dash-property-card" key={file.id}><div className="dash-property-image"><Link to={'/files?demo=0&detail='+file.id} aria-label={fileTitle(file)}>{typeof file.images?.[0]==='string'?<img src={file.images[0]} alt={fileTitle(file)}/>:<ImageOutlined/>}</Link><IconButton size="small" aria-label={(favorites.ids.has(file.id)?'حذف از':'افزودن به')+' علاقه‌مندی‌ها: '+fileTitle(file)} disabled={busy===file.id} onClick={async()=>{setBusy(file.id);try{await favorites.toggle(file.id);setNotice('')}catch{setNotice('ذخیره علاقه‌مندی انجام نشد.')}finally{setBusy(undefined)}}}>{favorites.ids.has(file.id)?<Favorite/>:<FavoriteBorder/>}</IconButton><span>{file.contractType||'ویژه'}</span></div><Link to={'/files?demo=0&detail='+file.id}><h3>{fileTitle(file)}</h3><strong className="dash-property-price">{price?Number(price).toLocaleString('fa-IR')+' تومان':'قیمت توافقی'}</strong><div className="dash-property-facts"><span><BedOutlined/>{file.roomCount??'—'} خواب</span><span><SquareFoot/>{file.area?Number(file.area).toLocaleString('fa-IR'):'—'} متر</span><span>{file.buildYear||'—'}</span></div></Link></div>})}</div>{!files.length&&<div className="dashboard-empty-chart">{error||'هنوز ملک ویژه‌ای در دسترس نیست.'}</div>}{files.length>3&&<IconButton className="dash-featured-next" aria-label="ملک‌های ویژه بعدی" onClick={()=>track.current?.scrollBy({left:-200,behavior:'smooth'})}><ChevronLeft/></IconButton>}{notice&&<p role="alert">{notice}</p>}</article>
}

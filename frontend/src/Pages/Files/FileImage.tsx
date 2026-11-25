import {ImgHTMLAttributes,useEffect,useState} from 'react'
import ImageNotSupportedOutlined from '@mui/icons-material/ImageNotSupportedOutlined'
export default function FileImage({src,alt='',...props}:ImgHTMLAttributes<HTMLImageElement>){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);return !src||failed?<span className="file-image-fallback" role="img" aria-label={alt||'تصویر موجود نیست'}><ImageNotSupportedOutlined/><small>تصویر در دسترس نیست</small></span>:<img {...props} src={src} alt={alt} onError={()=>setFailed(true)}/>}

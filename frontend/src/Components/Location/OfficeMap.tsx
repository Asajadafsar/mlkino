import {useEffect,useRef,useState} from 'react'
import {Alert, Box, Button, Chip, CircularProgress, Stack, Typography} from '@mui/material'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../Core/Request'
import {PANEL_URL} from '../../Core/APP_URL'
const icon=L.divIcon({className:'mlkino-office-pin',html:'<span style="display:block;width:30px;height:30px;background:#246bfd;border:4px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 5px 20px #246bfd70"></span>',iconSize:[34,34],iconAnchor:[17,34]})
export function OfficeMap({value,onChange,placeLabel='دفتر'}:{value:any;onChange:(next:any)=>void;placeLabel?:'دفتر'|'ملک'}) {
 const container=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),marker=useRef<L.Marker|null>(null)
 const selectionVersion=useRef(0)
 const latest=useRef({value,onChange});latest.current={value,onChange}
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[hint,setHint]=useState(''),[tileError,setTileError]=useState(false),[retry,setRetry]=useState(0)
 const address=[value.province,value.city,value.office_address].filter(Boolean).join('، ')
 const valid=value.latitude!=null&&value.longitude!=null&&Number.isFinite(Number(value.latitude))&&Number.isFinite(Number(value.longitude))
 const pick=(lat:number,lon:number)=>{if(lat<25||lat>40||lon<44||lon>63.5){setError(`موقعیت ${placeLabel} باید داخل محدوده ایران باشد.`);return}selectionVersion.current++;const {value,onChange}=latest.current;onChange({...value,latitude:Number(lat.toFixed(7)),longitude:Number(lon.toFixed(7))});setError('');setHint(`موقعیت انتخاب شد و همراه مشخصات ${placeLabel} ذخیره می‌شود.`)}
 useEffect(()=>{
  if(!container.current)return
  const m=L.map(container.current,{zoomControl:false,scrollWheelZoom:false,minZoom:5,maxZoom:19,maxBounds:[[23,42],[42,65]]}).setView([32.4,53.7],5);map.current=m
  L.control.zoom({position:'bottomleft'}).addTo(m)
  L.tileLayer(`${PANEL_URL.replace(/\/$/,'')}/locations/tiles/{z}/{x}/{y}.png`,{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',maxZoom:19,minZoom:5,crossOrigin:'use-credentials'}).on('tileerror',()=>setTileError(true)).addTo(m)
  m.on('click',event=>pick(event.latlng.lat,event.latlng.lng))
  let frame=0;const resize=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>m.invalidateSize())};const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);observer?.observe(container.current);if(!observer)window.addEventListener('resize',resize)
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',resize);m.remove();map.current=null;marker.current=null}
 },[])
 useEffect(()=>{if(!map.current)return;if(!valid){marker.current?.remove();marker.current=null;return}const point=L.latLng(Number(value.latitude),Number(value.longitude));if(marker.current)marker.current.setLatLng(point);else{marker.current=L.marker(point,{icon,draggable:true}).addTo(map.current);marker.current.on('dragend',()=>{const p=marker.current!.getLatLng();pick(p.lat,p.lng)})}map.current.flyTo(point,17,{duration:.7})},[valid,value.latitude,value.longitude])
 useEffect(()=>{if(valid||!value.city)return;const controller=new AbortController();api.get('locations/',{params:{level:'city',province:value.province,city:value.city},signal:controller.signal}).then(r=>{if(controller.signal.aborted)return;const city=r.data.data.results.find((x:any)=>x.name===value.city);if(city?.latitude&&city?.longitude&&!latest.current.value.latitude)map.current?.flyTo([city.latitude,city.longitude],12,{duration:.5})}).catch(()=>{});return()=>controller.abort()},[value.city,value.province,valid])
 useEffect(()=>{
  if(!value.office_address||!value.city||valid&&!retry){setBusy(false);return}
  const controller=new AbortController();setBusy(true);setError('');setHint('در حال یافتن دفتر از روی نشانی…')
  const version=selectionVersion.current
  const timer=setTimeout(()=>{api.post('locations/geocode/',{province:value.province,city:value.city,address:value.office_address},{signal:controller.signal}).then(response=>{if(controller.signal.aborted||version!==selectionVersion.current)return;const result=response.data.data;pick(result.latitude,result.longitude);setHint(result.needs_confirmation?'موقعیت پیشنهادی است؛ نشانگر را روی ورودی دقیق دفتر جابه‌جا کنید.':'موقعیت دفتر از روی نشانی پیدا شد.')}).catch(e=>{if(!controller.signal.aborted){setError(e.response?.data?.message||`مکان‌یابی خودکار انجام نشد. محل ${placeLabel} را روی نقشه انتخاب کنید.`);setHint('')}}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})},800)
  return()=>{clearTimeout(timer);controller.abort()}
 // A coordinate update must not cancel a just-completed lookup; only address changes trigger a new search.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[address,retry])
 const locate=()=>{if(!navigator.geolocation){setError('مرورگر موقعیت فعلی را پشتیبانی نمی‌کند.');return}navigator.geolocation.getCurrentPosition(position=>pick(position.coords.latitude,position.coords.longitude),()=>setError('دسترسی به موقعیت فعلی ممکن نیست؛ دفتر را روی نقشه انتخاب کنید.'),{enableHighAccuracy:true,timeout:10000})}
 return <Box sx={{border:'1px solid',borderColor:'divider',borderRadius:4,overflow:'hidden',background:'linear-gradient(120deg,#f3f7ff,#fff)'}}>
  <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" alignItems={{xs:'flex-start',sm:'center'}} gap={2} p={2.5}><Stack direction="row" gap={1.5} alignItems="center"><Box sx={{p:1.3,bgcolor:'#e8f0ff',borderRadius:3,color:'primary.main'}}><LocationOnRoundedIcon/></Box><Box><Typography fontWeight={800}>{placeLabel} شما روی نقشه</Typography><Typography fontSize={12} color="text.secondary">{placeLabel==='دفتر'?'نشانی را استعلام کنید؛ موقعیت را همین‌جا ببینید و تنظیم کنید.':'نشانی ملک را وارد کنید و موقعیت دقیق را با انتخاب روی نقشه تأیید کنید.'}</Typography></Box></Stack><Chip size="small" color={valid?'success':'default'} label={busy?'در حال مکان‌یابی':valid?'موقعیت انتخاب شده':'در انتظار نشانی'}/></Stack>
  <Box sx={{position:'relative'}}><Box ref={container} aria-label={`نقشه تعاملی محل ${placeLabel}`} sx={{height:{xs:320,md:410},zIndex:0,direction:'ltr'}}/>{busy&&<Stack direction="row" gap={1} alignItems="center" sx={{position:'absolute',top:16,right:16,zIndex:500,bgcolor:'background.paper',borderRadius:3,p:1.5,boxShadow:2}}><CircularProgress size={18}/><Typography fontSize={12}>در حال یافتن نشانی</Typography></Stack>}</Box>
  <Stack p={2.5} spacing={1.5}><Typography fontWeight={600} fontSize={13}>{address||(placeLabel==='دفتر'?'پس از استعلام کد پستی، نشانی دفتر اینجا نمایش داده می‌شود.':'نشانی ملک را وارد یا نقطه دقیق ملک را روی نقشه انتخاب کنید.')}</Typography>{hint&&<Typography fontSize={12} color="text.secondary">{hint}</Typography>}{error&&<Alert severity="warning">{error}</Alert>}{tileError&&<Alert severity="info">بخشی از نقشه بارگذاری نشد. موقعیت انتخاب‌شده حفظ شده است؛ اتصال اینترنت را بررسی کنید.</Alert>}<Stack direction="row" gap={1} flexWrap="wrap"><Button size="small" variant="outlined" startIcon={<MyLocationRoundedIcon/>} onClick={locate}>موقعیت فعلی من</Button><Button size="small" disabled={!value.office_address||busy} onClick={()=>setRetry(n=>n+1)}>یافتن دوباره از روی نشانی</Button></Stack></Stack>
 </Box>
}

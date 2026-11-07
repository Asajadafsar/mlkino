"use client";

import {useMemo,useState} from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import HomeWorkRounded from "@mui/icons-material/HomeWorkRounded";
import ManageSearchRounded from "@mui/icons-material/ManageSearchRounded";
import {authenticatedFetch} from "../../Core/authenticatedFetch";
import {catalogQuery,faNumber,normalizeDigits} from "../../Core/catalog";
import {useLandingSession} from "../../Core/Session";
import {CATEGORIES} from "../Home/categories";
import {usePublic} from "../Catalog/usePublic";

export type LandingSubmissionKind="owner"|"request";
type Location={id:number|string;name:string};
type Values={
  contractType:string;propertyType:string;province:string;city:string;district:string;neighborhoods:string[];
  address:string;area:string;areaFrom:string;areaTo:string;totalPrice:string;totalPriceFrom:string;totalPriceTo:string;
  mortgagePrice:string;mortgagePriceFrom:string;mortgagePriceTo:string;monthlyRent:string;monthlyRentFrom:string;monthlyRentTo:string;
  monthlyCharge:string;roomCount:string;buildYear:string;documentType:string;description:string;virtualTourUrl:string;
  partyName:string;partyPhone:string;partyPhone2:string;partyJob:string;partyNationalId:string;
  amenities:string[];floorPreferences:string[];images:File[];
};

const EMPTY:Values={
  contractType:"",propertyType:"",province:"",city:"",district:"",neighborhoods:[],address:"",area:"",areaFrom:"",areaTo:"",
  totalPrice:"",totalPriceFrom:"",totalPriceTo:"",mortgagePrice:"",mortgagePriceFrom:"",mortgagePriceTo:"",monthlyRent:"",
  monthlyRentFrom:"",monthlyRentTo:"",monthlyCharge:"",roomCount:"",buildYear:"",documentType:"",description:"",virtualTourUrl:"",
  partyName:"",partyPhone:"",partyPhone2:"",partyJob:"",partyNationalId:"",amenities:[],floorPreferences:[],images:[],
};
const AMENITIES=["پارکینگ","آسانسور","انباری","بالکن","حیاط","لابی","نگهبانی","روف گاردن"];
const FLOORS=["طبقه اول","طبقه آخر","پیلوت","فرقی نمی‌کند","سایر طبقات"];
const numberKeys=(kind:LandingSubmissionKind,contract:string)=>kind==="owner"
  ? ["area",...(contract==="فروش"?["totalPrice"]:["mortgagePrice","monthlyRent","monthlyCharge"])]
  : ["areaFrom","areaTo",...(contract==="فروش"?["totalPriceFrom","totalPriceTo"]:["mortgagePriceFrom","mortgagePriceTo","monthlyRentFrom","monthlyRentTo"])];

function responseMessage(body:unknown,fallback:string){
  if(body&&typeof body==="object"){
    const row=body as {message?:unknown;detail?:unknown;data?:unknown};
    if(typeof row.message==="string"&&row.message.trim())return row.message;
    if(typeof row.detail==="string"&&row.detail.trim())return row.detail;
    if(row.data&&typeof row.data==="object")for(const value of Object.values(row.data as Record<string,unknown>))if(typeof value==="string")return value;
  }
  return fallback;
}
function digits(value:string){return normalizeDigits(value).replace(/[^0-9]/g,"")}
function formatted(value:string){return value?faNumber(value):""}

function LocationSelect({level,label,value,values,onChange,disabled=false}:{level:"province"|"city"|"district";label:string;value:string;values:Values;onChange:(value:string)=>void;disabled?:boolean}){
  const query=catalogQuery({level,...(level!=="province"?{province:values.province}:{}),...(level==="district"?{city:values.city}:{})});
  const {data,error,loading}=usePublic<{results:Location[]}>(`locations/?${query}`);
  return <TextField select fullWidth label={label} value={value} disabled={disabled||loading} onChange={event=>onChange(event.target.value)} helperText={error||undefined} error={Boolean(error)}>
    <MenuItem value="">انتخاب کنید</MenuItem>
    {(data?.results||[]).map(row=><MenuItem key={`${row.id}-${row.name}`} value={row.name}>{row.name}</MenuItem>)}
  </TextField>;
}

function NeighborhoodChoices({values,onChange}:{values:Values;onChange:(value:string[])=>void}){
  const query=catalogQuery({level:"neighborhood",province:values.province,city:values.city,district:values.district});
  const {data,error,loading}=usePublic<{results:Location[]}>(`locations/?${query}`);
  if(!values.city)return <Typography color="text.secondary" sx={{fontSize:12}}>برای انتخاب محله ابتدا شهر را مشخص کنید.</Typography>;
  if(loading)return <Typography role="status" color="text.secondary" sx={{fontSize:12}}>در حال دریافت محله‌ها…</Typography>;
  if(error)return <Alert severity="warning">{error}</Alert>;
  return <Box sx={{display:"flex",flexWrap:"wrap",gap:1,maxHeight:150,overflow:"auto",p:1.25,border:"1px solid #e0e7f5",borderRadius:2.5}}>
    {(data?.results||[]).map(row=>{const checked=values.neighborhoods.includes(row.name);return <Chip key={`${row.id}-${row.name}`} label={row.name} clickable color={checked?"primary":"default"} variant={checked?"filled":"outlined"} onClick={()=>onChange(checked?values.neighborhoods.filter(name=>name!==row.name):[...values.neighborhoods,row.name])}/>})}
    {!data?.results?.length&&<Typography color="text.secondary" sx={{fontSize:12}}>محله ثبت‌شده‌ای برای این محدوده پیدا نشد.</Typography>}
  </Box>;
}

function NumberField({label,value,onChange,unit=""}:{label:string;value:string;onChange:(value:string)=>void;unit?:string}){
  return <TextField fullWidth label={label} value={formatted(value)} onChange={event=>onChange(digits(event.target.value))} slotProps={{htmlInput:{inputMode:"numeric"}}} helperText={value?`${formatted(value)}${unit?` ${unit}`:""}`:undefined}/>;
}

export default function LandingSubmissionDialog({open,kind,onClose}:{open:boolean;kind:LandingSubmissionKind;onClose:()=>void}){
  const {user}=useLandingSession();
  const [values,setValues]=useState<Values>({...EMPTY,partyName:user?.full_name||""}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<{id?:number;publication_state?:string}|null>(null);
  const change=<K extends keyof Values>(key:K,value:Values[K])=>setValues(current=>({...current,[key]:value}));
  const partyTitle=values.contractType==="رهن و اجاره"?(kind==="owner"?"موجر":"مستأجر"):(kind==="owner"?"مالک":"خریدار");
  const title=kind==="owner"?"ثبت ملک توسط مالک":"ثبت درخواست فایل";
  const contractReady=Boolean(values.contractType);
  const summary=useMemo(()=>[
    values.contractType,values.propertyType,[values.province,values.city,values.district].filter(Boolean).join("، "),
    ...numberKeys(kind,values.contractType).filter(key=>values[key as keyof Values]).map(key=>`${key.includes("area")?"متراژ":"مبلغ"}: ${formatted(String(values[key as keyof Values]))}`),
  ].filter(Boolean),[kind,values]);

  const submit=async(draft:boolean)=>{
    if(busy)return;
    if(!values.contractType||!values.propertyType||!values.province||!values.city){setError("نوع معامله، نوع ملک، استان و شهر را کامل کنید.");return}
    if(!values.partyName.trim()||!/^09\d{9}$/.test(digits(values.partyPhone))){setError(`نام و شماره موبایل معتبر ${partyTitle} را وارد کنید.`);return}
    if(values.partyNationalId&&digits(values.partyNationalId).length!==10){setError("کد ملی باید ۱۰ رقم باشد.");return}
    const numeric=numberKeys(kind,values.contractType);
    if(numeric.some(key=>!values[key as keyof Values])){setError(kind==="owner"?"متراژ و مبالغ اصلی ملک را کامل کنید.":"بازه متراژ و بودجه درخواستی را کامل کنید.");return}
    for(const [from,to] of [["areaFrom","areaTo"],["totalPriceFrom","totalPriceTo"],["mortgagePriceFrom","mortgagePriceTo"],["monthlyRentFrom","monthlyRentTo"]]){
      if(Number(values[from as keyof Values]||0)>Number(values[to as keyof Values]||Number.MAX_SAFE_INTEGER)){setError("حداقل بازه نباید بیشتر از حداکثر باشد.");return}
    }
    const partyPrefix=kind==="owner"?"owner":"customer";
    const payload:Record<string,unknown>={
      source:"landing",requesterType:kind==="owner"?"owner":"customer",publicationStatus:draft?"draft":"pending",contractType:values.contractType,
      propertyType:values.propertyType,province:values.province,city:values.city,district:kind==="request"?(values.district?[values.district]:[]):values.district,
      neighborhood:kind==="request"?values.neighborhoods:values.neighborhoods[0]||"",address:kind==="owner"?values.address:"",amenities:values.amenities,
      floorPreferences:kind==="request"?values.floorPreferences:[],description:values.description,roomCount:values.roomCount,buildYear:values.buildYear,
      documentType:values.documentType,virtualTourUrl:values.virtualTourUrl,
      [`${partyPrefix}Name`]:values.partyName.trim(),[`${partyPrefix}Phone`]:digits(values.partyPhone),[`${partyPrefix}Phone2`]:digits(values.partyPhone2),
      [`${partyPrefix}Job`]:values.partyJob.trim(),[`${partyPrefix}NationalId`]:digits(values.partyNationalId),
    };
    for(const key of numeric)payload[key]=values[key as keyof Values];
    Object.keys(payload).forEach(key=>{if(payload[key]===""||Array.isArray(payload[key])&&!payload[key].length)delete payload[key]});
    setBusy(true);setError("");
    try{
      let response:Response;
      if(kind==="owner"){
        const form=new FormData();form.append("payload",JSON.stringify(payload));for(const image of values.images)form.append("images",image);
        response=await authenticatedFetch("/panel/workflows/owner-submissions/",{method:"POST",body:form});
      }else response=await authenticatedFetch("/panel/requests/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const body:unknown=await response.json().catch(()=>null);
      if(!response.ok)throw Error(responseMessage(body,"ثبت اطلاعات انجام نشد."));
      const envelope=body as {data?:{id?:number;publication_state?:string}};
      setResult(envelope?.data||{});
    }catch(reason){setError(reason instanceof Error?reason.message:"ثبت اطلاعات انجام نشد. دوباره تلاش کنید.")}
    finally{setBusy(false)}
  };

  return <Dialog open={open} onClose={busy?undefined:onClose} fullWidth maxWidth="md" fullScreen={false} slotProps={{paper:{sx:{borderRadius:{xs:0,sm:4},maxHeight:{xs:"100dvh",sm:"92dvh"}}}}}>
    <DialogTitle sx={{display:"flex",alignItems:"center",gap:1.5,pb:1}}>
      <Box sx={{display:"grid",placeItems:"center",width:44,height:44,borderRadius:3,bgcolor:kind==="owner"?"#fff3dc":"#eaf2ff",color:kind==="owner"?"#db8400":"#075bff"}}>{kind==="owner"?<HomeWorkRounded/>:<ManageSearchRounded/>}</Box>
      <Box sx={{flex:1}}><Typography component="h2" sx={{fontWeight:900}}>{title}</Typography><Typography sx={{fontSize:12}} color="text.secondary">اطلاعات فقط در پرونده امن شما ذخیره می‌شود و عمومی نمایش داده نمی‌شود.</Typography></Box>
      <IconButton aria-label="بستن" onClick={onClose} disabled={busy}><CloseRounded/></IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{bgcolor:"#f8faff",p:{xs:2,sm:3}}}>
      {result?<Stack spacing={2} sx={{alignItems:"center",textAlign:"center",py:6}}>
        <Box sx={{fontSize:42}}>✓</Box><Typography variant="h6" sx={{fontWeight:900}}>{kind==="owner"?"ملک شما ثبت شد":"درخواست فایل ثبت شد"}</Typography>
        <Typography color="text.secondary">شناسه پیگیری {result.id?.toLocaleString("fa-IR")||"صادر شد"}. {result.publication_state==="draft"?"پیش‌نویس در پنل کاربری شما آماده تکمیل است.":"درخواست بر اساس محدوده به کارشناس مرتبط ارجاع می‌شود."}</Typography>
        <Button href={kind==="owner"?"/files":"/requests"} onClick={onClose}>مشاهده فایل‌های ملکینو</Button>
      </Stack>:<Stack spacing={3}>
        <Alert severity="info">{kind==="owner"?"برای فروش یا اجاره ملک، مشخصات کامل را وارد کنید؛ پس از پذیرش کارشناس وضعیت پرونده در پنل کاربری قابل پیگیری است.":"نیاز ملکی خود را دقیق وارد کنید؛ درخواست‌های ثبت‌شده از لندینگ با برچسب اختصاصی به دفترهای محدوده ارجاع می‌شوند."}</Alert>
        <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"1fr 1fr"},gap:2}}>
          <TextField select required label="نوع معامله" value={values.contractType} onChange={event=>setValues(current=>({...current,contractType:event.target.value,totalPrice:"",totalPriceFrom:"",totalPriceTo:"",mortgagePrice:"",mortgagePriceFrom:"",mortgagePriceTo:"",monthlyRent:"",monthlyRentFrom:"",monthlyRentTo:""}))}><MenuItem value="فروش">فروش</MenuItem><MenuItem value="رهن و اجاره">رهن و اجاره</MenuItem></TextField>
          <TextField select required label="نوع ملک" value={values.propertyType} onChange={event=>change("propertyType",event.target.value)}>{CATEGORIES.slice(0,8).map(row=><MenuItem key={row.label} value={row.label}>{row.label}</MenuItem>)}</TextField>
        </Box>
        {contractReady&&<>
          <Box><Typography sx={{fontWeight:850,mb:1.5}}>محدوده ملک</Typography><Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(3,1fr)"},gap:2}}>
            <LocationSelect level="province" label="استان" value={values.province} values={values} onChange={province=>setValues(current=>({...current,province,city:"",district:"",neighborhoods:[]}))}/>
            <LocationSelect level="city" label="شهر" value={values.city} values={values} disabled={!values.province} onChange={city=>setValues(current=>({...current,city,district:"",neighborhoods:[]}))}/>
            <LocationSelect level="district" label="منطقه" value={values.district} values={values} disabled={!values.city} onChange={district=>setValues(current=>({...current,district,neighborhoods:[]}))}/>
          </Box></Box>
          <Box><Typography sx={{fontSize:13,fontWeight:750,mb:1}}>محله‌های مدنظر</Typography><NeighborhoodChoices values={values} onChange={neighborhoods=>change("neighborhoods",neighborhoods)}/></Box>
          {kind==="owner"&&<TextField required fullWidth label="نشانی ملک" value={values.address} onChange={event=>change("address",event.target.value)} placeholder="خیابان، کوچه و پلاک (در انتشار عمومی نمایش داده نمی‌شود)"/>}
          <Box><Typography sx={{fontWeight:850,mb:1.5}}>{kind==="owner"?"مشخصات و قیمت ملک":"بازه متراژ و بودجه"}</Typography><Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,1fr)",md:"repeat(3,1fr)"},gap:2}}>
            {kind==="owner"?<NumberField label="متراژ" unit="متر" value={values.area} onChange={value=>change("area",value)}/>:<><NumberField label="متراژ از" unit="متر" value={values.areaFrom} onChange={value=>change("areaFrom",value)}/><NumberField label="متراژ تا" unit="متر" value={values.areaTo} onChange={value=>change("areaTo",value)}/></>}
            {values.contractType==="فروش"?(kind==="owner"?<NumberField label="قیمت کل" unit="تومان" value={values.totalPrice} onChange={value=>change("totalPrice",value)}/>:<><NumberField label="بودجه از" unit="تومان" value={values.totalPriceFrom} onChange={value=>change("totalPriceFrom",value)}/><NumberField label="بودجه تا" unit="تومان" value={values.totalPriceTo} onChange={value=>change("totalPriceTo",value)}/></>):(kind==="owner"?<><NumberField label="مبلغ رهن" unit="تومان" value={values.mortgagePrice} onChange={value=>change("mortgagePrice",value)}/><NumberField label="اجاره ماهانه" unit="تومان" value={values.monthlyRent} onChange={value=>change("monthlyRent",value)}/><NumberField label="شارژ ماهانه" unit="تومان" value={values.monthlyCharge} onChange={value=>change("monthlyCharge",value)}/></>:<><NumberField label="رهن از" unit="تومان" value={values.mortgagePriceFrom} onChange={value=>change("mortgagePriceFrom",value)}/><NumberField label="رهن تا" unit="تومان" value={values.mortgagePriceTo} onChange={value=>change("mortgagePriceTo",value)}/><NumberField label="اجاره از" unit="تومان" value={values.monthlyRentFrom} onChange={value=>change("monthlyRentFrom",value)}/><NumberField label="اجاره تا" unit="تومان" value={values.monthlyRentTo} onChange={value=>change("monthlyRentTo",value)}/></>)}
            <NumberField label="تعداد اتاق" value={values.roomCount} onChange={value=>change("roomCount",value)}/>
            {kind==="owner"&&<><NumberField label="سال ساخت" value={values.buildYear} onChange={value=>change("buildYear",value)}/><TextField select label="نوع سند" value={values.documentType} onChange={event=>change("documentType",event.target.value)}>{["","تک برگ","شش دانگ","قولنامه‌ای","مشاع","اوقافی"].map(value=><MenuItem key={value||"empty"} value={value}>{value||"انتخاب کنید"}</MenuItem>)}</TextField></>}
          </Box></Box>
          {kind==="request"&&<Box><Typography sx={{fontSize:13,fontWeight:750}}>طبقات قابل قبول</Typography><Stack direction="row" sx={{flexWrap:"wrap"}}>{FLOORS.map(value=><FormControlLabel key={value} label={value} control={<Checkbox checked={values.floorPreferences.includes(value)} onChange={event=>change("floorPreferences",event.target.checked?(value==="فرقی نمی‌کند"?[value]:[...values.floorPreferences.filter(item=>item!=="فرقی نمی‌کند"),value]):values.floorPreferences.filter(item=>item!==value))}/>}/>)}</Stack></Box>}
          <Box><Typography sx={{fontSize:13,fontWeight:750}}>امکانات مهم</Typography><Stack direction="row" sx={{flexWrap:"wrap"}}>{AMENITIES.map(value=><FormControlLabel key={value} label={value} control={<Checkbox checked={values.amenities.includes(value)} onChange={event=>change("amenities",event.target.checked?[...values.amenities,value]:values.amenities.filter(item=>item!==value))}/>}/>)}</Stack></Box>
          <Box><Typography sx={{fontWeight:850,mb:1.5}}>اطلاعات {partyTitle}</Typography><Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"1fr 1fr"},gap:2}}>
            <TextField required label="نام و نام خانوادگی" value={values.partyName} onChange={event=>change("partyName",event.target.value)}/><TextField required label="شماره موبایل" value={formatted(values.partyPhone)} onChange={event=>change("partyPhone",digits(event.target.value))} slotProps={{htmlInput:{inputMode:"tel"}}}/>
            <TextField label="تلفن دوم" value={formatted(values.partyPhone2)} onChange={event=>change("partyPhone2",digits(event.target.value))} slotProps={{htmlInput:{inputMode:"tel"}}}/><TextField label="شغل" value={values.partyJob} onChange={event=>change("partyJob",event.target.value)}/>
            <TextField label="کد ملی" value={formatted(values.partyNationalId)} onChange={event=>change("partyNationalId",digits(event.target.value).slice(0,10))} slotProps={{htmlInput:{inputMode:"numeric",maxLength:10}}} helperText="برای تشخیص پرونده‌های قبلی و جلوگیری از مخاطب تکراری"/>
          </Box></Box>
          {kind==="owner"&&<><Button component="label" variant="outlined" startIcon={<CloudUploadRounded/>}>انتخاب تصاویر (حداکثر ۱۵ تصویر)<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const files=Array.from(event.target.files||[]).slice(0,15);change("images",files)}}/></Button>{values.images.length>0&&<Typography sx={{fontSize:12}} color="text.secondary">{values.images.length.toLocaleString("fa-IR")} تصویر انتخاب شد: {values.images.slice(0,3).map(file=>file.name).join("، ")}</Typography>}<TextField fullWidth label="لینک تور مجازی (اختیاری)" value={values.virtualTourUrl} onChange={event=>change("virtualTourUrl",event.target.value)} placeholder="https://…"/></>}
          <TextField fullWidth multiline minRows={4} label="توضیحات تکمیلی" value={values.description} onChange={event=>change("description",event.target.value)}/>
          {summary.length>0&&<Box sx={{p:2,borderRadius:3,bgcolor:"#fff",border:"1px solid #e4eaf7"}}><Typography sx={{fontWeight:850,mb:1}}>خلاصه ثبت</Typography><Typography sx={{fontSize:12}} color="text.secondary">{summary.join(" · ")}</Typography></Box>}
        </>}
        {error&&<Alert severity="error" role="alert">{error}</Alert>}
      </Stack>}
    </DialogContent>
    {!result&&<DialogActions sx={{p:2,gap:1}}><Button onClick={onClose} disabled={busy}>انصراف</Button><Button onClick={()=>submit(true)} disabled={busy||!contractReady}>ذخیره پیش‌نویس</Button><Button variant="contained" onClick={()=>submit(false)} disabled={busy||!contractReady} startIcon={busy?<CircularProgress size={16} color="inherit"/>:undefined}>{busy?"در حال ثبت…":kind==="owner"?"ارسال ملک برای بررسی":"ثبت و ارجاع درخواست"}</Button></DialogActions>}
  </Dialog>;
}

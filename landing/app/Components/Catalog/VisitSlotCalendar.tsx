"use client";
import {useMemo,useState} from "react";
import {Box,Button,Chip,Stack,Typography} from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";

export type VisitCalendarSlot={id:number;starts_at:string;ends_at:string;available:number;property_title?:string};
const dayKey=(value:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tehran",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const faDay=(value:string)=>new Date(value).toLocaleDateString("fa-IR-u-ca-persian",{day:"numeric",timeZone:"Asia/Tehran"});
const faMonth=(value:string)=>new Date(value).toLocaleDateString("fa-IR-u-ca-persian",{month:"long",year:"numeric",timeZone:"Asia/Tehran"});
const faWeekday=(value:string)=>new Date(value).toLocaleDateString("fa-IR",{weekday:"short",timeZone:"Asia/Tehran"});
const faTime=(value:string)=>new Date(value).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Tehran"});

export default function VisitSlotCalendar({slots,value,onChange}:{slots:VisitCalendarSlot[];value:string;onChange:(id:string)=>void}){
 const available=useMemo(()=>slots.filter(slot=>slot.available>0).sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at)),[slots]);
 const days=useMemo(()=>Array.from(new Map(available.map(slot=>[dayKey(slot.starts_at),slot])).entries()),[available]);
 const [selectedDay,setSelectedDay]=useState(()=>value?dayKey(available.find(slot=>String(slot.id)===value)?.starts_at||""):days[0]?.[0]||"");
 const selectedSlots=available.filter(slot=>dayKey(slot.starts_at)===(selectedDay||days[0]?.[0]));
 const activeDay=selectedDay||days[0]?.[0]||"";
 if(!available.length)return <Box sx={{p:2.5,border:"1px dashed #d7e1f5",borderRadius:3,textAlign:"center",color:"text.secondary"}}>کارشناس هنوز روز و ساعت آزادی برای این ملک ثبت نکرده است.</Box>;
 return <Box sx={{border:"1px solid #dfe7f7",borderRadius:3,overflow:"hidden",background:"#fbfdff"}}>
  <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",p:1.5,borderBottom:"1px solid #e7edf8",background:"#f3f7ff"}}><Button size="small" disabled><ChevronRightRounded/></Button><Typography sx={{fontWeight:900}}>{faMonth(available.find(slot=>dayKey(slot.starts_at)===activeDay)?.starts_at||available[0].starts_at)}</Typography><Button size="small" disabled><ChevronLeftRounded/></Button></Stack>
  <Box sx={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:1,p:1.5}}>{days.map(([key,slot])=><Button key={key} onClick={()=>{setSelectedDay(key);onChange("")}} aria-pressed={activeDay===key} sx={{minWidth:0,p:.75,display:"flex",flexDirection:"column",borderRadius:2,border:"1px solid",borderColor:activeDay===key?"primary.main":"#e6ecf7",background:activeDay===key?"#eaf2ff":"#fff",color:activeDay===key?"primary.main":"#24375f"}}><small>{faWeekday(slot.starts_at)}</small><strong>{faDay(slot.starts_at)}</strong></Button>)}</Box>
  <Box sx={{p:2,borderTop:"1px solid #e7edf8"}}><Typography sx={{fontWeight:800,mb:1}}>ساعت‌های آزاد این روز</Typography><Stack direction="row" sx={{flexWrap:"wrap",gap:1}}>{selectedSlots.map(slot=><Chip key={slot.id} clickable color={value===String(slot.id)?"primary":"default"} variant={value===String(slot.id)?"filled":"outlined"} onClick={()=>onChange(String(slot.id))} label={`${faTime(slot.starts_at)} تا ${faTime(slot.ends_at)} · ${slot.available.toLocaleString("fa-IR")} ظرفیت`}/>)}</Stack></Box>
 </Box>
}

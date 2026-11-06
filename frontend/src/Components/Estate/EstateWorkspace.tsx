import {Box,Button,Collapse,InputAdornment,MenuItem,Paper,Stack,TextField,ToggleButton,ToggleButtonGroup,Typography} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import {useState} from 'react'
import type {ViewMode} from '../../Core/useViewMode'
import './estate.css'
export function EstateHero({title,description,icon=<DescriptionRoundedIcon/>}:{title:string;description:string;icon?:React.ReactNode}) {
 return <Box className="estate-hero" style={{'--estate-hero-image':"url('/assets/estate-hero-v1.webp')"} as React.CSSProperties}><Stack direction="row" gap={2.5} alignItems="center" sx={{position:'relative',zIndex:1}}><Box className="estate-hero-icon">{icon}</Box><Box><Typography component="h1" sx={{fontSize:{xs:22,md:28},fontWeight:900,lineHeight:1.3,color:'#101c40',mb:.8}}>{title}</Typography><Typography sx={{fontSize:{xs:11,md:14},color:'#53618b',lineHeight:1.8}}>{description}</Typography></Box></Stack></Box>
}
export function EstateStats({items,reverse=false}:{reverse?:boolean;items:{label:string;value:number;kind?:'blue'|'green'|'orange'|'purple'|'red';icon?:React.ReactNode}[]}) {
 return <Box className={`estate-stats ${reverse?'estate-stats-reversed':''}`}>{items.map((item,index)=><Paper key={item.label} className={`estate-stat estate-${item.kind||['blue','green','orange','purple'][index]}`} elevation={0}><Box className="estate-stat-icon">{item.icon||[<LayersRoundedIcon/>,<CheckRoundedIcon/>,<AccessTimeRoundedIcon/>,<LayersRoundedIcon/>][index%4]}</Box><Box><Typography className="estate-stat-value">{item.value.toLocaleString('fa-IR')}</Typography><Typography className="estate-stat-label">{item.label}</Typography></Box></Paper>)}</Box>
}
export type EstateFilter={field:string;label:string;options?:{value:string;label:string}[];type?:string}
export function EstateToolbar({search,onSearch,view,onView,onCreate,createLabel='جدید',placeholder,filters=[],values={},onFilter,extra,quickFilterCount=3}:{search:string;onSearch:(value:string)=>void;view:ViewMode;onView:(view:ViewMode)=>void;onCreate?:()=>void;createLabel?:string;placeholder:string;filters?:EstateFilter[];values?:Record<string,any>;onFilter?:(field:string,value:string)=>void;extra?:React.ReactNode;quickFilterCount?:number}) {
 const [expanded,setExpanded]=useState(false)
 return <Box><Stack className="estate-toolbar" direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
 {onCreate&&<Button className="estate-create" variant="contained" startIcon={<AddRoundedIcon/>} onClick={onCreate}>{createLabel}</Button>}
 <TextField className="estate-search" size="small" placeholder={placeholder} value={search} onChange={e=>onSearch(e.target.value)} inputProps={{'aria-label':placeholder}} InputProps={{startAdornment:<InputAdornment position="start"><SearchRoundedIcon/></InputAdornment>}}/>
 <Box className="estate-quick-filters">{filters.slice(0,quickFilterCount).map(filter=><TextField key={filter.field} select={!!filter.options} label={filter.options?undefined:filter.label} size="small" value={values[filter.field]||''} onChange={e=>onFilter?.(filter.field,e.target.value)} SelectProps={{displayEmpty:true}} inputProps={{'aria-label':filter.label}}><MenuItem value="">{filter.label}</MenuItem>{filter.options?.map(option=><MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>)}</Box>
 <Button variant="outlined" className="estate-filter-button" startIcon={<TuneRoundedIcon/>} onClick={()=>setExpanded(x=>!x)} aria-expanded={expanded}>فیلترها</Button>{extra}
 <ToggleButtonGroup className="estate-view-toggle" value={view} exclusive onChange={(_,next)=>next&&onView(next)} size="small" aria-label="نمایش فهرست"><ToggleButton value="card" aria-label="نمایش کارتی"><GridViewRoundedIcon fontSize="small"/></ToggleButton><ToggleButton value="list" aria-label="نمایش ردیفی"><FormatListBulletedRoundedIcon fontSize="small"/></ToggleButton></ToggleButtonGroup>
 </Stack><Collapse in={expanded}><Box className="estate-expanded-filters">{filters.map(filter=><TextField key={filter.field} size="small" label={filter.label} select={!!filter.options} type={filter.type||'text'} value={values[filter.field]||''} onChange={e=>onFilter?.(filter.field,e.target.value)}>{filter.options&&[<MenuItem key="all" value="">همه</MenuItem>,...filter.options.map(option=><MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)]}</TextField>)}<Button onClick={()=>filters.forEach(filter=>onFilter?.(filter.field,''))}>پاک‌کردن فیلترها</Button></Box></Collapse></Box>
}

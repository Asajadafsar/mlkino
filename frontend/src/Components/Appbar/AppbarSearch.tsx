import {useState} from 'react'
import {Autocomplete,InputAdornment,TextField,Select,MenuItem,ListItemIcon,ListItemText} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {drawerGroups,drawerItems,canAccessDrawerItem} from '../Drawer/DrawerItems'
import {selectRole} from '../../redux/RoleSlice'
import {usePanelSettings} from '../../Core/PanelSettingsContext'
import featureOptions from '../../Pages/Settings/featureOptions.json'

export default function AppbarSearch({placeholder,mobile}:{placeholder?:string;mobile?:boolean}){
 const role=useSelector(selectRole),navigate=useNavigate(),{settings}=usePanelSettings()
 const [section,setSection]=useState(''),[input,setInput]=useState('')
 const featureForLink=Object.fromEntries(featureOptions.map(x=>[x.link,x.key]))
 const available=drawerItems.filter(item=>!item.disabled&&canAccessDrawerItem(item,role)&&settings.features[featureForLink[item.link]]!==false)
 const groups=drawerGroups.filter(group=>available.some(item=>item.groupId===group.id))
 return <div className="panel-search-shell">
 <Autocomplete componentsProps={{paper:{className:'panel-search-results',sx:theme=>({borderRadius:'17px',mt:1,border:'1px solid',borderColor:theme.palette.mode==='dark'?'#3b4c6b':'#e0e7fc',boxShadow:'0 12px 35px #243b7320',background:theme.palette.mode==='dark'?'#1c2b43':'#fff'})}}} renderOption={(props,item)=><li {...props} aria-label={item.title}><span className="panel-search-result-icon">{item.icon}</span><span className="panel-search-result-copy"><strong>{item.title}</strong><small aria-hidden="true">{drawerGroups.find(group=>group.id===item.groupId)?.title}</small></span></li>} className="panel-search-input" size="small" options={available.filter(item=>!section||item.groupId===section)} getOptionLabel={item=>item.title} value={null} inputValue={input} onInputChange={(_,value)=>setInput(value)} noOptionsText="نتیجه‌ای پیدا نشد" onChange={(_,item)=>{if(item){navigate(`/${item.link}`);setInput('')}}} forcePopupIcon={false} renderInput={params=><TextField {...params} placeholder={placeholder||`جستجو در ${settings.general.shortName} ...`} inputProps={{...params.inputProps,'aria-label':'جستجو در صفحات پنل'}} InputProps={{...params.InputProps,startAdornment:<InputAdornment position="start"><SearchRoundedIcon/></InputAdornment>}}/>}/>
 <Select className="panel-search-section" size="small" displayEmpty value={section} inputProps={{'aria-label':'بخش جستجو'}} IconComponent={ExpandMoreRoundedIcon} onChange={e=>{setSection(e.target.value);setInput('')}} renderValue={value=>groups.find(group=>group.id===value)?.title||'همه بخش‌ها'} MenuProps={{anchorOrigin:{vertical:'bottom',horizontal:'left'},transformOrigin:{vertical:'top',horizontal:'left'},PaperProps:{className:'panel-search-section-menu',sx:theme=>({direction:'rtl',mt:1,minWidth:230,maxWidth:'calc(100vw - 24px)',maxHeight:360,borderRadius:'18px',p:.75,border:'1px solid',borderColor:theme.palette.mode==='dark'?'#3b4c6b':'#e0e7fc',background:theme.palette.mode==='dark'?'linear-gradient(135deg,#24354e,#17253c)':'linear-gradient(135deg,#fff,#f7faff)',boxShadow:'0 12px 35px #243b7325'})}}}><MenuItem value=""><ListItemIcon><GridViewRoundedIcon fontSize="small"/></ListItemIcon><ListItemText>همه بخش‌ها</ListItemText>{!section&&<CheckRoundedIcon className="panel-search-chosen" fontSize="small"/>}</MenuItem>{groups.map(group=><MenuItem key={group.id} value={group.id}><ListItemIcon>{group.icon}</ListItemIcon><ListItemText>{group.title}</ListItemText>{section===group.id&&<CheckRoundedIcon className="panel-search-chosen" fontSize="small"/>}</MenuItem>)}</Select>
 </div>
}

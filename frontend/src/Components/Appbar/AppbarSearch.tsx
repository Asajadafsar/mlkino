import {Autocomplete, InputAdornment, TextField} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {drawerItems, canAccessDrawerItem} from '../Drawer/DrawerItems'
import {selectRole} from '../../redux/RoleSlice'

export default function AppbarSearch({placeholder = 'جستجو در ملکینو…'}: {placeholder?: string; mobile?: boolean}) {
    const role = useSelector(selectRole)
    const navigate = useNavigate()
    return <Autocomplete size="small" options={drawerItems.filter(item => !item.disabled && canAccessDrawerItem(item, role))} getOptionLabel={item => item.title} value={null} noOptionsText="نتیجه‌ای پیدا نشد" onChange={(_, item) => {if (item) navigate(`/${item.link}`)}} sx={{width: '100%', maxWidth: 420}} renderInput={params => <TextField {...params} placeholder={placeholder} inputProps={{...params.inputProps, 'aria-label': 'جستجو در صفحات پنل'}} InputProps={{...params.InputProps, startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>}} sx={{'& .MuiOutlinedInput-root': {bgcolor: 'action.hover', borderRadius: '15px'}}} />} />
}

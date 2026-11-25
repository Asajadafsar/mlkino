import {PersonOutline,SettingsOutlined} from '@mui/icons-material'
import './accountWorkspace.css'
export function AccountHero({profile=false}:{profile?:boolean}){return <header className="account-hero"><span>{profile?<PersonOutline/>:<SettingsOutlined/>}</span><div><h1>{profile?'پروفایل کاربری':'تنظیمات سامانه'}</h1><p>{profile?'مشاهده و ویرایش اطلاعات حساب کاربری، امنیت و ترجیحات شخصی.':'مدیریت تنظیمات کلی سامانه، اطلاعات عمومی و نحوه عملکرد پلتفرم.'}</p></div><img src={profile?'/assets/users-3d.webp':'/assets/settings-3d.webp'} alt=""/></header>}

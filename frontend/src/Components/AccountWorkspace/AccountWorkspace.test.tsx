import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import PanelSettings from '../../Pages/Settings/PanelSettings'
import Profile from '../../Pages/Profile/Profile'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {SETTINGS_DEFAULTS} from '../../Pages/Settings/defaults'
import api from '../../Core/Request'
const mockSave=jest.fn(),mockSetUser=jest.fn()
jest.mock('react-redux',()=>({useSelector:()=>({session:null})}))
jest.mock('../../Core/PanelSettingsContext',()=>({usePanelSettings:()=>({settings:require('../../Pages/Settings/defaults').SETTINGS_DEFAULTS,loading:false,error:'',save:mockSave})}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn(),patch:jest.fn()}}))
jest.mock('../../Core/RealtimeContext',()=>({useRealtime:()=>({lastEvent:null})}))
const user={id:1,first_name:'سجاد',last_name:'افسر',full_name:'سجاد افسر',role:'user',phone:'09123456789',is_active:true,province:'قم',city:'قم',date_joined:'2025-01-01',assignments:[]}
beforeEach(()=>{jest.clearAllMocks();mockSave.mockResolvedValue(undefined);(api.get as jest.Mock).mockResolvedValue({data:{data:user}});(api.patch as jest.Mock).mockResolvedValue({data:{data:{...user,first_name:'علی'}}})})
test('settings retain save API and reverting unsaved changes restores saved configuration',async()=>{render(<PanelSettings/>);const input=screen.getByRole('textbox',{name:'نام پنل'});fireEvent.change(input,{target:{value:'سامانه آزمایشی'}});fireEvent.click(screen.getByRole('button',{name:'بازگرداندن تغییرات ذخیره‌نشده'}));expect(input).toHaveValue(SETTINGS_DEFAULTS.general.panelName);fireEvent.change(input,{target:{value:'سامانه آزمایشی'}});fireEvent.click(screen.getByRole('button',{name:'ذخیره تنظیمات'}));await screen.findByText('تنظیمات ذخیره و روی پنل اعمال شد.');expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({general:expect.objectContaining({panelName:'سامانه آزمایشی'})}))})
test('profile reset discards draft and saving only sends changed allowed fields',async()=>{render(<CurrentUserContext.Provider value={{user:user as any,setUser:mockSetUser}}><MemoryRouter><Profile/></MemoryRouter></CurrentUserContext.Provider>);const input=await screen.findByRole('textbox',{name:/^نام\s*\*?$/});fireEvent.change(input,{target:{value:'دیگر'}});fireEvent.click(screen.getByRole('button',{name:'انصراف از تغییرات'}));expect(input).toHaveValue('سجاد');fireEvent.change(input,{target:{value:'علی'}});fireEvent.click(screen.getByRole('button',{name:'ذخیره تغییرات'}));await screen.findByText('اطلاعات پروفایل ذخیره شد.');expect(api.patch).toHaveBeenCalledWith(expect.stringContaining('/profile/'),{first_name:'علی'},{})})

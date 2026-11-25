import '@testing-library/jest-dom'
import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter,useLocation} from 'react-router-dom'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import {ThemeProvider,createTheme} from '@mui/material'
import roleReducer,{setRole,UserRole} from '../../redux/RoleSlice'
import impersonationReducer from '../../redux/ImpersonationSlice'
import Appbar from './Appbar'
import {DataProvider} from '../../Core/DataProvider'

jest.mock('../../Core/PanelSettingsContext',()=>({usePanelSettings:()=>({settings:require('../../Pages/Settings/defaults').SETTINGS_DEFAULTS})}))
jest.mock('../../Core/RealtimeContext',()=>({useRealtime:()=>({conversations:[{unread_count:3}]})}))
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../Drawer/AppDrawer',()=>({drawerWidth:258}))
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname}</output>}
const collapse=jest.fn(),drawer=jest.fn()
function show(){const store=configureStore({reducer:{role:roleReducer,impersonation:impersonationReducer}});store.dispatch(setRole(UserRole.SUPERADMIN));return render(<Provider store={store}><ThemeProvider theme={createTheme({breakpoints:{values:{xs:0,sm:600,md:900,mdl:1024,lg:1200,xl:1536}}})}><MemoryRouter initialEntries={['/files']}><Appbar selectedTitle="" drawerOpen={false} setDrawerOpen={drawer} onToggleCollapse={collapse} user={{first_name:'سجاد',last_name:'افسر',role:'superadmin'}}/><Location/></MemoryRouter></ThemeProvider></Provider>)}
beforeEach(()=>{jest.clearAllMocks();Object.defineProperty(window,'matchMedia',{writable:true,value:jest.fn().mockImplementation(query=>({matches:false,media:query,onchange:null,addListener:jest.fn(),removeListener:jest.fn(),addEventListener:jest.fn(),removeEventListener:jest.fn(),dispatchEvent:jest.fn()}))});(DataProvider.get as jest.Mock).mockResolvedValue({data:{results:[{is_done:false,remind_at:'2000-01-01T00:00:00Z'},{is_done:true,remind_at:'2000-01-01T00:00:00Z'}]}})})
test('header preserves sidebar toggle, live badges and action navigation',async()=>{show();expect(screen.getByRole('link',{name:'پیشخوان ملکینو'})).toBeTruthy();expect(screen.getByText('سجاد افسر')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'جمع کردن سایدبار'}));expect(collapse).toHaveBeenCalledTimes(1);await waitFor(()=>expect(screen.getByRole('button',{name:'یادآوری‌ها'})).toHaveTextContent('۱'));expect(screen.getByRole('button',{name:'گفتگوها و تماس‌ها'})).toHaveTextContent('۳');fireEvent.click(screen.getByRole('button',{name:'گفتگوها و تماس‌ها'}));expect(screen.getByTestId('location')).toHaveTextContent('/chats');fireEvent.click(screen.getByRole('button',{name:'یادآوری‌ها'}));expect(screen.getByTestId('location')).toHaveTextContent('/reminders')})
test('search section filters destinations and navigates to the chosen page',async()=>{show();fireEvent.mouseDown(screen.getByLabelText('بخش جستجو'));fireEvent.click(await screen.findByRole('option',{name:'فایل و درخواست'}));await waitFor(()=>expect(screen.queryByRole('listbox')).toBeNull());fireEvent.change(screen.getByRole('combobox',{name:'جستجو در صفحات پنل'}),{target:{value:'فایل'}});expect(await screen.findByRole('option',{name:'فایل‌های ملکی'})).toBeTruthy();expect(screen.queryByRole('option',{name:'قراردادها'})).toBeNull();fireEvent.click(screen.getByRole('option',{name:'فایل‌های ملکی'}));expect(screen.getByTestId('location')).toHaveTextContent('/files')})
test('profile and create menus open and navigate from nested pages',async()=>{show();fireEvent.click(screen.getByRole('button',{name:'حساب کاربری'}));fireEvent.click(await screen.findByRole('menuitem',{name:'پروفایل'}));expect(screen.getByTestId('location')).toHaveTextContent('/profile');await waitFor(()=>expect(screen.queryByRole('menu')).toBeNull());fireEvent.click(screen.getByRole('button',{name:'ایجاد جدید'}));fireEvent.click(await screen.findByRole('menuitem',{name:/ثبت فایل/}));expect(screen.getByTestId('location')).toHaveTextContent('/files/create')})

test('mobile menu opens the drawer',async()=>{(window.matchMedia as jest.Mock).mockImplementation(query=>({matches:true,media:query,onchange:null,addListener:jest.fn(),removeListener:jest.fn()}));show();fireEvent.click(screen.getByRole('button',{name:'باز کردن منو'}));expect(drawer).toHaveBeenCalledWith(true);await waitFor(()=>expect(screen.getByRole('button',{name:'یادآوری‌ها'})).toHaveTextContent('۱'))})

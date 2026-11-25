import '@testing-library/jest-dom'
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import {MemoryRouter,useLocation} from 'react-router-dom'
import {ThemeProvider,createTheme} from '@mui/material'
import roleReducer,{setRole,UserRole} from '../redux/RoleSlice'
import impersonationReducer from '../redux/ImpersonationSlice'
import {CurrentUserContext} from '../Core/CurrentUser'
import {DataProvider} from '../Core/DataProvider'
import MainLayout from './MainLayout'
jest.mock('../Core/PanelSettingsContext',()=>({usePanelSettings:()=>({settings:require('../Pages/Settings/defaults').SETTINGS_DEFAULTS})}))
jest.mock('../Core/FavoritesContext',()=>({useFavorites:()=>({error:'',reload:jest.fn()})}))
jest.mock('../Core/RealtimeContext',()=>({useRealtime:()=>({conversations:[]})}))
jest.mock('../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname}</output>}
function show(){const store=configureStore({reducer:{role:roleReducer,impersonation:impersonationReducer}});store.dispatch(setRole(UserRole.SUPERADMIN));return render(<Provider store={store}><ThemeProvider theme={createTheme({breakpoints:{values:{xs:0,sm:600,md:900,mdl:1024,lg:1200,xl:1536}}})}><CurrentUserContext.Provider value={{user:{role:'superadmin',first_name:'سجاد'} as any,setUser:jest.fn()}}><MemoryRouter initialEntries={['/dashboard']}><MainLayout><Location/></MainLayout></MemoryRouter></CurrentUserContext.Provider></ThemeProvider></Provider>)}
beforeEach(()=>{localStorage.clear();Object.defineProperty(window,'matchMedia',{writable:true,value:jest.fn().mockImplementation(query=>({matches:false,media:query,onchange:null,addListener:jest.fn(),removeListener:jest.fn()}))});(DataProvider.get as jest.Mock).mockResolvedValue({data:{results:[]}})})
test('header owns branding and collapse control; collapsed sidebar retains navigation',async()=>{const {container}=show();await waitFor(()=>expect(DataProvider.get).toHaveBeenCalled());expect(container.querySelectorAll('header .panel-header-brand img')).toHaveLength(1);expect(container.querySelectorAll('.panel-sidebar img')).toHaveLength(0);expect(screen.getAllByRole('button',{name:'جمع کردن سایدبار'})).toHaveLength(1);const nav=screen.getByRole('navigation',{name:'بخش‌های پنل'});expect(within(nav).queryByRole('button',{name:'خروج از حساب'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'جمع کردن سایدبار'}));expect(localStorage.getItem('mlkino:sidebar-collapsed')).toBe('true');expect(screen.getAllByRole('button',{name:'باز کردن سایدبار'})).toHaveLength(1);fireEvent.click(within(nav).getByRole('button',{name:'فایل‌های ملکی'}));expect(screen.getByTestId('location')).toHaveTextContent('/files');fireEvent.click(screen.getByRole('button',{name:'باز کردن سایدبار'}));expect(localStorage.getItem('mlkino:sidebar-collapsed')).toBe('false')})
test('mobile drawer has an independent close control and closes on navigation',async()=>{(window.matchMedia as jest.Mock).mockImplementation(query=>({matches:true,media:query,onchange:null,addListener:jest.fn(),removeListener:jest.fn()}));show();await waitFor(()=>expect(DataProvider.get).toHaveBeenCalled());fireEvent.click(screen.getByRole('button',{name:'باز کردن منو'}));expect(await screen.findByRole('heading',{name:'فهرست بخش‌ها'})).toBeTruthy();expect(screen.getByRole('button',{name:'بستن منو'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'فایل‌های ملکی'}));await waitFor(()=>expect(screen.queryByRole('heading',{name:'فهرست بخش‌ها'})).toBeNull());expect(screen.getByTestId('location')).toHaveTextContent('/files');fireEvent.click(screen.getByRole('button',{name:'باز کردن منو'}));fireEvent.click(await screen.findByRole('button',{name:'بستن منو'}));await waitFor(()=>expect(screen.queryByRole('heading',{name:'فهرست بخش‌ها'})).toBeNull())})

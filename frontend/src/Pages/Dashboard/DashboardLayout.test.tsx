import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter,useLocation} from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../../Core/PanelSettingsContext',()=>({usePanelSettings:()=>({settings:require('../Settings/defaults').SETTINGS_DEFAULTS})}))
jest.mock('../../Core/RealtimeContext',()=>({useRealtime:()=>({conversations:[]})}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn().mockResolvedValue({data:{data:{results:[]}}})}}))
jest.mock('./DashboardMap',()=>({__esModule:true,default:({onSelect}:any)=> <button onClick={()=>onSelect({city:'قم',province:'قم',count:1,latitude:34,longitude:50})}>نقشه فایل‌ها</button>}))
jest.mock('./TodayImportantTasks',()=>()=> <div>وظایف امروز</div>)
jest.mock('./PersonalReminders',()=>({PersonalReminders:()=> <div>یادآوری‌ها</div>}))
jest.mock('./EstateAnalytics',()=>({__esModule:true,default:({admin}:any)=><h2>{admin?'آمار و مقایسه مناطق':'عملکرد دفتر و کارشناسان من'}</h2>}))
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname+l.search}</output>}
jest.setTimeout(20000)
const counts=Object.fromEntries(['files','agencies','experts','requests','followups','contracts'].map(key=>[key,{total:14,recent:2,previous:1}]))
beforeEach(()=>{jest.clearAllMocks();(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}});(DataProvider.get as jest.Mock).mockImplementation(resource=>Promise.resolve({data:resource==='dashboard/'?{announcements:{results:[{id:1,title:'اطلاعیه کامل',description:'متن کامل اطلاعیه',created_at:'2026-11-04'}],total_results:1},important_tasks:{total_results:2,completed_count:1,pending_count:1}}:{counts,points:[],matching_files:0,mapped_files:0}}))})
function show(role='superadmin'){render(<CurrentUserContext.Provider value={{user:{role,first_name:'سجاد'} as any,setUser:jest.fn()}}><MemoryRouter><DashboardLayout/><Location/></MemoryRouter></CurrentUserContext.Provider>)}
test('new dashboard preserves announcements and forwards quick-search filters into real file navigation',async()=>{
 show();expect(await screen.findByText('اطلاعیه کامل')).toBeTruthy();await waitFor(()=>expect(screen.getAllByText('۱۴').length).toBe(6));fireEvent.click(screen.getByRole('button',{name:'مشاهده همه اطلاعیه‌ها ←'}));expect(screen.getByRole('dialog')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'بستن'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull(),{timeout:10000});fireEvent.click(await screen.findByRole('button',{name:'آپارتمان',exact:true}));fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'۱۲۳۴'}});fireEvent.click(screen.getByRole('button',{name:'جستجوی ملک'}));await waitFor(()=>expect(screen.getByTestId('location').textContent).toContain('/files?'));const query=new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1]);expect(query.get('propertyType')).toBe('آپارتمان');expect(query.get('priceFrom')).toBe('1234')
})
test('agency keeps its expert performance and invalid ranges do not navigate',async()=>{
 show('agency');expect(screen.getByRole('heading',{name:'عملکرد دفتر و کارشناسان من'})).toBeTruthy();fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'500'}});fireEvent.change(screen.getByLabelText('قیمت تا (تومان)'),{target:{value:'100'}});fireEvent.click(screen.getByRole('button',{name:'جستجوی ملک'}));expect(await screen.findByText('حداکثر قیمت نباید کمتر از حداقل باشد.')).toBeTruthy();expect(screen.getByTestId('location').textContent).toBe('/')
})

test('map city navigation retains active property and price filters',async()=>{show();fireEvent.click(screen.getByRole('button',{name:'آپارتمان',exact:true}));fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'100'}});fireEvent.click(screen.getByRole('button',{name:'نقشه فایل‌ها'}));const query=new URLSearchParams(screen.getByTestId('location').textContent!.split('?')[1]);expect(query.get('city')).toBe('قم');expect(query.get('province')).toBe('قم');expect(query.get('propertyType')).toBe('آپارتمان');expect(query.get('priceFrom')).toBe('100')})

import {fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {MemoryRouter,useLocation} from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../../Core/PanelSettingsContext',()=>({usePanelSettings:()=>({settings:require('../Settings/defaults').SETTINGS_DEFAULTS})}))
jest.mock('../../Core/RealtimeContext',()=>({useRealtime:()=>({conversations:[]})}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn().mockResolvedValue({data:{data:{results:[]}}})}}))
jest.mock('./DashboardMap',()=>({__esModule:true,default:({onSelect}:any)=> <button onClick={()=>onSelect({city:'قم',province:'قم',count:1,latitude:34,longitude:50,id:7,kind:"files"})}>نقشه فایل‌ها</button>}))
jest.mock('./TodayImportantTasks',()=>()=> <div>وظایف امروز</div>)
jest.mock('./PersonalReminders',()=>({PersonalReminders:()=> <div>یادآوری‌ها</div>}))
jest.mock('./EstateAnalytics',()=>({__esModule:true,default:({admin}:any)=><h2>{admin?'آمار و مقایسه مناطق':'عملکرد دفتر و کارشناسان من'}</h2>}))
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname+l.search}</output>}
jest.setTimeout(20000)
const counts=Object.fromEntries(['files','agencies','experts','requests','followups','contracts'].map(key=>[key,{total:14,recent:2,previous:1}]))
beforeEach(()=>{jest.clearAllMocks();(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}});(DataProvider.get as jest.Mock).mockImplementation(resource=>Promise.resolve({data:resource==='dashboard/'?{announcements:{results:[{id:1,title:'اطلاعیه کامل',description:'متن کامل اطلاعیه',created_at:'2026-11-04'}],total_results:1},important_tasks:{total_results:2,completed_count:1,pending_count:1}}:{counts,points:[],matching_files:0,mapped_files:0}}))})
function show(role='superadmin'){render(<CurrentUserContext.Provider value={{user:{role,first_name:'سجاد'} as any,setUser:jest.fn()}}><MemoryRouter><DashboardLayout/><Location/></MemoryRouter></CurrentUserContext.Provider>)}
test('quick search opens the filtered list with layers initially turned off',async()=>{
 show()
 await waitFor(()=>expect(within(screen.getByLabelText('خلاصه آمار')).getAllByText('۱۴').length).toBe(6))
 const section=within(screen.getByLabelText('نقشه و فهرست ملکینو'))
 expect((section.getByRole('checkbox',{name:'فایل‌های ملکی'}) as HTMLInputElement).checked).toBe(false)
 fireEvent.change(screen.getByRole('combobox',{name:'نوع ملک',exact:true}),{target:{value:'آپارتمان'}})
 fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'۱۲۳۴'}})
 fireEvent.click(screen.getByRole('button',{name:'جستجوی ملک'}))
 expect(section.getByRole('button',{name:'فهرست'}).getAttribute('aria-pressed')).toBe('true')
 await waitFor(()=>expect(DataProvider.get).toHaveBeenCalledWith('dashboard/estate-overview/',expect.objectContaining({map_layers:'files',propertyType:'آپارتمان',priceFrom:'1234'})))
})
test('agency removes extra reports and invalid ranges do not navigate',async()=>{
 show('agency');expect(screen.queryByRole('heading',{name:'عملکرد دفتر و کارشناسان من'})).toBeNull();fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'500'}});fireEvent.change(screen.getByLabelText('قیمت تا (تومان)'),{target:{value:'100'}});fireEvent.click(screen.getByRole('button',{name:'جستجوی ملک'}));expect(await screen.findByText('حداکثر قیمت نباید کمتر از حداقل باشد.')).toBeTruthy();expect(screen.getByTestId('location').textContent).toBe('/')
})

test('selecting a real map record opens the matching live file',()=>{show();fireEvent.click(screen.getByRole('button',{name:'نقشه فایل‌ها'}));expect(screen.getByTestId('location').textContent).toBe('/files?demo=0&detail=7')})

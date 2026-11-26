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
jest.mock('@mui/x-charts/BarChart',()=>({BarChart:()=> <div>نمودار مقایسه</div>}))
jest.mock('@mui/x-charts/LineChart',()=>({LineChart:()=> <div>نمودار روند</div>}))
jest.mock('@mui/x-charts/PieChart',()=>({PieChart:()=> <div>نمودار توزیع</div>}))
jest.mock('./TodayImportantTasks',()=>()=> <div>وظایف امروز</div>)
jest.mock('./PersonalReminders',()=>({PersonalReminders:()=> <div>یادآوری‌ها</div>}))
jest.mock('./EstateAnalytics',()=>({__esModule:true,default:({admin}:any)=><h2>{admin?'آمار و مقایسه مناطق':'عملکرد دفتر و کارشناسان من'}</h2>}))
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname+l.search}</output>}
jest.setTimeout(20000)
const counts=Object.fromEntries(['files','agencies','experts','requests','followups','contracts','customers'].map(key=>[key,{total:14,recent:2,previous:1}]))
beforeEach(()=>{localStorage.clear();jest.clearAllMocks();(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}});(DataProvider.get as jest.Mock).mockImplementation(resource=>Promise.resolve({data:resource==='dashboard/'?{announcements:{results:[{id:1,title:'اطلاعیه کامل',description:'متن کامل اطلاعیه',created_at:'2026-11-04'}],total_results:1},important_tasks:{total_results:2,completed_count:1,pending_count:1}}:{counts,points:[],rows:[],groups:[],timeline:[],distribution:[],offices:[],experts:[],notes:[],market_index:{scope:'همه محدوده‌های مجاز',sample_size:0,price_per_meter:null,mean_listing_age_days:null,change_percent:null},matching_files:0,mapped_files:0,matching_items:0,mapped_items:0}}))})
function show(role='superadmin'){render(<CurrentUserContext.Provider value={{user:{role,first_name:'سجاد'} as any,setUser:jest.fn()}}><MemoryRouter><DashboardLayout/><Location/></MemoryRouter></CurrentUserContext.Provider>)}
test('reference search opens the filtered list while the compact map shows properties',async()=>{
 show()
 await waitFor(()=>expect(within(screen.getByLabelText('خلاصه آمار')).getAllByText('۱۴').length).toBe(6))

 const section=within(screen.getByLabelText('نقشه و فهرست ملکینو'))
 expect(section.queryByRole('checkbox')).toBeNull()
 fireEvent.change(screen.getAllByRole('combobox',{name:'نوع ملک',exact:true})[0],{target:{value:'آپارتمان'}})
 fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'۱۲۳۴'}})
 fireEvent.click(screen.getByRole('button',{name:'جستجوی ملک'}))
 const explorer=within(await screen.findByRole('dialog'))
 expect((explorer.getByRole('checkbox',{name:'فایل‌های ملکی'}) as HTMLInputElement).checked).toBe(true)
 expect(explorer.getByRole('button',{name:'فهرست'}).getAttribute('aria-pressed')).toBe('true')
 await waitFor(()=>expect((DataProvider.get as jest.Mock).mock.calls.some(([url])=>String(url).includes('propertyType=')&&String(url).includes('priceFrom=1234'))).toBe(true))
})
test('agency removes extra reports and invalid ranges do not navigate',async()=>{
 show('agency');expect(screen.queryByRole('heading',{name:'عملکرد دفتر و کارشناسان من'})).toBeNull();fireEvent.change(screen.getByLabelText('قیمت از (تومان)'),{target:{value:'500'}});fireEvent.change(screen.getByLabelText('قیمت تا (تومان)'),{target:{value:'100'}});fireEvent.click(screen.getByRole('button',{name:'جستجوی ملک'}));expect(await screen.findByText('حداکثر قیمت نباید کمتر از حداقل باشد.')).toBeTruthy();expect(screen.getByTestId('location').textContent).toBe('/')
})

test('selecting a map record reveals a detail form and then opens its live file',async()=>{show();fireEvent.click(await screen.findByRole('button',{name:'نقشه فایل‌ها'}, {timeout:5000}));expect(await screen.findByRole('region',{name:'جزئیات مورد انتخاب‌شده'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'باز کردن پرونده'}));expect(screen.getByTestId('location').textContent).toBe('/files?demo=0&detail=7')})

test('superadmin sees geographic aggregates instead of raw recent requests and contracts',async()=>{
 show()
 expect(screen.getByRole('heading',{name:'مقایسه تعداد درخواست‌ها در مناطق'})).toBeTruthy()
 expect(screen.getByRole('heading',{name:'مقایسه تعداد قراردادها در مناطق'})).toBeTruthy()
 expect(screen.queryByRole('heading',{name:'جدیدترین درخواست‌ها'})).toBeNull()
 expect(screen.queryByRole('heading',{name:'آخرین قراردادهای منعقد شده'})).toBeNull()
 await waitFor(()=>expect(DataProvider.get).toHaveBeenCalledWith('dashboard/estate-overview/',expect.anything()))
})

test('saved dashboard searches restore their filters and do not send writes to the server',async()=>{
 show()
 fireEvent.change(screen.getByRole('textbox',{name:'کد ملک'}),{target:{value:'۷۷'}})
 fireEvent.click(screen.getByRole('button',{name:'ذخیره جستجو'}))
 fireEvent.click(screen.getByRole('button',{name:'ذخیره فیلترهای فعلی'}))
 expect(await screen.findByText('جستجو در این مرورگر ذخیره شد.')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'پاک‌سازی فیلترها'}))
 expect((screen.getByRole('textbox',{name:'کد ملک'}) as HTMLInputElement).value).toBe('')
 fireEvent.click(screen.getByRole('button',{name:/همه شهرها.*جستجوی ۱/}))
 expect((screen.getByRole('textbox',{name:'کد ملک'}) as HTMLInputElement).value).toBe('77')
})

test('featured cards and latest property rows use server records and live routes',async()=>{
 const original=(DataProvider.get as jest.Mock).getMockImplementation()!
 ;(DataProvider.get as jest.Mock).mockImplementation((resource,params)=>resource==='files/'?Promise.resolve({data:{results:[{id:77,title:'ملک ویژه واقعی',propertyType:'آپارتمان',featured:true,totalPrice:4000000,images:[]} ]}}):original(resource,params))
 show()
 const links=await screen.findAllByRole('link',{name:'ملک ویژه واقعی'})
 expect(links[0].getAttribute('href')).toBe('/files?demo=0&detail=77')
 expect(DataProvider.get).toHaveBeenCalledWith('files/',{page_size:5})
})

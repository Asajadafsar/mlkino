import {fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {FilteredReportCard} from './DashboardReporting'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('@mui/x-charts/BarChart',()=>({BarChart:({xAxis}:any)=> <div>{JSON.stringify(xAxis[0].data)}</div>}))
jest.mock('@mui/x-charts/LineChart',()=>({LineChart:()=> <div>نمودار روند</div>}))
jest.mock('@mui/x-charts/PieChart',()=>({PieChart:()=> <div>نمودار توزیع</div>}))
const report={counts:{files:{total:5,recent:2,previous:1}},groups:[],timeline:[],distribution:[],offices:[{id:'4',name:'دفتر نمونه'}],experts:[{id:'8',name:'کارشناس نمونه'}],notes:[],market_index:{scope:'همه محدوده‌های مجاز',sample_size:5,price_per_meter:20000000,mean_listing_age_days:10,change_percent:null}}
beforeEach(()=>{jest.clearAllMocks();(DataProvider.get as jest.Mock).mockResolvedValue({data:report});(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[{name:'قم'}]}}})})
test('independent report filters carry property type, office, expert and ranges to the report API',async()=>{
 render(<FilteredReportCard title="گزارش مستقل" kind="compare"/>)
 await waitFor(()=>expect(DataProvider.get).toHaveBeenCalled())
 fireEvent.click(screen.getByRole('button',{name:'فیلتر گزارش مستقل'}))
 await screen.findByRole('combobox',{name:'انتخاب محدوده‌ها برای مقایسه'})
 fireEvent.change(screen.getByRole('combobox',{name:'دفتر املاک'}),{target:{value:'4'}})
 fireEvent.change(screen.getByRole('combobox',{name:'کارشناس'}),{target:{value:'8'}})
 fireEvent.change(screen.getByRole('textbox',{name:'قیمت از'}),{target:{value:'۱۲۳۴'}})
 await waitFor(()=>expect((DataProvider.get as jest.Mock).mock.calls.some(([url])=>url.includes('report=1')&&url.includes('office=4')&&url.includes('expert=8')&&url.includes('priceFrom=1234'))).toBe(true))
})
test('market starts with all authorized locations and never injects Tehran',async()=>{
 render(<FilteredReportCard title="شاخص" kind="market"/>)
 expect(await screen.findByText('همه محدوده‌های مجاز')).toBeTruthy()
 expect((DataProvider.get as jest.Mock).mock.calls[0][0]).not.toContain('city=')
})
test('filters belonging to one report do not change a neighboring report',async()=>{
 render(<><FilteredReportCard title="اول" kind="compare"/><FilteredReportCard title="دوم" kind="market"/></>)
 await screen.findByText('همه محدوده‌های مجاز')
 const first=within(screen.getByRole('article',{name:'اول'}))
 fireEvent.click(first.getByRole('button',{name:'فیلتر اول'}))
 fireEvent.change(screen.getByRole('textbox',{name:'متراژ از'}),{target:{value:'50'}})
 await waitFor(()=>expect((DataProvider.get as jest.Mock).mock.calls.some(([url])=>url.includes('areaFrom=50'))).toBe(true))
 fireEvent.click(screen.getByRole('button',{name:'اعمال و بستن'}))
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull())
 fireEvent.click(screen.getByRole('button',{name:'فیلتر دوم'}))
 expect((screen.getByRole('textbox',{name:'متراژ از'}) as HTMLInputElement).value).toBe('')
})


test('equally named regions in different cities remain separate chart categories',async()=>{
 ;(DataProvider.get as jest.Mock).mockResolvedValue({data:{...report,groups:[{key:'tehran-1',label:'منطقه ۱',context:'تهران',totals:{files:1},recent:{files:1},previous:{files:0},timeline:{}},{key:'qom-1',label:'منطقه ۱',context:'قم',totals:{files:2},recent:{files:2},previous:{files:0},timeline:{}}]}})
 render(<FilteredReportCard title="مقایسه مناطق هم‌نام" kind="compare"/>)
 expect(await screen.findByText('["منطقه ۱ / تهران","منطقه ۱ / قم"]')).toBeTruthy()
})

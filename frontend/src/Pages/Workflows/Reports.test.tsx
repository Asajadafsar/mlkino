import '@testing-library/jest-dom'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {Reports} from './Reports'
import {CurrentUserContext} from '../../Core/CurrentUser'
import api from '../../Core/Request'
import {csvCell, initialReportFilters, reportCell, reportLink, reportQuery, reportValidation} from './reportPresentation'
jest.mock('../../Core/Request', () => ({__esModule:true,default:{get:jest.fn(),post:jest.fn(),delete:jest.fn()}}))
jest.mock('./ReportCharts', () => () => <div>نمودارهای گزارش</div>)
const payload = {results:[{id:7,key:'file:7',title:'آپارتمان تست',type:'فایل ملکی',status:'active',city:'تهران',record_url:'/files/7'}],total_results:1,summary:{files:1,requests:0,visits:0,contracts:0,active:1,pending:0},columns:[{key:'id',label:'شناسه'},{key:'title',label:'عنوان'},{key:'status',label:'وضعیت'},{key:'created_at',label:'تاریخ ثبت'}],comparison:[{label:'تهران',current:1,previous:0}]}
beforeEach(() => {jest.clearAllMocks();(api.get as jest.Mock).mockImplementation(async (url,config) => ({data:{data:url === 'workflows/reports/' ? {...payload,comparison:config.params.group_by === 'status' ? [{label:'active',current:1,previous:0}] : payload.comparison} : {results:[]}}}));(api.post as jest.Mock).mockResolvedValue({data:{data:{}}})})
function show(role='superadmin'){return render(<CurrentUserContext.Provider value={{user:{role} as any,setUser:jest.fn()}}><MemoryRouter><Reports/></MemoryRouter></CurrentUserContext.Provider>)}
test('reports retain real API data, scoped chart queries and read-only detail links', async () => {
 show();expect(await screen.findByText('آپارتمان تست')).toBeInTheDocument();expect(screen.getByRole('link',{name:'مشاهده آپارتمان تست'})).toHaveAttribute('href','/files?demo=0&detail=7')
 await waitFor(() => expect(api.get).toHaveBeenCalledWith('workflows/reports/',expect.objectContaining({params:expect.objectContaining({group_by:'province',page_size:1})})))
 expect(within(screen.getByRole('region',{name:'جدول گزارش'})).getByText('فعال')).toBeInTheDocument()
 expect(api.post).not.toHaveBeenCalled()
})
test('invalid ranges stop API loads and column selection retains at least one column',async()=>{
 show();await screen.findByText('آپارتمان تست');fireEvent.change(screen.getByRole('textbox',{name:'حداقل قیمت (تومان)'}),{target:{value:'100'}});fireEvent.change(screen.getByRole('textbox',{name:'حداکثر قیمت (تومان)'}),{target:{value:'10'}})
 expect(await screen.findByText('حداکثر قیمت نباید کمتر از حداقل باشد.')).toBeInTheDocument();expect(screen.getByRole('button',{name:'خروجی CSV'})).toBeDisabled()
 fireEvent.click(screen.getByRole('button',{name:'پاک‌کردن فیلترها'}));await screen.findByText('آپارتمان تست');fireEvent.click(screen.getByRole('button',{name:'ستون‌ها'}));const menu=screen.getByRole('menu');fireEvent.click(within(menu).getByText('عنوان'));expect(within(menu).getAllByRole('checkbox').filter(input=>(input as HTMLInputElement).checked)).toHaveLength(3)
})
test('filter saving preserves report and conditions in the existing API',async()=>{
 show('agency');await screen.findByText('آپارتمان تست');fireEvent.click(screen.getByRole('button',{name:'ذخیره فیلتر'}));fireEvent.change(screen.getByRole('textbox',{name:'نام فیلتر'}),{target:{value:'گزارش ماهانه'}});fireEvent.click(screen.getByRole('button',{name:'ذخیره فیلتر جاری'}));await waitFor(()=>expect(api.post).toHaveBeenCalledWith('workflows/saved-filters/',expect.objectContaining({name:'گزارش ماهانه',report:'operations',filters:expect.objectContaining({period:'month'})})));await screen.findByText('فیلتر در حساب شما ذخیره شد.')
})
test('date presets discard stale custom dates, Persian numbers format and CSV formulas escape',()=>{
 expect(reportQuery({...initialReportFilters,date_from:'2026-01-01',date_to:'2026-01-02'})).not.toHaveProperty('date_from')
 expect(reportQuery({...initialReportFilters,period:'custom',date_from:'2026-01-01',date_to:'2026-01-02'})).toHaveProperty('date_from','2026-01-01')
 expect(reportValidation({...initialReportFilters,period:'custom'})).toBeTruthy();expect(reportValidation({...initialReportFilters,priceFrom:'-1'})).toBeTruthy()
 expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');expect(reportCell({id:1,status:'active'},'status')).toBe('فعال');expect(reportLink({id:1,record_url:'//outside.test'},'operations')).toBe('')
})

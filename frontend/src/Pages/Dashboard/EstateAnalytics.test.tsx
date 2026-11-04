import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import EstateAnalytics from './EstateAnalytics'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('@mui/x-charts/BarChart',()=>({BarChart:()=> <div>نمودار مقایسه</div>}))
jest.mock('@mui/x-charts/LineChart',()=>({LineChart:()=> <div>نمودار روند</div>}))
const counts={files:4,requests:3,agencies:1,experts:2,followups:2,contracts:1}
const report={totals:counts,recent:counts,previous:counts,notes:[],groups:[{key:'qom',label:'قم',context:'قم',totals:counts,recent:counts,previous:counts}],timeline:[{date:'2026-11-04',...counts}],agencies:[{id:1,name:'دفتر نمونه'}]}
beforeEach(()=>{jest.clearAllMocks();(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}});(DataProvider.get as jest.Mock).mockResolvedValue({data:report})})
test('administrator gets real counts and can switch from comparisons to charts',async()=>{
 render(<EstateAnalytics admin/>);expect(await screen.findByRole('table',{name:'مقایسه عملکرد'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'نموداری'}));expect(screen.getByText('نمودار مقایسه')).toBeTruthy();expect(screen.getByText('نمودار روند')).toBeTruthy();await waitFor(()=>expect(DataProvider.get).toHaveBeenCalledWith('dashboard/estate-analytics/',{group_by:'city',days:30}))
})
test('agency view requests individual experts and offers retry after API failure',async()=>{
 (DataProvider.get as jest.Mock).mockRejectedValueOnce(new Error('خطای گزارش')).mockResolvedValueOnce({data:report});render(<EstateAnalytics admin={false}/>);expect(await screen.findByText('خطای گزارش')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'تلاش مجدد'}));expect(await screen.findByRole('table')).toBeTruthy();expect(DataProvider.get).toHaveBeenLastCalledWith('dashboard/estate-analytics/',{group_by:'expert',days:30});expect(screen.queryByLabelText('دفتر املاک')).toBeNull()
})

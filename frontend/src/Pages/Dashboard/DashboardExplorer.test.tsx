import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import DashboardExplorer from './DashboardExplorer'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('./DashboardMap',()=>({__esModule:true,default:({onSelect}:any)=><button onClick={()=>onSelect({id:1,kind:'agencies',title:'دفتر قم',city:'قم',province:'قم',count:1})}>نمونه نقشه</button>}))
const data={rows:[{id:1,kind:'agencies',title:'دفتر قم',city:'قم',province:'قم',count:1},{id:2,kind:'experts',title:'کارشناس قم',city:'قم',province:'قم',count:1},{id:3,kind:'contracts',title:'قرارداد قم',city:'قم',province:'قم',count:1}],points:[],matching_items:103,mapped_items:0,offices:[],experts:[]}
beforeEach(()=>{jest.clearAllMocks();(DataProvider.get as jest.Mock).mockResolvedValue({data});(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}})})
function show(){render(<MemoryRouter><DashboardExplorer admin manager filters={{}} onChange={()=>{}}/></MemoryRouter>)}
test('the same agencies, experts and contracts are available in list and form views without coordinates',async()=>{
 show()
 for(const layer of screen.getAllByRole('checkbox')) expect((layer as HTMLInputElement).checked).toBe(false)
 await screen.findByRole('button',{name:'نمونه نقشه'})
 fireEvent.click(screen.getByRole('button',{name:'فهرست'}))
 expect(screen.getByRole('button',{name:'جزئیات دفتر قم'})).toBeTruthy()
 expect(screen.getByRole('button',{name:'جزئیات کارشناس قم'})).toBeTruthy()
 expect(screen.getByRole('button',{name:'جزئیات قرارداد قم'})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'فرمی'}))
 fireEvent.click(screen.getByRole('button',{name:/دفتر قم.*مشاهده جزئیات/}))
 expect(screen.getByRole('region',{name:'جزئیات مورد انتخاب‌شده'})).toBeTruthy()
 expect(screen.getByText('فاقد مختصات قابل نمایش')).toBeTruthy()
})
test('full-screen dialog preserves data and can close while pagination fetches remaining records',async()=>{
 show()
 await screen.findByRole('button',{name:'نمونه نقشه'})
 fireEvent.click(screen.getByRole('button',{name:'باز کردن تمام‌عرض با جزئیات'}))
 expect(screen.getByRole('dialog')).toBeTruthy()
 expect(screen.getByRole('button',{name:'نمونه نقشه'})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Go to page 2'}))
 await waitFor(()=>expect((DataProvider.get as jest.Mock).mock.calls.some(([url])=>url.includes('paginate=1')&&url.includes('page=2'))).toBe(true))
 fireEvent.click(screen.getByRole('button',{name:'بستن'}))
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull())
})

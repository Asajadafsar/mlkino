import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter,useLocation} from 'react-router-dom'
import AdvancedPropertyResults from './AdvancedPropertyResults'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('../../Components/Estate/EstateProperty',()=>({EstateProperty:({item,layout}:any)=><div>{`ملک ${item.id} ${layout}`}</div>}))
jest.mock('../Dashboard/DashboardMap',()=>({__esModule:true,default:()=> <div>نقشه نتایج</div>}))
function Location(){const location=useLocation();return <output data-testid="query">{location.search}</output>}
beforeEach(()=>{(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}});(DataProvider.get as jest.Mock).mockImplementation(resource=>Promise.resolve({data:resource==='files/'?{results:[{id:7}],total_results:25}:{points:[],mapped_files:0}}))})
test('filters persist through sorting, pagination, list and map views',async()=>{
 render(<MemoryRouter initialEntries={['/files?advanced=1&buildYear=1402&creatorRoles=expert&amenities=پارکینگ']}><AdvancedPropertyResults/><Location/></MemoryRouter>);expect(await screen.findByText('ملک 7 card')).toBeTruthy();expect(DataProvider.get).toHaveBeenCalledWith('files/',expect.objectContaining({buildYear:'1402',creatorRoles:'expert',amenities:'پارکینگ'}));fireEvent.change(screen.getByLabelText('مرتب‌سازی نتایج'),{target:{value:'created_at'}});await waitFor(()=>expect(DataProvider.get).toHaveBeenCalledWith('files/',expect.objectContaining({ordering:'created_at',buildYear:'1402'})));fireEvent.click(await screen.findByRole('button',{name:'Go to page 2'}));await waitFor(()=>expect(DataProvider.get).toHaveBeenCalledWith('files/',expect.objectContaining({page:'2',creatorRoles:'expert'})));fireEvent.click(screen.getByRole('button',{name:'لیستی'}));expect(await screen.findByText('ملک 7 list')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'نقشه',exact:true}));expect(await screen.findByText('نقشه نتایج')).toBeTruthy();expect(DataProvider.get).toHaveBeenCalledWith('dashboard/estate-overview/',expect.objectContaining({map_layers:'files',buildYear:'1402',creatorRoles:'expert'}))
})

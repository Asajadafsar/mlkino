import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {AnnouncementList} from '../../Pages/Announcement/List/AnnouncementList'
import {LogsList} from '../../Pages/Logs/List/LogsList'
import {DataProvider} from '../../Core/DataProvider'
import api from '../../Core/Request'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn(),delete:jest.fn()}}))
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('../../Components/Filter/DatePicker',()=>({__esModule:true,default:({item,value,onChange}:any)=><input aria-label={item.label} value={value||''} onChange={e=>onChange(e.target.value)}/>}))
const announcement={id:1,title:'اطلاعیه تست',description:'متن اطلاعیه',status:'published',created_at:'2026-11-22T09:00:00Z',updated_at:'2026-11-22T09:00:00Z'}
beforeEach(()=>jest.clearAllMocks())
test('announcement detail failure displays a retry and deletion preserves existing API',async()=>{(DataProvider.get as jest.Mock).mockImplementation(async path=>{if(path==='announcements/1/')throw Error('دریافت جزئیات ناموفق');return {data:{results:[announcement],total_results:1}}});(DataProvider.delete as jest.Mock).mockResolvedValue({});render(<MemoryRouter><AnnouncementList/></MemoryRouter>);await screen.findByText('دریافت جزئیات ناموفق');fireEvent.click(screen.getByRole('button',{name:'حذف اطلاعیه تست'}));fireEvent.click(screen.getByRole('button',{name:'حذف اطلاعیه',exact:true}));await waitFor(()=>expect(DataProvider.delete).toHaveBeenCalledWith('announcements/1/'))})
test('logs retain actor and metadata details while preventing reversed date ranges',async()=>{(DataProvider.get as jest.Mock).mockResolvedValue({data:{results:[{id:1,actor_name:'مدیر',event:'login',status_code:200,created_at:'2026-11-22',method:'POST',path:'/accounts/login/',ip_address:'127.0.0.1'}],total_results:1,stats:{total:1,success:1,failure:0,today:1},actors:[]}});render(<LogsList/>);fireEvent.click(await screen.findByRole('button',{name:'مشاهده'}));expect(screen.getByRole('dialog')).toHaveTextContent('/accounts/login/');fireEvent.click(screen.getByRole('button',{name:'بستن',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());fireEvent.change(screen.getByRole('textbox',{name:'از تاریخ'}),{target:{value:'2026-11-25'}});fireEvent.change(screen.getByRole('textbox',{name:'تا تاریخ'}),{target:{value:'2026-11-20'}});expect(await screen.findByText('تاریخ پایان باید پس از شروع باشد.')).toBeInTheDocument();expect(screen.getByRole('button',{name:'دریافت CSV'})).toBeDisabled();expect(api.get).not.toHaveBeenCalled()})

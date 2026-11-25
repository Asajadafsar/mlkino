import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {TicketsList} from './TicketsList'
import {DataProvider} from '../../../Core/DataProvider'
jest.mock('../../../Core/DataProvider',()=>({DataProvider:{get:jest.fn()}}))
jest.mock('react-redux',()=>({useSelector:()=>true}))
jest.mock('../../../Components/Filter/DatePicker',()=>({__esModule:true,default:({item,value,onChange}:any)=><input aria-label={item.label} value={value||''} onChange={e=>onChange(e.target.value)}/>}))
test('management ticket filters retain API scoping and reject inverted dates',async()=>{(DataProvider.get as jest.Mock).mockResolvedValue({data:{results:[{id:4,subject:'اشکال در ثبت ملک',status:'open',creator_name:'کاربر',category_display:'فنی',updated_at:'2026-11-22'}],total_results:1,stats:{open:1},assignees:[]}});render(<MemoryRouter><TicketsList/></MemoryRouter>);await screen.findByText('اشکال در ثبت ملک');expect(screen.queryByRole('button',{name:'ثبت تیکت جدید'})).not.toBeInTheDocument();fireEvent.change(screen.getByRole('textbox',{name:'از تاریخ'}),{target:{value:'2026-11-25'}});fireEvent.change(screen.getByRole('textbox',{name:'تا تاریخ'}),{target:{value:'2026-11-20'}});expect(await screen.findByText('تاریخ پایان باید پس از شروع باشد.')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'پاکسازی فیلترها'}));await waitFor(()=>expect(screen.queryByText('تاریخ پایان باید پس از شروع باشد.')).toBeNull());await screen.findByText('اشکال در ثبت ملک')})

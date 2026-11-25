import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import ChatPage from './ChatPage'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {DataProvider} from '../../Core/DataProvider'
import {useRealtime} from '../../Core/RealtimeContext'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn(),post:jest.fn(),delete:jest.fn()}}))
jest.mock('../../Core/RealtimeContext',()=>({useRealtime:jest.fn()}))
jest.mock('../Tickets/TicketAttachment',()=>({TicketAttachment:()=> <span>پیوست</span>}))
const chat={id:1,peer:{id:2,full_name:'مخاطب آزمایشی',role:'expert'},properties:[{id:20,kind:'file',title:'آپارتمان نمونه'}],unread_count:2,updated_at:'2026-11-21T10:00:00Z'}
const call=jest.fn(),reload=jest.fn().mockResolvedValue(undefined)
beforeEach(()=>{jest.clearAllMocks();Element.prototype.scrollIntoView=jest.fn();(useRealtime as jest.Mock).mockReturnValue({connected:true,conversations:[chat],reload,send:jest.fn(),startCall:call,error:'',lastEvent:null});(DataProvider.get as jest.Mock).mockImplementation(async path=>({data:path.includes('messages')?{results:[],has_more:false}:chat}));(DataProvider.post as jest.Mock).mockResolvedValue({data:{id:9,conversation:1,sender:1,body:'پیام آزمایشی',created_at:'2026-11-21T10:01:00Z'}})})
function show(){render(<CurrentUserContext.Provider value={{user:{id:1,role:'agency'} as any,setUser:jest.fn()}}><MemoryRouter initialEntries={['/chats?conversation=1']}><ChatPage/></MemoryRouter></CurrentUserContext.Provider>)}
test('redesigned thread preserves message sending and property detail links',async()=>{show();const input=await screen.findByRole('textbox',{name:'متن پیام'});fireEvent.change(input,{target:{value:'پیام آزمایشی'}});fireEvent.click(screen.getByRole('button',{name:'ارسال پیام'}));await waitFor(()=>expect(DataProvider.post).toHaveBeenCalledWith('chats/1/messages/',{data:{body:'پیام آزمایشی'}}));expect(await screen.findByText('پیام آزمایشی')).toBeInTheDocument();expect(screen.getAllByRole('link',{name:/آپارتمان نمونه/})[0]).toHaveAttribute('href','/files?demo=0&detail=20')})
test('quick reply fills the composer without sending and calls retain realtime integration',async()=>{show();await screen.findByRole('textbox',{name:'متن پیام'});fireEvent.click(screen.getByRole('button',{name:'برای بازدید هماهنگ کنیم؟'}));expect(screen.getByRole('textbox',{name:'متن پیام'})).toHaveValue('برای بازدید هماهنگ کنیم؟');expect(DataProvider.post).not.toHaveBeenCalled();fireEvent.click(screen.getAllByRole('button',{name:'تماس صوتی',exact:true})[0]);expect(call).toHaveBeenCalledWith(chat)})
test('failed send preserves the message draft',async()=>{(DataProvider.post as jest.Mock).mockRejectedValue(Error('ارسال ناموفق'));show();const input=await screen.findByRole('textbox',{name:'متن پیام'});fireEvent.change(input,{target:{value:'متن حفظ شود'}});fireEvent.click(screen.getByRole('button',{name:'ارسال پیام'}));await screen.findByText('ارسال ناموفق');expect(input).toHaveValue('متن حفظ شود')})

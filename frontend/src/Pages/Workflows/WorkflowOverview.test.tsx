import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {WorkflowOverview} from './WorkflowOverview'
import {CurrentUserContext} from '../../Core/CurrentUser'
import api from '../../Core/Request'
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('@mui/x-charts/BarChart',()=>({BarChart:()=> <div/>}))
jest.mock('@mui/x-charts/PieChart',()=>({PieChart:()=> <div/>}))
function show(path='/workflows',role='superadmin'){render(<CurrentUserContext.Provider value={{user:{role} as any,setUser:jest.fn()}}><MemoryRouter initialEntries={[path]}><WorkflowOverview/></MemoryRouter></CurrentUserContext.Provider>)}
beforeEach(()=>jest.clearAllMocks())
test('sample operations use no backend, open quick actions and allow local automation preview',async()=>{show('/workflows?demo=1');await screen.findByText('با مشتری آقای محمدی');expect(api.get).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'ایجاد عملیات جدید'}));expect(screen.getByRole('link',{name:'ثبت درخواست ملک'})).toHaveAttribute('href','/requests/create');expect(screen.getByRole('link',{name:'مدیریت دسترسی',hidden:true})).toHaveAttribute('href','/workspace-roles')})
test('live ordinary users do not request management reports or finance and preserve failed-source feedback',async()=>{(api.get as jest.Mock).mockImplementation(async(path:string)=>{if(path.startsWith('tasks/'))throw Error('خطای وظایف');return {data:{data:{counts:{contacts:2},results:[]}}}});show('/workflows','user');await screen.findByText(/خطای وظایف/);expect(screen.queryByRole('link',{name:/مدیریت دسترسی/})).not.toBeInTheDocument();await waitFor(()=>expect(api.get).toHaveBeenCalledWith('workflows/'));expect((api.get as jest.Mock).mock.calls.some(([path])=>/reports|finance/.test(path))).toBe(false);expect(screen.getByRole('checkbox',{name:'توزیع خودکار درخواست‌های جدید'})).toBeDisabled()})

import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {UserDirectory} from '../../Pages/User/UserDirectory'
import {ReminderList} from '../../Pages/Reminder/List/ReminderList'
import {groupOfficeRoles} from '../../Pages/Workflows/WorkspaceRoles'
import {CurrentUserContext} from '../../Core/CurrentUser'
import {DataProvider} from '../../Core/DataProvider'
jest.mock('../../Core/DataProvider',()=>({DataProvider:{get:jest.fn(),patch:jest.fn(),delete:jest.fn()}}))
beforeEach(()=>jest.clearAllMocks())
test('empty office expert directory preserves scoped API and onboarding create route',async()=>{(DataProvider.get as jest.Mock).mockResolvedValue({data:{results:[],total_results:0}});render(<CurrentUserContext.Provider value={{user:{id:7,role:'agency'} as any,setUser:jest.fn()}}><MemoryRouter><UserDirectory role="expert"/></MemoryRouter></CurrentUserContext.Provider>);expect(await screen.findByRole('link',{name:'افزودن اولین کارشناس'})).toHaveAttribute('href','/users/expert/create');expect(DataProvider.get).toHaveBeenCalledWith(expect.stringContaining('users/?group=expert'));expect(screen.getByRole('heading',{name:'کارشناسان دفتر شما'})).toBeInTheDocument()})
test('reminder completion uses the existing personal endpoint and retains API errors',async()=>{(DataProvider.get as jest.Mock).mockResolvedValue({data:{results:[{id:6,title:'تماس با مشتری',description:'هماهنگی بازدید',remind_at:'2099-01-01T10:00:00Z',is_done:false}],total_results:1}});(DataProvider.patch as jest.Mock).mockRejectedValue(Error('عدم دسترسی'));render(<ReminderList/>);fireEvent.click(await screen.findByRole('button',{name:'انجام شد'}));await screen.findByText('عدم دسترسی');expect(DataProvider.patch).toHaveBeenCalledWith('reminders/6/',{data:{is_done:true}});expect(screen.getByText('تماس با مشتری')).toBeInTheDocument()})
test('business role grouping retains all roles per user and separates office memberships',()=>{const result=groupOfficeRoles([{id:1,user_id:7,workspace_id:3,role:'owner'},{id:2,user_id:7,workspace_id:3,role:'finance'},{id:3,user_id:7,workspace_id:4,role:'buyer'}]);expect(result).toHaveLength(2);expect(result[0].roles).toEqual(['owner','finance']);expect(result[1].roles).toEqual(['buyer'])})

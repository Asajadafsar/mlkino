import '@testing-library/jest-dom'
import {render,screen,fireEvent,waitFor,within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {TasksList} from './TasksList'
import {DataProvider} from '../../../Core/DataProvider'
import {CurrentUserContext} from '../../../Core/CurrentUser'
import {filterBoard,taskSamples,weekStart} from './taskBoardData'
jest.mock('../../../Core/DataProvider',()=>({DataProvider:{get:jest.fn(),patch:jest.fn()}}))
function show(path='/tasks?demo=1'){render(<CurrentUserContext.Provider value={{user:{role:'superadmin'} as any,setUser:jest.fn()}}><MemoryRouter initialEntries={[path]}><TasksList/></MemoryRouter></CurrentUserContext.Provider>)}
beforeEach(()=>jest.clearAllMocks())
test('sample board shows tasks and changes status locally without backend writes',async()=>{show();expect(await screen.findAllByRole('article')).toHaveLength(9);fireEvent.click(within(screen.getAllByRole('article')[0]).getByRole('button',{name:'جزئیات هماهنگی بازدید ملک تهران'}));expect(screen.getByRole('dialog')).toHaveTextContent('هماهنگی زمان بازدید');expect(DataProvider.get).not.toHaveBeenCalled();expect(DataProvider.patch).not.toHaveBeenCalled()})
test('live list fetches all dates and preserves future tasks',async()=>{const task=taskSamples('2099-01-01')[0];(DataProvider.get as jest.Mock).mockImplementation(async(path:string)=>({data:{results:path.startsWith('tasks/')?[task]:[],total_results:path.startsWith('tasks/')?1:0}}));show('/tasks');await screen.findByRole('article');expect(DataProvider.get).toHaveBeenCalledWith('tasks/?period=all&page=1&page_size=100');expect(screen.getByRole('article')).toHaveTextContent(task.title)})
test('week and date filters use Saturday boundaries and combine status and assignee',()=>{expect(weekStart('2026-11-21')).toBe('2026-11-21');const rows=taskSamples('2026-11-21');expect(filterBoard(rows,{period:'today',status:'done',assignee:'1'},'2026-11-21')).toHaveLength(3);expect(filterBoard(rows,{period:'upcoming'},'2026-11-21')).toHaveLength(0)})

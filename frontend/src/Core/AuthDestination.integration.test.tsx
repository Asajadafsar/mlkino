import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom'
import {Provider} from 'react-redux'
import {store} from '../redux/store'
import LoginPassword from '../Pages/Auth/Login/LoginPassword'
import axios from 'axios'
jest.mock('axios',()=>({__esModule:true,default:{post:jest.fn()}}))
function Destination(){const location=useLocation();return <output>{location.pathname+location.search}</output>}
test('password login returns to the requested form and preserves its filters',async()=>{
 (axios.post as jest.Mock).mockResolvedValue({data:{data:{user:{role:'user'}}}})
 render(<Provider store={store}><MemoryRouter initialEntries={['/login?next='+encodeURIComponent('/files/create?city=قم')]}><Routes><Route path="/login" element={<LoginPassword/>}/><Route path="/files/create" element={<Destination/>}/></Routes></MemoryRouter></Provider>)
 fireEvent.change(screen.getByLabelText(/شماره تلفن/),{target:{value:'09123456789'}});fireEvent.change(screen.getByLabelText(/^رمز عبور/),{target:{value:'test-password'}});fireEvent.click(screen.getByRole('button',{name:'ورود به حساب'}));await waitFor(()=>expect(screen.getByText('/files/create?city=%D9%82%D9%85')).toBeTruthy())
})

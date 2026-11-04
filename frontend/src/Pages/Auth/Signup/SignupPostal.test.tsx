import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {Provider} from 'react-redux'
import {store} from '../../../redux/store'
import SignupInfo from './SignupInfo'
import axios from 'axios'
import {registerUser} from './authApi'
jest.mock('axios',()=>({__esModule:true,default:{get:jest.fn(),create:()=>({interceptors:{request:{use:jest.fn()},response:{use:jest.fn()}}})}}))
jest.mock('./authApi',()=>({registerUser:jest.fn()}))
test('signup normalizes Persian postal digits, fills submitted address and displays lookup failures',async()=>{
 (axios.get as jest.Mock).mockRejectedValueOnce({response:{data:{message:'استعلام موقتاً در دسترس نیست'}}}).mockResolvedValueOnce({data:{data:{province:'قم',city:'قم',address:'نشانی آزمایشی'}}});(registerUser as jest.Mock).mockResolvedValue({})
 render(<Provider store={store}><MemoryRouter><SignupInfo phone="09123456789" onBack={jest.fn()} initialValues={{first_name:'تست',last_name:'ثبت',national_code:'1234567891',birth_date:'1990-01-01',password:'safe-test-password',password_confirm:'safe-test-password'}}/></MemoryRouter></Provider>)
 fireEvent.click(screen.getByRole('button',{name:'مرحله بعد'}));const postal=await screen.findByLabelText(/^کد پستی/);fireEvent.change(postal,{target:{value:'۱۲۳۴۵۶۷۸۹۰'}});fireEvent.click(screen.getByRole('button',{name:'بررسی کد پستی'}));expect(await screen.findByText('استعلام موقتاً در دسترس نیست')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'بررسی کد پستی'}));await waitFor(()=>expect((screen.getByLabelText('آدرس') as HTMLInputElement).value).toBe('نشانی آزمایشی'));fireEvent.click(screen.getByRole('button',{name:'تکمیل ثبت نام'}));await waitFor(()=>expect(registerUser).toHaveBeenCalledWith(expect.objectContaining({province:'قم',city:'قم',address:'نشانی آزمایشی',postal_code:'1234567890'})))
})

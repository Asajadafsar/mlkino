import {render,screen,fireEvent,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {Provider} from 'react-redux'
import {store} from '../../redux/store'
import LoginPage from './Login/LoginPage'
import SignupPage from './Signup/SignupPage'
import {sendOtp,verifyOtp} from './Signup/authApi'
jest.mock('./Signup/authApi',()=>({sendOtp:jest.fn(),verifyOtp:jest.fn(),registerUser:jest.fn()}))
const renderPage=(page:React.ReactElement)=>render(<Provider store={store}><MemoryRouter>{page}</MemoryRouter></Provider>)
beforeEach(()=>jest.clearAllMocks())
test('login exposes a working password visibility control and OTP method',()=>{renderPage(<LoginPage/>);const input=screen.getByLabelText(/^رمز عبور\s*\*?$/) as HTMLInputElement;expect(input.type).toBe('password');fireEvent.click(screen.getByRole('button',{name:'نمایش رمز'}));expect(input.type).toBe('text');fireEvent.click(screen.getByRole('tab',{name:'ورود با کد یکبارمصرف'}));expect(screen.getByRole('button',{name:'دریافت کد ورود'})).toBeTruthy()})
test('signup retains identity in memory across phone verification and completion',async()=>{(sendOtp as jest.Mock).mockResolvedValue({});(verifyOtp as jest.Mock).mockResolvedValue({});renderPage(<SignupPage/>);for(const [label,value] of [['نام','آزمون'],['نام خانوادگی','توسعه'],['شماره تلفن','۰۹۱۲۳۴۵۶۷۸۹'],['رمز عبور','safe-test-password'],['تکرار رمز عبور','safe-test-password']])fireEvent.change(screen.getByLabelText(new RegExp(`^${label}\\s*\\*?$`)),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'ادامه و دریافت کد تأیید'}));await waitFor(()=>expect(sendOtp).toHaveBeenCalledWith('09123456789'));const first=await screen.findByLabelText('رقم ۱ کد تأیید');fireEvent.paste(first,{clipboardData:{getData:()=> '۱۲۳۴۵۶'}});fireEvent.click(screen.getByRole('button',{name:'تأیید کد',exact:true}));await waitFor(()=>expect(verifyOtp).toHaveBeenCalledWith('09123456789','123456'));expect(await screen.findByRole('heading',{name:'اطلاعات تکمیلی'})).toBeTruthy();expect((screen.getByLabelText(/^نام\s*\*?$/) as HTMLInputElement).value).toBe('آزمون')})

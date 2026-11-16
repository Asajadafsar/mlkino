import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import PasswordOtpFlow from './PasswordOtpFlow'
import api from '../../../Core/Request'
import {ACCOUNTS_URL} from '../../../Core/APP_URL'

jest.mock('../../../Core/Request',()=>({__esModule:true,default:{post:jest.fn()}}))
beforeEach(()=>jest.clearAllMocks())

test.each([false,true])('new password is shown only after SMS verification (authenticated=%s)',async authenticated=>{
 (api.post as jest.Mock).mockResolvedValueOnce({data:{}}).mockResolvedValueOnce({data:{data:{reset_token:'verified-token'}}}).mockResolvedValueOnce({data:{}})
 render(<PasswordOtpFlow authenticated={authenticated} phone="09123456789"/>)
 expect(screen.queryByLabelText(/^رمز جدید$/)).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'ارسال کد تأیید'}))
 const code=await screen.findByLabelText('کد تأیید')
 expect(screen.queryByLabelText(/^رمز جدید$/)).toBeNull()
 fireEvent.change(code,{target:{value:'۱۲۳۴۵'}})
 fireEvent.click(screen.getByRole('button',{name:'تأیید کد'}))
 fireEvent.change(await screen.findByLabelText(/^رمز جدید$/),{target:{value:' new-password '}})
 fireEvent.change(screen.getByLabelText('تکرار رمز جدید'),{target:{value:' new-password '}})
 fireEvent.click(screen.getByRole('button',{name:'ثبت رمز جدید'}))
 await screen.findByText(/رمز با موفقیت تغییر کرد/)
 await waitFor(()=>expect(api.post).toHaveBeenLastCalledWith(`${ACCOUNTS_URL}/password/reset/complete/`,{token:'verified-token',new_password:' new-password ',new_password_confirm:' new-password '}))
 expect(api.post).toHaveBeenNthCalledWith(2,`${ACCOUNTS_URL}/password/${authenticated?'change':'reset'}/verify-otp/`,authenticated?{code:'12345'}:{phone:'09123456789',code:'12345'})
})

import {useState} from 'react'
import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {ProfileDetailsForm} from './ProfileDetailsForm'
import api from '../../Core/Request'
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
jest.mock('react-redux',()=>({useSelector:()=> 'superadmin'}))
function Form(){const [value,onChange]=useState<any>({postal_code:'1234567890',role:'agency'});return <ProfileDetailsForm value={value} onChange={onChange} role="agency"/>}
beforeEach(()=>jest.clearAllMocks())
test('postal lookup fills verified fields with sufficient provider timeout and shows provider errors',async()=>{
 (api.get as jest.Mock).mockRejectedValueOnce({response:{data:{message:'کد پستی یافت نشد'}}}).mockResolvedValueOnce({data:{data:{province:'قم',city:'قم',address:'نشانی آزمایشی'}}})
 render(<Form/>);fireEvent.click(screen.getByRole('button',{name:'استعلام کد پستی'}));expect(await screen.findByText('کد پستی یافت نشد')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'استعلام کد پستی'}));await waitFor(()=>expect((screen.getByLabelText('آدرس') as HTMLInputElement).value).toBe('نشانی آزمایشی'));expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('/postal/lookup/'),{params:{postal_code:'1234567890'},timeout:45000})
})

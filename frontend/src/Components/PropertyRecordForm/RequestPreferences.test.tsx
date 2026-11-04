import {useState} from 'react'
import {act,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {FloorChoices} from './components/CheckboxChoices'
import {PropertyLocationFields} from '../Location/PropertyLocationFields'
import {TechnicalStep} from './steps/TechnicalStep'
import api from '../../Core/Request'
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn()}}))
function FloorForm(){const [value,setValue]=useState<string[]>([]);return <><FloorChoices value={value} onChange={setValue}/><output data-testid="floor-value">{JSON.stringify(value)}</output></>}
test('floor preferences support several checks and other floors excludes special floors',()=>{
 render(<FloorForm/>);fireEvent.click(screen.getByRole('checkbox',{name:'طبقه اول'}));fireEvent.click(screen.getByRole('checkbox',{name:'طبقه آخر'}));expect(screen.getByTestId('floor-value').textContent).toBe('["طبقه اول","طبقه آخر"]');fireEvent.click(screen.getByRole('checkbox',{name:'فرقی نمی‌کند'}));expect(screen.getByTestId('floor-value').textContent).toBe('["فرقی نمی‌کند"]');fireEvent.click(screen.getByRole('checkbox',{name:'سایر طبقات'}));expect(screen.getByTestId('floor-value').textContent).toBe('["سایر طبقات"]')
})
test('request technical fields do not ask occupancy or bathroom',()=>{
 render(<TechnicalStep mode="request" property={{amenities:[],floorPreferences:[]} as any} setProperty={jest.fn()} resource="requests"/>);expect(screen.queryByText('وضعیت اشتغال')).toBeNull();expect(screen.queryByText('حمام')).toBeNull();expect(screen.getByRole('checkbox',{name:'طبقه اول'})).toBeTruthy()
})
function LocationForm(){const [value,setValue]=useState<any>({province:'تهران',county:'تهران',city:'تهران',district:[],neighborhood:[]});return <><PropertyLocationFields property={value} setProperty={setValue} mode="request" resource="requests"/><output data-testid="place-value">{JSON.stringify(value)}</output></>}
test('district selection requests only its neighborhoods and supports multiple checked neighborhoods',async()=>{
 ;(api.get as jest.Mock).mockImplementation(async (_:string,{params}:any)=>({data:{data:{results:params.level==='district'?[{id:4,name:'منطقه ۴'},{id:5,name:'منطقه ۵'}]:params.level==='neighborhood'&&params.districts==='منطقه ۴'?[{id:1,name:'حکیمیه'},{id:2,name:'تهرانپارس'}]:params.level==='province'||params.level==='county'||params.level==='city'?[{id:1,name:'تهران'}]:[]}}}))
 render(<LocationForm/>);await waitFor(()=>expect((screen.getByRole('combobox',{name:'منطقه‌های موردنظر'}) as HTMLInputElement).disabled).toBe(false));fireEvent.mouseDown(screen.getByRole('combobox',{name:'منطقه‌های موردنظر'}));fireEvent.click(await screen.findByRole('option',{name:'منطقه ۴'}));fireEvent.keyDown(screen.getByRole('combobox',{name:'منطقه‌های موردنظر'}),{key:'Escape'});
 await waitFor(()=>expect(api.get).toHaveBeenCalledWith('locations/',expect.objectContaining({params:expect.objectContaining({level:'neighborhood',districts:'منطقه ۴'})})));
 fireEvent.mouseDown(screen.getByRole('combobox',{name:'محله‌های موردنظر'}));fireEvent.click(await screen.findByRole('option',{name:'حکیمیه'}));fireEvent.click(await screen.findByRole('option',{name:'تهرانپارس'}));expect(screen.getByTestId('place-value').textContent).toContain('"neighborhood":["حکیمیه","تهرانپارس"]')
})

test('monthly charge appears only for apartment rental files and requests',async()=>{
 ;(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}})
 const {BaseStep}=require('./steps/BaseStep')
 const property={propertyType:'آپارتمان',contractType:'فروش',district:[],neighborhood:[],virtualTourLink:{}}
 const view=render(<BaseStep mode="request" property={property} setProperty={jest.fn()} resource="requests"/>);
 expect(screen.queryByText(/شارژ ماهانه/)).toBeNull()
 view.rerender(<BaseStep mode="request" property={{...property,contractType:'رهن و اجاره'}} setProperty={jest.fn()} resource="requests"/>);
 expect(screen.getByText(/شارژ ماهانه/)).toBeTruthy()
 view.rerender(<BaseStep mode="file" property={property} setProperty={jest.fn()} resource="files"/>);
 expect(screen.queryByLabelText('شارژ ماهانه')).toBeNull()
 view.rerender(<BaseStep mode="file" property={{...property,contractType:'رهن و اجاره'}} setProperty={jest.fn()} resource="files"/>);
 expect(screen.getByLabelText('شارژ ماهانه')).toBeTruthy()
 await act(async()=>{})
})

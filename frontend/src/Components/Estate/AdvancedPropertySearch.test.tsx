import {useState} from 'react'
import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import AdvancedPropertySearch,{PropertySearchValues,validatePropertySearch} from './AdvancedPropertySearch'
import api from '../../Core/Request'
jest.mock('../../Core/Request',()=>({__esModule:true,default:{get:jest.fn().mockResolvedValue({data:{data:{results:[]}}})}}))
beforeEach(()=>{(api.get as jest.Mock).mockResolvedValue({data:{data:{results:[]}}})})
function Form(){const [values,setValues]=useState<PropertySearchValues>({});return <><AdvancedPropertySearch values={values} onChange={setValues} onSearch={jest.fn()}/><output data-testid="filters">{JSON.stringify(values)}</output></>}
test('supplementary form has one construction field and preserves creator roles through other edits',async()=>{
 render(<Form/>);await waitFor(()=>expect(api.get).toHaveBeenCalled());expect(screen.getByRole('heading',{name:'جستجوی تکمیلی ملک'})).toBeTruthy();expect(screen.getAllByRole('combobox',{name:'سال ساخت'})).toHaveLength(1);expect(screen.queryByText('سن بنا')).toBeNull();expect(screen.queryByText('املاک/کارشناس')).toBeNull();fireEvent.click(screen.getByRole('checkbox',{name:'کارشناس'}));fireEvent.click(screen.getByRole('checkbox',{name:'املاکی'}));fireEvent.change(screen.getByLabelText('متراژ از'),{target:{value:'۱۲۰'}});fireEvent.change(screen.getByRole('combobox',{name:'سال ساخت'}),{target:{value:'1402'}});expect(JSON.parse(screen.getByTestId('filters').textContent!)).toEqual({creatorRoles:'expert|agency',areaFrom:'120',buildYear:'1402'});fireEvent.click(screen.getByRole('button',{name:'پاک‌سازی فیلترها'}));expect(screen.getByTestId('filters').textContent).toBe('{}')
})
test('both numeric ranges are validated before navigation',()=>{expect(validatePropertySearch({areaFrom:'200',areaTo:'100'})).toBe('حداکثر متراژ نباید کمتر از حداقل باشد.');expect(validatePropertySearch({priceFrom:'20',priceTo:'10'})).toBe('حداکثر قیمت نباید کمتر از حداقل باشد.');expect(validatePropertySearch({areaFrom:'100',areaTo:'200'})).toBe('')})

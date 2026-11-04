import {fireEvent,render,screen,within,waitFor} from '@testing-library/react'
import {EstateActivityList} from './EstateActivityList'
const rows=[{id:1,file_name:'آپارتمان سالاریه',full_name:'علی',phone_number:'09120000001',date:'2026-08-15T12:00:00',description:'بازدید',status:'در حال پیگیری'},{id:2,file_name:'ویلای چمران',full_name:'مریم',date:'2026-08-15T12:00:00',description:'تماس',status:'انجام شده'}]
jest.setTimeout(20000)
beforeEach(()=>localStorage.clear())
test('follow-up reference view searches rows, opens details, and edits the selected record',async()=>{
 const save=jest.fn();render(<EstateActivityList kind="follow-ups" rows={rows} onSave={save}/>);
 expect(screen.getByRole('heading',{name:'مدیریت پیگیری‌ها'})).toBeTruthy();fireEvent.change(screen.getByRole('textbox',{name:'جستجو در پیگیری‌ها…'}),{target:{value:'سالاریه'}});expect(screen.queryByText('ویلای چمران')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'مشاهده جزئیات'}));expect(screen.getByRole('dialog')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'بستن'}));
 fireEvent.click(await screen.findByRole('button',{name:'ویرایش آپارتمان سالاریه'}));const dialog=screen.getByRole('dialog');fireEvent.change(within(dialog).getByLabelText(/نام ملک/),{target:{value:'آپارتمان ویرایش‌شده'}});fireEvent.click(within(dialog).getByRole('button',{name:'ذخیره'}));expect(save).toHaveBeenCalledWith(expect.objectContaining({id:1,file_name:'آپارتمان ویرایش‌شده'}))
})
test('contracts show the contract amount and a usable contract detail dialog',()=>{
 render(<EstateActivityList kind="contracts" rows={[{id:8,file_name:'دفتر امین',meeting_manager:'سارا',contract_datetime:'2026-08-15T12:00:00',agreed_price:850000000,description:'توافق طرفین',status:'در انتظار امضا'}]}/>);
 expect(screen.getByRole('heading',{name:'مدیریت قراردادها'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'مشاهده قرارداد'}));expect(within(screen.getByRole('dialog')).getByText('توافق طرفین')).toBeTruthy()
})

test('failed saves retain the draft and allow retry',async()=>{
 const save=jest.fn().mockRejectedValueOnce(new Error('خطای ارتباط')).mockResolvedValueOnce(undefined)
 render(<EstateActivityList kind="contracts" rows={[]} onSave={save}/>);fireEvent.click(screen.getByRole('button',{name:'جدید',exact:true}));fireEvent.change(screen.getByLabelText(/نام ملک/),{target:{value:'قرارداد حفظ‌شده'}});fireEvent.click(screen.getByRole('button',{name:'ذخیره',exact:true}));
 expect(await screen.findByRole('alert')).toBeTruthy();expect((screen.getByLabelText(/نام ملک/) as HTMLInputElement).value).toBe('قرارداد حفظ‌شده');fireEvent.click(screen.getByRole('button',{name:'ذخیره',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(save).toHaveBeenCalledTimes(2)
})

import {render,screen} from '@testing-library/react'
import DatePickerFilter from '../Components/Filter/DatePicker'
import {dateTimeIso,localDateTime,latinDigits} from './PersianDate'
import {formatDate} from './FormatDate'
beforeEach(()=>localStorage.clear())
test('Persian and Arabic digits normalize for APIs',()=>expect(latinDigits('۰۹۱٢٣۴')).toBe('091234'))
test('Tehran wall time roundtrips without browser timezone dependence',()=>{expect(dateTimeIso('2026-10-31 12:00')).toBe('2026-10-31T08:30:00.000Z');expect(localDateTime('2026-10-31T08:30:00Z')).toBe('2026-10-31 12:00')})
test('date fields display Jalali while receiving ISO Gregorian values',()=>{render(<DatePickerFilter mode="controlled" item={{label:'تاریخ سررسید'}} value="2026-10-31" onChange={()=>{}}/>);expect((screen.getByLabelText('تاریخ سررسید') as HTMLInputElement).value).toBe('۱۴۰۵/۰۸/۰۹')})
test('date-time fields display the configured Tehran time in Persian',()=>{render(<DatePickerFilter mode="controlled" withTime item={{label:'زمان'}} value="2026-10-31T08:30:00Z" onChange={()=>{}}/>);expect((screen.getByLabelText('زمان') as HTMLInputElement).value).toBe('۱۴۰۵/۰۸/۰۹ ۱۲:۰۰')})
test('display formatting stays Persian even with a stale Gregorian setting',()=>{localStorage.setItem('mlkino:date-settings',JSON.stringify({dateFormat:'gregorian',timezone:'Asia/Tehran'}));expect(formatDate('2026-10-31T08:30:00Z')).toContain('۱۴۰۵')})

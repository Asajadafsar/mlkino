import {fireEvent,render,screen,within} from '@testing-library/react'
import {useState} from 'react'
import {FieldSettings} from './FieldSettings'
import {FeatureSettings} from './FeatureSettings'
import {SETTINGS_DEFAULTS} from './defaults'
import {fieldVisible} from '../../Components/PropertyRecordForm/FieldScope'
import {drawerItems} from '../../Components/Drawer/DrawerItems'
import featureOptions from './featureOptions.json'
function Form(){const [settings,setSettings]=useState(SETTINGS_DEFAULTS);return <><FieldSettings settings={settings} setSettings={setSettings}/><output data-testid="result">{JSON.stringify(settings.fields)}</output></>}
test('rent and sale fields are independent and sale never offers monthly charge',()=>{
 render(<Form/>);fireEvent.click(screen.getByRole('checkbox',{name:'شارژ ماهانه'}));const fields=JSON.parse(screen.getByTestId('result').textContent!);expect(fieldVisible(fields,'file.rent','monthlyCharge')).toBe(false);expect(fieldVisible(fields,'request.rent','monthlyCharge')).toBe(true)
 fireEvent.mouseDown(screen.getByRole('combobox',{name:/فرم موردنظر/}));fireEvent.click(within(screen.getByRole('listbox')).getByText('درخواست خرید'));expect(screen.queryByRole('checkbox',{name:'شارژ ماهانه'})).toBeNull()
})
test('every sidebar destination except settings has an independently configurable switch',()=>{
 const keys=featureOptions.map(x=>x.link);expect(keys).not.toContain('settings');for(const item of drawerItems.filter(x=>x.link!=='settings'))expect(keys).toContain(item.link)
 render(<FeatureSettings settings={SETTINGS_DEFAULTS} setSettings={jest.fn()}/>);expect(screen.getAllByRole('checkbox').length).toBe(keys.length)
})

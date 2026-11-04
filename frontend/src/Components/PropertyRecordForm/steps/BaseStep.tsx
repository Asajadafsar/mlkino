import {PropertyLocationFields} from '../../Location/PropertyLocationFields'
import {InputAdornment} from '@mui/material'

import {
    CITY_OPTIONS,
    CUSTOMER_OPTIONS,
    DOCUMENT_TYPE_OPTIONS,
    EXPERT_OPTIONS,
    PROPERTY_TYPE_OPTIONS,
    STATUS_OPTIONS,
} from '../constants'
import {MultiValueField} from '../components/MultiValueField'
import {RangeField} from '../components/RangeField'
import {CustomSelectField, CustomTextField, GridProducer} from '../shared'
import type {ModeStepProps} from '../types'
import {asStringArray, toSelectOptions} from '../utils'
import {SelectOption} from '../../Input/CustomSelectField'
import DatePickerFilter from '../../Filter/DatePicker'

// در «رهن و اجاره» علاوه‌بر گزینه‌های عمومی نوع ملک، «تجاری» و «سوله» هم اضافه می‌شود
const MORTGAGE_RENT_EXTRA_PROPERTY_TYPES = ['تجاری', 'سوله']

// گزینه‌های وضعیت اشغال فایل رهن و اجاره
const occupancyStatusOptions: SelectOption[] = [
    {label: 'تخلیه', value: 'تخلیه'},
    {label: 'تاریخ تخلیه', value: 'تاریخ تخلیه'},
]

// گزینه‌های شرایط پیش‌فرض رهن و اجاره
const mortgageTermsOptions: SelectOption[] = [
    {label: 'چک تخلیه می‌دهم', value: 'چک تخلیه می‌دهم'},
    {label: 'اجاره‌ها را چک می‌دهم', value: 'اجاره‌ها را چک می‌دهم'},
    {label: 'کل اجاره را یکجا پرداخت می‌کنم', value: 'کل اجاره را یکجا پرداخت می‌کنم'},
]

export function BaseStep({property, setProperty, resource, mode, editMode}: ModeStepProps) {
    const isMortgageRent = property.contractType === 'رهن و اجاره'
    const propertyTypeOptions = toSelectOptions(
        isMortgageRent
            ? [...PROPERTY_TYPE_OPTIONS, ...MORTGAGE_RENT_EXTRA_PROPERTY_TYPES]
            : PROPERTY_TYPE_OPTIONS,
    )
    // شارژ ماهانه فقط برای «آپارتمان» معنا دارد
    const isApartment = property.propertyType === 'آپارتمان'

    // وضعیت اشغال و شرایط پیش‌فرض رهن و اجاره فقط برای «ثبت فایل» + «رهن و اجاره» معنا دارند
    const isMortgageRentFile = isMortgageRent && mode === 'file'
    // فیلد تاریخ تخلیه فقط وقتی وضعیت اشغال «تاریخ تخلیه» انتخاب شده باشد
    const showVacateDate = isMortgageRentFile && property.occupancyStatus === 'تاریخ تخلیه'

    return (
        <GridProducer
            sx={{marginBottom: '16px'}}
            data={[
                // «وضعیت» فقط برای ثبت فایل معنا دارد
                ...(mode === 'file' && editMode
                    ? [
                          <CustomSelectField
                              key="status"
                              name="status"
                              setData={setProperty}
                              resource={resource}
                              label="وضعیت"
                              defaultValue={property.status}
                              options={toSelectOptions(STATUS_OPTIONS)}
                          />,
                      ]
                    : []),

                ...(mode === 'request' && isMortgageRent
                    ? [
                          <DatePickerFilter
                              key="vacateDate"
                              mode="controlled"
                              item={{label: 'زمان تصرف'}}
                              value={property.vacateDate ?? null}
                              onChange={(value) =>
                                  setProperty((prev) => ({
                                      ...prev,
                                      occupancyDate: value ?? '',
                                  }))
                              }
                          />,
                      ]
                    : []),

                <CustomSelectField
                    key="propertyType"
                    name="propertyType"
                    setData={setProperty}
                    resource={resource}
                    label="نوع ملک"
                    defaultValue={property.propertyType}
                    options={propertyTypeOptions}
                />,

                // شارژ ماهانه فقط وقتی نوع ملک «آپارتمان» باشد نمایش داده می‌شود
                ...(isApartment && isMortgageRent
                    ? [
                          mode === 'request' ? (
                              <RangeField
                                  key="monthlyCharge"
                                  baseName="monthlyCharge"
                                  label="شارژ ماهانه"
                                  unit="تومان"
                                  property={property}
                                  setProperty={setProperty}
                                  resource={resource}
                              />
                          ) : (
                              <CustomTextField
                                  key="monthlyCharge"
                                  name="monthlyCharge"
                                  setData={setProperty}
                                  resource={resource}
                                  label="شارژ ماهانه"
                                  defaultValue={property.monthlyCharge}
                                  thousandSeparator
                                  endIcon={<InputAdornment position="end">تومان</InputAdornment>}
                              />
                          ),
                      ]
                    : []),

                // وضعیت اشغال: فقط در «ثبت فایل» + «رهن و اجاره» نمایش داده می‌شه
                ...(isMortgageRentFile
                    ? [
                          <CustomSelectField
                              key="occupancyStatus"
                              name="occupancyStatus"
                              setData={setProperty}
                              resource={resource}
                              label="وضعیت اشغال"
                              defaultValue={property.occupancyStatus}
                              options={occupancyStatusOptions}
                          />,
                      ]
                    : []),

                // فیلد تاریخ تخلیه فقط وقتی وضعیت اشغال «تاریخ تخلیه» انتخاب شده باشد
                ...(showVacateDate
                    ? [
                          <DatePickerFilter
                              key="vacateDate"
                              mode="controlled"
                              item={{label: 'تاریخ تخلیه'}}
                              value={property.vacateDate ?? null}
                              onChange={(value) =>
                                  setProperty((prev) => ({
                                      ...prev,
                                      vacateDate: value ?? '',
                                  }))
                              }
                          />,
                      ]
                    : []),

                // در «آگهی» شرایط رهن و اجاره گرفته نمی‌شود
                ...(isMortgageRent && mode !== 'ad'
                    ? [
                          <CustomSelectField
                              key="mortgageTerms"
                              name="mortgageTerms"
                              setData={setProperty}
                              resource={resource}
                              label="شرایط پیش‌فرض رهن و اجاره"
                              defaultValue={property.mortgageTerms}
                              options={mortgageTermsOptions}
                          />,
                      ]
                    : []),

                <PropertyLocationFields key="location" property={property} setProperty={setProperty} resource={resource} mode={mode}/>,
                // آدرس دقیق در متن آگهی عمومی نمایش داده نمی‌شود
                ...(mode !== 'file'
                    ? []
                    : [
                          <CustomTextField
                              key="address"
                              name="address"
                              setData={setProperty}
                              resource={resource}
                              label="آدرس"
                              defaultValue={property.address}
                              multiline
                              minRows={3}
                          />,
                      ]),
                ...(mode === 'file'
                    ? [
                          <CustomTextField
                              key="virtualTourLink"
                              name="virtualTourLink"
                              setData={setProperty}
                              resource={resource}
                              label="لینک تور مجازی ایتا"
                              defaultValue={property.virtualTourLink?.eitaa ?? ''}
                              change={e=>setProperty(prev=>({...prev,virtualTourLink:{...prev.virtualTourLink,eitaa:e.target.value}}))}
                          />,
                          <CustomTextField
                              key="virtualTourLink"
                              name="virtualTourLink"
                              setData={setProperty}
                              resource={resource}
                              label="لینک تور مجازی تلگرام"
                              defaultValue={property.virtualTourLink?.telegram ?? ''}
                              change={e=>setProperty(prev=>({...prev,virtualTourLink:{...prev.virtualTourLink,telegram:e.target.value}}))}
                          />,
                          <CustomTextField
                              key="virtualTourLink"
                              name="virtualTourLink"
                              setData={setProperty}
                              resource={resource}
                              label="لینک تور مجازی اینستاگرام"
                              defaultValue={property.virtualTourLink?.instagram ?? ''}
                              change={e=>setProperty(prev=>({...prev,virtualTourLink:{...prev.virtualTourLink,instagram:e.target.value}}))}
                          />,
                          <CustomSelectField
                              key="publicationStatus"
                              name="publicationStatus"
                              setData={setProperty}
                              resource={resource}
                              label="وضعیت"
                              defaultValue={property.publicationStatus}
                              options={toSelectOptions(['منتشر شده', 'پیش‌نویس شده'])}
                          />,
                      ]
                    : []),
            ]}
        />
    )
}

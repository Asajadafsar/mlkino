import {useEffect, useRef, useState} from 'react'
import {InputAdornment} from '@mui/material'

import {RangeField} from '../components/RangeField'
import {CustomSelectField, CustomTextField, GridProducer} from '../shared'
import type {ModeStepProps} from '../types'
import {priceHelperText} from '../utils'
import { SelectOption } from '../../Input/CustomSelectField'

// گزینه‌های نوع وضعیت بودجه در «ثبت فایل» برای رهن و اجاره
type BudgetType = 'رهن کامل' | 'اجاره کامل' | 'رهن و اجاره'

const budgetTypeOptions: SelectOption[] = [
    {label: 'رهن کامل', value: 'رهن کامل'},
    {label: 'اجاره کامل', value: 'اجاره کامل'},
    {label: 'رهن و اجاره', value: 'رهن و اجاره'},
]

export function FinancialStep({property, setProperty, resource, mode}: ModeStepProps) {
    // آخرین مقادیری که پردازش شدن (برای تشخیص اینکه واقعاً چه چیزی تغییر کرده)
    const prevValues = useRef({
        area: property.area,
        totalPrice: property.totalPrice,
        pricePerMeter: property.pricePerMeter,
    })

    // آخرین فیلد قیمتی‌ای که خود کاربر دستی تغییرش داده: 'totalPrice' یا 'pricePerMeter'
    const lastEditedPriceField = useRef<'totalPrice' | 'pricePerMeter' | null>(null)

    // CustomTextField ظاهراً uncontrolled هست (defaultValue می‌گیره)، پس وقتی خودمون
    // مقدارش رو برنامه‌ای عوض می‌کنیم باید مجبورش کنیم دوباره mount بشه تا مقدار
    // جدید رو توی خودِ اینپوت نشون بده. برای همین یه شماره نسخه جدا برای هرکدوم داریم
    // که فقط وقتی خودمون اون فیلد رو محاسبه می‌کنیم بالا می‌ره (نه موقع تایپ کاربر).
    const [totalPriceVersion, setTotalPriceVersion] = useState(0)
    const [pricePerMeterVersion, setPricePerMeterVersion] = useState(0)

    // محاسبه‌ی خودکار قیمت کل / قیمت متری بر اساس متراژ — فقط «ثبت فایل» + «فروش»
    useEffect(() => {
        const isSaleFile = property.contractType === 'فروش' && mode === 'file'

        if (!isSaleFile) {
            // اگر از حالت فروش/فایل خارج شدیم، ردیابی قبلی رو ریست کن تا برگشتن بهش تمیز باشه
            lastEditedPriceField.current = null
            prevValues.current = {
                area: property.area,
                totalPrice: property.totalPrice,
                pricePerMeter: property.pricePerMeter,
            }
            return
        }

        const prev = prevValues.current
        const areaChanged = property.area !== prev.area
        const totalPriceChanged = property.totalPrice !== prev.totalPrice
        const pricePerMeterChanged = property.pricePerMeter !== prev.pricePerMeter

        // هیچی واقعاً عوض نشده (مثلاً کامپوننت به دلیل دیگه‌ای ری‌رندر شده)
        if (!areaChanged && !totalPriceChanged && !pricePerMeterChanged) return

        // ثبت اینکه کاربر کدوم فیلد قیمتی رو دستی عوض کرده
        if (totalPriceChanged) lastEditedPriceField.current = 'totalPrice'
        if (pricePerMeterChanged) lastEditedPriceField.current = 'pricePerMeter'

        const area = Number(property.area) || 0
        const totalPrice = Number(property.totalPrice) || 0
        const pricePerMeter = Number(property.pricePerMeter) || 0

        let nextTotalPrice = property.totalPrice
        let nextPricePerMeter = property.pricePerMeter

        if (area > 0) {
            if (lastEditedPriceField.current === 'totalPrice' && !pricePerMeterChanged) {
                // مبنا: قیمت کل (آخرین چیزی که کاربر زده) + متراژ فعلی => قیمت متری
                const computed = Math.round(totalPrice / area)
                if (computed !== pricePerMeter) {
                    nextPricePerMeter = computed
                    setProperty((prev) => ({...prev, pricePerMeter: computed}))
                    // فیلد قیمت متری رو ری‌مونت کن تا مقدار محاسبه‌شده توی خودِ اینپوت دیده بشه
                    setPricePerMeterVersion((v) => v + 1)
                }
            } else if (lastEditedPriceField.current === 'pricePerMeter' && !totalPriceChanged) {
                // مبنا: قیمت متری (آخرین چیزی که کاربر زده) + متراژ فعلی => قیمت کل
                const computed = Math.round(pricePerMeter * area)
                if (computed !== totalPrice) {
                    nextTotalPrice = computed
                    setProperty((prev) => ({...prev, totalPrice: computed}))
                    // فیلد قیمت کل رو ری‌مونت کن تا مقدار محاسبه‌شده توی خودِ اینپوت دیده بشه
                    setTotalPriceVersion((v) => v + 1)
                }
            }
        }

        // مقدار «محاسبه‌شده» رو همین‌جا به‌عنوان prev ثبت می‌کنیم، نه مقدار خام state رو؛
        // این‌جوری وقتی رندر بعدی با مقدار جدید (که خودمون ست کردیم) بیاد، به اشتباه
        // به‌عنوان «تغییر دستی کاربر» تشخیص داده نمی‌شه.
        prevValues.current = {
            area: property.area,
            totalPrice: nextTotalPrice,
            pricePerMeter: nextPricePerMeter,
        }
    }, [property.area, property.totalPrice, property.pricePerMeter, property.contractType, mode, setProperty])

    // نوع وضعیت بودجه فقط برای «ثبت فایل» + «رهن و اجاره» معنا داره.
    // پیش‌فرض «رهن و اجاره» تا رفتار قبلی (نمایش هر دو فیلد) حفظ بشه.
    const isMortgageRentFile = property.contractType === 'رهن و اجاره' && mode === 'file'
    const budgetType: BudgetType = (property.budgetType as BudgetType) || 'رهن و اجاره'
    const showMortgagePrice = !isMortgageRentFile || budgetType !== 'اجاره کامل'
    const showMonthlyRent = !isMortgageRentFile || budgetType !== 'رهن کامل'

    return (
        <GridProducer
            sx={{marginBottom: '16px'}}
            data={[
                mode === 'request' ? (
                    <RangeField
                        key="area"
                        baseName="area"
                        label="متراژ"
                        unit="متر"
                        property={property}
                        setProperty={setProperty}
                        resource={resource}
                    />
                ) : (
                    <CustomTextField
                        key="area"
                        name="area"
                        setData={setProperty}
                        resource={resource}
                        label="متراژ"
                        defaultValue={property.area}
                        thousandSeparator
                        endIcon={<InputAdornment position="end">متر</InputAdornment>}
                    />
                ),

                /* ---------------- فروش ---------------- */

                ...(property.contractType === 'فروش'
                    ? [
                          mode === 'request' ? (
                              <RangeField
                                  key="totalPrice"
                                  baseName="totalPrice"
                                  label="قیمت کل"
                                  unit="تومان"
                                  property={property}
                                  setProperty={setProperty}
                                  resource={resource}
                              />
                          ) : (
                              <CustomTextField
                                  key={`totalPrice-${totalPriceVersion}`}
                                  name="totalPrice"
                                  setData={setProperty}
                                  resource={resource}
                                  label="قیمت کل"
                                  defaultValue={property.totalPrice}
                                  thousandSeparator
                                  endIcon={<InputAdornment position="end">تومان</InputAdornment>}
                                  helperText={priceHelperText(property.totalPrice)}
                              />
                          ),

                          ...(mode === 'file'
                              ? [
                                    <CustomTextField
                                        key={`pricePerMeter-${pricePerMeterVersion}`}
                                        name="pricePerMeter"
                                        setData={setProperty}
                                        resource={resource}
                                        label="قیمت متری"
                                        defaultValue={property.pricePerMeter}
                                        thousandSeparator
                                        endIcon={
                                            <InputAdornment position="end">تومان</InputAdornment>
                                        }
                                        helperText={priceHelperText(property.pricePerMeter)}
                                    />,
                                ]
                              : []),
                      ]
                    : []),

                /* ------------ رهن و اجاره ------------- */

                ...(property.contractType === 'رهن و اجاره'
                    ? [
                          // نوع وضعیت بودجه: فقط در «ثبت فایل» نمایش داده می‌شه
                          ...(isMortgageRentFile
                              ? [
                                    <CustomSelectField
                                        key="budgetType"
                                        name="budgetType"
                                        setData={setProperty}
                                        resource={resource}
                                        label="نوع وضعیت بودجه"
                                        defaultValue={budgetType}
                                        options={budgetTypeOptions}
                                    />,
                                ]
                              : []),

                          // قیمت رهن — در «رهن کامل» و «رهن و اجاره» نمایش داده می‌شه
                          // (در حالت «اجاره کامل» فقط وقتی mode === 'file' مخفی می‌شه)
                          ...(showMortgagePrice
                              ? [
                                    mode === 'request' ? (
                                        <RangeField
                                            key="mortgagePrice"
                                            baseName="mortgagePrice"
                                            label="قیمت رهن"
                                            unit="تومان"
                                            property={property}
                                            setProperty={setProperty}
                                            resource={resource}
                                        />
                                    ) : (
                                        <CustomTextField
                                            key="mortgagePrice"
                                            name="mortgagePrice"
                                            setData={setProperty}
                                            resource={resource}
                                            label="قیمت رهن"
                                            defaultValue={property.mortgagePrice}
                                            thousandSeparator
                                            endIcon={
                                                <InputAdornment position="end">تومان</InputAdornment>
                                            }
                                            helperText={priceHelperText(property.mortgagePrice)}
                                        />
                                    ),
                                ]
                              : []),

                          // اجاره ماهانه — در «اجاره کامل» و «رهن و اجاره» نمایش داده می‌شه
                          // (در حالت «رهن کامل» فقط وقتی mode === 'file' مخفی می‌شه)
                          ...(showMonthlyRent
                              ? [
                                    mode === 'request' ? (
                                        <RangeField
                                            key="monthlyRent"
                                            baseName="monthlyRent"
                                            label="اجاره ماهانه"
                                            unit="تومان"
                                            property={property}
                                            setProperty={setProperty}
                                            resource={resource}
                                        />
                                    ) : (
                                        <CustomTextField
                                            key="monthlyRent"
                                            name="monthlyRent"
                                            setData={setProperty}
                                            resource={resource}
                                            label="اجاره ماهانه"
                                            defaultValue={property.monthlyRent}
                                            thousandSeparator
                                            endIcon={
                                                <InputAdornment position="end">تومان</InputAdornment>
                                            }
                                            helperText={priceHelperText(property.monthlyRent)}
                                        />
                                    ),
                                ]
                              : []),
                      ]
                    : []),
            ]}
        />
    )
}
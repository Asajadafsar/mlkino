import {Stack} from '@mui/material'

import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {toSelectOptions} from '../../Components/PropertyRecordForm/utils'
import {PROPERTY_TYPE_OPTIONS} from '../../Components/PropertyRecordForm/constants'
import {CustomAutocomplete} from '../../Components/Input/CustomAutoComplete'
import DatePickerFilter from '../../Components/Filter/DatePicker'

export type BudgetRangeType = {
    min: string
    max: string
}

export type TenantsType = {
    id: number

    // =========================
    // اطلاعات پایه
    // =========================

    full_name: string
    phone_number: string

    // =========================
    // فیلدهای مشتری
    // =========================

    status: string

    propertyType: string
    minArea: string
    maxArea: string
    rooms: string

    neighborhoods: string[]
    note: string

    cities: string
    area: string

    employmentStatus: string
    floors: string
    units: string

    // =========================
    // اطلاعات مالی مشتری
    // =========================

    barterAmount: string
    cashAmount: string
    initialPayment: string

    remainingAmount1: string
    remainingDate1: string

    remainingAmount2: string
    remainingDate2: string

    remainingAmount3: string
    remainingDate3: string

    remainingAmount4: string
    remainingDate4: string

    remainingAmount5: string
    remainingDate5: string

    remainingAmount6: string
    remainingDate6: string

    // =========================
    // اطلاعات اختصاصی مستاجر
    // =========================

    budgetStatus: 'رهن کامل' | 'اجاره کامل' | 'رهن و اجاره' | ''

    budget: {
        mortgage: BudgetRangeType
        rent: BudgetRangeType
    }

    defaultConditions: string
    nationality: string
    occupancyDate:string
}

const emptyBudget = {
    mortgage: {
        min: '',
        max: '',
    },
    rent: {
        min: '',
        max: '',
    },
}

export function Tenants({
    tenants,
    setTenants,
    resource,
    editMode = false,
}: {
    tenants: TenantsType
    setTenants: React.Dispatch<React.SetStateAction<TenantsType>>
    resource: string
    editMode?: boolean
}) {
    const budget = tenants.budget ?? emptyBudget

    const budgetFields = () => {
        switch (tenants.budgetStatus) {
            // ============================================
            // رهن کامل
            // ============================================
            case 'رهن کامل':
                return [
                    <CustomTextField
                        key="mortgage-min"
                        name="budget.mortgage.min"
                        setData={setTenants}
                        resource={resource}
                        label="حداقل رهن"
                        defaultValue={budget.mortgage.min}
                    />,
                    <CustomTextField
                        key="mortgage-max"
                        name="budget.mortgage.max"
                        setData={setTenants}
                        resource={resource}
                        label="حداکثر رهن"
                        defaultValue={budget.mortgage.max}
                    />,
                ]

            // ============================================
            // اجاره کامل
            // ============================================
            case 'اجاره کامل':
                return [
                    <CustomTextField
                        key="rent-min"
                        name="budget.rent.min"
                        setData={setTenants}
                        resource={resource}
                        label="حداقل اجاره"
                        defaultValue={budget.rent.min}
                    />,
                    <CustomTextField
                        key="rent-max"
                        name="budget.rent.max"
                        setData={setTenants}
                        resource={resource}
                        label="حداکثر اجاره"
                        defaultValue={budget.rent.max}
                    />,
                ]

            // ============================================
            // رهن و اجاره
            // ============================================
            case 'رهن و اجاره':
                return [
                    <CustomTextField
                        key="mortgage-min"
                        name="budget.mortgage.min"
                        setData={setTenants}
                        resource={resource}
                        label="حداقل رهن"
                        defaultValue={budget.mortgage.min}
                    />,
                    <CustomTextField
                        key="mortgage-max"
                        name="budget.mortgage.max"
                        setData={setTenants}
                        resource={resource}
                        label="حداکثر رهن"
                        defaultValue={budget.mortgage.max}
                    />,
                    <CustomTextField
                        key="rent-min"
                        name="budget.rent.min"
                        setData={setTenants}
                        resource={resource}
                        label="حداقل اجاره"
                        defaultValue={budget.rent.min}
                    />,
                    <CustomTextField
                        key="rent-max"
                        name="budget.rent.max"
                        setData={setTenants}
                        resource={resource}
                        label="حداکثر اجاره"
                        defaultValue={budget.rent.max}
                    />,
                ]

            default:
                return []
        }
    }

    // ============================================
    // فیلدهای مالی مشتری
    // ============================================

    const customerFinancialFields = () => {
        switch (tenants.status) {
            // ============================================
            // تهاتر
            // ============================================
            case 'تهاتر':
                return [
                    <CustomTextField
                        key="barterAmount"
                        name="barterAmount"
                        setData={setTenants}
                        resource={resource}
                        label="میزان تهاتر"
                        defaultValue={tenants.barterAmount}
                    />,

                    <CustomTextField
                        key="cashAmount"
                        name="cashAmount"
                        setData={setTenants}
                        resource={resource}
                        label="میزان نقد / اختلاف تهاتر"
                        defaultValue={tenants.cashAmount}
                    />,
                ]

            // ============================================
            // خرید نقد
            // ============================================
            case 'خرید نقد':
                return [
                    <CustomTextField
                        key="cashAmount"
                        name="cashAmount"
                        setData={setTenants}
                        resource={resource}
                        label="میزان نقدینگی"
                        defaultValue={tenants.cashAmount}
                    />,
                ]

            // ============================================
            // خرید با شرایط یک ماهه
            // ============================================
            case 'خرید با شرایط یک ماهه':
                return [
                    <CustomTextField
                        key="initialPayment"
                        name="initialPayment"
                        setData={setTenants}
                        resource={resource}
                        label="میزان پرداخت اولیه"
                        defaultValue={tenants.initialPayment}
                    />,

                    <CustomTextField
                        key="remainingAmount1"
                        name="remainingAmount1"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۱"
                        defaultValue={tenants.remainingAmount1}
                    />,

                    <DatePickerFilter
                        key="remainingDate1"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت باقی‌مانده ۱'}}
                        value={tenants.remainingDate1}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate1: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount2"
                        name="remainingAmount2"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۲"
                        defaultValue={tenants.remainingAmount2}
                    />,

                    <DatePickerFilter
                        key="remainingDate2"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت باقی‌مانده ۲'}}
                        value={tenants.remainingDate2}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate2: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount3"
                        name="remainingAmount3"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۳"
                        defaultValue={tenants.remainingAmount3}
                    />,

                    <DatePickerFilter
                        key="remainingDate3"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت باقی‌مانده ۳'}}
                        value={tenants.remainingDate3}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate3: value ?? '',
                            }))
                        }
                        withTime
                    />,
                ]

            // ============================================
            // خرید با شرایط تا سه ماهه
            // ============================================
            case 'خرید با شرایط تا سه ماهه':
                return [
                    <CustomTextField
                        key="initialPayment"
                        name="initialPayment"
                        setData={setTenants}
                        resource={resource}
                        label="میزان پرداخت اولیه"
                        defaultValue={tenants.initialPayment}
                    />,

                    <CustomTextField
                        key="remainingAmount1"
                        name="remainingAmount1"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۱"
                        defaultValue={tenants.remainingAmount1}
                    />,

                    <DatePickerFilter
                        key="remainingDate1"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۱'}}
                        value={tenants.remainingDate1}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate1: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount2"
                        name="remainingAmount2"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۲"
                        defaultValue={tenants.remainingAmount2}
                    />,

                    <DatePickerFilter
                        key="remainingDate2"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۲'}}
                        value={tenants.remainingDate2}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate2: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount3"
                        name="remainingAmount3"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۳"
                        defaultValue={tenants.remainingAmount3}
                    />,

                    <DatePickerFilter
                        key="remainingDate3"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۳'}}
                        value={tenants.remainingDate3}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate3: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount4"
                        name="remainingAmount4"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۴"
                        defaultValue={tenants.remainingAmount4}
                    />,

                    <DatePickerFilter
                        key="remainingDate4"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۴'}}
                        value={tenants.remainingDate4}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate4: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount5"
                        name="remainingAmount5"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۵"
                        defaultValue={tenants.remainingAmount5}
                    />,

                    <DatePickerFilter
                        key="remainingDate5"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۵'}}
                        value={tenants.remainingDate5}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate5: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount6"
                        name="remainingAmount6"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۶"
                        defaultValue={tenants.remainingAmount6}
                    />,

                    <DatePickerFilter
                        key="remainingDate6"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۶'}}
                        value={tenants.remainingDate6}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate6: value ?? '',
                            }))
                        }
                        withTime
                    />,
                ]

            // ============================================
            // نقد و تهاتر
            // ============================================
            case 'نقد و تهاتر':
                return [
                    <CustomTextField
                        key="barterAmount"
                        name="barterAmount"
                        setData={setTenants}
                        resource={resource}
                        label="میزان تهاتر"
                        defaultValue={tenants.barterAmount}
                    />,

                    <CustomTextField
                        key="cashAmount"
                        name="cashAmount"
                        setData={setTenants}
                        resource={resource}
                        label="میزان نقدینگی"
                        defaultValue={tenants.cashAmount}
                    />,

                    <CustomTextField
                        key="remainingAmount1"
                        name="remainingAmount1"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۱"
                        defaultValue={tenants.remainingAmount1}
                    />,

                    <DatePickerFilter
                        key="remainingDate1"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۱'}}
                        value={tenants.remainingDate1}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate1: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount2"
                        name="remainingAmount2"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۲"
                        defaultValue={tenants.remainingAmount2}
                    />,

                    <DatePickerFilter
                        key="remainingDate2"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۲'}}
                        value={tenants.remainingDate2}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate2: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount3"
                        name="remainingAmount3"
                        setData={setTenants}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۳"
                        defaultValue={tenants.remainingAmount3}
                    />,

                    <DatePickerFilter
                        key="remainingDate3"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۳'}}
                        value={tenants.remainingDate3}
                        onChange={(value) =>
                            setTenants((prev) => ({
                                ...prev,
                                remainingDate3: value ?? '',
                            }))
                        }
                        withTime
                    />,
                ]

            default:
                return []
        }
    }

    return (
        <Stack>
            {tenants && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        // ============================================
                        // شناسه
                        // ============================================

                        ...(editMode
                            ? [
                                  <CustomTextField
                                      key="id"
                                      name="id"
                                      setData={setTenants}
                                      resource={resource}
                                      label="شناسه"
                                      defaultValue={tenants.id}
                                      disabled
                                  />,
                              ]
                            : []),

                        // ============================================
                        // اطلاعات پایه
                        // ============================================

                        <CustomTextField
                            key="full_name"
                            name="full_name"
                            setData={setTenants}
                            resource={resource}
                            label="نام و نام خانوادگی"
                            defaultValue={tenants.full_name}
                        />,

                        <CustomTextField
                            key="phone_number"
                            name="phone_number"
                            setData={setTenants}
                            resource={resource}
                            label="تلفن"
                            defaultValue={tenants.phone_number}
                        />,

                        // ============================================
                        // فیلدهای اختصاصی مستاجر
                        // ============================================

                        <CustomSelectField
                            key="budgetStatus"
                            name="budgetStatus"
                            setData={setTenants}
                            resource={resource}
                            label="وضعیت بودجه"
                            defaultValue={tenants.budgetStatus}
                            options={toSelectOptions(['رهن کامل', 'اجاره کامل', 'رهن و اجاره'])}
                        />,

                        ...budgetFields(),

                        <CustomSelectField
                            key="defaultConditions"
                            name="defaultConditions"
                            setData={setTenants}
                            resource={resource}
                            label="شرایط پیش‌فرض"
                            defaultValue={tenants.defaultConditions}
                            options={toSelectOptions([
                                'چک تخلیه می‌دهم',
                                'اجاره‌ها را چک می‌دهم',
                                'کل اجاره را یکجا پرداخت می‌کنم',
                            ])}
                        />,

                        <CustomSelectField
                            key="nationality"
                            name="nationality"
                            setData={setTenants}
                            resource={resource}
                            label="ملیت"
                            defaultValue={tenants.nationality}
                            options={toSelectOptions(['ایرانی', 'اتباع'])}
                        />,

                        // ============================================
                        // فیلدهای مشتری
                        // ============================================

                        <CustomSelectField
                            key="status"
                            name="status"
                            setData={setTenants}
                            resource={resource}
                            label="وضعیت خرید"
                            defaultValue={tenants.status}
                            options={toSelectOptions([
                                'تهاتر',
                                'خرید نقد',
                                'خرید با شرایط یک ماهه',
                                'خرید با شرایط تا سه ماهه',
                                'نقد و تهاتر',
                            ])}
                        />,

                        // ============================================
                        // فیلدهای مالی Dynamic مشتری
                        // ============================================

                        ...customerFinancialFields(),

                        // ============================================
                        // مشخصات ملک
                        // ============================================

                        <CustomSelectField
                            key="propertyType"
                            name="propertyType"
                            setData={setTenants}
                            resource={resource}
                            label="نوع ملک"
                            defaultValue={tenants.propertyType}
                            options={toSelectOptions(PROPERTY_TYPE_OPTIONS)}
                        />,

                        <CustomTextField
                            key="minArea"
                            name="minArea"
                            setData={setTenants}
                            resource={resource}
                            label="حداقل متراژ"
                            defaultValue={tenants.minArea}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="maxArea"
                            name="maxArea"
                            setData={setTenants}
                            resource={resource}
                            label="حداکثر متراژ"
                            defaultValue={tenants.maxArea}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="rooms"
                            name="rooms"
                            setData={setTenants}
                            resource={resource}
                            label="تعداد اتاق"
                            defaultValue={tenants.rooms}
                            inputType="number"
                        />,

                        <CustomSelectField
                            key="cities"
                            name="cities"
                            setData={setTenants}
                            resource={resource}
                            label="شهر"
                            defaultValue={tenants.cities}
                            options={toSelectOptions(['قم'])}
                        />,

                        <CustomSelectField
                            key="area"
                            name="area"
                            setData={setTenants}
                            resource={resource}
                            label="منطقه"
                            defaultValue={tenants.area}
                            options={toSelectOptions(['1', '2', '3', '4', '5', '6', '7', '8'])}
                        />,

                        <CustomAutocomplete
                            key="neighborhoods"
                            name="neighborhoods"
                            setData={setTenants}
                            label="محله"
                            multiple
                            maxSelections={10}
                            defaultValue={tenants.neighborhoods}
                            options={[
                                'زنبیل آباد',
                                'آزادگان',
                                'سالاریه',
                                'صفائیه',
                                'بلوار امین',
                                'باجک',
                                'نیروگاه',
                                'پردیسان',
                                'انسجام',
                                'شهرک قدس',
                                'زنبیل آباد شمالی',
                                'جمکران',
                            ]}
                            sx={{
                                width: '100%',
                            }}
                        />,

                        <CustomSelectField
                            key="employmentStatus"
                            name="employmentStatus"
                            setData={setTenants}
                            resource={resource}
                            label="وضعیت اشتغال"
                            defaultValue={tenants.employmentStatus}
                            options={toSelectOptions(['تخلیه', 'مالک', 'مستاجر'])}
                        />,

                        <CustomTextField
                            key="floors"
                            name="floors"
                            setData={setTenants}
                            resource={resource}
                            label="تعداد طبقات"
                            defaultValue={tenants.floors}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="units"
                            name="units"
                            setData={setTenants}
                            resource={resource}
                            label="تعداد واحد در طبقه"
                            defaultValue={tenants.units}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="note"
                            name="note"
                            setData={setTenants}
                            resource={resource}
                            label="یادداشت"
                            defaultValue={tenants.note}
                            multiline
                            rows={4}
                        />,
                         <CustomTextField
                            key="occupanc_date"
                            name="occupancy_date"
                            setData={setTenants}
                            resource={resource}
                            label="تاریخ تصرف"
                            defaultValue={tenants.occupancyDate}
                            inputType="text"
                        />,
                    ]}
                />
            )}
        </Stack>
    )
}

import {Grid, Stack, Typography} from '@mui/material'

import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {toSelectOptions} from '../../Components/PropertyRecordForm/utils'
import {PROPERTY_TYPE_OPTIONS} from '../../Components/PropertyRecordForm/constants'
import {CustomAutocomplete} from '../../Components/Input/CustomAutoComplete'
import DatePickerFilter from '../../Components/Filter/DatePicker'
import {PropertyCard} from '../Files/PropertyCard/PropertyCard'
import ProfileUploader from '../User/ProfileUploader'

export type CustomersType = {
    id: number
    full_name: string
    profileImage?:string | null
    phone_number: string
    status: string
    propertyType: string
    minArea: string
    maxArea: string
    rooms: string
    neighborhoods: string[]
    note: string
    cities: string
    employmentStatus: string
    floors: string
    units: string
    area: string

    // =========================
    // اطلاعات مالی
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
}

export function Customers({
    customers,
    setCustomers,
    resource,
    editMode = false,
}: {
    customers: CustomersType
    setCustomers: React.Dispatch<React.SetStateAction<CustomersType>>
    resource: string
    editMode?: boolean
}) {
    const budgetFields = () => {
        switch (customers.status) {
            // ============================================
            // تهاتر
            // ============================================
            case 'تهاتر':
                return [
                    <CustomTextField
                        key="barterAmount"
                        name="barterAmount"
                        setData={setCustomers}
                        resource={resource}
                        label="میزان تهاتر"
                        defaultValue={customers.barterAmount}
                    />,

                    <CustomTextField
                        key="cashAmount"
                        name="cashAmount"
                        setData={setCustomers}
                        resource={resource}
                        label="میزان نقد / اختلاف تهاتر"
                        defaultValue={customers.cashAmount}
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
                        setData={setCustomers}
                        resource={resource}
                        label="میزان نقدینگی"
                        defaultValue={customers.cashAmount}
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
                        setData={setCustomers}
                        resource={resource}
                        label="میزان پرداخت اولیه"
                        defaultValue={customers.initialPayment}
                    />,

                    <CustomTextField
                        key="remainingAmount1"
                        name="remainingAmount1"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۱"
                        defaultValue={customers.remainingAmount1}
                    />,

                    <DatePickerFilter
                        key="remainingDate1"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت باقی‌مانده ۱'}}
                        value={customers.remainingDate1}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate1: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount2"
                        name="remainingAmount2"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۲"
                        defaultValue={customers.remainingAmount2}
                    />,

                    <DatePickerFilter
                        key="remainingDate2"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت باقی‌مانده ۲'}}
                        value={customers.remainingDate2}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate2: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount3"
                        name="remainingAmount3"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۳"
                        defaultValue={customers.remainingAmount3}
                    />,

                    <DatePickerFilter
                        key="remainingDate3"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت باقی‌مانده ۳'}}
                        value={customers.remainingDate3}
                        onChange={(value) =>
                            setCustomers((prev) => ({
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
                        setData={setCustomers}
                        resource={resource}
                        label="میزان پرداخت اولیه"
                        defaultValue={customers.initialPayment}
                    />,

                    <CustomTextField
                        key="remainingAmount1"
                        name="remainingAmount1"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۱"
                        defaultValue={customers.remainingAmount1}
                    />,

                    <DatePickerFilter
                        key="remainingDate1"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۱'}}
                        value={customers.remainingDate1}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate1: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount2"
                        name="remainingAmount2"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۲"
                        defaultValue={customers.remainingAmount2}
                    />,

                    <DatePickerFilter
                        key="remainingDate2"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۲'}}
                        value={customers.remainingDate2}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate2: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount3"
                        name="remainingAmount3"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۳"
                        defaultValue={customers.remainingAmount3}
                    />,

                    <DatePickerFilter
                        key="remainingDate3"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۳'}}
                        value={customers.remainingDate3}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate3: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount4"
                        name="remainingAmount4"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۴"
                        defaultValue={customers.remainingAmount4}
                    />,

                    <DatePickerFilter
                        key="remainingDate4"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۴'}}
                        value={customers.remainingDate4}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate4: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount5"
                        name="remainingAmount5"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۵"
                        defaultValue={customers.remainingAmount5}
                    />,

                    <DatePickerFilter
                        key="remainingDate5"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۵'}}
                        value={customers.remainingDate5}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate5: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount6"
                        name="remainingAmount6"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۶"
                        defaultValue={customers.remainingAmount6}
                    />,

                    <DatePickerFilter
                        key="remainingDate6"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۶'}}
                        value={customers.remainingDate6}
                        onChange={(value) =>
                            setCustomers((prev) => ({
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
                        setData={setCustomers}
                        resource={resource}
                        label="میزان تهاتر"
                        defaultValue={customers.barterAmount}
                    />,

                    <CustomTextField
                        key="cashAmount"
                        name="cashAmount"
                        setData={setCustomers}
                        resource={resource}
                        label="میزان نقدینگی"
                        defaultValue={customers.cashAmount}
                    />,

                    <CustomTextField
                        key="remainingAmount1"
                        name="remainingAmount1"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۱"
                        defaultValue={customers.remainingAmount1}
                    />,

                    <DatePickerFilter
                        key="remainingDate1"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۱'}}
                        value={customers.remainingDate1}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate1: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount2"
                        name="remainingAmount2"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۲"
                        defaultValue={customers.remainingAmount2}
                    />,

                    <DatePickerFilter
                        key="remainingDate2"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۲'}}
                        value={customers.remainingDate2}
                        onChange={(value) =>
                            setCustomers((prev) => ({
                                ...prev,
                                remainingDate2: value ?? '',
                            }))
                        }
                        withTime
                    />,

                    <CustomTextField
                        key="remainingAmount3"
                        name="remainingAmount3"
                        setData={setCustomers}
                        resource={resource}
                        label="مبلغ باقی‌مانده ۳"
                        defaultValue={customers.remainingAmount3}
                    />,

                    <DatePickerFilter
                        key="remainingDate3"
                        mode="controlled"
                        item={{label: 'تاریخ پرداخت ۳'}}
                        value={customers.remainingDate3}
                        onChange={(value) =>
                            setCustomers((prev) => ({
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
    const requestData = [
        // ---------- فروش ----------
        {
            id: 1,
            propertyType: 'آپارتمان',
            contractType: 'فروش',
            city: 'تهران',
            district: ['منطقه ۱', 'منطقه ۲'],
            neighborhood: ['زعفرانیه', 'الهیه'],
            areaFrom: 90,
            areaTo: 130,
            totalPriceFrom: 5000000000,
            totalPriceTo: 7500000000,
            roomCount: 2,
            requesterName: 'علی محمدی',
            requesterPhone: '09121234567',
        },
        {
            id: 3,
            propertyType: 'زمین',
            contractType: 'فروش',
            city: 'شیراز',
            district: ['معالی‌آباد'],
            neighborhood: [],
            areaFrom: 300,
            areaTo: 400,
            totalPriceFrom: 10000000000,
            totalPriceTo: 14000000000,
            roomCount: 0,
            requesterName: 'رضا کریمی',
            requesterPhone: '09131234567',
        },
        {
            id: 4,
            propertyType: 'مغازه',
            contractType: 'فروش',
            city: 'اصفهان',
            district: ['خیابان چهارباغ'],
            neighborhood: ['نقش جهان'],
            areaFrom: 40,
            areaTo: 60,
            totalPriceFrom: 3000000000,
            totalPriceTo: 4500000000,
            roomCount: 1,
            requesterName: 'مریم صادقی',
            requesterPhone: '09141234567',
        },
    ]

    return (
        <Stack>
            {/* <Stack
                sx={{
                    width: '100%',
                    marginBottom: '16px',
                }}
            >
                <ProfileUploader user={customers} setUser={setCustomers} />
            </Stack> */}
            {customers && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        ...(editMode
                            ? [
                                  <CustomTextField
                                      key="id"
                                      name="id"
                                      setData={setCustomers}
                                      resource={resource}
                                      label="شناسه"
                                      defaultValue={customers.id}
                                      disabled
                                  />,
                              ]
                            : []),

                        <CustomTextField
                            key="full_name"
                            name="full_name"
                            setData={setCustomers}
                            resource={resource}
                            label="نام و نام خانوادگی"
                            defaultValue={customers.full_name}
                        />,

                        <CustomTextField
                            key="phone_number"
                            name="phone_number"
                            setData={setCustomers}
                            resource={resource}
                            label="تلفن"
                            defaultValue={customers.phone_number}
                        />,

                        <CustomSelectField
                            key="status"
                            name="status"
                            setData={setCustomers}
                            resource={resource}
                            label="وضعیت خرید"
                            defaultValue={customers.status}
                            options={toSelectOptions([
                                'تهاتر',
                                'خرید نقد',
                                'خرید با شرایط یک ماهه',
                                'خرید با شرایط تا سه ماهه',
                                'نقد و تهاتر',
                            ])}
                        />,

                        // ============================================
                        // فیلدهای مالی Dynamic
                        // ============================================

                        ...budgetFields(),

                        <CustomSelectField
                            key="propertyType"
                            name="propertyType"
                            setData={setCustomers}
                            resource={resource}
                            label="نوع ملک"
                            defaultValue={customers.propertyType}
                            options={toSelectOptions(PROPERTY_TYPE_OPTIONS)}
                        />,

                        <CustomTextField
                            key="minArea"
                            name="minArea"
                            setData={setCustomers}
                            resource={resource}
                            label="حداقل متراژ"
                            defaultValue={customers.minArea}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="maxArea"
                            name="maxArea"
                            setData={setCustomers}
                            resource={resource}
                            label="حداکثر متراژ"
                            defaultValue={customers.maxArea}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="rooms"
                            name="rooms"
                            setData={setCustomers}
                            resource={resource}
                            label="تعداد اتاق"
                            defaultValue={customers.rooms}
                            inputType="number"
                        />,

                        <CustomSelectField
                            key="cities"
                            name="cities"
                            setData={setCustomers}
                            resource={resource}
                            label="شهر"
                            defaultValue={customers.cities}
                            options={toSelectOptions(['قم'])}
                        />,

                        <CustomSelectField
                            key="area"
                            name="area"
                            setData={setCustomers}
                            resource={resource}
                            label="منطقه"
                            defaultValue={customers.area}
                            options={toSelectOptions(['1', '2', '3', '4', '5', '6', '7', '8'])}
                        />,

                        <CustomAutocomplete
                            key="neighborhoods"
                            name="neighborhoods"
                            setData={setCustomers}
                            label="محله"
                            multiple
                            maxSelections={10}
                            defaultValue={customers.neighborhoods}
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
                            setData={setCustomers}
                            resource={resource}
                            label="وضعیت اشتغال"
                            defaultValue={customers.employmentStatus}
                            options={toSelectOptions(['تخلیه', 'مالک', 'مستاجر'])}
                        />,

                        <CustomTextField
                            key="floors"
                            name="floors"
                            setData={setCustomers}
                            resource={resource}
                            label="تعداد طبقات"
                            defaultValue={customers.floors}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="units"
                            name="units"
                            setData={setCustomers}
                            resource={resource}
                            label="تعداد واحد در طبقه"
                            defaultValue={customers.units}
                            inputType="number"
                        />,

                        <CustomTextField
                            key="note"
                            name="note"
                            setData={setCustomers}
                            resource={resource}
                            label="یادداشت"
                            defaultValue={customers.note}
                            multiline
                            rows={4}
                        />,
                    ]}
                />
            )}
            <Typography variant="body2" color="initial" fontWeight={'bold'} my={3}>
                درخواست ها:
            </Typography>
            <Grid container spacing={2.5}>
                {requestData.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <PropertyCard item={item} mode="request" />
                    </Grid>
                ))}
            </Grid>
        </Stack>
    )
}

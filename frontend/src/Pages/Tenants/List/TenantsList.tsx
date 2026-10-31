import {Typography} from '@mui/material'
import TableCell from '@mui/material/TableCell'
import {useState} from 'react'
import {useQueryParams} from 'use-query-params'

import {createCardField} from '../../../Components/Card/CustomCard'
import {CustomCardList} from '../../../Components/Card/CustomCardList'
import {CustomTable} from '../../../Components/Table/CustomTable'
import {createTableHeadCells} from '../../../Components/Table/CustomTableHead'
import {ListPage} from '../../../Components/Table/ListPage'
import {createQueryParam} from '../../../Core/QueryParams'
import {TenantsType} from '../Tenants'

const RESOURCE = 'tenants'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('نام و نام خانوادگی', 'full_name'),
    createTableHeadCells('تلفن', 'phone_number'),
    createTableHeadCells('شهر', 'cities'),
    createTableHeadCells('محله', 'neighborhoods'),
    createTableHeadCells('وضعیت بودجه', 'budgetStatus'),
    createTableHeadCells('بازه رهن', 'budget.mortgage'),
    createTableHeadCells('بازه اجاره', 'budget.rent'),
    createTableHeadCells('ملیت', 'budget.rent'),
    createTableHeadCells('تاریخ تصرف', 'occupancyDate'),
]

const queryNames = tableHeadCells.slice(1,3).map((cell) => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))

const formatRange = (min: string, max: string) => {
    if (!min && !max) return '--'
    if (!min) return `تا ${max}`
    if (!max) return `از ${min}`
    return `${min} - ${max}`
}

const neighborhoodsText = (item: TenantsType) =>
    Array.isArray(item.neighborhoods) ? item.neighborhoods.join('، ') : item.neighborhoods || '--'

const cellText = (value: any) => (
    <Typography
        variant="body2"
        sx={{
            whiteSpace: 'nowrap',
            fontSize: {xs: '13px', sm: '14px', md: '16px', xl: '17px'},
        }}
    >
        {value || '--'}
    </Typography>
)

/** همان ستون‌ها، اما برای بدنه‌ی کارت. نام و تلفن در سربرگ کارت می‌آیند پس اینجا تکرار نشده */
const cardFields = [
    createCardField('شهر', 'cities'),
    createCardField('محله', 'neighborhoods', {render: (row) => neighborhoodsText(row)}),
    createCardField('وضعیت بودجه', 'budgetStatus'),
    createCardField('ملیت', 'nationality'),
    createCardField('بازه رهن', 'mortgage', {
        render: (row) => formatRange(row.budget.mortgage.min, row.budget.mortgage.max),
    }),
    createCardField('بازه اجاره', 'rent', {
        render: (row) => formatRange(row.budget.rent.min, row.budget.rent.max),
    }),
    createCardField('تاریخ تصرف', 'occupancyDate'),
]

export function TenantsList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))

    const [loading] = useState(false)

    const [tenants] = useState<{
        total_results: number
        data: TenantsType[]
    }>({
        total_results: 5,
        data: [
            {
                id: 1,
                full_name: 'علی رضایی',
                phone_number: '09125463121',

                cities: 'قم',
                neighborhoods: ['زنبیل آباد', 'سالاریه'],

                budgetStatus: 'رهن کامل',

                budget: {
                    mortgage: {
                        min: '500 میلیون',
                        max: '800 میلیون',
                    },
                    rent: {
                        min: '',
                        max: '',
                    },
                },

                defaultConditions: 'چک تخلیه می‌دهم',
                nationality: 'ایرانی',

                status: 'خرید نقد',
                propertyType: 'آپارتمان',
                minArea: '80',
                maxArea: '120',
                rooms: '2',
                area: '1',
                employmentStatus: 'مالک',
                floors: '4',
                units: '2',
                note: 'واحد نورگیر و نزدیک مرکز شهر',

                barterAmount: '',
                cashAmount: '1 میلیارد',
                initialPayment: '',

                remainingAmount1: '',
                remainingDate1: '',
                remainingAmount2: '',
                remainingDate2: '',
                remainingAmount3: '',
                remainingDate3: '',
                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
                occupancyDate:'1405/3/2'
            },

            {
                id: 2,
                full_name: 'محمد احمدی',
                phone_number: '09105463121',

                cities: 'قم',
                neighborhoods: ['آزادگان'],

                budgetStatus: 'اجاره کامل',

                budget: {
                    mortgage: {
                        min: '',
                        max: '',
                    },
                    rent: {
                        min: '10 میلیون',
                        max: '20 میلیون',
                    },
                },

                defaultConditions: 'اجاره‌ها را چک می‌دهم',
                nationality: 'ایرانی',

                status: 'خرید با شرایط یک ماهه',
                propertyType: 'آپارتمان',
                minArea: '70',
                maxArea: '100',
                rooms: '2',
                area: '3',
                employmentStatus: 'مستاجر',
                floors: '5',
                units: '3',
                note: 'ترجیحاً پارکینگ و آسانسور داشته باشد',

                barterAmount: '',
                cashAmount: '',
                initialPayment: '500 میلیون',

                remainingAmount1: '300 میلیون',
                remainingDate1: '1405/07/15',

                remainingAmount2: '',
                remainingDate2: '',
                remainingAmount3: '',
                remainingDate3: '',
                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
                occupancyDate:'1405/3/2'
            },

            {
                id: 3,
                full_name: 'رضا کریمی',
                phone_number: '09123456789',

                cities: 'قم',
                neighborhoods: ['صفائیه', 'بلوار امین'],

                budgetStatus: 'رهن و اجاره',

                budget: {
                    mortgage: {
                        min: '300 میلیون',
                        max: '600 میلیون',
                    },
                    rent: {
                        min: '5 میلیون',
                        max: '12 میلیون',
                    },
                },

                defaultConditions: 'کل اجاره را یکجا پرداخت می‌کنم',
                nationality: 'ایرانی',

                status: 'نقد و تهاتر',
                propertyType: 'آپارتمان',
                minArea: '100',
                maxArea: '150',
                rooms: '3',
                area: '2',
                employmentStatus: 'مالک',
                floors: '6',
                units: '2',
                note: 'واحد نوساز اولویت دارد',

                barterAmount: '700 میلیون',
                cashAmount: '500 میلیون',
                initialPayment: '',

                remainingAmount1: '200 میلیون',
                remainingDate1: '1405/08/01',

                remainingAmount2: '',
                remainingDate2: '',
                remainingAmount3: '',
                remainingDate3: '',
                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
                occupancyDate:'1405/3/2'
            },

            {
                id: 4,
                full_name: 'سجاد موسوی',
                phone_number: '09351234567',

                cities: 'قم',
                neighborhoods: ['پردیسان'],

                budgetStatus: 'رهن کامل',

                budget: {
                    mortgage: {
                        min: '800 میلیون',
                        max: '1.2 میلیارد',
                    },
                    rent: {
                        min: '',
                        max: '',
                    },
                },

                defaultConditions: 'چک تخلیه می‌دهم',
                nationality: 'اتباع',

                status: 'خرید نقد',
                propertyType: 'ویلایی',
                minArea: '150',
                maxArea: '250',
                rooms: '3',
                area: '7',
                employmentStatus: 'مالک',
                floors: '2',
                units: '1',
                note: 'حیاط مستقل داشته باشد',

                barterAmount: '',
                cashAmount: '2 میلیارد',
                initialPayment: '',

                remainingAmount1: '',
                remainingDate1: '',
                remainingAmount2: '',
                remainingDate2: '',
                remainingAmount3: '',
                remainingDate3: '',
                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
                occupancyDate:'1405/3/2'
            },

            {
                id: 5,
                full_name: 'حسین محمدی',
                phone_number: '09191234567',

                cities: 'قم',
                neighborhoods: ['جمکران', 'انسجام'],

                budgetStatus: 'رهن و اجاره',

                budget: {
                    mortgage: {
                        min: '200 میلیون',
                        max: '400 میلیون',
                    },
                    rent: {
                        min: '8 میلیون',
                        max: '15 میلیون',
                    },
                },

                defaultConditions: 'اجاره‌ها را چک می‌دهم',
                nationality: 'ایرانی',

                status: 'تهاتر',
                propertyType: 'آپارتمان',
                minArea: '60',
                maxArea: '90',
                rooms: '2',
                area: '4',
                employmentStatus: 'مستاجر',
                floors: '4',
                units: '3',
                note: 'نزدیک مدرسه و امکانات شهری',

                barterAmount: '400 میلیون',
                cashAmount: '200 میلیون',
                initialPayment: '',

                remainingAmount1: '',
                remainingDate1: '',
                remainingAmount2: '',
                remainingDate2: '',
                remainingAmount3: '',
                remainingDate3: '',
                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
                occupancyDate:'1405/3/2'
            },
        ],
    })

    const getTenants = () => {}

    // پراپ‌های مشترک بین جدول و کارت
    const shared = {
        title: 'مستأجر',
        resource: RESOURCE,
        rows: tenants.data,
        count: tenants.total_results,
        params: search,
        setParams: setSearch,
        loading,
        getList: getTenants,
        hasDetail: true,
    }

    return (
        <ListPage
            viewKey={RESOURCE}
            defaultView="card"
            header="مدیریت مستأجرها"
            href={`/landlord-tenant/tenants/create`}
            searchField="full_name"
            searchText="نام"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={getTenants}
            filtersData={queryNames}
            noCreate
            defaultState={{name: ''}}
        >
            {(view) =>
                view === 'card' ? (
                    <CustomCardList
                        {...shared}
                        fields={cardFields}
                        columns={{xs: 1, sm: 2, md: 3, xl: 4}}
                        renderers={{
                            title: (row) => row.full_name || '--',
                            subtitle: (row) => row.phone_number || '--',
                        }}
                    />
                ) : (
                    <CustomTable
                        {...shared}
                        headCells={tableHeadCells}
                        handleSort={getTenants}
                        tableBodyCells={tenants.data.map((item) => (
                            <>
                                <TableCell key={`${item.id}-id`}>{cellText(item.id)}</TableCell>

                                <TableCell key={`${item.id}-full_name`}>
                                    {cellText(item.full_name)}
                                </TableCell>

                                <TableCell key={`${item.id}-phone_number`}>
                                    {cellText(item.phone_number)}
                                </TableCell>

                                <TableCell key={`${item.id}-cities`}>
                                    {cellText(item.cities)}
                                </TableCell>

                                <TableCell key={`${item.id}-neighborhoods`}>
                                    {cellText(neighborhoodsText(item))}
                                </TableCell>

                                <TableCell key={`${item.id}-budgetStatus`}>
                                    {cellText(item.budgetStatus)}
                                </TableCell>

                                <TableCell key={`${item.id}-mortgage`}>
                                    {cellText(
                                        formatRange(
                                            item.budget.mortgage.min,
                                            item.budget.mortgage.max,
                                        ),
                                    )}
                                </TableCell>

                                <TableCell key={`${item.id}-rent`}>
                                    {cellText(
                                        formatRange(item.budget.rent.min, item.budget.rent.max),
                                    )}
                                </TableCell>

                                <TableCell key={`${item.id}-nationality`}>
                                    {cellText(item.nationality)}
                                </TableCell>
                                 <TableCell key={`${item.id}-occupancyDate`}>
                                    {cellText(item.occupancyDate)}
                                </TableCell>
                            </>
                        ))}
                    />
                )
            }
        </ListPage>
    )
}
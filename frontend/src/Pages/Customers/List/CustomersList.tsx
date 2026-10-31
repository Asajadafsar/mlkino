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
import {CustomersType} from '../Customers'

const RESOURCE = 'customers'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('نام و نام خانوادگی', 'full_name'),
    createTableHeadCells('تلفن', 'phone_number'),
    createTableHeadCells('وضعیت', 'status'),
    createTableHeadCells('نوع ملک', 'propertyType'),
    createTableHeadCells('متراژ', 'areaRange'),
    createTableHeadCells('شرایط مالی', 'financial'),
    createTableHeadCells('اتاق', 'rooms'),
    createTableHeadCells('شهر', 'cities'),
    createTableHeadCells('منطقه', 'area'),
    createTableHeadCells('محله', 'neighborhoods'),
]

const queryNames = tableHeadCells.slice(1,3).map(cell => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))

function formatNumber(value: string): string {
    const number = Number(value)
    if (Number.isNaN(number)) return value
    return new Intl.NumberFormat('fa-IR').format(number)
}

/** متن شرایط مالی — بدون هیچ Typography/Wrapperی، تا هم در سلول جدول و هم در کارت قابل استفاده باشد */
function financialText(customer: CustomersType): string {
    switch (customer.status) {
        case 'تهاتر':
        case 'نقد و تهاتر': {
            const parts: string[] = []
            if (customer.barterAmount) parts.push(`تهاتر: ${formatNumber(customer.barterAmount)} تومان`)
            if (customer.cashAmount) parts.push(`نقد: ${formatNumber(customer.cashAmount)} تومان`)
            return parts.length ? parts.join(' | ') : '--'
        }
        case 'خرید نقد':
            return customer.cashAmount
                ? `نقدینگی: ${formatNumber(customer.cashAmount)} تومان`
                : '--'
        case 'خرید با شرایط یک ماهه':
        case 'خرید با شرایط تا سه ماهه':
            return customer.initialPayment
                ? `اولیه: ${formatNumber(customer.initialPayment)} تومان`
                : '--'
        default:
            return '--'
    }
}

function areaRangeText(item: CustomersType): string {
    if (item.minArea && item.maxArea) return `${item.minArea} تا ${item.maxArea} متر`
    if (item.minArea) return `از ${item.minArea} متر`
    if (item.maxArea) return `تا ${item.maxArea} متر`
    return '--'
}

/** فیلدهای بدنه‌ی کارت. نام و تلفن در سربرگ کارت (renderers.title/subtitle) می‌آیند */
const cardFields = [
    createCardField('وضعیت', 'status'),
    createCardField('نوع ملک', 'propertyType'),
    createCardField('متراژ', 'areaRange', {render: (row) => areaRangeText(row)}),
    createCardField('اتاق', 'rooms', {render: (row) => (row.rooms ? `${row.rooms} اتاق` : '--')}),
    createCardField('شهر', 'cities'),
    createCardField('منطقه', 'area', {render: (row) => (row.area ? `منطقه ${row.area}` : '--')}),
    createCardField('محله', 'neighborhoods', {
        render: (row) => row.neighborhoods?.join('، ') || '--',
    }),
    createCardField('شرایط مالی', 'financial', {
        render: (row) => financialText(row),
        fullWidth: true,
    }),
]

export function CustomersList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading] = useState(false)

    const [customers] = useState<{
        total_results: number
        data: CustomersType[]
    }>({
        total_results: 5,

        data: [
            {
                id: 1,
                full_name: 'علی رضایی',
                phone_number: '09121234567',
                status: 'تهاتر',
                propertyType: 'آپارتمان',
                minArea: '80',
                maxArea: '150',
                rooms: '2',
                neighborhoods: ['سعادت آباد'],
                note: 'به دنبال آپارتمان دو خوابه با پارکینگ است.',
                cities: 'قم',
                employmentStatus: 'مالک',
                floors: '5',
                units: '2',
                area: '1',

                barterAmount: '3000000000',
                cashAmount: '2000000000',
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
            },

            {
                id: 2,
                full_name: 'محمد احمدی',
                phone_number: '09129876543',
                status: 'خرید نقد',
                propertyType: 'آپارتمان',
                minArea: '70',
                maxArea: '120',
                rooms: '2',
                neighborhoods: ['پونک'],
                note: 'ترجیحاً واحد نوساز و نزدیک مترو باشد.',
                cities: 'قم',
                employmentStatus: 'مستاجر',
                floors: '4',
                units: '3',
                area: '2',

                barterAmount: '',
                cashAmount: '5000000000',
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
            },

            {
                id: 3,
                full_name: 'سارا کریمی',
                phone_number: '09351234567',
                status: 'خرید با شرایط یک ماهه',
                propertyType: 'ویلایی',
                minArea: '150',
                maxArea: '300',
                rooms: '3',
                neighborhoods: ['لواسان'],
                note: 'به دنبال ویلای مستقل با حیاط بزرگ است.',
                cities: 'قم',
                employmentStatus: 'مالک',
                floors: '2',
                units: '1',
                area: '3',

                barterAmount: '',
                cashAmount: '',
                initialPayment: '4000000000',

                remainingAmount1: '2000000000',
                remainingDate1: '1405/07/01',

                remainingAmount2: '2000000000',
                remainingDate2: '1405/07/15',

                remainingAmount3: '1000000000',
                remainingDate3: '1405/07/30',

                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
            },

            {
                id: 4,
                full_name: 'رضا مرادی',
                phone_number: '09105555555',
                status: 'خرید با شرایط تا سه ماهه',
                propertyType: 'آپارتمان',
                minArea: '90',
                maxArea: '130',
                rooms: '2',
                neighborhoods: ['تهرانپارس'],
                note: 'قصد فروش واحد مسکونی خود را دارد.',
                cities: 'قم',
                employmentStatus: 'مالک',
                floors: '6',
                units: '2',
                area: '4',

                barterAmount: '',
                cashAmount: '',
                initialPayment: '3000000000',

                remainingAmount1: '1000000000',
                remainingDate1: '1405/07/01',

                remainingAmount2: '1000000000',
                remainingDate2: '1405/07/15',

                remainingAmount3: '1000000000',
                remainingDate3: '1405/08/01',

                remainingAmount4: '1000000000',
                remainingDate4: '1405/08/15',

                remainingAmount5: '1000000000',
                remainingDate5: '1405/09/01',

                remainingAmount6: '1000000000',
                remainingDate6: '1405/09/15',
            },

            {
                id: 5,
                full_name: 'نگار حسینی',
                phone_number: '09221234567',
                status: 'نقد و تهاتر',
                propertyType: 'آپارتمان',
                minArea: '60',
                maxArea: '100',
                rooms: '1',
                neighborhoods: ['جنت آباد'],
                note: 'در صورت پیدا شدن گزینه مناسب مجدداً پیگیری شود.',
                cities: 'قم',
                employmentStatus: 'مستاجر',
                floors: '3',
                units: '4',
                area: '5',

                barterAmount: '1500000000',
                cashAmount: '1000000000',
                initialPayment: '',

                remainingAmount1: '500000000',
                remainingDate1: '1405/07/10',

                remainingAmount2: '500000000',
                remainingDate2: '1405/08/10',

                remainingAmount3: '500000000',
                remainingDate3: '1405/09/10',

                remainingAmount4: '',
                remainingDate4: '',
                remainingAmount5: '',
                remainingDate5: '',
                remainingAmount6: '',
                remainingDate6: '',
            },
        ],
    })

    const getCustomers = () => {}

    // پراپ‌های مشترک بین جدول و کارت
    const shared = {
        title: 'مشتری ها',
        resource: RESOURCE,
        rows: customers.data,
        count: customers.total_results,
        params: search,
        setParams: setSearch,
        loading,
        getList: getCustomers,
        hasDetail: true,
    }

    return (
        <ListPage
            viewKey={RESOURCE}
            defaultView="card"
            header="مدیریت مشتری ها"
            href={`${RESOURCE}/create`}
            searchField="full_name"
            searchText="نام و نام خانوادگی"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={getCustomers}
            filtersData={queryNames}
            noCreate
            defaultState={{full_name: ''}}
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
                        handleSort={getCustomers}
                        tableBodyCells={customers.data.map(item => (
                            <>
                                <TableCell key={`${item.id}-id`}>
                                    <CellText>{item.id || '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-full_name`}>
                                    <CellText>{item.full_name || '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-phone`}>
                                    <CellText>{item.phone_number || '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-status`}>
                                    <CellText>{item.status || '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-propertyType`}>
                                    <CellText>{item.propertyType || '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-areaRange`}>
                                    <CellText>{areaRangeText(item)}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-financial`}>
                                    <CellText>{financialText(item)}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-rooms`}>
                                    <CellText>{item.rooms ? `${item.rooms} اتاق` : '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-cities`}>
                                    <CellText>{item.cities || '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-area`}>
                                    <CellText>{item.area ? `منطقه ${item.area}` : '--'}</CellText>
                                </TableCell>

                                <TableCell key={`${item.id}-neighborhoods`}>
                                    <CellText>
                                        {item.neighborhoods?.length
                                            ? item.neighborhoods.join('، ')
                                            : '--'}
                                    </CellText>
                                </TableCell>
                            </>
                        ))}
                    />
                )
            }
        </ListPage>
    )
}

function CellText({children}: {children: React.ReactNode}) {
    return (
        <Typography
            variant="body2"
            fontSize={{
                xs: '13px',
                sm: '14px',
                md: '16px',
                xl: '17px',
            }}
            sx={{
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </Typography>
    )
}
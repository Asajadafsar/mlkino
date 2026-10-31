import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import {Button, Typography} from '@mui/material'
import TableCell from '@mui/material/TableCell'
import {useState} from 'react'
import {useQueryParams} from 'use-query-params'

import {createCardField} from '../../../Components/Card/CustomCard'
import {CustomCardList} from '../../../Components/Card/CustomCardList'
import {CustomTable} from '../../../Components/Table/CustomTable'
import {createTableHeadCells} from '../../../Components/Table/CustomTableHead'
import {ListPage} from '../../../Components/Table/ListPage'
import {formatDate} from '../../../Core/FormatDate'
import {createQueryParam} from '../../../Core/QueryParams'
import {ContractsType} from '../Contracts'

const RESOURCE = 'contracts'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('فایل', 'file_name'),
    createTableHeadCells('قیمت توافق شده', 'agreed_price'),
    createTableHeadCells('اختلاف قیمت', 'price_difference'),
    createTableHeadCells('مدیر جلسه', 'meeting_manager'),
    createTableHeadCells('کمیسیون مالک', 'owner_commission'),
    createTableHeadCells('کمیسیون خریدار', 'buyer_commission'),
    createTableHeadCells('زمان قرارداد', 'contract_datetime'),
    createTableHeadCells('توضیحات', 'description'),
]

const cardFields = [
    createCardField('شناسه', 'id'),

    createCardField('فایل', 'file_name'),

    createCardField('زمان قرارداد', 'contract_datetime', {
        render: (row: ContractsType) => formatDate(row.contract_datetime),
    }),

    createCardField('قیمت توافق شده', 'agreed_price'),

    createCardField('اختلاف قیمت', 'price_difference'),

    createCardField('مدیر جلسه', 'meeting_manager'),

    createCardField('کمیسیون مالک', 'owner_commission'),

    createCardField('کمیسیون خریدار', 'buyer_commission'),

    createCardField('توضیحات', 'description', {
        fullWidth: true,
    }),
]

const queryNames = tableHeadCells.slice(1,4).map((cell) => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))

const cellText = (value: string | number | null | undefined) => (
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
        {value !== null && value !== undefined && value !== ''
            ? String(value)
            : '--'}
    </Typography>
)

export function ContractsList() {
    const [search, setSearch] = useQueryParams(
        createQueryParam(queryNames),
    )

    const [loading] = useState(false)

    const [contracts] = useState<{
        total_results: number
        data: ContractsType[]
    }>({
        total_results: 5,

        data: [
            {
                id: 1,
                file_name: 'آپارتمان سالاریه',
                contract_datetime: '2026-08-12T17:30:00+03:30',
                agreed_price: 8500000000,
                price_difference: 250000000,
                meeting_manager: 'علی محمدی',
                owner_commission: 85000000,
                buyer_commission: 85000000,
                description:
                    'قیمت نهایی پس از توافق طرفین تعیین و قرارداد ثبت شد.',
            },
            {
                id: 2,
                file_name: 'ویلای جمکران',
                contract_datetime: '2026-08-14T11:00:00+03:30',
                agreed_price: 12500000000,
                price_difference: -300000000,
                meeting_manager: 'محمد رضایی',
                owner_commission: 125000000,
                buyer_commission: 125000000,
                description:
                    'قرارداد پس از توافق نهایی مالک و خریدار تنظیم شد.',
            },
            {
                id: 3,
                file_name: 'واحد صفائیه',
                contract_datetime: '2026-08-17T16:00:00+03:30',
                agreed_price: 6200000000,
                price_difference: 150000000,
                meeting_manager: 'رضا کریمی',
                owner_commission: 62000000,
                buyer_commission: 62000000,
                description:
                    'طرفین در جلسه حضوری بر روی مبلغ نهایی توافق کردند.',
            },
            {
                id: 4,
                file_name: 'آپارتمان زنبیل آباد',
                contract_datetime: '2026-08-19T18:30:00+03:30',
                agreed_price: 7300000000,
                price_difference: 100000000,
                meeting_manager: 'سارا احمدی',
                owner_commission: 73000000,
                buyer_commission: 73000000,
                description:
                    'قرارداد با توافق طرفین و پرداخت کمیسیون ثبت شد.',
            },
            {
                id: 5,
                file_name: 'دفتر بلوار امین',
                contract_datetime: '2026-08-22T10:30:00+03:30',
                agreed_price: 9800000000,
                price_difference: -200000000,
                meeting_manager: 'نگار موسوی',
                owner_commission: 98000000,
                buyer_commission: 98000000,
                description:
                    'مبلغ قرارداد پس از مذاکره نهایی مشخص شد.',
            },
        ],
    })

    const getContracts = () => {}

    const shared = {
        title: 'قرارداد',
        resource: RESOURCE,
        rows: contracts.data,
        count: contracts.total_results,
        params: search,
        setParams: setSearch,
        loading,
        getList: getContracts,
        hasDetail: true,
    }

    return (
        <ListPage
            viewKey={RESOURCE}
            defaultView="list"
            header="مدیریت قراردادها"
            href={`${RESOURCE}/create`}
            searchField="file_name"
            searchText="نام فایل"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={getContracts}
            filtersData={queryNames}
            noCreate
            defaultState={{
                name: '',
            }}
        >
            {(view) =>
                view === 'card' ? (
                    <CustomCardList
                        {...shared}
                        fields={cardFields}
                        columns={{
                            xs: 1,
                            sm: 2,
                            md: 3,
                            xl: 4,
                        }}
                        renderers={{
                            title: (row: ContractsType) =>
                                row.file_name || '--',

                            subtitle: (row: ContractsType) =>
                                row.meeting_manager || '--',

                            actions: (row: ContractsType) => (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    startIcon={
                                        <DescriptionOutlinedIcon />
                                    }
                                    onClick={(event) => {
                                        event.stopPropagation()

                                        console.log(
                                            'مشاهده قرارداد:',
                                            row.id,
                                        )
                                    }}
                                    sx={{
                                        height: 34,
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        boxShadow: 'none',
                                        whiteSpace: 'nowrap',

                                        '&:hover': {
                                            boxShadow: 'none',
                                        },
                                    }}
                                >
                                    مشاهده قرارداد
                                </Button>
                            ),
                        }}
                    />
                ) : (
                    <CustomTable
                        {...shared}
                        headCells={tableHeadCells}
                        handleSort={getContracts}
                        tableBodyCells={contracts.data.map((item) => (
                            <>
                                <TableCell>
                                    {cellText(item.id)}
                                </TableCell>

                                <TableCell>
                                    {cellText(item.file_name)}
                                </TableCell>

                                

                                <TableCell>
                                    {cellText(item.agreed_price)}
                                </TableCell>

                                <TableCell>
                                    {cellText(item.price_difference)}
                                </TableCell>

                                <TableCell>
                                    {cellText(item.meeting_manager)}
                                </TableCell>

                                <TableCell>
                                    {cellText(item.owner_commission)}
                                </TableCell>

                                <TableCell>
                                    {cellText(item.buyer_commission)}
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        sx={{
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {formatDate(
                                            item.contract_datetime,
                                        )}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    {cellText(item.description)}
                                </TableCell>
                            </>
                        ))}
                    />
                )
            }
        </ListPage>
    )
}
import {Button, IconButton, Typography} from '@mui/material'
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
import {ViewsType} from '../Views'
import DoneIcon from '@mui/icons-material/Done'
const RESOURCE = 'views'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('ملک', 'file_name'),
    createTableHeadCells('نام و نام خانوادگی', 'full_name'),
    createTableHeadCells('شماره تماس', 'phone_number'),
    createTableHeadCells('تاریخ', 'date'),
    createTableHeadCells('توضیحات کاربر', 'description'),
    createTableHeadCells('تایید بازدید', 'done'),
]

const cardFields = [
    createCardField('شناسه', 'id'),

    createCardField('ملک', 'file_name'),

    createCardField('نام و نام خانوادگی', 'full_name'),

    createCardField('شماره تماس', 'phone_number'),

    createCardField('تاریخ', 'date', {
        render: (row: ViewsType) => formatDate(row.date),
    }),

    createCardField('توضیحات کاربر', 'description', {
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
        {value !== null && value !== undefined && value !== '' ? String(value) : '--'}
    </Typography>
)

export function ViewsList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))

    const [loading] = useState(false)

    const [views] = useState<{
        total_results: number
        data: ViewsType[]
    }>({
        total_results: 5,

        data: [
            {
                id: 1,
                file_name: 'آپارتمان سالاریه',
                full_name: 'محمد احمدی',
                phone_number: '09121234567',
                date: '2026-08-06T13:30:55.008241+03:30',
                description: 'سلام، برای بازدید این ملک در صورت امکان ساعت ۵ عصر مراجعه می‌کنم.',
            },

            {
                id: 2,
                file_name: 'ویلای جمکران',
                full_name: 'علی رضایی',
                phone_number: '09129876543',
                date: '2026-08-07T10:15:20.008241+03:30',
                description: 'در صورت امکان می‌خواهم ملک را از نزدیک مشاهده کنم.',
            },

            {
                id: 3,
                file_name: 'دفتر بلوار امین',
                full_name: 'سارا کریمی',
                phone_number: '09351234567',
                date: '2026-08-08T16:45:10.008241+03:30',
                description: 'لطفاً برای هماهنگی بازدید با من تماس بگیرید.',
            },

            {
                id: 4,
                file_name: 'واحد صفائیه',
                full_name: 'رضا مرادی',
                phone_number: '09107654321',
                date: '2026-08-09T12:20:35.008241+03:30',
                description: 'ترجیحاً بازدید در ساعات بعدازظهر انجام شود.',
            },

            {
                id: 5,
                file_name: 'آپارتمان زنبیل آباد',
                full_name: 'نگار موسوی',
                phone_number: '09361234567',
                date: '2026-08-10T09:40:15.008241+03:30',
                description: 'برای این ملک درخواست بازدید دارم.',
            },
        ],
    })

    const getViews = () => {}

    const shared = {
        title: 'بازدید',

        resource: RESOURCE,

        rows: views.data,

        count: views.total_results,

        params: search,

        setParams: setSearch,

        loading,

        getList: getViews,

        hasDetail: true,
    }

    return (
        <ListPage
            viewKey={RESOURCE}
            defaultView="list"
            header="مدیریت بازدیدها"
            href={`${RESOURCE}/create`}
            searchField="full_name"
            searchText="نام و نام خانوادگی"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={getViews}
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
                            title: (row: ViewsType) => row.file_name || '--',
                            subtitle: (row: ViewsType) => row.full_name || '--',

                            actions: (row: ViewsType) => (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    onClick={(event) => {
                                        event.stopPropagation()

                                        console.log('تأیید بازدید:', row.id)
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
                                    تأیید بازدید
                                </Button>
                            ),
                        }}
                    />
                ) : (
                    <CustomTable
                        {...shared}
                        headCells={tableHeadCells}
                        handleSort={getViews}
                        tableBodyCells={views.data.map((item) => (
                            <>
                                <TableCell>{cellText(item.id)}</TableCell>

                                <TableCell>{cellText(item.file_name)}</TableCell>

                                <TableCell>{cellText(item.full_name)}</TableCell>

                                <TableCell>{cellText(item.phone_number)}</TableCell>

                                <TableCell>
                                    <Typography
                                        sx={{
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {formatDate(item.date)}
                                    </Typography>
                                </TableCell>

                                <TableCell>{cellText(item.description)}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        size="small"
                                        startIcon={<DoneIcon />}
                                        sx={{
                                            minWidth: '110px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            gap: 0.5,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        تأیید بازدید
                                    </Button>
                                </TableCell>
                            </>
                        ))}
                    />
                )
            }
        </ListPage>
    )
}

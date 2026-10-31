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
import {LessorsType} from '../Lessors'

const RESOURCE = 'lessors'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('نام و نام خانوادگی', 'full_name'),
    createTableHeadCells('تلفن', 'phone_number'),
    createTableHeadCells('شهر', 'cities'),
    createTableHeadCells('محله', 'neighborhoods'),
    createTableHeadCells('وضعیت اشتغال', 'occupancyStatus'),
]

/** همان ستون‌ها، اما برای بدنه‌ی کارت. نام و تلفن در سربرگ کارت می‌آیند پس اینجا تکرار نشده */
const cardFields = [
    createCardField('شهر', 'cities'),
    createCardField('محله', 'neighborhoods'),
    createCardField('وضعیت اشتغال', 'occupancyStatus'),
]

const queryNames = tableHeadCells.slice(1,3).map((cell) => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))

const cellText = (value: any) => (
    <Typography
        variant="body2"
        fontSize={{xs: '13px', sm: '14px', md: '16px', xl: '17px'}}
        sx={{whiteSpace: 'nowrap'}}
    >
        {value || '--'}
    </Typography>
)

export function LessorsList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading, setLoading] = useState(false)
    const [lessors, setLessors] = useState<{
        total_results: number
        data: LessorsType[]
    }>({
        total_results: 5,
        data: [
            {
                id: 1,
                full_name: 'علی رضایی',
                phone_number: '09125463121',
                cities: 'قم',
                neighborhoods: 'زنبیل آباد',
                occupancyStatus:'تخلیه'
            },
            {
                id: 2,
                full_name: 'تغییر ساعات پشتیبانی',
                phone_number: '09105463121',
                cities: 'تهران',
                neighborhoods: 'پیروزی',
                occupancyStatus:'1405/2/3'
            },
        ],
    })

    const getLessors = () => {}

    // پراپ‌های مشترک بین جدول و کارت
    const shared = {
        title: 'موجر',
        resource: RESOURCE,
        rows: lessors.data,
        count: lessors.total_results,
        params: search,
        setParams: setSearch,
        loading,
        getList: getLessors,
        hasDetail: true,
    }

    return (
        <ListPage
            viewKey={RESOURCE}
            defaultView="card"
            header={'مدیریت موجر ها'}
            href={'/landlord-tenant/lessors/create'}
            searchField="title"
            searchText="نام"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={getLessors}
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
                        handleSort={getLessors}
                        tableBodyCells={lessors.data.map((item) => (
                            <>
                                <TableCell>{cellText(item.id)}</TableCell>
                                <TableCell>{cellText(item.full_name)}</TableCell>
                                <TableCell>{cellText(item.phone_number)}</TableCell>
                                <TableCell>{cellText(item.cities)}</TableCell>
                                <TableCell>{cellText(item.neighborhoods)}</TableCell>
                                <TableCell>{cellText(item.occupancyStatus)}</TableCell>
                            </>
                        ))}
                    />
                )
            }
        </ListPage>
    )
}
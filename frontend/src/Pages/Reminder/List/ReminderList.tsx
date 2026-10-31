import {Chip, Typography} from '@mui/material'
import TableCell from '@mui/material/TableCell'
import {Fragment, useState} from 'react'
import {useDispatch} from 'react-redux'
import useDeepCompareEffect from 'use-deep-compare-effect'
import {DataProvider} from '../../../Core/DataProvider'
import {setUtil} from '../../../redux/UtilSlice'
import {useQueryParams} from 'use-query-params'
import {createCardField} from '../../../Components/Card/CustomCard'
import {CustomCardList} from '../../../Components/Card/CustomCardList'
import {CustomTable} from '../../../Components/Table/CustomTable'
import {createTableHeadCells} from '../../../Components/Table/CustomTableHead'
import {ListPage} from '../../../Components/Table/ListPage'
import {formatDate} from '../../../Core/FormatDate'
import {createQueryParam} from '../../../Core/QueryParams'
import {ReminderCreate} from '../Create/ReminderCreate'
import {ReminderType, reminderDefaults} from '../Reminder'

const RESOURCE = 'reminders'

function ReminderStatus({isDone}: {isDone: boolean}) {
    return <Chip size="small" label={isDone ? 'انجام شده' : 'انجام نشده'} color={isDone ? 'success' : 'warning'} variant="outlined" />
}

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('عنوان', 'title'),
    createTableHeadCells('توضیحات', 'description'),
    createTableHeadCells('زمان یادآوری', 'remind_at'),
    createTableHeadCells('وضعیت', 'is_done'),
]

/** همان ستون‌ها، اما برای بدنه‌ی کارت. عنوان در renderers.title می‌آید پس اینجا تکرار نشده */
const cardFields = [
    createCardField('شناسه', 'id'),
    createCardField('زمان یادآوری', 'remind_at', {render: (row: ReminderType) => formatDate(row.remind_at)}),
    createCardField('توضیحات', 'description', {fullWidth: true}),
]

const queryNames = tableHeadCells.slice(1, 2).map((cell) => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))

const cellText = (value: any) => (
    <Typography
        variant="body2"
        fontSize={{xs: '13px', sm: '14px', md: '16px', xl: '17px'}}
        sx={{overflowWrap: 'anywhere', maxWidth: 260}}
    >
        {value ?? '--'}
    </Typography>
)

export function ReminderList() {
    const dispatch = useDispatch()
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading, setLoading] = useState(false)
    const [reminders, setReminders] = useState<{
        total_results: number
        data: ReminderType[]
    }>({
        total_results: 0,
        data: [],
    })

    const getReminders = async () => {
        setLoading(true)
        try {
            const response = await DataProvider.get<{
                total_results: number
                results: ReminderType[]
            }>(`${RESOURCE}/`, search)
            if (response) {
                setReminders({
                    total_results: response.data.total_results,
                    data: response.data.results,
                })
            }
        } catch (error: any) {
            dispatch(setUtil({open: true, message: error.message || 'خطا در دریافت یادآوری‌ها', severity: 'error'}))
        } finally {
            setLoading(false)
        }
    }
    useDeepCompareEffect(() => {
        getReminders()
    }, [search])

    // پراپ‌های مشترک بین جدول و کارت
    const shared = {
        title: 'یادآوری',
        resource: RESOURCE,
        rows: reminders.data,
        count: reminders.total_results,
        params: search,
        setParams: setSearch,
        loading,
        getList: getReminders,
        hasDetail: true,
    }

    return (
        <ListPage
            viewKey={RESOURCE}
            defaultView="list"
            header="مدیریت یادآوری‌ها"
            href={RESOURCE + '/create'}
            searchField="title"
            searchText="عنوان"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={getReminders}
            filtersData={queryNames}
            createModal={ReminderCreate}
            defaultState={reminderDefaults}
        >
            {(view) =>
                view === 'card' ? (
                    <CustomCardList
                        {...shared}
                        fields={cardFields}
                        columns={{xs: 1, sm: 2, md: 3, xl: 4}}
                        renderers={{
                            title: (row) => row.title || '--',
                            subtitle: (row: ReminderType) => formatDate(row.remind_at),
                            status: (row: ReminderType) => <ReminderStatus isDone={row.is_done} />,
                        }}
                    />
                ) : (
                    <CustomTable
                        {...shared}
                        headCells={tableHeadCells}
                        handleSort={getReminders}
                        tableBodyCells={reminders.data.map((item) => (
                            <Fragment key={item.id}>
                                <TableCell>{cellText(item.id)}</TableCell>
                                <TableCell>{cellText(item.title)}</TableCell>
                                <TableCell>{cellText(item.description)}</TableCell>
                                <TableCell>
                                    <Typography sx={{overflowWrap: 'anywhere', maxWidth: 260}}>
                                        {formatDate(item.remind_at)}
                                    </Typography>
                                </TableCell>
                                <TableCell><ReminderStatus isDone={item.is_done} /></TableCell>
                            </Fragment>
                        ))}
                    />
                )
            }
        </ListPage>
    )
}

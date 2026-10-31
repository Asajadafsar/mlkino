import {Box, Button, IconButton, Modal, Stack, Typography} from '@mui/material'
import TableCell from '@mui/material/TableCell'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import {useState} from 'react'
import {useQueryParams} from 'use-query-params'

import {createCardField} from '../../../Components/Card/CustomCard'
import {CustomCardList} from '../../../Components/Card/CustomCardList'
import {CustomTable} from '../../../Components/Table/CustomTable'
import {createTableHeadCells} from '../../../Components/Table/CustomTableHead'
import {ListPage} from '../../../Components/Table/ListPage'
import {formatDate} from '../../../Core/FormatDate'
import {createQueryParam} from '../../../Core/QueryParams'
import {FollowUpsType} from '../FollowUps'

import {
    FollowUpStatusModal,
    FollowUpStatusData,
} from './FollowUpStatusModal'

import {
    NewVisitModal,
    NewVisitData,
} from './NewVisitModal'

const RESOURCE = 'follow-ups'

/* -------------------------------------------------------------------------- */
/* Custom Modal                                                               */
/* -------------------------------------------------------------------------- */

type CustomModalProps = {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: React.ReactNode
}

function CustomModal({
    open,
    onClose,
    title,
    subtitle,
    children,
}: CustomModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            dir="rtl"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: {
                    xs: 1.5,
                    sm: 2,
                },
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 560,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                    borderRadius: {
                        xs: '16px',
                        sm: '20px',
                    },
                    boxShadow: 24,
                    outline: 'none',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: {
                            xs: 2,
                            sm: 3,
                        },
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box>
                        <Typography
                            fontSize={{
                                xs: 16,
                                sm: 18,
                            }}
                            fontWeight={700}
                        >
                            {title}
                        </Typography>

                        {subtitle && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: 0.5,
                                    fontSize: {
                                        xs: 12,
                                        sm: 13,
                                    },
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: 'action.hover',
                            flexShrink: 0,

                            '&:hover': {
                                bgcolor: 'action.selected',
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        px: {
                            xs: 2,
                            sm: 3,
                        },
                        py: {
                            xs: 2,
                            sm: 3,
                        },
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Modal>
    )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('ملک', 'file_name'),
    createTableHeadCells('نام و نام خانوادگی', 'full_name'),
    createTableHeadCells('شماره تماس', 'phone_number'),
    createTableHeadCells('تاریخ', 'date'),
    createTableHeadCells('توضیحات کاربر', 'description'),
    createTableHeadCells('', ''),
    createTableHeadCells('', ''),
]

const cardFields = [
    createCardField('شناسه', 'id'),

    createCardField('ملک', 'file_name'),

    createCardField('نام و نام خانوادگی', 'full_name'),

    createCardField('شماره تماس', 'phone_number'),

    createCardField('تاریخ', 'date', {
        render: (row: FollowUpsType) => formatDate(row.date),
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

const cellText = (
    value: string | number | null | undefined,
) => (
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
        {value !== null &&
        value !== undefined &&
        value !== ''
            ? String(value)
            : '--'}
    </Typography>
)

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function FollowUpsList() {
    const [search, setSearch] = useQueryParams(
        createQueryParam(queryNames),
    )

    const [loading] = useState(false)

    /* ---------------------------------------------------------------------- */
    /* Status Modal                                                           */
    /* ---------------------------------------------------------------------- */

    const [
        selectedFollowUp,
        setSelectedFollowUp,
    ] = useState<FollowUpsType | null>(null)

    const [
        statusModalOpen,
        setStatusModalOpen,
    ] = useState(false)

    const [
        statusData,
        setStatusData,
    ] = useState<FollowUpStatusData>({
        visitStatus: '',
        nextStatus: '',
        description: '',
        statusDescription: '',
        archive: false,
    })

    /* ---------------------------------------------------------------------- */
    /* New Visit Modal                                                        */
    /* ---------------------------------------------------------------------- */

    const [
        selectedFile,
        setSelectedFile,
    ] = useState<FollowUpsType | null>(null)

    const [
        newVisitModalOpen,
        setNewVisitModalOpen,
    ] = useState(false)

   const [newVisitData, setNewVisitData] =
    useState<NewVisitData>({
        customerName: '',
        date: '',
    })

    /* ---------------------------------------------------------------------- */
    /* Mock Data                                                              */
    /* ---------------------------------------------------------------------- */

    const [followUps] = useState<{
        total_results: number
        data: FollowUpsType[]
    }>({
        total_results: 5,

        data: [
            {
                id: 1,
                file_name: 'آپارتمان سالاریه',
                full_name: 'محمد احمدی',
                phone_number: '09121234567',
                date: '2026-08-06T13:30:55.008241+03:30',
                description:
                    'سلام، برای بازدید این ملک در صورت امکان ساعت ۵ عصر مراجعه می‌کنم.',
            },

            {
                id: 2,
                file_name: 'ویلای جمکران',
                full_name: 'علی رضایی',
                phone_number: '09129876543',
                date: '2026-08-07T10:15:20.008241+03:30',
                description:
                    'در صورت امکان می‌خواهم ملک را از نزدیک مشاهده کنم.',
            },

            {
                id: 3,
                file_name: 'دفتر بلوار امین',
                full_name: 'سارا کریمی',
                phone_number: '09351234567',
                date: '2026-08-08T16:45:10.008241+03:30',
                description:
                    'لطفاً برای هماهنگی بازدید با من تماس بگیرید.',
            },

            {
                id: 4,
                file_name: 'واحد صفائیه',
                full_name: 'رضا مرادی',
                phone_number: '09107654321',
                date: '2026-08-09T12:20:35.008241+03:30',
                description:
                    'ترجیحاً بازدید در ساعات بعدازظهر انجام شود.',
            },

            {
                id: 5,
                file_name: 'آپارتمان زنبیل آباد',
                full_name: 'نگار موسوی',
                phone_number: '09361234567',
                date: '2026-08-10T09:40:15.008241+03:30',
                description:
                    'برای این ملک درخواست بازدید دارم.',
            },
        ],
    })

    const getFollowUps = () => {}

    /* ---------------------------------------------------------------------- */
    /* Status Handlers                                                        */
    /* ---------------------------------------------------------------------- */

    const handleOpenStatusModal = (
        row: FollowUpsType,
    ) => {
        setSelectedFollowUp(row)

        setStatusData({
            visitStatus: '',
            nextStatus: '',
            description: '',
            statusDescription: '',
            archive: false,
        })

        setStatusModalOpen(true)
    }

    const handleCloseStatusModal = () => {
        setStatusModalOpen(false)
        setSelectedFollowUp(null)

        setStatusData({
            visitStatus: '',
            nextStatus: '',
            description: '',
            statusDescription: '',
            archive: false,
        })
    }

    const handleSubmitStatus = () => {
        if (!selectedFollowUp) return

        console.log('تغییر وضعیت بازدید:', {
            followUpId: selectedFollowUp.id,
            ...statusData,
        })

        handleCloseStatusModal()
    }

    /* ---------------------------------------------------------------------- */
    /* New Visit Handlers                                                     */
    /* ---------------------------------------------------------------------- */

   const handleOpenNewVisitModal = (row: FollowUpsType) => {
    setSelectedFile(row)

    setNewVisitData({
        customerName: '',
        date: '',
    })

    setNewVisitModalOpen(true)
}

   const handleCloseNewVisitModal = () => {
    setNewVisitModalOpen(false)
    setSelectedFile(null)

    setNewVisitData({
        customerName: '',
        date: '',
    })
}

   const handleSubmitNewVisit = () => {
    if (!selectedFile) return

    if (
        !newVisitData.customerName.trim() ||
        !newVisitData.date
    ) {
        return
    }

    console.log('بازدید جدید:', {
        fileId: selectedFile.id,
        fileName: selectedFile.file_name,
        customerName: newVisitData.customerName,
        date: newVisitData.date,
    })

    handleCloseNewVisitModal()
}

    /* ---------------------------------------------------------------------- */
    /* Shared                                                                 */
    /* ---------------------------------------------------------------------- */

    const shared = {
        title: 'بازدید',
        resource: RESOURCE,
        rows: followUps.data,
        count: followUps.total_results,
        params: search,
        setParams: setSearch,
        loading,
        getList: getFollowUps,
        hasDetail: true,
    }

    return (
        <>
            <ListPage
                viewKey={RESOURCE}
                defaultView="list"
                header="مدیریت پیگیری ها"
                href={`${RESOURCE}/create`}
                searchField="full_name"
                searchText="نام و نام خانوادگی"
                setParams={setSearch}
                params={search}
                resource={RESOURCE}
                getList={getFollowUps}
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
                                title: (
                                    row: FollowUpsType,
                                ) =>
                                    row.file_name || '--',

                                subtitle: (
                                    row: FollowUpsType,
                                ) =>
                                    row.full_name || '--',

                                actions: (
                                    row: FollowUpsType,
                                ) => (
                                    <Stack spacing={1}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="secondary"
                                            size="small"
                                            onClick={(
                                                event,
                                            ) => {
                                                event.stopPropagation()

                                                handleOpenStatusModal(
                                                    row,
                                                )
                                            }}
                                           
                                        >
                                            تغییر وضعیت
                                        </Button>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            startIcon={
                                                <AddIcon />
                                            }
                                            onClick={(
                                                event,
                                            ) => {
                                                event.stopPropagation()

                                                handleOpenNewVisitModal(
                                                    row,
                                                )
                                            }}
                                            sx={{
                                                height: 34,
                                                borderRadius:
                                                    '9px',
                                                fontSize:
                                                    '12px',
                                                fontWeight: 600,
                                                whiteSpace:
                                                    'nowrap',
                                            }}
                                        >
                                            بازدید جدید
                                        </Button>
                                    </Stack>
                                ),
                            }}
                        />
                    ) : (
                        <CustomTable
                            {...shared}
                            headCells={tableHeadCells}
                            handleSort={getFollowUps}
                            tableBodyCells={followUps.data.map(
                                (item) => (
                                    <>
                                        <TableCell>
                                            {cellText(item.id)}
                                        </TableCell>

                                        <TableCell>
                                            {cellText(
                                                item.file_name,
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {cellText(
                                                item.full_name,
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {cellText(
                                                item.phone_number,
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                sx={{
                                                    whiteSpace:
                                                        'nowrap',
                                                }}
                                            >
                                                {formatDate(
                                                    item.date,
                                                )}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            {cellText(
                                                item.description,
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{
                                                    justifyContent:
                                                        'center',
                                                }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={() =>
                                                        handleOpenStatusModal(
                                                            item,
                                                        )
                                                    }
                                                     sx={{
                                                        whiteSpace:'nowrap'
                                                    }}
                                                >
                                                    تغییر وضعیت
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    startIcon={
                                                        <AddIcon />
                                                    }
                                                    onClick={() =>
                                                        handleOpenNewVisitModal(
                                                            item,
                                                        )
                                                    }
                                                    sx={{
                                                        whiteSpace:'nowrap'
                                                    }}
                                                >
                                                    بازدید جدید
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </>
                                ),
                            )}
                        />
                    )
                }
            </ListPage>

            {/* ---------------------------------------------------------------- */}
            {/* تغییر وضعیت                                                     */}
            {/* ---------------------------------------------------------------- */}

            <FollowUpStatusModal
                open={statusModalOpen}
                onClose={handleCloseStatusModal}
                followUp={selectedFollowUp}
                statusData={statusData}
                setStatusData={setStatusData}
                onSubmit={handleSubmitStatus}
                CustomModal={CustomModal}
            />

            {/* ---------------------------------------------------------------- */}
            {/* بازدید جدید                                                     */}
            {/* ---------------------------------------------------------------- */}

            <NewVisitModal
                open={newVisitModalOpen}
                onClose={handleCloseNewVisitModal}
                selectedFile={selectedFile}
                newVisitData={newVisitData}
                setNewVisitData={setNewVisitData}
                onSubmit={handleSubmitNewVisit}
                CustomModal={CustomModal}
            />
        </>
    )
}
import DeleteIcon from '@mui/icons-material/Delete'
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import { Button, Checkbox, IconButton, TableFooter, Typography } from '@mui/material'
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import { alpha, useTheme } from '@mui/material/styles'
import { Box, Stack } from '@mui/system'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { DataProvider } from '../../Core/DataProvider'
import { setUtil } from '../../redux/UtilSlice'
import { BaseModal } from '../Modal/BaseModal'
import { BlankList } from '../Pictures/BlankList'
import { CustomTableHead, HeadCellType } from './CustomTableHead'
import EditIcon from '@mui/icons-material/Edit';
export function CustomTable(props: {
    headCells: HeadCellType
    handleSort: () => void
    rows: any[]
    tableBodyCells: any
    loading: boolean
    setParams: any
    params: any
    count: number
    resource: string
    noEdit?: boolean
    noPagination?: boolean
    noDelete?: boolean
    getList: () => void
    hasDetail?: boolean
    groupEdit?: boolean
    selectedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
    title:string
}) {
    const {
        rows,
        tableBodyCells,
        headCells,
        loading,
        setParams,
        params,
        count,
        resource,
        noEdit,
        noPagination,
        noDelete,
        getList,
        hasDetail,
        groupEdit,
        selectedIds: externalSelectedIds,
        onSelectionChange,
        title
    } = props

    const theme = useTheme()
    const primary = theme.palette.primary

    // Derived tints from the theme's primary color — no hardcoded palette
    const tint = {
        headerBg: alpha(primary.main, 0.045),
        stripe: alpha(primary.light, 0.06),
        hoverBg: alpha(primary.main, 0.08),
        selectedBg: alpha(primary.main, 0.1),
        line: alpha(primary.main, 0.14),
    }

    const navigate = useNavigate()
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState('')
    const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([])
    const dispatch = useDispatch()

    // Use external state if provided, otherwise use internal state
    const selectedIds = externalSelectedIds ?? internalSelectedIds

    function setSelectedIds(ids: string[]) {
        setInternalSelectedIds(ids)
        onSelectionChange?.(ids)
    }

    function handleRowSelect(id: string) {
        const updated = selectedIds.includes(id)
            ? selectedIds.filter((sid) => sid !== id)
            : [...selectedIds, id]
        setSelectedIds(updated)
    }

    function handleSelectAll(checked: boolean) {
        setSelectedIds(checked ? rows.map((row) => String(row.id)) : [])
    }

    const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(String(row.id)))
    const someSelected = rows.some((row) => selectedIds.includes(String(row.id))) && !allSelected

    function handleEditClick(event, id: string | number, row) {
        navigate(`${id}`, {state: {row}})
    }

    function handleDetailClick(id: string | number, hasDetail: boolean, row) {
        if (hasDetail) {
            navigate(`${id}`, {state: {row}})
        }
    }

    async function handleDelete() {
        dispatch(setUtil({loading: true}))
        try {
            await DataProvider.delete(`${resource}/${selected}/`)
            getList()
        } catch (error: any) {
            dispatch(setUtil({open: true, message: error.message, severity: 'error'}))
        }
        dispatch(setUtil({loading: false}))
        setOpen(false)
        setSelected('')
    }

    return !loading && rows.length === 0 ? (
        <BlankList />
    ) : (
        <>
            <Box sx={{p:'10px'}}>
                <Box
                    sx={{
                        borderRadius: '18px',
                        border: '1px solid',
                        borderColor: tint.line,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -16px rgba(0,0,0,0.08)',
                    }}
                >
                    <LinearProgress
                        sx={{
                            height: '2.5px',
                            [`& .${linearProgressClasses.bar}`]: {
                                background: `linear-gradient(90deg, ${primary.dark}, ${primary.light})`,
                            },
                            [`&.${linearProgressClasses.colorPrimary}`]: {
                                backgroundColor: 'transparent',
                            },
                        }}
                        variant={loading ? 'indeterminate' : 'determinate'}
                        value={0}
                    />
                    <TableContainer sx={{overflowX: 'auto', maxWidth: '100%'}}>
                        <Table
                            sx={{
                                '& .MuiTableCell-head': {
                                    bgcolor: tint.headerBg,
                                    color: 'text.secondary',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    fontFamily:
                                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                    borderBottom: '2px solid transparent',
                                    borderImage: `linear-gradient(90deg, ${primary.main}, transparent 60%) 1`,
                                    py: 1.85,
                                },
                                '& .MuiTableCell-root': {
                                    borderColor: tint.line,
                                    py: 1.4,
                                },
                                '& .MuiTableBody-root .MuiTableRow-root': {
                                    position: 'relative',
                                    transition: 'background-color .15s ease, box-shadow .15s ease',
                                    boxShadow: 'inset 3px 0 0 transparent',
                                },
                                '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)': {
                                    bgcolor: tint.stripe,
                                },
                                '& .MuiTableBody-root .MuiTableRow-root:hover': {
                                    bgcolor: tint.hoverBg,
                                    boxShadow: `inset 3px 0 0 ${primary.main}`,
                                },
                                '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': {
                                    borderBottom: 'none',
                                },
                                '& .MuiTableRow-root.Mui-selected': {
                                    bgcolor: tint.selectedBg,
                                    boxShadow: `inset 3px 0 0 ${primary.dark}`,
                                },
                                '& .MuiTableRow-root.Mui-selected:hover': {
                                    bgcolor: tint.selectedBg,
                                },
                            }}
                        >
                            <CustomTableHead
                                headCells={headCells}
                                search={params}
                                onRequestSort={(event, prop) => {
                                    const isAsc =
                                        params.ordering?.includes(prop) &&
                                        !params.ordering?.includes('-')
                                    setParams((prev) => ({
                                        ...prev,
                                        ordering: isAsc ? `-${prop}` : prop,
                                    }))
                                }}
                                noDelete={noDelete}
                                noEdit={noEdit}
                                hasDetail={hasDetail}
                                groupEdit={groupEdit}
                                allSelected={allSelected}
                                someSelected={someSelected}
                                onSelectAll={handleSelectAll}
                            />
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow
                                        hover
                                        key={row._id}
                                        selected={groupEdit && selectedIds.includes(String(row.id))}
                                    >
                                        {groupEdit && (
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.includes(String(row.id))}
                                                    onChange={() => handleRowSelect(String(row.id))}
                                                    sx={{
                                                        borderRadius: '6px',
                                                        '&.Mui-checked': {color: 'primary.main'},
                                                        '& .MuiSvgIcon-root': {fontSize: 20},
                                                    }}
                                                />
                                            </TableCell>
                                        )}
                                        {tableBodyCells[index]}
                                       {hasDetail && (
    <TableCell
        width="52px"
        align="center"
        sx={{
            px: 0.5,
        }}
    >
        <IconButton
            size="small"
            onClick={() => handleDetailClick(row.id, hasDetail, row)}
            sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                color: 'primary.main',
                backgroundColor: 'rgba(25, 118, 210, 0.06)',
                border: '1px solid rgba(25, 118, 210, 0.12)',
                transition: 'all 0.2s ease',

                '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    borderColor: 'rgba(25, 118, 210, 0.25)',
                    color: 'primary.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 10px rgba(25, 118, 210, 0.12)',
                },

                '&:active': {
                    transform: 'translateY(0)',
                },
            }}
        >
            <EditIcon sx={{ fontSize: 18 }} />
        </IconButton>
    </TableCell>
)}

{!noDelete && (
    <TableCell
        width="52px"
        align="center"
        sx={{
            px: 0.5,
        }}
    >
        <IconButton
            size="small"
            onClick={() => {
                setSelected(row.id)
                setOpen(true)
            }}
            sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                color: 'error.main',
                backgroundColor: 'rgba(211, 47, 47, 0.06)',
                border: '1px solid rgba(211, 47, 47, 0.12)',
                transition: 'all 0.2s ease',

                '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.12)',
                    borderColor: 'rgba(211, 47, 47, 0.25)',
                    color: 'error.dark',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 10px rgba(211, 47, 47, 0.12)',
                },

                '&:active': {
                    transform: 'translateY(0)',
                },
            }}
        >
            <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
    </TableCell>
)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {!noPagination && (
                        <TableFooter
                            sx={{
                                direction: 'rtl',
                                display: 'table',
                                width: '100%',
                                borderTop: '1px solid',
                                borderColor: tint.line,
                                bgcolor: tint.headerBg,
                                borderBottomLeftRadius: '18px',
                                borderBottomRightRadius: '18px',
                            }}
                        >
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                component="div"
                                count={count}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(event, newPage) => {
                                    setPage(newPage)
                                    setParams((prev) => ({...prev, page: newPage + 1}))
                                }}
                                onRowsPerPageChange={(event) => {
                                    const newValue = parseInt(event.target.value, 10)
                                    setRowsPerPage(newValue)
                                    setPage(0)
                                    setParams((prev) => ({...prev, page_size: newValue}))
                                }}
                                labelRowsPerPage="تعداد ردیف در هر صفحه:"
                                labelDisplayedRows={({from, to, count}) =>
                                    `${from}–${to} از ${count !== -1 ? count : `بیشتر از ${to}`}`
                                }
                                sx={{
                                    '& .MuiTablePagination-selectLabel': {
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: 'text.secondary',
                                    },
                                    '& .MuiTablePagination-displayedRows': {
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: 'text.primary',
                                    },
                                    '& .MuiTablePagination-select': {
                                        fontSize: '13px',
                                    },
                                    '& .MuiTablePagination-actions button': {
                                        borderRadius: '8px',
                                        transition: 'all .15s ease',
                                    },
                                    '& .MuiTablePagination-actions button:hover': {
                                        bgcolor: tint.hoverBg,
                                        color: 'primary.main',
                                    },
                                }}
                            />
                        </TableFooter>
                    )}
                </Box>
            </Box>
<BaseModal
    open={open}
    setOpen={setOpen}
    title={`حذف ${props.title}`}
    style={{ maxWidth: 'sm' }}
>
    <Stack spacing={2.5}>
        <Stack
            alignItems="center"
            textAlign="center"
            spacing={1.5}
            sx={{
                pt: 1,
                px: 2,
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'error.lighter',
                    border: '1px solid',
                    borderColor: 'error.light',
                }}
            >
                <ReportProblemRoundedIcon
                    sx={{
                        color: 'error.main',
                        fontSize: 32,
                    }}
                />
            </Box>

            <Typography
                sx={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'text.primary',
                }}
            >
                آیا از حذف این {props.title} مطمئن هستید؟
            </Typography>

            <Typography
                sx={{
                    fontSize: '13px',
                    color: 'text.secondary',
                    lineHeight: 1.8,
                }}
            >
                با حذف این {props.title}، اطلاعات آن برای همیشه حذف خواهد شد
                <br />
                و این عملیات قابل بازگشت نیست.
            </Typography>
        </Stack>

        <Stack
            direction="row"
            spacing={1.5}
            sx={{
                pt: 1,
                px: 1,
            }}
        >
            <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleDelete}
                sx={{
                    height: 46,
                    borderRadius: '11px',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: 'error.dark',
                    },
                }}
            >
                حذف {props.title}
            </Button>

            <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpen(false)}
                sx={{
                    height: 46,
                    borderRadius: '11px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'text.primary',
                    borderColor: 'divider',
                    '&:hover': {
                        borderColor: 'text.secondary',
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                انصراف
            </Button>
        </Stack>
    </Stack>
</BaseModal>
        </>
    )
}
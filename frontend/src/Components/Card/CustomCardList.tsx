import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import {Button, Checkbox, Skeleton, Typography} from '@mui/material'
import LinearProgress, {linearProgressClasses} from '@mui/material/LinearProgress'
import TablePagination from '@mui/material/TablePagination'
import {alpha, useTheme} from '@mui/material/styles'
import {Box, Stack} from '@mui/system'
import {useState} from 'react'
import {useDispatch} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {DataProvider} from '../../Core/DataProvider'
import {setUtil} from '../../redux/UtilSlice'
import {BaseModal} from '../Modal/BaseModal'
import {BlankList} from '../Pictures/BlankList'
import {CardFieldType, CardRenderersType, CustomCard} from './CustomCard'

export function CustomCardList(props: {
    rows: any[]
    fields: CardFieldType[]
    renderers?: CardRenderersType
    loading: boolean
    params: any
    setParams: any
    count: number
    resource: string
    getList: () => void
    title: string
    noEdit?: boolean
    noDelete?: boolean
    noPagination?: boolean
    hasDetail?: boolean
    groupEdit?: boolean
    selectedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
    columns?: {
        xs?: number
        sm?: number
        md?: number
        lg?: number
        xl?: number
    }
    onCardClick?: (row: any) => void
}) {
    const {
        rows,
        fields,
        renderers,
        loading,
        params,
        setParams,
        count,
        resource,
        getList,
        title,
        noEdit,
        noDelete,
        noPagination,
        hasDetail,
        groupEdit,
        selectedIds: externalSelectedIds,
        onSelectionChange,
        columns,
        onCardClick,
    } = props

    const theme = useTheme()
    const primary = theme.palette.primary

    const tint = {
        line: alpha(primary.main, 0.14),
        barBg: alpha(primary.main, 0.045),
        hoverBg: alpha(primary.main, 0.08),
    }

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState('')
    const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([])

    const selectedIds = externalSelectedIds ?? internalSelectedIds

    function setSelectedIds(ids: string[]) {
        setInternalSelectedIds(ids)
        onSelectionChange?.(ids)
    }

    function handleRowSelect(id: string) {
        setSelectedIds(
            selectedIds.includes(id)
                ? selectedIds.filter((sid) => sid !== id)
                : [...selectedIds, id],
        )
    }

    function handleSelectAll(checked: boolean) {
        setSelectedIds(
            checked ? rows.map((row) => String(row.id)) : [],
        )
    }

    const allSelected =
        rows.length > 0 &&
        rows.every((row) => selectedIds.includes(String(row.id)))

    const someSelected =
        rows.some((row) => selectedIds.includes(String(row.id))) &&
        !allSelected

    async function handleDelete() {
        dispatch(setUtil({loading: true}))

        try {
            await DataProvider.delete(`${resource}/${selected}/`)
            getList()
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error.message,
                    severity: 'error',
                }),
            )
        }

        dispatch(setUtil({loading: false}))
        setOpen(false)
        setSelected('')
    }

    const gridTemplate = {
        xs: `repeat(${columns?.xs ?? 1}, minmax(0, 1fr))`,
        sm: `repeat(${columns?.sm ?? 2}, minmax(0, 1fr))`,
        md: `repeat(${columns?.md ?? 3}, minmax(0, 1fr))`,
        lg: `repeat(${columns?.lg ?? columns?.md ?? 3}, minmax(0, 1fr))`,
        xl: `repeat(${columns?.xl ?? columns?.lg ?? 4}, minmax(0, 1fr))`,
    }

    if (!loading && rows.length === 0) {
        return <BlankList />
    }

    return (
        <>
            <Box sx={{p: '10px'}}>
                <LinearProgress
                    sx={{
                        height: '2.5px',
                        borderRadius: '2px',
                        mb: 1.5,

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

                {groupEdit && rows.length > 0 && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                            mb: 1.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: tint.line,
                            bgcolor: tint.barBg,
                        }}
                    >
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={(e) =>
                                handleSelectAll(e.target.checked)
                            }
                            sx={{
                                p: 0.5,
                                '&.Mui-checked': {
                                    color: 'primary.main',
                                },
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: '13px',
                                color: 'text.secondary',
                            }}
                        >
                            {selectedIds.length > 0
                                ? `${selectedIds.length} مورد انتخاب شده`
                                : 'انتخاب همه'}
                        </Typography>
                    </Stack>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: gridTemplate,
                        gap: 2,
                    }}
                >
                    {loading && rows.length === 0
                        ? Array.from({length: 6}).map((_, i) => (
                              <Skeleton
                                  key={i}
                                  variant="rectangular"
                                  height={210}
                                  sx={{
                                      borderRadius: '18px',
                                  }}
                              />
                          ))
                        : rows.map((row, index) => (
                              <CustomCard
                                  key={row._id ?? row.id ?? index}
                                  row={row}
                                  index={index}
                                  fields={fields}
                                  renderers={renderers}
                                  noEdit={noEdit}
                                  noDelete={noDelete}
                                  selectable={groupEdit}
                                  selected={selectedIds.includes(
                                      String(row.id),
                                  )}
                                  onSelect={() =>
                                      handleRowSelect(
                                          String(row.id),
                                      )
                                  }
                                  clickable={Boolean(
                                      hasDetail || onCardClick,
                                  )}
                                  onClick={() =>
                                      onCardClick
                                          ? onCardClick(row)
                                          : navigate(`${row.id}`, {
                                                state: {row},
                                            })
                                  }
                                  onEdit={() =>
                                      navigate(`${row.id}`, {
                                          state: {row},
                                      })
                                  }
                                  onDelete={() => {
                                      setSelected(row.id)
                                      setOpen(true)
                                  }}
                              />
                          ))}
                </Box>

                {!noPagination && (
                    <Box
                        sx={{
                            direction: 'rtl',
                            mt: 2,
                            border: '1px solid',
                            borderColor: tint.line,
                            borderRadius: '14px',
                            bgcolor: tint.barBg,
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

                                setParams((prev: typeof params) => ({
                                    ...prev,
                                    page: newPage + 1,
                                }))
                            }}
                            onRowsPerPageChange={(event) => {
                                const newValue = parseInt(
                                    event.target.value,
                                    10,
                                )

                                setRowsPerPage(newValue)
                                setPage(0)

                                setParams((prev: typeof params) => ({
                                    ...prev,
                                    page_size: newValue,
                                }))
                            }}
                            labelRowsPerPage="تعداد کارت در هر صفحه:"
                            labelDisplayedRows={({from, to, count}) =>
                                `${from}–${to} از ${
                                    count !== -1
                                        ? count
                                        : `بیشتر از ${to}`
                                }`
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

                                '& .MuiTablePagination-actions button:hover':
                                    {
                                        bgcolor: tint.hoverBg,
                                        color: 'primary.main',
                                    },
                            }}
                        />
                    </Box>
                )}
            </Box>

            <BaseModal
                open={open}
                setOpen={setOpen}
                title={`حذف ${title}`}
                style={{maxWidth: 'sm'}}
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
                            آیا از حذف این {title} مطمئن هستید؟
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: '13px',
                                color: 'text.secondary',
                                lineHeight: 1.8,
                            }}
                        >
                            با حذف این {title}، اطلاعات آن برای همیشه حذف
                            خواهد شد
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
                            حذف {title}
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
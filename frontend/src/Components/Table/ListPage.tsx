import {Button, Stack, Typography} from '@mui/material'
import {Box} from '@mui/system'
import React, {Dispatch, SetStateAction, useState} from 'react'
import {DataProvider} from '../../Core/DataProvider'
import AddButton from '../Buttons/add'
import {Searchbar} from '../Input/Searchbar'
import {BaseModal} from '../Modal/BaseModal'
import EditIcon from '@mui/icons-material/Edit'
import CsvExportButton from '../../Pages/Logs/List/CsvExportButton'
import {LogsType} from '../../Pages/Logs/List/LogsList'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import {useViewMode, ViewMode} from '../../Core/useViewMode'
import { ViewToggle } from '../Card/ViewToggle'

export function ListPage({
    setEditMode,

    listData,
    isCsvExport = false,
    isActiveEdit,
    header,
    searchText,
    searchField,
    setParams,
    params,
    filtersData,
    createModal,
    resource,
    defaultState,
    getList,
    noCreate,
    children,
    href,
    nofilter = false,
    setOpenModal,
    viewKey,
    defaultView = 'list',
}: {
    setEditMode?: Dispatch<SetStateAction<'fee' | 'referral' | null>>

    listData?: LogsType[]
    isCsvExport?: boolean
    header: string
    searchText: string
    searchField: string
    setParams: any
    params: any
    filtersData: any
    createModal?: any
    resource: string
    defaultState?: any
    getList: () => void
    href: string
    noCreate?: boolean
    /** یا نود ساده، یا تابعی که نمای فعلی را می‌گیرد و جدول/کارت را برمی‌گرداند */
    children: React.ReactNode | ((view: ViewMode) => React.ReactNode)
    nofilter?: boolean
    isActiveEdit?: boolean
    setOpenModal?: Dispatch<SetStateAction<boolean>>
    /** اگر داده شود، دکمه‌ی تغییر نما نمایش داده و انتخاب کاربر با همین کلید ذخیره می‌شود */
    viewKey?: string
    defaultView?: ViewMode
}) {
    const CreaterModal = createModal
    const [open, setOpen] = useState(false)
    const [data, setData] = useState(defaultState)
    const [view, setView] = useViewMode(viewKey ?? resource, defaultView)

    async function update() {
        if (data._id) {
            let result = await DataProvider.patch(`${resource}/${data._id}`, {data: data})
            if (result) {
                setOpen(false)
                getList()
            }
        }
    }

    return (
        <Box sx={{p: {xs: 2, md: 3}, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '16px'}}>
            {open && (
                <BaseModal
                    open={open}
                    setOpen={setOpen}
                    title={'Add to ' + header}
                    onClose={() => setOpen(false)}
                >
                    <CreaterModal open={open} setOpen={setOpen} data={data} setData={setData} onSuccess={async () => {setOpen(false); setData(defaultState); await getList()}} />
                    <Stack direction="row" margin={'10px 0px'} spacing={2}>
                        <Button
                            variant="contained"
                            onClick={update}
                            size="large"
                            sx={{fontSize: '20px'}}
                        >
                            Add
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setOpen(false)}
                            size="large"
                            color="secondary"
                            sx={{fontSize: '20px'}}
                        >
                            Cancel
                        </Button>
                    </Stack>
                </BaseModal>
            )}
            <Stack alignItems={'center'} padding="10px">
                <Stack
                    direction="row"
                    width="100%"
                    alignItems="center"
                    justifyContent="space-between"
                    mt={noCreate ? 1 : 0}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: {
                                xs: '16px !important',
                                sm: '18px !important',
                            },
                            '@media (max-width: 350px)': {
                                fontSize: '15px !important',
                            },
                            fontWeight: 600,
                        }}
                    >
                        {header}
                    </Typography>

                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                        {viewKey !== undefined && <ViewToggle view={view} onChange={setView} />}

                        {noCreate ? null : (
                            <AddButton
                                href={href}
                                text="جدید"
                                startIcon={<AddRoundedIcon />}
                                sx={{
                                    height: 44,
                                    minWidth: 105,
                                    px: 1.2,
                                    borderRadius: '12px',

                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.8,

                                    fontSize: {
                                        xs: '13px',
                                        sm: '14px',
                                    },
                                    fontWeight: 600,

                                    color: '#fff',
                                    backgroundColor: 'primary.main',

                                    border: '1px solid',
                                    borderColor: 'primary.main',

                                    boxShadow: 'none',

                                    transition:
                                        'background-color .2s ease, border-color .2s ease, transform .2s ease',

                                    '& .MuiSvgIcon-root': {
                                        fontSize: 21,
                                        transition: 'transform .2s ease',
                                    },

                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                        borderColor: 'primary.dark',
                                        boxShadow: 'none',

                                        '& .MuiSvgIcon-root': {
                                            transform: 'rotate(90deg)',
                                        },
                                    },

                                    '&:active': {
                                        transform: 'scale(.97)',
                                    },
                                }}
                            />
                        )}
                        {isActiveEdit && (
                            <>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        setOpenModal && setOpenModal(true)
                                        setEditMode && setEditMode('fee')
                                    }}
                                    startIcon={<EditIcon />}
                                    sx={{
                                        fontSize: {
                                            xs: '14px',
                                            sm: '18px',
                                        },
                                        padding: '7px 13px',
                                    }}
                                >
                                    ویرایش کارمزد ها
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        setOpenModal && setOpenModal(true)
                                        setEditMode && setEditMode('referral')
                                    }}
                                    startIcon={<EditIcon />}
                                    sx={{
                                        fontSize: {
                                            xs: '14px',
                                            sm: '18px',
                                        },
                                        padding: '7px 13px',
                                    }}
                                >
                                    ویرایش سود
                                </Button>
                            </>
                        )}
                        {isCsvExport && (
                            <CsvExportButton
                                exportType="table"
                                rowOptions={[5, 10, 25, 50, 100, 250]}
                                data={listData || []}
                                fileName="logs.csv"
                            />
                        )}
                    </Stack>
                </Stack>

                {!nofilter && (
                    <Searchbar
                        searchField={searchField}
                        setParams={setParams}
                        filtersData={filtersData ?? []}
                        noFilters={filtersData ? false : true}
                        params={params}
                    />
                )}
            </Stack>
            <Stack minHeight={'60vh'}>
                {typeof children === 'function' ? children(view) : children}
            </Stack>
        </Box>
    )
}
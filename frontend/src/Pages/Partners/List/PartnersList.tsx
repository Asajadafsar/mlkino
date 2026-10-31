import {Box, Chip, Typography} from '@mui/material'
import TableCell from '@mui/material/TableCell'
import {useState} from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'
import {useQueryParams} from 'use-query-params'
import {CustomTable} from '../../../Components/Table/CustomTable'
import {createTableHeadCells} from '../../../Components/Table/CustomTableHead'
import {ListPage} from '../../../Components/Table/ListPage'
import {DataProvider} from '../../../Core/DataProvider'
import {createQueryParam} from '../../../Core/QueryParams'
import {setUtil} from '../../../redux/UtilSlice'
import {useDispatch} from 'react-redux'
import {PartnersType} from '../Partners'
import LogoImage from '../../../Images/melkino.png'
const RESOURCE = 'announcements'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('لوگو', 'logo'),
    createTableHeadCells('نام و نام خانوادگی', 'fullName'),
    createTableHeadCells('شماره تماس', 'phoneNumber'),
    createTableHeadCells('آدرس', 'address'),
    createTableHeadCells('نام املاکی', 'realEstateName'),
    createTableHeadCells('وضعیت', 'status'),

]
const queryNames = tableHeadCells.map((cell) => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))
export function PartnersList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading, setLoading] = useState(false)
    const [partners, setPartners] = useState<{
        total_results: number
        data: PartnersType[]
    }>({
        total_results: 5,
        data: [
            {
                id: 1,
                logo: 'https://via.placeholder.com/80x80.png?text=Logo1',
                fullName: 'علی رضایی',
                phoneNumber: '09121234567',
                address: 'تهران، خیابان ولیعصر، پلاک ۱۲',
                realEstateName: 'املاک آفتاب',
                status: 'false',
            },
            {
                id: 2,
                logo: 'https://via.placeholder.com/80x80.png?text=Logo2',
                fullName: 'مریم احمدی',
                phoneNumber: '09129876543',
                address: 'اصفهان، خیابان چهارباغ، پلاک ۴۵',
                realEstateName: 'املاک نگین',
                status: 'true',
            },
            {
                id: 3,
                logo: 'https://via.placeholder.com/80x80.png?text=Logo3',
                fullName: 'حسین کریمی',
                phoneNumber: '09351112233',
                address: 'شیراز، خیابان زند، پلاک ۷',
                realEstateName: 'املاک پارسیان',
                status: 'true',
            },
            {
                id: 4,
                logo: 'https://via.placeholder.com/80x80.png?text=Logo4',
                fullName: 'زهرا محمدی',
                phoneNumber: '09151239876',
                address: 'مشهد، بلوار وکیل‌آباد، پلاک ۲۰',
                realEstateName: 'املاک ستاره',
                status: 'true',
            },
            {
                id: 5,
                logo: 'https://via.placeholder.com/80x80.png?text=Logo5',
                fullName: 'محمد حسینی',
                phoneNumber: '09361239988',
                address: 'تبریز، خیابان امام، پلاک ۳۳',
                realEstateName: 'املاک الماس',
                status: 'false',
            },
        ],
    })
    const dispatch = useDispatch()
    // const getPartners = async () => {
    //     setLoading(true)
    //     try {
    //         let response = await DataProvider.get<{
    //             total_results: number
    //             results: PartnersType[]
    //         }>(`${RESOURCE}/`, search)
    //         if (response) {
    //             setPartners({
    //                 total_results: response.data.total_results,
    //                 data: response.data.results,
    //             })
    //         }
    //     } catch (error: any) {
    //         dispatch(setUtil({open: true, message: error.message, severity: 'error'}))
    //     }
    //     setLoading(false)
    // }
    // useDeepCompareEffect(() => {
    //     getPartners()
    // }, [search])

    return (
        <ListPage
        viewKey={RESOURCE}
        defaultView='list'
            header={'مدیریت درخواست ها'}
            href={RESOURCE + '/create'}
            searchField="fullName"
            searchText="نام"
            nofilter
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={() => {}}
            // getList={getPartners}
            filtersData={[]}
            createModal={() => {}}
            defaultState={{
                name: '',
            }}
        >
            <CustomTable
                title="درخواست ها"
                resource={RESOURCE}
                headCells={tableHeadCells}
                rows={partners.data}
                count={partners.total_results}
                getList={() => {}}
                // getList={getPartners}
                params={search}
                setParams={setSearch}
                handleSort={() => {}}
                // handleSort={getPartners}
                loading={loading}
                hasDetail={true}
                tableBodyCells={partners.data.map((item, index) => (
                    <>
                        <TableCell>
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
                                {item.id || '--'}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Box
                                component="img"
                                src={LogoImage}
                                alt={item.fullName}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    objectFit: 'contain',
                                    borderRadius: '4px',
                                }}
                            />
                        </TableCell>
                        <TableCell>
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
                                {item.fullName || '--'}
                            </Typography>
                        </TableCell>
                        <TableCell>
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
                                {item.phoneNumber || '--'}
                            </Typography>
                        </TableCell>
                        <TableCell>
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
                                {item.address || '--'}
                            </Typography>
                        </TableCell>
                        <TableCell>
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
                                {item.realEstateName || '--'}
                            </Typography>
                        </TableCell>
                        <TableCell>
                        <Chip
                            size="medium"
                            label={item.status === 'false'?'درخواست رد شد':'درخواست پذیرفته شد'}
                            sx={{
                                height: 22,
                                fontSize: '11px',
                                fontWeight: 700,
                                color: item.status === 'false' ? 'error.main':'success.main',
                            }}
                        />
                        </TableCell>
                    </>
                ))}
            />
        </ListPage>
    )
}

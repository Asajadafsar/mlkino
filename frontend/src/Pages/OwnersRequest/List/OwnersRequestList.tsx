import {Box, Grid, Tab, Tabs, Typography} from '@mui/material'
import {useMemo, useState} from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'
import {useQueryParams} from 'use-query-params'
import {createTableHeadCells} from '../../../Components/Table/CustomTableHead'
import {ListPage} from '../../../Components/Table/ListPage'
import {DataProvider} from '../../../Core/DataProvider'
import {createQueryParam} from '../../../Core/QueryParams'
import {setUtil} from '../../../redux/UtilSlice'
import {useDispatch} from 'react-redux'
import {PropertyType} from '../../../Components/PropertyRecordForm'
import {PropertyCard} from '../../Files/PropertyCard/PropertyCard'
import { OwnersRequestCreate } from '../Create/OwnersRequestCreate'

const RESOURCE = 'owners-requests'

const tableHeadCells = [
    createTableHeadCells('شناسه', 'id'),
    createTableHeadCells('نوع ملک', 'propertyType'),
    createTableHeadCells('شهر', 'city'),
    createTableHeadCells('قیمت', 'totalPrice'),
]
const queryNames = tableHeadCells.slice(1,4).map((cell) => ({
    field: cell.name,
    label: cell.label,
    type: '',
}))

// نوع‌های قرارداد برای تب‌ها
const CONTRACT_TYPES = {
    SALE: 'فروش',
    RENT: 'رهن و اجاره',
} as const

export function OwnersRequestList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<0 | 1>(0)
    const [requests, setRequests] = useState<{
        total_results: number
        data: Partial<PropertyType>[]
    }>({
        total_results: 6,
        data: [
            // ---------- فروش ----------
            {
                id: 1,
                propertyType: 'آپارتمان',
                contractType: 'فروش',
                city: 'تهران',
                district: ['منطقه ۱', 'منطقه ۲'],
                neighborhood: ['زعفرانیه', 'الهیه'],
                areaFrom: 90,
                areaTo: 130,
                totalPriceFrom: 5000000000,
                totalPriceTo: 7500000000,
                roomCount: 2,
                requesterName: 'علی محمدی',
                requesterPhone: '09121234567',
            },
            {
                id: 3,
                propertyType: 'زمین',
                contractType: 'فروش',
                city: 'شیراز',
                district: ['معالی‌آباد'],
                neighborhood: [],
                areaFrom: 300,
                areaTo: 400,
                totalPriceFrom: 10000000000,
                totalPriceTo: 14000000000,
                roomCount: 0,
                requesterName: 'رضا کریمی',
                requesterPhone: '09131234567',
            },
            {
                id: 4,
                propertyType: 'مغازه',
                contractType: 'فروش',
                city: 'اصفهان',
                district: ['خیابان چهارباغ'],
                neighborhood: ['نقش جهان'],
                areaFrom: 40,
                areaTo: 60,
                totalPriceFrom: 3000000000,
                totalPriceTo: 4500000000,
                roomCount: 1,
                requesterName: 'مریم صادقی',
                requesterPhone: '09141234567',
            },
            // ---------- رهن و اجاره ----------
            {
                id: 2,
                propertyType: 'ویلایی',
                contractType: 'رهن و اجاره',
                city: 'کرج',
                district: ['گوهردشت'],
                neighborhood: ['فاز ۲', 'فاز ۳'],
                areaFrom: 150,
                areaTo: 220,
                mortgagePriceFrom: 300000000,
                mortgagePriceTo: 600000000,
                monthlyRentFrom: 8000000,
                monthlyRentTo: 15000000,
                roomCount: 3,
                requesterName: 'سارا احمدی',
                requesterPhone: '09351234567',
            },
            {
                id: 5,
                propertyType: 'آپارتمان',
                contractType: 'رهن و اجاره',
                city: 'مشهد',
                district: ['وکیل‌آباد'],
                neighborhood: ['بلوار سجاد'],
                areaFrom: 80,
                areaTo: 100,
                mortgagePriceFrom: 150000000,
                mortgagePriceTo: 250000000,
                monthlyRentFrom: 5000000,
                monthlyRentTo: 9000000,
                roomCount: 2,
                requesterName: 'حسین رستمی',
                requesterPhone: '09151234567',
            },
            {
                id: 6,
                propertyType: 'دفتر کار',
                contractType: 'رهن و اجاره',
                city: 'تهران',
                district: ['ونک'],
                neighborhood: ['ملاصدرا'],
                areaFrom: 60,
                areaTo: 90,
                mortgagePriceFrom: 100000000,
                mortgagePriceTo: 200000000,
                monthlyRentFrom: 12000000,
                monthlyRentTo: 20000000,
                roomCount: 2,
                requesterName: 'نگار ابراهیمی',
                requesterPhone: '09161234567',
            },
        ],
    })
    const dispatch = useDispatch()
    // const getRequests = async () => {
    //     setLoading(true)
    //     try {
    //         let response = await DataProvider.get<{
    //             total_results: number
    //             results: PropertyType[]
    //         }>(`${RESOURCE}/`, search)
    //         if (response) {
    //             setRequests({
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
    //     getRequests()
    // }, [search])

    const activeContractType = tab === 0 ? CONTRACT_TYPES.SALE : CONTRACT_TYPES.RENT

    const filteredData = useMemo(
        () => requests.data.filter((item) => item.contractType === activeContractType),
        [requests.data, activeContractType],
    )

    return (
        <ListPage
            header={'مدیریت درخواست‌ها'}
            href={RESOURCE + '/create'}
            searchField="title"
            searchText="نام"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={() => {}}
            // getList={getRequests}
            filtersData={queryNames}
            createModal={OwnersRequestCreate}
            defaultState={{
                name: '',
            }}
            noCreate
        >
            <Box sx={{borderBottom: 1, borderColor: 'divider', px: 1.5}}>
                <Tabs
                    value={tab}
                    onChange={(_, newValue) => setTab(newValue)}
                    aria-label="نوع قرارداد درخواست‌ها"
                    sx={{mb:2}}
                >
                    <Tab label={CONTRACT_TYPES.SALE} value={0} />
                    <Tab label={CONTRACT_TYPES.RENT} value={1} />
                </Tabs>
            </Box>

            {loading ? (
                <Typography
                    variant="bodySm"
                    color="text.secondary"
                    sx={{py: 4, textAlign: 'center'}}
                >
                    در حال بارگذاری...
                </Typography>
            ) : filteredData.length === 0 ? (
                <Typography
                    variant="bodySm"
                    color="text.secondary"
                    sx={{py: 4, textAlign: 'center'}}
                >
                    درخواستی ثبت نشده است.
                </Typography>
            ) : (
                <Box sx={{pt: 1, px: 1.5}}>
                    <Grid container spacing={2.5}>
                        {filteredData.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <PropertyCard item={item} mode="request" />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </ListPage>
    )
}

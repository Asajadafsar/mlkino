import {Box, Grid, Typography} from '@mui/material'
import {useState} from 'react'
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
import {AdvertisementsCreate} from '../Create/AdvertisementsCreate'

const RESOURCE = 'advertisements'

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

export function AdvertisementsList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading, setLoading] = useState(false)
    const [advertisements, setAdvertisements] = useState<{
        total_results: number
        data: Partial<PropertyType>[]
    }>({
        total_results: 4,
        data: [
            // ۱) رکورد نسبتاً کامل — فروش آپارتمان
            {
                id: 1,
                propertyType: 'آپارتمان',
                contractType: 'فروش',
                neighborhood: 'زعفرانیه',
                documentType: 'تک برگ',
                area: 130,
                roomCount: 2,
                direction: 'جنوبی',
                buildYear: '1399',
                totalPrice: 7500000000,
                amenities: ['آسانسور', 'پارکینگ', 'بالکن', 'نورگیر'],
                strongPoint: 'غرق در نور، نمای رومی شیک، دسترسی عالی به مترو',
                adTone: 'حرفه‌ای و رسمی 💼',
                advisorName: 'علی محمدی',
                agencyName: 'املاک زعفرانیه',
                contactPhone: '09121234567',
            },
            // ۲) رهن و اجاره ویلایی — بدون نام آژانس (نمونه‌ی داده‌ی ناقص)
            {
                id: 2,
                propertyType: 'ویلایی',
                contractType: 'رهن و اجاره',
                neighborhood: 'فاز ۲ گوهردشت',
                documentType: 'مبایعه‌نامه',
                area: 220,
                roomCount: 3,
                buildYear: '1394',
                mortgagePrice: 400000000,
                monthlyRent: 12000000,
                amenities: ['پارکینگ', 'بازسازی', 'دسترسی'],
                strongPoint: 'حیاط بزرگ، شرایط پرداخت عالی',
                adTone: 'دوستانه و صمیمی 🙂',
                advisorName: 'سارا احمدی',
                contactPhone: '09351234567',
            },
            // ۳) زمین — حداقلی، فقط فیلدهای ضروری
            {
                id: 3,
                propertyType: 'زمین',
                contractType: 'فروش',
                neighborhood: 'معالی‌آباد',
                documentType: 'قولنامه‌ای',
                area: 350,
                totalPrice: 12000000000,
                strongPoint: 'موقعیت عالی برای سرمایه‌گذاری',
                adTone: 'مختصر و مستقیم ⚡',
                contactPhone: '09131234567',
            },
            // ۴) پیش‌فروش — لحن تبلیغاتی، بدون مشاور/آژانس
            {
                id: 4,
                propertyType: 'پیش فروش',
                contractType: 'رهن و اجاره',
                neighborhood: 'وکیل‌آباد',
                documentType: 'وکالتی',
                area: 140,
                roomCount: 3,
                direction: 'شمالی',
                buildYear: '1405',
                mortgagePrice: 150000000,
                monthlyRent: 9000000,
                amenities: ['آسانسور', 'پارکینگ', 'خوش‌نقشه', 'سازنده معتبر'],
                strongPoint: 'واحد نوساز با متریال درجه یک و امکانات کامل',
                adTone: 'جذاب و تبلیغاتی ✨',
                contactPhone: '09151234567',
            },
        ],
    })
    const dispatch = useDispatch()
    // const getAdvertisements = async () => {
    //     setLoading(true)
    //     try {
    //         let response = await DataProvider.get<{
    //             total_results: number
    //             results: PropertyType[]
    //         }>(`${RESOURCE}/`, search)
    //         if (response) {
    //             setAdvertisements({
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
    //     getAdvertisements()
    // }, [search])

    return (
        <ListPage
            header={'مدیریت دیوارکوب'}
            href={RESOURCE + '/create'}
            searchField="title"
            searchText="نام"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={() => {}}
            // getList={getAdvertisements}
            filtersData={queryNames}
            createModal={AdvertisementsCreate}
            defaultState={{
                name: '',
            }}
        >
            {loading ? (
                <Typography variant="bodySm" color="text.secondary" sx={{py: 4, textAlign: 'center'}}>
                    در حال بارگذاری...
                </Typography>
            ) : advertisements.data.length === 0 ? (
                <Typography variant="bodySm" color="text.secondary" sx={{py: 4, textAlign: 'center'}}>
                    آگهی‌ای ثبت نشده است.
                </Typography>
            ) : (
                <Box sx={{pt: 1, px: 1.5}}>
                    <Grid container spacing={2.5}>
                        {advertisements.data.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <PropertyCard item={item} mode="ad" />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </ListPage>
    )
}
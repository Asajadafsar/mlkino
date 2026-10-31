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
import {FilesCreate} from '../Create/FilesCreate'
import {PropertyType} from '../../../Components/PropertyRecordForm'
import {PropertyCard} from '../PropertyCard/PropertyCard'

// تصاویر نمونه برای نمایش در کارت‌ها
import img1 from '../../../Images/file/1.jpg'
import img2 from '../../../Images/file/2.jpg'
import img3 from '../../../Images/file/3.jpg'
import img4 from '../../../Images/file/4.jpg'
import img5 from '../../../Images/file/5.jpg'

const RESOURCE = 'files'

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

export function FilesList() {
    const [search, setSearch] = useQueryParams(createQueryParam(queryNames))
    const [loading, setLoading] = useState(false)

    const [files, setFiles] = useState<{
        total_results: number
        data: Partial<PropertyType>[]
    }>({
        total_results: 5,
        data: [
            // ۱) رکورد کامل — تقریباً همه‌ی فیلدها پر شده
            {
                id: 1,
                status: 'فعال',
                propertyType: 'آپارتمان',
                contractType: 'فروش',
                documentType: 'تک برگ',
                city: 'تهران',
                district: 'منطقه ۲',
                neighborhood: 'سعادت‌آباد',
                address: 'خیابان علامه شمالی، کوچه ۱۲، پلاک ۴',
                area: 120,
                totalPrice: 8500000000,
                pricePerMeter: 70833333,
                roomCount: 2,
                occupancyStatus: 'تخلیه',
                bathroom: 'ایرانی و فرنگی',
                heating: 'پکیج',
                cooling: 'اسپلیت',
                flooring: 'سرامیک',
                facade: 'سنگ',
                totalFloor: 6,
                direction: 'شمالی',
                amenities: ['آسانسور', 'پارکینگ', 'انباری', 'بالکن'],
                ownerName: 'علی رضایی',
                ownerPhone: '09121234567',
                ownerPhone2: '02188451234',
                ownerJob: 'مهندس',
                description: 'واحد نوساز، نور عالی، نزدیک مترو و مراکز خرید.',
                internalNote: 'مالک عجله برای فروش دارد، قابل مذاکره.',
                images: [img1,img2],
                expertName: 'محمد احمدی',
                expertPhone: '09123456789',
                agencyName: 'املاک آریا',
                agencyPhone: '02122334455',
                agencyAddress: 'تهران، سعادت‌آباد، خیابان علامه',
                isAd:true
                
            },
            // ۲) ویلایی رهن و اجاره — تعدادی از فیلدها خالی
            {
                id: 2,
                status: 'فعال',
                propertyType: 'ویلایی',
                contractType: 'رهن و اجاره',
                documentType: 'دفترچه‌ای',
                city: 'کرج',
                district: 'گوهردشت',
                neighborhood: 'فاز ۲',
                address: 'خیابان شهید بهشتی، بن‌بست گل‌ها',
                area: 200,
                mortgagePrice: 500000000,
                monthlyRent: 15000000,
                mortgageTerms: 'قابل تبدیل به رهن کامل',
                roomCount: 3,
                totalFloor: 2,
                heating: 'شوفاژ',
                cooling: 'کولر آبی',
                amenities: ['حیاط', 'پارکینگ'],
                ownerName: 'محمد کریمی',
                ownerPhone: '09351234567',
                description: 'ویلای دوبلکس با حیاط بزرگ و درخت‌های میوه.',
                images: [img2],
                expertName: 'علی رضایی',
                expertPhone: '09123456780',
                agencyName: 'املاک سپهر',
                agencyPhone: '02632223344',
                agencyAddress: 'کرج، گوهردشت، فاز ۲',
                isAd:true
            },
            // ۳) زمین — فقط حداقل اطلاعات
            {
                id: 3,
                status: 'کنسل شد',
                propertyType: 'زمین',
                contractType: 'فروش',
                documentType: 'قولنامه‌ای',
                city: 'شیراز',
                district: 'معالی‌آباد',
                address: 'بلوار معالی‌آباد، نبش کوچه ۱۴',
                area: 350,
                totalPrice: 12000000000,
                direction: 'جنوبی',
                images: [img3],
                expertName: 'حسین کریمی',
                expertPhone: '09123456781',
                agencyName: 'املاک پارس',
                agencyPhone: '07132223344',
                agencyAddress: 'شیراز، معالی‌آباد، بلوار معالی‌آباد',
                isAd:true

            },
            // ۴) آپارتمان — اطلاعات متوسط، بدون قیمت هر متر و امکانات
            {
                id: 4,
                status: 'منصرف شد',
                propertyType: 'آپارتمان',
                contractType: 'فروش',
                city: 'اصفهان',
                neighborhood: 'ملک‌شهر',
                area: 95,
                totalPrice: 3200000000,
                pricePerMeter: 33684210,
                roomCount: 2,
                occupancyStatus: 'در حال سکونت',
                bathroom: 'ایرانی',
                facade: 'رومی',
                totalFloor: 4,
                ownerName: 'زهرا احمدی',
                ownerPhone: '09131234567',
                ownerJob: 'آزاد',
                images: [img4],
                expertName: 'رضا محمدی',
                expertPhone: '09123456782',
                agencyName: 'املاک تهران نو',
                agencyPhone: '03132223344',
                agencyAddress: 'اصفهان، ملک‌شهر، خیابان اصلی',
                isAd:false

            },
            // ۵) پیش فروش — بدون مالک و بدون امکانات، فقط یادداشت داخلی
            {
                id: 5,
                status: 'فروخته شده',
                propertyType: 'پیش فروش',
                contractType: 'مشارکت',
                documentType: 'وکالتی',
                city: 'مشهد',
                district: 'وکیل‌آباد',
                area: 140,
                totalPrice: 6100000000,
                roomCount: 3,
                flooring: 'پارکت',
                internalNote: 'فایل به مشتری قبلی فروخته شد، آرشیو شود.',
                images: [img5],
                expertName: 'امیر حسینی',
                expertPhone: '09123456783',
                agencyName: 'املاک آفتاب',
                agencyPhone: '05132223344',
                agencyAddress: 'مشهد، وکیل‌آباد، بلوار وکیل‌آباد',
                isAd:false

            },
        ],
    })
    const dispatch = useDispatch()
    // const getFiles = async () => {
    //     setLoading(true)
    //     try {
    //         let response = await DataProvider.get<{
    //             total_results: number
    //             results: PropertyType[]
    //         }>(`${RESOURCE}/`, search)
    //         if (response) {
    //             setFiles({
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
    //     getFiles()
    // }, [search])

    return (
        <ListPage
            header={'مدیریت فایل‌های ملکی'}
            href={RESOURCE + '/create'}
            searchField="title"
            searchText="نام"
            setParams={setSearch}
            params={search}
            resource={RESOURCE}
            getList={() => {}}
            // getList={getFiles}
            filtersData={queryNames}
            createModal={FilesCreate}
            defaultState={{
                name: '',
            }}
        >
            {loading ? (
                <Typography
                    variant="bodySm"
                    color="text.secondary"
                    sx={{py: 4, textAlign: 'center'}}
                >
                    در حال بارگذاری...
                </Typography>
            ) : files.data.length === 0 ? (
                <Typography
                    variant="bodySm"
                    color="text.secondary"
                    sx={{py: 4, textAlign: 'center'}}
                >
                    فایلی ثبت نشده است.
                </Typography>
            ) : (
                <Box sx={{pt: 1, px: 1.5}}>
                    <Grid container spacing={2.5}>
                        {files.data.map((item) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <PropertyCard item={item} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </ListPage>
    )
}

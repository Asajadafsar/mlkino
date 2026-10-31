import {Grid, Stack, Typography} from '@mui/material'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {toSelectOptions} from '../../Components/PropertyRecordForm/utils'
import {PropertyCard} from '../Files/PropertyCard/PropertyCard'
import img1 from '../../Images/file/1.jpg'
import img2 from '../../Images/file/2.jpg'
import img3 from '../../Images/file/3.jpg'
import ProfileUploader from '../User/ProfileUploader'
export type OwnersType = {
    id: number
    full_name: string
    phone_number: string
    cities: string
    neighborhoods: string
    profileImage?: string | null
    propertiesCount: string
    role:string
}

export function Owners({
    owners,
    setOwners,
    resource,
    editMode = false,
}: {
    owners: OwnersType
    setOwners: React.Dispatch<React.SetStateAction<OwnersType>>
    resource: string
    editMode?: boolean
}) {
    const files = [
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
            images: [img1],
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
        },
    ]
    return (
        <Stack>
            {/* <Stack
                sx={{
                    width: '100%',
                    marginBottom: '16px',
                }}
            >
                <ProfileUploader user={owners} setUser={setOwners} />
            </Stack> */}
            {owners && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        ...(editMode
                            ? [
                                  <CustomTextField
                                      key="id"
                                      name="id"
                                      setData={setOwners}
                                      resource={resource}
                                      label="شناسه"
                                      defaultValue={owners.id}
                                      disabled
                                  />,
                              ]
                            : []),

                        <CustomTextField
                            name="full_name"
                            setData={setOwners}
                            resource={resource}
                            label="نام"
                            defaultValue={owners.full_name}
                        />,

                        <CustomTextField
                            name="phone_number"
                            setData={setOwners}
                            resource={resource}
                            label="تلفن"
                            defaultValue={owners.phone_number}
                        />,

                        <CustomSelectField
                            key="cities"
                            name="cities"
                            setData={setOwners}
                            resource={resource}
                            label="شهر"
                            defaultValue={owners.cities}
                            options={toSelectOptions(['قم'])}
                        />,
                        <CustomTextField
                            key="properties_count"
                            name="properties_count"
                            setData={setOwners}
                            resource={resource}
                            label="تعداد ملک"
                            defaultValue={owners.propertiesCount}
                        />,
                        <CustomSelectField
                            key="neighborhoods"
                            name="neighborhoods"
                            setData={setOwners}
                            resource={resource}
                            label="محله"
                            defaultValue={owners.neighborhoods}
                            options={toSelectOptions(['زنبیل آباد', 'آزادگان'])}
                        />,
                    ]}
                />
            )}
            <Typography variant="body2" color="initial" fontWeight={'bold'} my={3}>
                فایل ها:
            </Typography>
            <Grid container spacing={2.5}>
                {files.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <PropertyCard item={item} />
                    </Grid>
                ))}
            </Grid>
        </Stack>
    )
}

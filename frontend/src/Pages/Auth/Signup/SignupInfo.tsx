import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import {Box, Button, IconButton, InputAdornment, Stack, Typography} from '@mui/material'
import {useState, type Dispatch, type SetStateAction} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import {CustomSelectField} from '../../../Components/Input/CustomSelectField'
import DatePickerFilter from '../../../Components/Filter/DatePicker'
import {setUtil} from '../../../redux/UtilSlice'
import {registerUser} from './authApi'
import {useNavigate} from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import axios from 'axios'
type SignupInfoForm = {
    first_name: string
    last_name: string
    national_code: string
    birth_date: string
    avatar: FileList | null
    province: string
    city: string
    postal_code: string
    address: string
    password: string
    password_confirm: string
    user_type: 'consumer' | 'investor'
}
interface AddressType {
    province: string
    city: string
    address: string
}

interface Props {
    phone: string
    onBack: () => void
    initialValues?: Partial<SignupInfoForm>
}

type InfoSubStep = 0 | 1

const SUB_STEP_FIELDS: Record<InfoSubStep, (keyof SignupInfoForm)[]> = {
    0: ['first_name', 'last_name', 'national_code', 'birth_date'],
    1: ['province', 'city', 'postal_code', 'address', 'password', 'password_confirm', 'user_type'],
}

const userTypeOptions = [
    {label: 'مصرف‌کننده', value: 'consumer'},
    {label: 'سرمایه‌گذار', value: 'investor'},
]

const subStepLabels = ['اطلاعات شخصی', 'آدرس و رمز عبور']

const SignupInfo = ({phone, onBack, initialValues}: Props) => {
    const dispatch = useDispatch()
    const [subStep, setSubStep] = useState<InfoSubStep>(0)
    const [addressData, setAddressData] = useState<AddressType>({} as AddressType)
    const {
        register,
        handleSubmit,
        trigger,
        watch,
        control,
        setValue,
        getValues,
        formState: {errors, isSubmitting},
    } = useForm<SignupInfoForm>({
        mode: 'onTouched',
        defaultValues: {
            first_name: '',
            last_name: '',
            national_code: '',
            birth_date: '',
            avatar: null,
            province: '',
            city: '',
            postal_code: '',
            address: '',
            password: '',
            password_confirm: '',
            user_type: 'consumer',
            ...initialValues,
        },
    })

    const password = watch('password')
    const navigate = useNavigate()
    // CustomSelectField uses a state setter; forward its value to react-hook-form.
    const setData: Dispatch<SetStateAction<any>> = (updater) => {
        const currentData = {user_type: watch('user_type')}
        const nextData = typeof updater === 'function' ? updater(currentData) : updater
        if (nextData?.user_type !== undefined) {
            setValue('user_type', nextData.user_type, {
                shouldDirty: true,
                shouldValidate: true,
            })
        }
    }

    register('user_type', {required: 'نوع کاربر الزامی است'})

    const goNext = async () => {
        const isValid = await trigger(SUB_STEP_FIELDS[0])
        if (isValid) setSubStep(1)
    }

    const goPrev = () => {
        if (subStep === 1) {
            setSubStep(0)
            return
        }
        onBack()
    }

    const onSubmit = async (data: SignupInfoForm) => {
        const payload = {
            phone,
            first_name: data.first_name,
            last_name: data.last_name,
            national_code: data.national_code,
            birth_date: data.birth_date,
            avatar: data.avatar?.[0] ?? undefined,
            province: data.province,
            city: data.city,
            postal_code: data.postal_code,
            address: data.address,
            password: data.password,
            password_confirm: data.password_confirm,
            user_type: data.user_type,
        }

        dispatch(setUtil({loading: true}))
        try {
            // Keep the API field names exactly as specified by the backend schema.
            await registerUser(payload as Parameters<typeof registerUser>[0])
            dispatch(setUtil({open: true, message: 'اطلاعات ثبت شد', severity: 'success'}))
            navigate('/dashboard')
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error?.response?.data?.message || 'ثبت اطلاعات با خطا مواجه شد',
                    severity: 'error',
                }),
            )
        } finally {
            dispatch(setUtil({loading: false}))
        }
    }

    const postalLookup = async () => {
        const postal = getValues('postal_code')

        try {
            const response = await axios.get<{
                data: AddressType
            }>(`${ACCOUNTS_URL}/postal/lookup/`, {
                params: {
                    postal_code: postal,
                },
                withCredentials: true,
            })
            setAddressData(response.data.data)
        } catch (error) {
            console.error('خطا در استعلام کد پستی:', error)
        }
    }

    return (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2} width="100%">
            <Box>
                <Typography fontSize={{xs: 14, sm: 15}} fontWeight={700}>
                    اطلاعات حساب
                </Typography>
                <Typography fontSize={{xs: 11, sm: 12}} color="text.secondary" mt={0.5}>
                    {subStepLabels[subStep]} — بخش {subStep + 1} از ۲
                </Typography>
                <Stack direction="row" spacing={0.5} mt={1}>
                    {subStepLabels.map((_, index) => (
                        <Box
                            key={index}
                            sx={{
                                flex: 1,
                                height: 3,
                                borderRadius: 10,
                                bgcolor:
                                    subStep >= index ? 'primary.main' : 'rgba(30, 97, 205, 0.1)',
                                transition: 'background-color 300ms ease',
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {subStep === 0 && (
                <>
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <CustomTextField
                            label="نام"
                            name="first_name"
                            register={{...register('first_name', {required: 'نام الزامی است'})}}
                            error={!!errors.first_name}
                            helperText={errors.first_name?.message}
                            fullWidth
                        />
                        <CustomTextField
                            label="نام خانوادگی"
                            name="last_name"
                            register={{
                                ...register('last_name', {required: 'نام خانوادگی الزامی است'}),
                            }}
                            error={!!errors.last_name}
                            helperText={errors.last_name?.message}
                            fullWidth
                        />
                    </Stack>

                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <CustomTextField
                            label="کد ملی"
                            name="national_code"
                            inputMode="numeric"
                            register={{
                                ...register('national_code', {
                                    required: 'کد ملی الزامی است',
                                    pattern: {
                                        value: /^\d{10}$/,
                                        message: 'کد ملی باید ۱۰ رقم باشد',
                                    },
                                }),
                            }}
                            error={!!errors.national_code}
                            helperText={errors.national_code?.message}
                            sx={{'& input': {direction: 'ltr', textAlign: 'right'}}}
                            fullWidth
                        />
                        <Controller
                            name="birth_date"
                            control={control}
                            rules={{required: 'تاریخ تولد الزامی است'}}
                            render={({field}) => (
                                <DatePickerFilter
                                    mode="controlled"
                                    item={{field: 'birth_date', label: 'تاریخ تولد'}}
                                    value={field.value || null}
                                    onChange={(value: string | null) => field.onChange(value ?? '')}
                                />
                            )}
                        />
                    </Stack>
                    {errors.birth_date && (
                        <Typography color="error" variant="caption">
                            {errors.birth_date.message}
                        </Typography>
                    )}

                    <Stack direction="row" spacing={1.5} mt={1}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={goPrev}
                            fullWidth
                            sx={{height: 48, borderRadius: 2, fontWeight: 700}}
                        >
                            مرحله قبل
                        </Button>
                        <Button
                            type="button"
                            variant="contained"
                            onClick={goNext}
                            fullWidth
                            sx={{
                                height: 48,
                                borderRadius: 2,
                                fontWeight: 700,
                                boxShadow: 'none',
                                '&:hover': {boxShadow: 'none'},
                            }}
                        >
                            مرحله بعد
                        </Button>
                    </Stack>
                </>
            )}

            {subStep === 1 && (
                <>
                    <CustomSelectField
                        name="user_type"
                        setData={setData}
                        resource="user_type"
                        label="نوع کاربر"
                        defaultValue="consumer"
                        options={userTypeOptions}
                    />

                    <CustomTextField
                        label="کد پستی"
                        name="postal_code"
                        inputMode="numeric"
                        register={{
                            ...register('postal_code', {
                                required: 'کد پستی الزامی است',
                                pattern: {
                                    value: /^\d{10}$/,
                                    message: 'کد پستی باید ۱۰ رقم باشد',
                                },
                            }),
                        }}
                        error={!!errors.postal_code}
                        helperText={errors.postal_code?.message}
                        sx={{
                            '& input': {
                                direction: 'ltr',
                                textAlign: 'right',
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        color="primary"
                                        aria-label="بررسی کد پستی"
                                        onClick={() => postalLookup()}
                                    >
                                        <SearchIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <CustomTextField
                            label="استان"
                            name="province"
                            value={addressData.province ?? ''}
                            fullWidth
                            disabled
                        />
                        <CustomTextField
                            label="شهر"
                            name="city"
                            value={addressData.city ?? ''}
                            fullWidth
                            disabled
                        />
                    </Stack>

                    <CustomTextField
                        label="آدرس"
                        name="address"
                        multiline
                        minRows={2}
                        value={addressData.address ?? ''}
                        fullWidth
                        disabled
                    />

                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <CustomTextField
                            label="رمز عبور"
                            name="password"
                            type="password"
                            register={{
                                ...register('password', {
                                    required: 'رمز عبور الزامی است',
                                    minLength: {
                                        value: 8,
                                        message: 'رمز عبور حداقل باید ۸ کاراکتر باشد',
                                    },
                                }),
                            }}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            fullWidth
                        />
                        <CustomTextField
                            label="تکرار رمز عبور"
                            name="password_confirm"
                            type="password"
                            register={{
                                ...register('password_confirm', {
                                    required: 'تکرار رمز عبور الزامی است',
                                    validate: (value) =>
                                        value === password || 'رمز عبور و تکرار آن یکسان نیست',
                                }),
                            }}
                            error={!!errors.password_confirm}
                            helperText={errors.password_confirm?.message}
                            fullWidth
                        />
                    </Stack>

                    <Stack direction="row" spacing={1.5} mt={1}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={goPrev}
                            fullWidth
                            sx={{height: 48, borderRadius: 2, fontWeight: 700}}
                        >
                            مرحله قبل
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                height: 48,
                                borderRadius: 2,
                                fontWeight: 700,
                                boxShadow: 'none',
                                '&:hover': {boxShadow: 'none'},
                            }}
                        >
                            {isSubmitting ? 'در حال ثبت...' : 'تکمیل ثبت نام'}
                        </Button>
                    </Stack>
                </>
            )}
        </Stack>
    )
}

export default SignupInfo

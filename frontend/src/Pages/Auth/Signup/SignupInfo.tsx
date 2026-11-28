import {authDestination} from '../../../Core/AuthDestination'
import {useLocation} from 'react-router-dom'
import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import {Alert,Avatar,CircularProgress, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography} from '@mui/material'
import {useEffect,useState, type Dispatch, type SetStateAction} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import {CustomSelectField} from '../../../Components/Input/CustomSelectField'
import DatePickerFilter from '../../../Components/Filter/DatePicker'
import {setUtil} from '../../../redux/UtilSlice'
import {registerUser} from './authApi'
import {useNavigate} from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import axios from 'axios'
type SignupInfoForm = {
    first_name: string
    last_name: string
    email: string
    national_code: string
    birth_date: string
    avatar: File | null
    province: string
    city: string
    postal_code: string
    address: string
    password: string
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
    initialValues?: Partial<SignupInfoForm> & {password_confirm?: string}
}

type InfoSubStep = 0 | 1

const PERSONAL_FIELDS = ['first_name', 'last_name', 'email', 'avatar', 'national_code', 'birth_date'] as const

const userTypeOptions = [
    {label: 'مصرف‌کننده', value: 'consumer'},
    {label: 'سرمایه‌گذار', value: 'investor'},
]


const SignupInfo = ({phone, onBack, initialValues}: Props) => {
    const hasInitialPassword = Boolean(initialValues?.password)
    const subStepLabels = ['اطلاعات شخصی', hasInitialPassword ? 'آدرس و نوع کاربر' : 'آدرس و رمز عبور']
    const dispatch = useDispatch()
    const [submitError, setSubmitError] = useState('')
    const [subStep, setSubStep] = useState<InfoSubStep>(0)
    const manual = false
    const [postalBusy,setPostalBusy]=useState(false)
    const [postalError,setPostalError]=useState('')
    const [avatarPreview,setAvatarPreview]=useState('')
    const digits=(s:string)=>s.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'?1776:1632)))
    const {
        register,
        handleSubmit,
        trigger,
        watch,
        control,
        setValue,
        setError,
        getValues,
        formState: {errors, isSubmitting},
    } = useForm<SignupInfoForm>({
        mode: 'onTouched',
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            national_code: '',
            birth_date: '',
            avatar: null,
            province: '',
            city: '',
            postal_code: '',
            address: '',
            password: '',
            user_type: 'consumer',
            ...initialValues,
        },
    })

    const avatar = watch('avatar')
    useEffect(()=>{if(!avatar){setAvatarPreview('');return}const url=URL.createObjectURL(avatar);setAvatarPreview(url);return()=>URL.revokeObjectURL(url)},[avatar])
    const location = useLocation()
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
        const isValid = await trigger([...PERSONAL_FIELDS])
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
            postal_manual:manual,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            national_code: data.national_code,
            birth_date: data.birth_date,
            avatar: data.avatar ?? undefined,
            province: data.province,
            city: data.city,
            postal_code: data.postal_code,
            address: data.address,
            password: initialValues?.password || data.password,
            password_confirm: initialValues?.password_confirm || data.password,
            user_type: data.user_type,
        }

        setSubmitError('')
        dispatch(setUtil({loading: true}))
        try {
            // Keep the API field names exactly as specified by the backend schema.
            const result=await registerUser(payload as Parameters<typeof registerUser>[0])
            dispatch(setUtil({open:true,message:result?.data?.message||'اطلاعات ثبت شد',severity:result?.data?.data?.user?.verification_status==='pending'?'info':'success'}))
            navigate(authDestination(location.search))
        } catch (error: any) {
            const response = error?.response?.data
            const details = Array.isArray(response?.errors) ? response.errors as {field: string; message: string}[] : []
            const personalErrors = PERSONAL_FIELDS.filter(field => details.some(detail => detail.field === field))
            for (const field of personalErrors) {
                setError(field, {type: 'server', message: details.find(detail => detail.field === field)?.message})
            }
            if (personalErrors.length) setSubStep(0)
            setSubmitError(details.map(detail => detail.message).filter(Boolean).join('؛ ') || response?.message || 'ثبت اطلاعات با خطا مواجه شد.')
        } finally {
            dispatch(setUtil({loading: false}))
        }
    }

    const postalLookup = async () => {
        const postal=digits(getValues('postal_code')||'').replace(/\s|-/g,'')
        if(!/^\d{10}$/.test(postal)){setPostalError('کد پستی باید دقیقاً ۱۰ رقم باشد.');return}
        setValue('postal_code',postal);setPostalBusy(true);setPostalError('')
        try {
            const response=await axios.get<{data:AddressType}>(`${ACCOUNTS_URL}/postal/lookup/`,{params:{postal_code:postal},withCredentials:true,timeout:45000})
            if(digits(getValues('postal_code')||'').replace(/\s|-/g,'')!==postal)return

            for(const key of ['province','city','address'] as const)setValue(key,response.data.data[key],{shouldDirty:true,shouldValidate:true})
        } catch(error:any) {setPostalError(error.response?.data?.message||'ارتباط با سرویس استعلام برقرار نشد؛ دوباره تلاش کنید.')}
        finally {setPostalBusy(false)}
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

            {submitError && <Alert severity="error">{submitError}</Alert>}
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

                    <TextField fullWidth required label="ایمیل" type="email" autoComplete="email" {...register('email', {required:'ایمیل الزامی است',pattern:{value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,message:'ایمیل معتبر وارد کنید'}})} error={!!errors.email} helperText={errors.email?.message}/>
                    <Controller name="avatar" control={control} rules={{required:'عکس پروفایل الزامی است'}} render={({field})=><Stack direction="row" alignItems="center" spacing={1.5}><Avatar src={avatarPreview||undefined} sx={{width:54,height:54,bgcolor:'#edf3ff',color:'primary.main'}}>{!avatarPreview&&'م'}</Avatar><Box><Button component="label" variant="outlined" size="small" startIcon={<PhotoCameraOutlinedIcon/>}>{field.value?'تغییر تصویر پروفایل':'افزودن تصویر پروفایل'}<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(file&&file.size<=5*1024*1024&&['image/png','image/jpeg','image/webp'].includes(file.type))field.onChange(file);else if(file)dispatch(setUtil({open:true,message:'عکس باید PNG، JPG یا WebP و کمتر از ۵ مگابایت باشد.',severity:'error'}));event.target.value=''}}/></Button>{field.value&&<Button size="small" onClick={()=>field.onChange(null)}>حذف تصویر</Button>}<Typography display="block" variant="caption" color="text.secondary">الزامی · JPG، PNG یا WebP تا ۵ مگابایت</Typography></Box></Stack>}/>

                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <Controller
                            name="national_code"
                            control={control}
                            rules={{
                                required: 'کد ملی الزامی است',
                                validate: value => digits(value || '').replace(/\D/g, '').length === 10 || 'کد ملی باید ۱۰ رقم باشد',
                            }}
                            render={({field}) => <TextField
                                {...field}
                                inputRef={field.ref}
                                fullWidth
                                label="کد ملی"
                                value={field.value || ''}
                                onChange={event => field.onChange(digits(event.target.value).replace(/\D/g, '').slice(0, 10))}
                                error={!!errors.national_code}
                                helperText={errors.national_code?.message}
                                inputProps={{inputMode: 'numeric', maxLength: 10, dir: 'ltr', pattern: '[0-9]*', 'aria-label': 'کد ملی'}}
                                sx={{'& input': {direction: 'ltr', textAlign: 'right'}}}
                            />}
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
                    {errors.avatar&&<Typography color="error" variant="caption">{errors.avatar.message}</Typography>}
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
                                setValueAs:(value:string)=>digits(value).replace(/\s|-/g,''),
                                onChange:()=>{for(const key of ['province','city','address'] as const)setValue(key,'')},
                                pattern: {
                                    value: /^\d{10}$/,
                                    message: 'کد پستی باید ۱۰ رقم باشد',
                                },
                            }),
                        }}
                        error={!!errors.postal_code||!!postalError}
                        helperText={postalError||errors.postal_code?.message}
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
                                        disabled={postalBusy}
                                        onClick={() => postalLookup()}
                                    >
                                        {postalBusy?<CircularProgress size={18}/>:<SearchIcon fontSize="small"/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Stack direction={{xs:'column',sm:'row'}} spacing={2}>{(['province','city'] as const).map(key=><Controller key={key} name={key} control={control} rules={{required:manual?'این فیلد الزامی است':false}} render={({field,fieldState})=><CustomTextField label={key==='province'?'استان':'شهر'} name={key} value={field.value||''} fullWidth disabled={!manual} onChange={field.onChange} error={!!fieldState.error} helperText={fieldState.error?.message}/>}/>)}</Stack>
                    <Controller name="address" control={control} rules={{required:manual?'آدرس کامل را وارد کنید':false,minLength:manual?{value:10,message:'نشانی حداقل ۱۰ حرف باشد'}:undefined}} render={({field,fieldState})=><CustomTextField label="آدرس" name="address" value={field.value||''} disabled={!manual} fullWidth multiline minRows={2} onChange={field.onChange} error={!!fieldState.error} helperText={fieldState.error?.message}/>}/>

                    {!hasInitialPassword && (
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

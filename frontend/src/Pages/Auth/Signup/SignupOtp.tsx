import {Box, Button, Stack, Typography} from '@mui/material'
import {useEffect, useState} from 'react'
import {useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import {setUtil} from '../../../redux/UtilSlice'
import { sendOtp, verifyOtp } from './authApi'

type OtpForm = {
    otp: string
}

interface Props {
    phone: string
    onBack: () => void
    onSuccess: () => void
}

const OTP_DURATION = 120

export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60

    return `${min}:${sec < 10 ? `0${sec}` : sec}`
}

const SignupOtp = ({phone, onBack, onSuccess}: Props) => {
    const dispatch = useDispatch()

    const [time, setTime] = useState(OTP_DURATION)
    const [otpRequestId, setOtpRequestId] = useState(0)
    const [isResending, setIsResending] = useState(false)

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<OtpForm>({mode: 'onTouched'})

    useEffect(() => {
        setTime(OTP_DURATION)

        const interval = window.setInterval(() => {
            setTime((prev) => {
                if (prev <= 1) {
                    window.clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => window.clearInterval(interval)
    }, [otpRequestId])

    const onVerify = async (data: OtpForm) => {
        dispatch(setUtil({loading: true}))

        try {
            await verifyOtp(phone, data.otp.trim())
            onSuccess()
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error?.response?.data?.message || 'کد تایید صحیح نیست',
                    severity: 'error',
                }),
            )
        } finally {
            dispatch(setUtil({loading: false}))
        }
    }

    const onResend = async () => {
        setIsResending(true)
        dispatch(setUtil({loading: true}))

        try {
            await sendOtp(phone)
            setOtpRequestId((id) => id + 1)

            dispatch(
                setUtil({
                    open: true,
                    message: 'کد جدید ارسال شد',
                    severity: 'success',
                }),
            )
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error?.response?.data?.message || 'ارسال مجدد کد با خطا مواجه شد',
                    severity: 'error',
                }),
            )
        } finally {
            setIsResending(false)
            dispatch(setUtil({loading: false}))
        }
    }

    return (
        <Stack component="form" onSubmit={handleSubmit(onVerify)} spacing={2} width="100%">
            <Box>
                <Typography fontSize={{xs: 14, sm: 15}} fontWeight={700} mb={0.7}>
                    کد تایید را وارد کنید
                </Typography>

                <Typography fontSize={{xs: 12, sm: 13}} color="text.secondary" lineHeight={1.8}>
                    کد ارسال شده به شماره{' '}
                    <Typography
                        component="span"
                        fontSize={{xs: 12, sm: 13}}
                        fontWeight={700}
                        color="text.primary"
                        dir="ltr"
                    >
                        {phone}
                    </Typography>{' '}
                    را وارد کنید.
                </Typography>
            </Box>

            <CustomTextField
                label="کد تایید"
                name="otp"
                inputMode="numeric"
                register={{
                    ...register('otp', {
                        required: 'کد تایید الزامی است',
                        pattern: {
                            value: /^\d{4,6}$/,
                            message: 'کد تایید معتبر نیست',
                        },
                    }),
                }}
                error={!!errors.otp}
                helperText={errors.otp?.message}
                sx={{'& input': {direction: 'ltr', textAlign: 'right'}}}
            />

            <Box textAlign="center">
                {time > 0 ? (
                    <Typography color="text.secondary" fontSize={{xs: 12, sm: 13}}>
                        {formatTime(time)} مانده تا دریافت مجدد کد
                    </Typography>
                ) : (
                    <Button
                        type="button"
                        variant="text"
                        onClick={onResend}
                        disabled={isResending}
                        sx={{fontSize: {xs: 12, sm: 13}}}
                    >
                        {isResending ? 'در حال ارسال...' : 'دریافت مجدد کد'}
                    </Button>
                )}
            </Box>

            <Stack direction="row" spacing={1.5} mt={1}>
                <Button
                    type="button"
                    variant="outlined"
                    onClick={onBack}
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
                    {isSubmitting ? 'در حال بررسی...' : 'تأیید و ادامه'}
                </Button>
            </Stack>
        </Stack>
    )
}

export default SignupOtp

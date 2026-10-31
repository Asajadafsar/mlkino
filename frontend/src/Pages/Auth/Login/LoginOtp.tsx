import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import {Box, Button, Stack, Typography} from '@mui/material'
import axios from 'axios'
import {useEffect, useState} from 'react'
import {useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import {setUtil} from '../../../redux/UtilSlice'
import SubmitCode from './SubmitCode'
import { useNavigate } from 'react-router-dom'

type OtpForm = {
    phone: string
}

interface LoginOtpProps {
    isOtpStep: boolean
    setIsOtpStep: (value: boolean) => void
}

export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60

    return `${min}:${sec < 10 ? `0${sec}` : sec}`
}

const OTP_DURATION = 120

const LoginOtp = ({isOtpStep, setIsOtpStep}: LoginOtpProps) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [time, setTime] = useState(0)

    const {register, handleSubmit, getValues} = useForm<OtpForm>()

    useEffect(() => {
        if (time <= 0) return

        const interval = window.setInterval(() => {
            setTime((prev) => {
                if (prev <= 1) {
                    window.clearInterval(interval)
                    return 0
                }

                return prev - 1
            })
        }, 1000)

        return () => {
            window.clearInterval(interval)
        }
    }, [time])

    const sendOtp = async (data: OtpForm) => {
        dispatch(setUtil({loading: true}))

        try {
            await axios.post(`${ACCOUNTS_URL}/send-otp/`, data)

            setTime(OTP_DURATION)

            setIsOtpStep(true)
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error?.response?.data?.message || 'ارسال کد با خطا مواجه شد',
                    severity: 'error',
                }),
            )
        } finally {
            dispatch(setUtil({loading: false}))
        }
    }

    const resendOtp = () => {
        handleSubmit(sendOtp)()
    }

    const phone = getValues('phone')

    if (!isOtpStep) {
        return (
            <Stack component="form" onSubmit={handleSubmit(sendOtp)} spacing={2.5} width="100%">
                <Box width="100%">
                    <Typography
                        fontSize={{
                            xs: 13,
                            sm: 14,
                        }}
                        fontWeight={600}
                        mb={1.5}
                    >
                        شماره تلفن همراه
                    </Typography>

                    <CustomTextField
                        label="شماره تلفن"
                        name="phone"
                        register={{
                            ...register('phone', {
                                required: 'شماره تلفن الزامی است',
                            }),
                        }}
                        sx={{
                            '& .MuiFormLabel-root': {
                                fontSize: {
                                    xs: '12px',
                                    sm: '14px',
                                },
                            },
                        }}
                    />
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                        height: 48,
                        borderRadius: 2,
                        fontSize: {
                            xs: 14,
                            sm: 15,
                        },
                        fontWeight: 700,
                        boxShadow: 'none',

                        '&:hover': {
                            boxShadow: 'none',
                        },
                    }}
                >
                    دریافت کد ورود
                </Button>
            </Stack>
        )
    }

    return (
        <Stack spacing={2} width="100%">
            <Stack spacing={0.7}>
                <Typography
                    fontSize={{
                        xs: 14,
                        sm: 15,
                    }}
                    fontWeight={700}
                >
                    کد تایید را وارد کنید
                </Typography>

                <Typography
                    fontSize={{
                        xs: 12,
                        sm: 13,
                    }}
                    color="text.secondary"
                    lineHeight={1.8}
                >
                    کد ارسال شده به شماره{' '}
                    <Typography
                        component="span"
                        fontSize={{
                            xs: 12,
                            sm: 13,
                        }}
                        fontWeight={700}
                        color="text.primary"
                        dir="ltr"
                    >
                        {phone}
                    </Typography>{' '}
                    را وارد کنید.
                </Typography>
            </Stack>

            <SubmitCode getValues={getValues} resource="login">
                {time > 0 ? (
                    <Typography
                        color="text.secondary"
                        textAlign="center"
                        fontSize={{
                            xs: 12,
                            sm: 13,
                        }}
                        mb={1}
                    >
                        {formatTime(time)} مانده تا دریافت مجدد کد
                    </Typography>
                ) : (
                    <Button
                        type="button"
                        variant="text"
                        onClick={resendOtp}
                        sx={{
                            fontSize: {
                                xs: 12,
                                sm: 13,
                            },
                            mb: 1,

                            '&:hover': {
                                backgroundColor: 'transparent',
                            },
                        }}
                    >
                        دریافت مجدد کد
                    </Button>
                )}
            </SubmitCode>
        </Stack>
    )
}

export default LoginOtp

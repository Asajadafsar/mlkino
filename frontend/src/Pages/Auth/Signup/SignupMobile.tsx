import {Box, Button, Stack, Typography} from '@mui/material'
import {useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import {setUtil} from '../../../redux/UtilSlice'
import { sendOtp } from './authApi'

type phoneForm = {
    phone: string
}

interface Props {
    onSuccess: (phone: string) => void
}

const SignupMobile = ({onSuccess}: Props) => {
    const dispatch = useDispatch()

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<phoneForm>({mode: 'onTouched'})

    const onSubmit = async (data: phoneForm) => {
        const phone = data.phone.trim()

        dispatch(setUtil({loading: true}))

        try {
            await sendOtp(phone)
            onSuccess(phone)
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

    return (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5} width="100%">
            <Box width="100%">
                <Typography fontSize={{xs: 13, sm: 14}} fontWeight={600} mb={1.5}>
                    شماره تلفن همراه
                </Typography>

                <CustomTextField
                    label="شماره تلفن"
                    name="phone"
                    inputMode="numeric"
                    register={{
                        ...register('phone', {
                            required: 'شماره تلفن الزامی است',
                            pattern: {
                                value: /^09\d{9}$/,
                                message: 'شماره موبایل معتبر نیست',
                            },
                        }),
                    }}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    sx={{
                        '& input': {direction: 'ltr', textAlign: 'right'},
                        '& .MuiFormLabel-root': {fontSize: {xs: '12px', sm: '14px'}},
                    }}
                />
            </Box>

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{
                    height: 48,
                    borderRadius: 2,
                    fontSize: {xs: 14, sm: 15},
                    fontWeight: 700,
                    boxShadow: 'none',
                    '&:hover': {boxShadow: 'none'},
                }}
            >
                {isSubmitting ? 'در حال ارسال...' : 'دریافت کد ثبت نام'}
            </Button>
        </Stack>
    )
}

export default SignupMobile

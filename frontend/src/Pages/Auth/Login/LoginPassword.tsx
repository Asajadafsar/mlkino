import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import { Button, Stack } from '@mui/material'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { CustomTextField } from '../../../Components/Input/CustomTextField'
import {setRole, UserRole} from '../../../redux/RoleSlice'
import { setUtil } from '../../../redux/UtilSlice'

type LoginPasswordForm = {
    phone: string
    password: string
    rememberMe: boolean
}

const LoginPassword = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<LoginPasswordForm>({
        defaultValues: {
            phone: '',
            password: '',
            rememberMe: false,
        },
    })

    const onSubmit = async (data: LoginPasswordForm) => {
        dispatch(setUtil({ loading: true }))

        try {
            const response = await axios.post(
                `${ACCOUNTS_URL}/login/password/`,
                {
                    phone: data.phone.trim(),
                    password: data.password,
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )

            const role = response.data?.data?.user?.role
            if (Object.values(UserRole).includes(role)) dispatch(setRole(role))
            navigate('/dashboard', {replace: true})
        } catch (error: unknown) {
            let message = 'خطایی در ورود رخ داده است'

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    (error.response?.status === 401
                        ? 'شماره تلفن یا رمز عبور اشتباه است'
                        : 'ارتباط با سرور برقرار نشد')
            }

            dispatch(
                setUtil({
                    open: true,
                    message,
                    severity: 'error',
                }),
            )
        } finally {
            dispatch(setUtil({ loading: false }))
        }
    }

    return (
        <Stack
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            spacing={2.2}
            width="100%"
            mt={0.7}
        >
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
                        fontSize: '14px',
                    },
                }}
            />

            <CustomTextField
                label="رمز عبور"
                name="password"
                type="password"
                register={{
                    ...register('password', {
                        required: 'رمز عبور الزامی است',
                    }),
                }}
                sx={{
                    '& .MuiFormLabel-root': {
                        fontSize: '14px',
                    },
                }}
            /><Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{
                    mt: 1,
                    height: 48,
                    borderRadius: 2,
                    fontSize: 15,
                    fontWeight: 700,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                }}
            >
                {isSubmitting
                    ? 'در حال ورود...'
                    : 'ورود به حساب'}
            </Button>
        </Stack>
    )
}

export default LoginPassword
import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import {Button, Stack} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import {Visibility, VisibilityOff} from '@mui/icons-material'
import axios from 'axios'
import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'
import {useNavigate} from 'react-router-dom'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import {setUtil} from '../../../redux/UtilSlice'

type ChangePasswordForm = {
    old_password: string
    new_password: string
    new_password_confirm: string
}

const ChangePassword = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: {errors},
    } = useForm<ChangePasswordForm>({
        defaultValues: {
            old_password: '',
            new_password: '',
            new_password_confirm: '',
        },
    })

    const newPassword = watch('new_password')
    const onSubmit = async (data: ChangePasswordForm) => {
        dispatch(setUtil({loading: true}))

        try {
            await axios.post(
                `${ACCOUNTS_URL}/change-password/`,
                {
                    old_password: data.old_password,
                    new_password: data.new_password,
                    new_password_confirm: data.new_password_confirm,
                },
                {
                    withCredentials: true,
                },
            )

            dispatch(
                setUtil({
                    open: true,
                    message: 'رمز عبور با موفقیت تغییر کرد',
                    severity: 'success',
                }),
            )

            navigate('/dashboard')
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message:
                        error?.response?.data?.message ||
                        error?.response?.data?.detail ||
                        'تغییر رمز عبور با خطا مواجه شد',
                    severity: 'error',
                }),
            )
        } finally {
            dispatch(setUtil({loading: false}))
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
                label="رمز عبور فعلی"
                name="old_password"
                type={showOldPassword ? 'text' : 'password'}
                register={{
                    ...register('old_password', {
                        required: 'رمز عبور فعلی الزامی است',
                    }),
                }}
                endIcon={
                    <IconButton
                        type="button"
                        size="small"
                        onClick={() =>
                            setShowOldPassword((prev) => !prev)
                        }
                        aria-label={
                            showOldPassword
                                ? 'مخفی کردن رمز عبور'
                                : 'نمایش رمز عبور'
                        }
                    >
                        {showOldPassword ? (
                            <VisibilityOff fontSize="small" />
                        ) : (
                            <Visibility fontSize="small" />
                        )}
                    </IconButton>
                }
                error={!!errors.old_password}
                helperText={errors.old_password?.message}
                sx={{
                    '& .MuiFormLabel-root': {
                        fontSize: '14px',
                    },
                }}
            />

            <CustomTextField
                label="رمز عبور جدید"
                name="new_password"
                type={showNewPassword ? 'text' : 'password'}
                register={{
                    ...register('new_password', {
                        required: 'رمز عبور جدید الزامی است',
                        minLength: {
                            value: 8,
                            message:
                                'رمز عبور باید حداقل ۸ کاراکتر باشد',
                        },
                    }),
                }}
                endIcon={
                    <IconButton
                        type="button"
                        size="small"
                        onClick={() =>
                            setShowNewPassword((prev) => !prev)
                        }
                        aria-label={
                            showNewPassword
                                ? 'مخفی کردن رمز عبور'
                                : 'نمایش رمز عبور'
                        }
                    >
                        {showNewPassword ? (
                            <VisibilityOff fontSize="small" />
                        ) : (
                            <Visibility fontSize="small" />
                        )}
                    </IconButton>
                }
                error={!!errors.new_password}
                helperText={errors.new_password?.message}
                sx={{
                    '& .MuiFormLabel-root': {
                        fontSize: '14px',
                    },
                }}
            />

            <CustomTextField
                label="تکرار رمز عبور جدید"
                name="new_password_confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                register={{
                    ...register('new_password_confirm', {
                        required: 'تکرار رمز عبور الزامی است',
                        validate: (value) =>
                            value === newPassword ||
                            'رمز عبور جدید و تکرار آن یکسان نیستند',
                    }),
                }}
                endIcon={
                    <IconButton
                        type="button"
                        size="small"
                        onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                        }
                        aria-label={
                            showConfirmPassword
                                ? 'مخفی کردن رمز عبور'
                                : 'نمایش رمز عبور'
                        }
                    >
                        {showConfirmPassword ? (
                            <VisibilityOff fontSize="small" />
                        ) : (
                            <Visibility fontSize="small" />
                        )}
                    </IconButton>
                }
                error={!!errors.new_password_confirm}
                helperText={errors.new_password_confirm?.message}
                sx={{
                    '& .MuiFormLabel-root': {
                        fontSize: '14px',
                    },
                }}
            />

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
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
                تغییر رمز عبور
            </Button>
        </Stack>
    )
}

export default ChangePassword
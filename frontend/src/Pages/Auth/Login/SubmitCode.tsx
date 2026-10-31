import {ACCOUNTS_URL} from '../../../Core/APP_URL'
import { Box, Button, Stack, Typography } from '@mui/material'
import axios from 'axios'
import React from 'react'
import { useForm, UseFormGetValues } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { CustomTextField } from '../../../Components/Input/CustomTextField'
import {setRole, UserRole} from '../../../redux/RoleSlice'
import { setUtil } from '../../../redux/UtilSlice'

type ParentForm = {
    phone: string
}

type SubmitCodeForm = {
    otp: string
}

type AuthResponse = {
    data: {
        user: {role: UserRole}
    }
}

interface Props {
    getValues?: UseFormGetValues<ParentForm>
    children: React.ReactNode
    phoneNumber?: string
    resource: string
}

export default function SubmitCode({ getValues, children, phoneNumber }: Props) {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { register, handleSubmit } = useForm<SubmitCodeForm>()

    const phone = getValues ? getValues('phone') : phoneNumber

    const onSubmit = async (data: SubmitCodeForm) => {
        dispatch(setUtil({ loading: true }))

        try {
            const response = await axios.post<AuthResponse>(
                `${ACCOUNTS_URL}/login/otp/`,
                {
                    phone,
                    code: data.otp,
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )

            dispatch(setRole(response.data.data.user.role))
            navigate('/dashboard', {replace: true})
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error?.response?.data?.message || 'کد تایید صحیح نیست',
                    severity: 'error',
                }),
            )
        } finally {
            dispatch(setUtil({ loading: false }))
        }
    }

    return (
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} width="100%">
            <Box width="100%">
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        my: 2,
                        fontSize: '12px',
                        lineHeight: 1.8,
                    }}
                >
                    کد تایید برای شماره{' '}
                    <Typography
                        component="span"
                        fontSize="12px"
                        fontWeight={700}
                        color="text.primary"
                    >
                        {phone}
                    </Typography>{' '}
                    ارسال شده است
                </Typography>

                <CustomTextField
                    label="کد تایید"
                    name="otp"
                    register={{
                        ...register('otp', {
                            required: 'کد تایید الزامی است',
                        }),
                    }}
                />
            </Box>

            <Box width="100%" mt={3} textAlign="center">
                {children}

                <Button
                    variant="contained"
                    size="large"
                    type="submit"
                    fullWidth
                    sx={{
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
                    تایید
                </Button>
            </Box>
        </Stack>
    )
}

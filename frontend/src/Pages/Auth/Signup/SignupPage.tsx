
import {Box, Link, Paper, Stack, Typography} from '@mui/material'
import {useState} from 'react'
import {Link as RouterLink} from 'react-router-dom'

import logoImage from '../../../Images/melkino.png'

import SignupInfo from './SignupInfo'
import SignupMobile from './SignupMobile'
import SignupOtp from './SignupOtp'

export type SignupStep = 0 | 1 | 2

const steps = [
    {title: 'شماره موبایل', description: 'ثبت شماره'},
    {title: 'تأیید شماره', description: 'کد یکبارمصرف'},
    {title: 'اطلاعات حساب', description: 'تکمیل ثبت نام'},
]

const CIRCLE_SIZE = {xs: 34, sm: 38}

const SignupPage = () => {
    const [step, setStep] = useState<SignupStep>(0)
    const [phone, setMobile] = useState('')

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: {xs: 1.5, sm: 3},
                py: 3,
                bgcolor: 'background.default',
                boxSizing: 'border-box',
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 560,
                    borderRadius: '22px',
                    boxSizing: 'border-box',

                    border: '3px solid transparent',

                    backgroundImage: (theme) => `
                        linear-gradient(${theme.palette.background.default}, ${theme.palette.background.default}),
                        conic-gradient(
                            from var(--border-angle),
                            transparent 0deg,
                            transparent 45deg,
                            rgba(30, 97, 205, 0.12) 70deg,
                            #1E61CD 100deg,
                            #4B83DC 120deg,
                            #1E61CD 140deg,
                            rgba(30, 97, 205, 0.12) 165deg,
                            transparent 200deg,
                            transparent 360deg
                        )
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',

                    boxShadow: `
                        0 0 20px rgba(30, 97, 205, 0.15),
                        0 0 50px rgba(30, 97, 205, 0.08)
                    `,

                    animation: 'signupBorderRotate 7s linear infinite',

                    '@keyframes signupBorderRotate': {
                        from: {'--border-angle': '0deg'},
                        to: {'--border-angle': '360deg'},
                    },

                    '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none',
                    },
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '19px',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'rgba(30, 97, 205, 0.08)',
                        boxShadow: '0 20px 60px rgba(30, 30, 30, 0.08)',
                        p: {xs: 2.5, sm: 4.5},
                        overflow: 'hidden',
                        minHeight: {xs: 520, sm: 580},
                    }}
                >
                    <Stack
                        width="100%"
                        spacing={{xs: 2.5, sm: 3}}
                    >
                        {/* Header */}
                        <Stack
                            alignItems="center"
                            spacing={{xs: 1, sm: 1.2}}
                        >
                            <Box
                                component="img"
                                src={logoImage}
                                alt="ملکینو"
                                sx={{
                                    width: {xs: 85, sm: 100},
                                    height: {xs: 60, sm: 70},
                                    objectFit: 'contain',
                                }}
                            />

                            <Stack alignItems="center" spacing={0.5}>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    color="text.primary"
                                    sx={{
                                        fontSize: {xs: '16px', sm: '20px'},
                                    }}
                                >
                                    ایجاد حساب کاربری
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    textAlign="center"
                                    sx={{
                                        fontSize: {xs: '11px', sm: '13px'},
                                    }}
                                >
                                    برای ادامه، اطلاعات خود را وارد کنید
                                </Typography>
                            </Stack>
                        </Stack>

                        {/* Stepper */}
                        <Box
                            sx={{
                                width: '100%',
                                direction: 'rtl',
                                pt: 0.5,
                                pb: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                }}
                            >
                                {steps.map((item, index) => {
                                    const isActive = step === index
                                    const isCompleted = step > index

                                    return (
                                        <Box
                                            key={item.title}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                flex:
                                                    index === steps.length - 1
                                                        ? '0 0 auto'
                                                        : 1,
                                            }}
                                        >
                                            <Stack
                                                alignItems="center"
                                                sx={{
                                                    flexShrink: 0,
                                                    width: {xs: 70, sm: 84},
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: CIRCLE_SIZE,
                                                        height: CIRCLE_SIZE,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',

                                                        bgcolor:
                                                            isActive || isCompleted
                                                                ? 'primary.main'
                                                                : 'background.paper',

                                                        color:
                                                            isActive || isCompleted
                                                                ? '#fff'
                                                                : 'text.secondary',

                                                        border: '2px solid',

                                                        borderColor:
                                                            isActive || isCompleted
                                                                ? 'primary.main'
                                                                : 'rgba(30, 97, 205, 0.12)',

                                                        fontSize: {xs: 10, sm: 11},
                                                        fontWeight: 800,

                                                        boxShadow: isActive
                                                            ? '0 0 0 5px rgba(30, 97, 205, 0.08), 0 5px 16px rgba(30, 97, 205, 0.22)'
                                                            : isCompleted
                                                              ? '0 4px 12px rgba(30, 97, 205, 0.15)'
                                                              : 'none',

                                                        transform: isActive
                                                            ? 'scale(1.04)'
                                                            : 'scale(1)',

                                                        transition:
                                                            'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
                                                    }}
                                                >
                                                    {isCompleted
                                                        ? '✓'
                                                        : `0${index + 1}`}
                                                </Box>

                                                <Typography
                                                    sx={{
                                                        mt: 1,
                                                        fontSize: {xs: 10, sm: 12},
                                                        fontWeight:
                                                            isActive || isCompleted
                                                                ? 700
                                                                : 500,

                                                        color: isActive
                                                            ? 'primary.main'
                                                            : isCompleted
                                                              ? 'text.primary'
                                                              : 'text.secondary',

                                                        transition: 'all 300ms ease',
                                                        textAlign: 'center',
                                                        wordBreak: 'break-word',
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        mt: 0.2,
                                                        display: {
                                                            xs: 'none',
                                                            sm: 'block',
                                                        },
                                                        fontSize: 10,

                                                        color: isActive
                                                            ? 'primary.main'
                                                            : 'text.secondary',

                                                        opacity: isActive ? 0.8 : 0.6,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {item.description}
                                                </Typography>
                                            </Stack>

                                            {index < steps.length - 1 && (
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        alignSelf: 'flex-start',
                                                        mt: {
                                                            xs: '16px',
                                                            sm: '18px',
                                                        },
                                                        mx: 0.5,
                                                        height: 2,
                                                        borderRadius: 10,

                                                        bgcolor:
                                                            step > index
                                                                ? 'primary.main'
                                                                : 'rgba(30, 97, 205, 0.08)',

                                                        transition:
                                                            'background-color 450ms cubic-bezier(0.4, 0, 0.2, 1)',
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>

                        {/* Content */}
                        <Box sx={{width: '100%'}}>
                            {step === 0 && (
                                <SignupMobile
                                    onSuccess={(value) => {
                                        setMobile(value)
                                        setStep(1)
                                    }}
                                />
                            )}

                            {step === 1 && (
                                <SignupOtp
                                    phone={phone}
                                    onBack={() => setStep(0)}
                                    onSuccess={() => setStep(2)}
                                />
                            )}

                            {step === 2 && (
                                <SignupInfo
                                    phone={phone}
                                    onBack={() => setStep(1)}
                                />
                            )}
                        </Box>

                        {/* Login link */}
                        <Box
                            sx={{
                                width: '100%',
                                textAlign: 'center',
                                pt: 2,
                                mt: 'auto',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    fontSize: {xs: '12px', sm: '13px'},
                                }}
                            >
                                قبلاً ثبت‌نام کرده‌اید؟{' '}
                            </Typography>

                            <Link
                                component={RouterLink}
                                to="/login"
                                underline="none"
                                sx={{
                                    fontSize: {xs: '12px', sm: '13px'},
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    transition: 'all 0.2s ease',

                                    '&:hover': {
                                        color: '#164FA8',
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                وارد شوید
                            </Link>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    )
}

export default SignupPage


import {
    Box,
    IconButton,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Link,
} from '@mui/material'

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import {useState} from 'react'
import {Link as RouterLink} from 'react-router-dom'

const logoImage = '/assets/melkino-logo-hd.png'
import LoginOtp from './LoginOtp'
import LoginPassword from './LoginPassword'

export type LoginMethod = 'password' | 'otp'

const LoginPage = () => {
    const [method, setMethod] = useState<LoginMethod>('password')
    const [isOtpStep, setIsOtpStep] = useState(false)

    const handleMethodChange = (value: LoginMethod | null) => {
        if (!value) return

        setMethod(value)
        setIsOtpStep(false)
    }

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
                    height: {xs: 650, sm: 660},
                    borderRadius: '22px',
                    padding: '3px',
                    overflow: 'hidden',

                    boxShadow: `
                        0 0 20px rgba(30, 97, 205, 0.15),
                        0 0 50px rgba(30, 97, 205, 0.08)
                    `,

                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        width: '180%',
                        height: '180%',
                        left: '-40%',
                        top: '-40%',

                        background: `
                            conic-gradient(
                                from 0deg,
                                transparent 0deg,
                                transparent 45deg,
                                rgba(30, 97, 205, 0.15) 70deg,
                                #1E61CD 100deg,
                                #4B83DC 120deg,
                                #1E61CD 140deg,
                                rgba(30, 97, 205, 0.15) 165deg,
                                transparent 200deg,
                                transparent 360deg
                            )
                        `,

                        animation: 'rotateBorder 6s linear infinite',
                        filter: 'blur(1px)',
                        zIndex: 0,

                        '@keyframes rotateBorder': {
                            '0%': {
                                transform: 'rotate(0deg)',
                            },
                            '100%': {
                                transform: 'rotate(360deg)',
                            },
                        },
                    },

                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '160%',
                        height: '160%',
                        left: '-30%',
                        top: '-30%',

                        background: `
                            conic-gradient(
                                from 180deg,
                                transparent 0deg,
                                transparent 70deg,
                                rgba(75, 131, 220, 0.45) 110deg,
                                transparent 150deg,
                                transparent 360deg
                            )
                        `,

                        filter: 'blur(18px)',
                        opacity: 0.7,
                        animation: 'rotateGlow 9s linear infinite reverse',
                        zIndex: 0,

                        '@keyframes rotateGlow': {
                            '0%': {
                                transform: 'rotate(0deg)',
                            },
                            '100%': {
                                transform: 'rotate(360deg)',
                            },
                        },
                    },
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        position: 'relative',
                        zIndex: 2,
                        width: '100%',
                        height: '100%',
                        boxSizing: 'border-box',
                        borderRadius: '19px',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'rgba(30, 97, 205, 0.08)',
                        boxShadow: '0 20px 60px rgba(30, 30, 30, 0.08)',
                        p: {xs: 2.5, sm: 4.5},
                        overflow: 'hidden',
                    }}
                >
                    {method === 'otp' && isOtpStep && (
                        <IconButton
                            onClick={() => setIsOtpStep(false)}
                            aria-label="بازگشت"
                            sx={{
                                position: 'absolute',
                                top: {xs: 12, sm: 16},
                                right: {xs: 12, sm: 16},
                                width: {xs: 38, sm: 42},
                                height: {xs: 38, sm: 42},
                                zIndex: 30,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'rgba(30, 97, 205, 0.12)',
                                color: 'text.secondary',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                                transition: 'all 0.2s ease',

                                '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: 'rgba(30, 97, 205, 0.06)',
                                    borderColor: 'rgba(30, 97, 205, 0.25)',
                                    transform: 'translateX(3px)',
                                },
                            }}
                        >
                            <ArrowForwardRoundedIcon />
                        </IconButton>
                    )}

                    <Stack
                        width="100%"
                        height="100%"
                        spacing={{xs: 2.5, sm: 3}}
                    >
                        <Stack
                            alignItems="center"
                            spacing={{xs: 1, sm: 1.2}}
                            flexShrink={0}
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
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    ورود به پنل مدیریت
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    textAlign="center"
                                    sx={{
                                        fontSize: {xs: '11px', sm: '13px'},
                                    }}
                                >
                                    برای ادامه، اطلاعات حساب خود را وارد کنید
                                </Typography>
                            </Stack>
                        </Stack>

                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            value={method}
                            onChange={(_, value: LoginMethod | null) =>
                                handleMethodChange(value)
                            }
                            sx={{
                                flexShrink: 0,
                                p: 0.5,
                                bgcolor: 'background.light',
                                borderRadius: 2.5,

                                '& .MuiToggleButton-root': {
                                    flex: 1,
                                    border: 0,
                                    borderRadius: 2,
                                    py: {xs: 0.9, sm: 1.15},
                                    px: {xs: 0.5, sm: 1.5},
                                    fontSize: {xs: '11px', sm: '14px'},
                                    whiteSpace: 'nowrap',
                                    color: 'text.secondary',
                                    transition: 'all 0.25s ease',

                                    '&:hover': {
                                        bgcolor: 'rgba(30, 97, 205, 0.05)',
                                    },

                                    '&.Mui-selected': {
                                        bgcolor: 'background.paper',
                                        color: 'primary.main',
                                        fontWeight: 700,
                                        boxShadow: '0 3px 10px rgba(0,0,0,0.09)',

                                        '&:hover': {
                                            bgcolor: 'background.paper',
                                        },
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="password">
                                ورود با رمز عبور
                            </ToggleButton>

                            <ToggleButton value="otp">
                                ورود با کد یکبارمصرف
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Box
                            sx={{
                                width: '100%',
                                flex: 1,
                                minHeight: 0,
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%',
                                    overflow: 'auto',

                                    '&::-webkit-scrollbar': {
                                        width: 4,
                                    },

                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor:
                                            'rgba(30, 97, 205, 0.15)',
                                        borderRadius: 10,
                                    },
                                }}
                            >
                                {method === 'password' ? (
                                    <LoginPassword />
                                ) : (
                                    <LoginOtp
                                        isOtpStep={isOtpStep}
                                        setIsOtpStep={setIsOtpStep}
                                    />
                                )}
                            </Box>
                        </Box>

                        {/* Registration link */}
                        <Box
                            sx={{
                                flexShrink: 0,
                                textAlign: 'center',
                                pt: 1.5,
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
                                حساب کاربری ندارید؟{' '}
                            </Typography>

                            <Link
                                component={RouterLink}
                                to="/signup"
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
                                ثبت‌نام کنید
                            </Link>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    )
}

export default LoginPage

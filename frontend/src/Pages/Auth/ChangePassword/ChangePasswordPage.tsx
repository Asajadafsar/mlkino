import {Box, Paper, Stack, Typography} from '@mui/material'

import logoImage from '../../../Images/melkino.png'
import ChangePassword from './ChangePassword'

const ChangePasswordPage = () => {
    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: {
                    xs: 1.5,
                    sm: 3,
                },
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
                    minHeight: {
                        xs: 570,
                        sm: 590,
                    },
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
                        minHeight: {
                            xs: 564,
                            sm: 584,
                        },
                        boxSizing: 'border-box',
                        borderRadius: '19px',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'rgba(30, 97, 205, 0.08)',
                        boxShadow: '0 20px 60px rgba(30, 30, 30, 0.08)',
                        p: {
                            xs: 2.5,
                            sm: 4.5,
                        },
                    }}
                >
                    <Stack
                        width="100%"
                        spacing={{
                            xs: 3,
                            sm: 3.5,
                        }}
                    >
                        <Stack
                            alignItems="center"
                            spacing={{
                                xs: 1,
                                sm: 1.2,
                            }}
                        >
                            <Box
                                component="img"
                                src={logoImage}
                                alt="Darine"
                                sx={{
                                    width: {
                                        xs: 85,
                                        sm: 100,
                                    },
                                    height: {
                                        xs: 60,
                                        sm: 70,
                                    },
                                    objectFit: 'contain',
                                }}
                            />

                            <Stack
                                alignItems="center"
                                spacing={0.5}
                            >
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    color="text.primary"
                                    sx={{
                                        fontSize: {
                                            xs: '16px',
                                            sm: '20px',
                                        },
                                    }}
                                >
                                    تغییر رمز عبور
                                </Typography>

                              
                            </Stack>
                        </Stack>

                        <Box
                            sx={{
                                width: '100%',
                                pt: 1,
                            }}
                        >
                            <ChangePassword />
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    )
}

export default ChangePasswordPage
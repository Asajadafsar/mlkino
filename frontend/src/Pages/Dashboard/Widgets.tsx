// Widgets.tsx

import { Grid, Stack, Typography, Skeleton, Box, keyframes } from '@mui/material'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type WidgetColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`

const floatBlob = keyframes`
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    50% {
        transform: translate(-6px, 6px) scale(1.08);
    }
`

interface Props {
    title: string
    value?: string | number
    icon?: ReactNode
    loading?: boolean
    link?: string
    color?: WidgetColor
    featured?: boolean
    trend?: number // درصد تغییر نسبت به دوره قبل، اختیاری — مثبت/منفی
}

export default function Widgets({
    title,
    value,
    loading,
    link,
    color = 'primary',
    featured = false,
    trend,
}: Props) {
    const stringValue = value === undefined || value === null ? '' : String(value)
    const isDataInvalid =
        !stringValue || stringValue.includes('NaN') || stringValue.includes('undefined')
    const isLoading = loading || isDataInvalid

    return (
        <Grid
            component={link ? Link : 'div'}
            to={link}
            item
            xs={12}
            sm={featured ? 6 : 6}
            md={featured ? 6 : 4}
            lg={featured ? 6 : 3}
            sx={{ textDecoration: 'none' }}
        >
            <Stack
                spacing={1}
                justifyContent="center"
                sx={{
                    height: '100%',
                    minHeight: featured ? 148 : 120,
                    p: featured ? 3.5 : 2.75,
                    borderRadius: '18px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: link ? 'pointer' : 'default',
                    animation: `${fadeInUp} 0.4s ease-out`,
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    color: '#fff',
                    backgroundImage: (theme) =>
                        `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
                    boxShadow: (theme) => `0 10px 24px ${theme.palette[color].main}3d`,
                    '&:hover': link
                        ? {
                              transform: 'translateY(-4px)',
                              boxShadow: (theme) => `0 18px 34px ${theme.palette[color].main}55`,
                          }
                        : undefined,
                }}
            >
                {/* بلاب‌های دکوراتیو برای حس گرافیکی، بدون آیکون */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -30,
                        insetInlineEnd: -30,
                        width: featured ? 140 : 100,
                        height: featured ? 140 : 100,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.14)',
                        animation: `${floatBlob} 6s ease-in-out infinite`,
                        pointerEvents: 'none',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -40,
                        insetInlineStart: -20,
                        width: featured ? 110 : 80,
                        height: featured ? 110 : 80,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.08)',
                        pointerEvents: 'none',
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {isLoading ? (
                        <Skeleton
                            width={110}
                            height={18}
                            sx={{ bgcolor: 'rgba(255,255,255,0.25)' }}
                        />
                    ) : (
                        <Typography
                            variant="labelMd"
                            sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}
                        >
                            {title}
                        </Typography>
                    )}

                    {isLoading ? (
                        <Skeleton
                            width={130}
                            height={featured ? 48 : 38}
                            sx={{ bgcolor: 'rgba(255,255,255,0.25)', mt: 0.5 }}
                        />
                    ) : (
                        <Stack direction="row" alignItems="baseline" spacing={1}>
                            <Typography
                                variant={featured ? 'headLineLg' : 'headLineMd'}
                                sx={{ fontWeight: 800, lineHeight: 1.15, mt: 0.5 }}
                            >
                                {stringValue}
                            </Typography>

                            {typeof trend === 'number' && !isLoading && (
                                <Typography
                                    variant="labelSm"
                                    sx={{
                                        fontWeight: 700,
                                        px: 0.8,
                                        py: 0.2,
                                        borderRadius: '8px',
                                        bgcolor: 'rgba(255,255,255,0.18)',
                                    }}
                                >
                                    {trend >= 0 ? `▲ ${trend}%` : `▼ ${Math.abs(trend)}%`}
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Grid>
    )
}
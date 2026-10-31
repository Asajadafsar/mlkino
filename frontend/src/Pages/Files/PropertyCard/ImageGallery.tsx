import {useEffect, useMemo, useRef, useState} from 'react'
import type {Swiper as SwiperClass} from 'swiper'
import {Swiper, SwiperSlide} from 'swiper/react'
import './swiper.css'
import {Box, IconButton, Stack, Typography} from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

export function ImageGallery({images, height}: {images: (string | File)[]; height: number}) {
    const [activeIndex, setActiveIndex] = useState(0)
    const swiperRef = useRef<SwiperClass | null>(null)

    // اگر آیتم از قبل رشته (مسیر import شده یا URL) است همون رو استفاده کن،
    // اگر File بود با createObjectURL تبدیلش کن
    const urls = useMemo(() => images.map((img) => (typeof img === 'string' ? img : URL.createObjectURL(img))), [images])

    useEffect(() => {
        // فقط URLهایی که از File ساخته شدن (blob:) باید revoke بشن
        return () => {
            urls.forEach((url) => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url)
                }
            })
        }
    }, [urls])

    // وقتی لیست تصاویر عوض شد، ایندکس رو ریست کن
    useEffect(() => {
        setActiveIndex(0)
    }, [urls])

    if (urls.length === 0) return null

    const multiple = urls.length > 1

    const arrowSx = {
        position: 'absolute',
        top: '50%',
        zIndex: 10,
        width: 44,
        height: 44,
        transform: 'translateY(-50%)',
        bgcolor: 'rgba(0,0,0,0.5)',
        color: '#fff',
        '&:hover': {bgcolor: 'rgba(0,0,0,0.7)'},
    } as const

    return (
        <Box sx={{position: 'relative', width: '100%', height, overflow: 'hidden', bgcolor: 'background.default'}}>
            <Swiper
                key={multiple ? 'loop' : 'single'} // loop رو نمی‌شه بعد از mount عوض کرد
                dir="rtl"
                loop={multiple}
                onSwiper={(s) => (swiperRef.current = s)}
                onSlideChange={(s) => setActiveIndex(s.realIndex)}
                style={{width: '100%', height: '100%'}}
            >
                {urls.map((url, i) => (
                    <SwiperSlide key={i}>
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

            {multiple && (
                <>
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation()
                            swiperRef.current?.slidePrev()
                        }}
                        sx={{...arrowSx, insetInlineStart: 12}}
                    >
                        <ChevronRightRoundedIcon sx={{fontSize: 32}} />
                    </IconButton>
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation()
                            swiperRef.current?.slideNext()
                        }}
                        sx={{...arrowSx, insetInlineEnd: 12}}
                    >
                        <ChevronLeftRoundedIcon sx={{fontSize: 32}} />
                    </IconButton>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            position: 'absolute',
                            bottom: 14,
                            insetInlineStart: 0,
                            insetInlineEnd: 0,
                            justifyContent: 'center',
                            zIndex: 10,
                        }}
                    >
                        {urls.map((_, i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                                }}
                            />
                        ))}
                    </Stack>

                    <Typography
                        variant="badge"
                        sx={{
                            position: 'absolute',
                            top: 12,
                            insetInlineStart: 12,
                            zIndex: 10,
                            bgcolor: 'rgba(0,0,0,0.55)',
                            color: '#fff',
                            px: 1.25,
                            py: 0.4,
                            borderRadius: 1.5,
                            fontSize: '14px',
                            fontWeight: 600,
                        }}
                    >
                        {activeIndex + 1}/{urls.length}
                    </Typography>
                </>
            )}
        </Box>
    )
}
import {Typography, Button, Paper} from '@mui/material'

import {CustomSelectField, CustomTextField, GridProducer} from '../shared'
import type {StepProps} from '../types'
import {toSelectOptions} from '../utils'
import { useState } from 'react'

export function AdTextStep({property, setProperty, resource}: StepProps) {
    const [active,setActive] = useState(false)
    // فعلاً اطلاعات تستی برای نمایش نتیجه هوش مصنوعی
    const aiResult = {
        title: '🔥 فروش آپارتمان ۱۲۰ متری خوش‌نقشه و مهندسی‌ساز',
        description:
            'فرصتی استثنایی برای خرید آپارتمان مدرن و خوش‌نقشه با طراحی مهندسی‌شده و نورگیری عالی. این واحد با موقعیت مناسب، متراژ ایده‌آل و امکانات کامل، گزینه‌ای مناسب برای سکونت یا سرمایه‌گذاری است.',
    }

    const handleGenerate = () => {
        setActive(true)
    }

    return (
        <>
            <CustomSelectField
                key="customerType"
                name="customerType"
                setData={setProperty}
                resource={resource}
                label="لحن آگهی"
                defaultValue={property.toneOfTheAd}
                options={toSelectOptions([
                    'حرفه ای و رسمی',
                    'صمیمی و دعوت کننده',
                    'فوری و فروش محور',
                    'مناسب سرمایه گذاری',
                ])}
                sx={{marginBottom: '20px'}}
            />

            <CustomTextField
                key="strongPoint"
                name="strongPoint"
                setData={setProperty}
                resource={resource}
                label="نقطه قوت ویژه ملک"
                placeholder="مثلاً: غرق در نور، شرایط پرداخت عالی"
                defaultValue={property.strongPoint}
                multiline
                minRows={3}
                sx={{marginBottom: '20px'}}
            />

            <Typography
                variant="labelSm"
                fontWeight={700}
                color="text.disabled"
                sx={{
                    mb: 1.5,
                    display: 'block',
                }}
            >
                اطلاعات تماس در متن (اختیاری)
            </Typography>

            <GridProducer
                data={[
                    <CustomTextField
                        key="advisorName"
                        name="advisorName"
                        setData={setProperty}
                        resource={resource}
                        label="نام مشاور"
                        defaultValue={property.advisorName}
                    />,

                    <CustomTextField
                        key="agencyName"
                        name="agencyName"
                        setData={setProperty}
                        resource={resource}
                        label="نام آژانس املاک"
                        defaultValue={property.agencyName}
                    />,

                    <CustomTextField
                        key="contactPhone"
                        name="contactPhone"
                        setData={setProperty}
                        resource={resource}
                        label="شماره تماس"
                        defaultValue={property.contactPhone}
                    />,
                ]}
            />

            <Button
                variant="contained"
                color="primary"
                sx={{
                    mt: 2,
                    fontSize: '12px',
                    minHeight: '36px',
                    px: 2,
                }}
                onClick={handleGenerate}
            >
                ✨ ساخت عنوان و متن آگهی
            </Button>

{
    active && <Paper
    elevation={0}
    sx={{
        mt: 2,
        p: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'primary.100',
        backgroundColor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',

        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '3px',
            background:
                'linear-gradient(90deg, transparent, #7C3AED, transparent)',
        },
    }}
>
    {/* Header */}
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
        }}
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            <div
                style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(124, 58, 237, 0.1)',
                    fontSize: '15px',
                }}
            >
                ✨
            </div>

            <div>
                <Typography
                    sx={{
                        fontSize: '12px',
                        fontWeight: 700,
                        lineHeight: 1.4,
                    }}
                >
                    نتیجه هوش مصنوعی
                </Typography>

                <Typography
                    sx={{
                        fontSize: '10px',
                        color: 'text.disabled',
                        mt: 0.2,
                    }}
                >
                    عنوان و متن پیشنهادی آگهی
                </Typography>
            </div>
        </div>

        <Typography
            sx={{
                fontSize: '10px',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: 'success.50',
                color: 'success.main',
                fontWeight: 600,
            }}
        >
            آماده
        </Typography>
    </div>

    {/* Title */}
    <div
        style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(124, 58, 237, 0.04)',
            marginBottom: '10px',
        }}
    >
        <Typography
            sx={{
                fontSize: '10px',
                color: 'text.disabled',
                mb: 0.7,
                fontWeight: 600,
            }}
        >
            عنوان پیشنهادی
        </Typography>

        <Typography
            sx={{
                fontSize: '13px',
                fontWeight: 700,
                lineHeight: 1.8,
                color: 'text.primary',
            }}
        >
            {aiResult.title}
        </Typography>
    </div>

    {/* Description */}
    <div
        style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.025)',
        }}
    >
        <Typography
            sx={{
                fontSize: '10px',
                color: 'text.disabled',
                mb: 0.7,
                fontWeight: 600,
            }}
        >
            متن آگهی
        </Typography>

        <Typography
            sx={{
                fontSize: '12px',
                lineHeight: 2,
                color: 'text.secondary',
            }}
        >
            {aiResult.description}
        </Typography>
    </div>

    {/* Actions */}
    <div
        style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
        }}
    >
        <Button
            variant="contained"
            size="small"
            sx={{
                flex: 1,
                minHeight: '34px',
                fontSize: '11px',
                borderRadius: '8px',
                boxShadow: 'none',
            }}
        >
            استفاده از این متن
        </Button>

        <Button
            variant="outlined"
            size="small"
            sx={{
                minHeight: '34px',
                px: 1.5,
                fontSize: '11px',
                borderRadius: '8px',
            }}
        >
            تولید مجدد
        </Button>
    </div>
</Paper>
}
        </>
    )
}
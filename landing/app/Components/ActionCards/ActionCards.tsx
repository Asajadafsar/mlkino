'use client'
import React from 'react'
import { Box, Button, Stack, Typography, Grid } from '@mui/material'
import AddHomeWorkIcon from '@mui/icons-material/AddHomeWork'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'

type CardProps = {
  title: string
  description: string
  buttonText: string
  icon: React.ReactNode
  variant: 'primary' | 'light'
  onClick?: () => void
}

const styles = {
  primary: {
    card: {
      background:
        'linear-gradient(270deg, #2f63b8 0%, #2454a3 55%, #1f4a93 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 8px 24px rgba(37, 84, 163, 0.28)',
    },
    iconBox: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
    title: { color: '#fff' },
    desc: { color: 'rgba(255, 255, 255, 0.85)' },
    button: {
      backgroundColor: '#f7b23b',
      color: '#1a1a1a',
      '&:hover': { backgroundColor: '#e9a22a' },
    },
  },
  light: {
    card: {
      background:
        'radial-gradient(circle at 0% 100%, rgba(255, 214, 150, 0.35) 0%, transparent 45%), #ffffff',
      color: '#1a1a1a',
      border: '1px solid #f0f0f0',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
    },
    iconBox: { backgroundColor: '#eef3fb' },
    title: { color: '#111' },
    desc: { color: '#555' },
    button: {
      backgroundColor: '#2563c9',
      color: '#fff',
      '&:hover': { backgroundColor: '#1d4fa3' },
    },
  },
} as const

function ActionCard({
  title,
  description,
  buttonText,
  icon,
  variant,
  onClick,
}: CardProps) {
  const s = styles[variant]

  return (
    <Box
      sx={{
        ...s.card,
        height: '100%',
        borderRadius: '14px',
        px: { xs: 2, md: 3 },
        py: { xs: 2.5, sm: 3, md: 4 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        gap: { xs: 1.5, sm: 2 },
        minWidth: 0,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': { transform: { xs: 'none', md: 'translateY(-2px)' } },
      }}
    >
      {/* آیکون (سمت راست) */}
      <Box
        sx={{
          ...s.iconBox,
          width: { xs: 48, md: 56 },
          height: { xs: 48, md: 56 },
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      {/* متن */}
      <Stack
        spacing={0.5}
        sx={{
          flex: 1,
          minWidth: 0,
          textAlign: { xs: 'center', sm: 'start' },
          alignItems: { xs: 'center', sm: 'stretch' },
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        <Typography
          component="h3"
          sx={{
            ...s.title,
            fontWeight: 800,
            fontSize: { xs: '1rem', md: '1.15rem' },
            lineHeight: 1.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            ...s.desc,
            fontSize: { xs: '0.75rem', md: '0.8rem' },
            lineHeight: 1.9,
            maxWidth: 420,
          }}
        >
          {description}
        </Typography>
      </Stack>

      {/* دکمه (سمت چپ) */}
      <Button
        variant="contained"
        disableElevation
        onClick={onClick}
        sx={{
          ...s.button,
          fontWeight: 700,
          borderRadius: '10px',
          px: { xs: 3, sm: 4, md: 3, lg: 5 },
          py: 1.3,
          fontSize: '0.8rem',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {buttonText}
      </Button>
    </Box>
  )
}

export default function ActionCards() {
  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 20, // بالاتر از کنترل‌های اسلایدر (zIndex: 10)
        width: '100%',
        // موبایل و تبلت: زیر اسلایدر و بدون همپوشانی | دسکتاپ (md به بالا): روی اسلایدر
        // اگر این عدد را عوض کردید، pb نوار پایین اسلایدر (md) را هم هماهنگ کنید
        mt: { xs: 2, md: '-70px' },
        pb: { xs: 1, md: 2 },
        px:{
          xs:0,
          md:5
        }
      }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ActionCard
            variant="primary"
            title="مالک یا سازنده هستید؟"
            description="ملک خود را رایگان بسپارید و در کمتر از چند روز به خریداران معرفی کنید"
            buttonText="ثبت رایگان ملک"
            icon={<AddHomeWorkIcon sx={{ fontSize: { xs: 28, md: 32 }, color: '#f7b23b' }} />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ActionCard
            variant="light"
            title="ملک دلخواه‌تان را نیافتید؟"
            description="درخواست خرید یا رهن خود را ثبت کنید تا مالکان و مشاوران با شما تماس بگیرند"
            buttonText="ثبت درخواست ملک"
            icon={<PersonSearchIcon sx={{ fontSize: { xs: 28, md: 32 }, color: '#2563c9' }} />}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
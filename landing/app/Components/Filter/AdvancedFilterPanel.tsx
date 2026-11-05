'use client'
import React, { useState } from 'react'
import { Box, Button, Divider, IconButton, Slider, Typography } from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import LocalParkingIcon from '@mui/icons-material/LocalParking'
import ElevatorIcon from '@mui/icons-material/Elevator'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import BalconyIcon from '@mui/icons-material/Balcony'
import DeckIcon from '@mui/icons-material/Deck'

// ==================== انواع ====================
type DealType = 'buy' | 'rent'
type RoomCount = 'all' | '1' | '2' | '3' | '4+'
type PropertyStatus = 'ready' | 'new' | 'fullRenovated' | 'empty'
type AmenityKey = 'privateDeed' | 'elevator' | 'warehouse' | 'largeBalcony' | 'roofGarden'

export interface FilterState {
  dealType: DealType
  areaRange: [number, number]
  roomCount: RoomCount
  amenities: Record<AmenityKey, boolean>
  propertyStatus: PropertyStatus[]
}

// ==================== ثابت‌ها ====================
const BLUE = '#2159c4'
const BLUE_SOFT = '#e3ecfb'
const INK = '#111827'
const MUTED = '#6b7280'
const FIELD = '#f1f3f6'

const AREA_MIN = 30
const AREA_MAX = 1000

const toFa = (n: number | string) =>
  String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

const DEAL_TYPES: { key: DealType; label: string }[] = [
  { key: 'buy', label: 'خرید و فروش' },
  { key: 'rent', label: 'رهن و اجاره' },
]

const ROOMS: { key: RoomCount; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: '1', label: '۱' },
  { key: '2', label: '۲' },
  { key: '3', label: '۳' },
  { key: '4+', label: '+۴' },
]

const AMENITIES: { key: AmenityKey; label: string; icon: React.ElementType }[] = [
  { key: 'privateDeed', label: 'پارکینگ سندی اختصاصی', icon: LocalParkingIcon },
  { key: 'elevator', label: 'آسانسور نفربر / باربر', icon: ElevatorIcon },
  { key: 'warehouse', label: 'انباری مجزا', icon: Inventory2OutlinedIcon },
  { key: 'largeBalcony', label: 'بالکن بزرگ و کاربردی', icon: BalconyIcon },
  { key: 'roofGarden', label: 'روف گاردن و فضاسازی', icon: DeckIcon },
]

const STATUSES: { key: PropertyStatus; label: string }[] = [
  { key: 'new', label: 'نوساز کلیدنخورده' },
  { key: 'fullRenovated', label: 'بازسازی کامل' },
  { key: 'empty', label: 'آماده تحویل و تخلیه' },
  { key: 'ready', label: 'آماده سکونت' },
]

export const EMPTY_FILTERS: FilterState = {
  dealType: 'buy',
  areaRange: [AREA_MIN, AREA_MAX],
  roomCount: 'all',
  amenities: {
    privateDeed: false,
    elevator: false,
    warehouse: false,
    largeBalcony: false,
    roofGarden: false,
  },
  propertyStatus: [],
}

// ==================== اجزای کمکی ====================
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: INK, mb: 1.5 }}>
      {children}
    </Typography>
  )
}

type Props = {
  initialFilters?: FilterState
  resultCount?: number
  onApply?: (filters: FilterState) => void
  onClose?: () => void // فقط وقتی داخل Drawer است
  embedded?: boolean // true = داخل Drawer (Bottom Sheet) موبایل
}

// ==================== کامپوننت اصلی ====================
export default function AdvancedFilterPanel({
  initialFilters,
  resultCount = 124,
  onApply,
  onClose,
  embedded = false,
}: Props) {
  const [filters, setFilters] = useState<FilterState>(initialFilters ?? {
    dealType: 'buy',
    areaRange: [85, 280],
    roomCount: '2',
    amenities: {
      privateDeed: true,
      elevator: true,
      warehouse: true,
      largeBalcony: false,
      roofGarden: false,
    },
    propertyStatus: ['new'],
  })

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const toggleAmenity = (key: AmenityKey) =>
    setFilters((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] },
    }))

  const toggleStatus = (status: PropertyStatus) =>
    setFilters((prev) => ({
      ...prev,
      propertyStatus: prev.propertyStatus.includes(status)
        ? prev.propertyStatus.filter((s) => s !== status)
        : [...prev.propertyStatus, status],
    }))

  const [minArea, maxArea] = filters.areaRange

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        overflow: 'hidden',
        ...(embedded
          ? { maxHeight: '90dvh' }
          : {
              borderRadius: '16px',
              border: '1px solid #eef0f4',
              boxShadow: '0 4px 20px rgba(20, 30, 60, 0.06)',
              maxHeight: { md: 'calc(100dvh - 32px)' },
            }),
      }}
    >
      {/* ==================== هدر (ثابت) ==================== */}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 1.5, sm: 2.5 }, flexShrink: 0 }}>
        {/* دستگیره‌ی Bottom Sheet */}
        {embedded && (
          <Box
            sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: '#d1d5db', mx: 'auto', mb: 1.5 }}
          />
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon sx={{ color: BLUE, fontSize: 22 }} />
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.05rem', color: INK }}>
              فیلترهای پیشرفته
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={() => setFilters(EMPTY_FILTERS)}
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />}
              sx={{
                color: '#d32f2f',
                fontSize: '0.75rem',
                fontWeight: 700,
                minWidth: 'auto',
                px: 1,
                '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.06)' },
              }}
            >
              پاک کردن
            </Button>

            {onClose && (
              <IconButton
                onClick={onClose}
                aria-label="بستن"
                size="small"
                sx={{ color: '#9ca3af', mx: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        <Divider />
      </Box>

      {/* ==================== بدنه (اسکرول‌شونده) ==================== */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          px: { xs: 2, sm: 2.5 },
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        {/* ==================== نوع معامله ==================== */}
        <Box>
          <SectionTitle>نوع معامله</SectionTitle>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {DEAL_TYPES.map((item) => {
              const active = filters.dealType === item.key
              return (
                <Button
                  key={item.key}
                  onClick={() => set('dealType', item.key)}
                  aria-pressed={active}
                  sx={{
                    flex: 1,
                    py: 1.1,
                    minHeight: { xs: 44, md: 'auto' },
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: active ? 800 : 500,
                    color: active ? BLUE : MUTED,
                    backgroundColor: active ? BLUE_SOFT : FIELD,
                    border: '1px solid',
                    borderColor: active ? '#b9cff5' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': { backgroundColor: active ? BLUE_SOFT : '#e8ebf0' },
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Box>
        </Box>

        {/* ==================== محدوده متراژ ==================== */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 0.5,
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: INK }}>
              محدوده متراژ (مترمربع)
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: BLUE }}>
              {toFa(minArea)} تا {toFa(maxArea)} متر
            </Typography>
          </Box>

          <Box sx={{ px: 1.5 }}>
            <Slider
              value={filters.areaRange}
              onChange={(_, v) => set('areaRange', v as [number, number])}
              min={AREA_MIN}
              max={AREA_MAX}
              disableSwap
              getAriaLabel={() => 'محدوده متراژ'}
              sx={{
                color: BLUE,
                height: 8,
                touchAction: 'none',
                '& .MuiSlider-rail': { backgroundColor: '#e6eaf1', opacity: 1 },
                '& .MuiSlider-track': { border: 'none' },
                '& .MuiSlider-thumb': {
                  width: 18,
                  height: 18,
                  '@media (pointer: coarse)': { width: 26, height: 26 },
                  backgroundColor: '#fff',
                  border: `3px solid ${BLUE}`,
                  boxShadow: 'none',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 6px rgba(33, 89, 196, 0.16)',
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
            <Typography sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
              {toFa(AREA_MIN)} متر
            </Typography>
            <Typography sx={{ color: '#9ca3af', fontSize: '0.7rem' }}>
              +{toFa(AREA_MAX)} متر
            </Typography>
          </Box>
        </Box>

        {/* ==================== تعداد اتاق خواب ==================== */}
        <Box>
          <SectionTitle>تعداد اتاق خواب</SectionTitle>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {ROOMS.map((item) => {
              const active = filters.roomCount === item.key
              return (
                <Button
                  key={item.key}
                  onClick={() => set('roomCount', item.key)}
                  aria-pressed={active}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    py: 1,
                    minHeight: { xs: 44, md: 'auto' },
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: active ? '#fff' : INK,
                    backgroundColor: active ? BLUE : FIELD,
                    transition: 'all 0.2s ease',
                    '&:hover': { backgroundColor: active ? '#1a4aa5' : '#e8ebf0' },
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Box>
        </Box>

        {/* ==================== امکانات رفاهی و ساختمان ==================== */}
        <Box>
          <SectionTitle>امکانات رفاهی و ساختمان</SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {AMENITIES.map((item) => {
              const checked = filters.amenities[item.key]
              const Icon = item.icon
              return (
                <Box
                  key={item.key}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onClick={() => toggleAmenity(item.key)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      toggleAmenity(item.key)
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: { xs: 1.4, md: 1 },
                    px: 0.5,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': { backgroundColor: '#f8f9fb' },
                    '&:focus-visible': { outline: `2px solid ${BLUE}` },
                  }}
                >
                  {/* چک‌باکس */}
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid',
                      borderColor: checked ? BLUE : '#9ca3af',
                      backgroundColor: checked ? BLUE : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {checked && <CheckRoundedIcon sx={{ fontSize: 15, color: '#fff' }} />}
                  </Box>

                  <Typography
                    sx={{ flex: 1, fontSize: '0.82rem', color: checked ? INK : '#374151' }}
                  >
                    {item.label}
                  </Typography>

                  <Icon sx={{ fontSize: 20, color: '#2c5d9e' }} />
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* ==================== وضعیت ملک ==================== */}
        <Box>
          <SectionTitle>وضعیت ملک</SectionTitle>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {STATUSES.map((item) => {
              const active = filters.propertyStatus.includes(item.key)
              return (
                <Box
                  key={item.key}
                  component="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleStatus(item.key)}
                  sx={{
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    px: 1.5,
                    py: { xs: 1, md: 0.8 },
                    borderRadius: '10px',
                    fontSize: { xs: '0.8rem', md: '0.75rem' },
                    fontWeight: active ? 800 : 500,
                    color: active ? BLUE : '#374151',
                    backgroundColor: active ? '#d9e6fb' : FIELD,
                    border: '1px solid',
                    borderColor: active ? '#b9cff5' : 'transparent',
                    transition: 'all 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': { backgroundColor: active ? '#d9e6fb' : '#e8ebf0' },
                    '&:focus-visible': { outline: `2px solid ${BLUE}`, outlineOffset: 2 },
                  }}
                >
                  {item.label}
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      {/* ==================== فوتر (ثابت) ==================== */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 2.5 },
          pt: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          borderTop: '1px solid #eef0f4',
          backgroundColor: '#fff',
        }}
      >
        <Button
          variant="contained"
          fullWidth
          disableElevation
          onClick={() => onApply?.(filters)}
          sx={{
            backgroundColor: BLUE,
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.9rem',
            borderRadius: '10px',
            py: 1.4,
            boxShadow: '0 6px 16px rgba(33, 89, 196, 0.3)',
            '&:hover': {
              backgroundColor: '#1a4aa5',
              boxShadow: '0 8px 20px rgba(33, 89, 196, 0.38)',
            },
          }}
        >
          اعمال فیلترها ({toFa(resultCount)} نتیجه)
        </Button>
      </Box>
    </Box>
  )
}
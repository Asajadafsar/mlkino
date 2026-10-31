import {Box, Chip, Dialog, DialogContent, IconButton, Stack, Typography} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ImageNotSupportedRoundedIcon from '@mui/icons-material/ImageNotSupportedRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import SquareFootRoundedIcon from '@mui/icons-material/SquareFootRounded'
import BedRoundedIcon from '@mui/icons-material/BedRounded'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import ContactPhoneRoundedIcon from '@mui/icons-material/ContactPhoneRounded'
import NotesRoundedIcon from '@mui/icons-material/NotesRounded'
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import {ImageGallery} from './ImageGallery'
import {DetailSection} from './DetailSection'
import {getPropertyTypeIcon} from './PropertyTypeIcon'
import {STATUS_COLOR, isFilled, useDerivedPropertyInfo} from './propertyCardUtils'
import { PropertyType, RecordMode } from '../../../Components/PropertyRecordForm'

function QuickFactChip({icon, label}: {icon: React.ReactNode; label?: string}) {
    if (!label) return null
    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
                px: 1.25,
                py: 0.6,
                borderRadius: 5,
                bgcolor: 'background.default',
                flexShrink: 0,
            }}
        >
            <Box sx={{display: 'flex', color: 'primary.main'}}>{icon}</Box>
            <Typography variant="labelSm" fontWeight={700} noWrap>
                {label}
            </Typography>
        </Stack>
    )
}

export function PropertyDetailDialog({
    open,
    onClose,
    item,
    mode = 'file',
}: {
    open: boolean
    onClose: () => void
    item: Partial<PropertyType>
    mode?: RecordMode
}) {
    const statusColor = STATUS_COLOR[item.status ?? ''] ?? 'text.disabled'
    const images = item.images ?? []
    const {
        location,
        quickFacts,
        priceMain,
        priceLabel,
        priceSecondary,
        amenities,
        specFields,
        financialFields,
        ownerFields,
        expertFields,
        requesterFields,
        adFields,
        hasNotes,
    } = useDerivedPropertyInfo(item)

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            scroll="paper"
            PaperProps={{sx: {borderRadius: 3, overflow: 'hidden'}}}
        >
            {/* هدر تصویری */}
            <Box sx={{position: 'relative'}}>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 10,
                        insetInlineEnd: 10,
                        zIndex: 3,
                        bgcolor: mode === 'request' ? 'rgba(30,97,205,0.14)' : 'rgba(0,0,0,0.4)',
                        color: mode === 'request' ? 'primary.main' : '#fff',
                        backdropFilter: 'blur(4px)',
                        '&:hover': {bgcolor: mode === 'request' ? 'rgba(30,97,205,0.22)' : 'rgba(0,0,0,0.6)'},
                    }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>

                {/* برای مود «درخواست» به‌جای گالری تصاویر، آیکون نوع ملک نمایش داده می‌شود */}
                {mode === 'request' ? (
                    <Box
                        sx={{
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(30,97,205,0.06)',
                        }}
                    >
                        {getPropertyTypeIcon(item.propertyType, {sx: {fontSize: 56, color: 'primary.main'}})}
                    </Box>
                ) : images.length > 0 ? (
                    <Box sx={{position: 'relative'}}>
                        <ImageGallery images={images} height={240} />
                        {/* گرادیانت پایین عکس برای خوانایی بهتر وضعیت روی آن */}
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)',
                            }}
                        />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                            color: 'text.disabled',
                        }}
                    >
                        <ImageNotSupportedRoundedIcon sx={{fontSize: 28}} />
                    </Box>
                )}
            </Box>

            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, p: 2.5}}>
                {/* عنوان و موقعیت */}
                <Box>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{mb: 0.75}}>
                        {item.status && (
                            <Chip
                                size="small"
                                label={item.status}
                                sx={{
                                    height: 22,
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: statusColor,
                                    bgcolor: 'transparent',
                                    border: '1px solid',
                                    borderColor: statusColor,
                                }}
                            />
                        )}
                        {isFilled(item.id) && (
                            <Typography variant="badge" sx={{color: 'text.disabled', fontSize: '12px'}}>
                                #{item.id}
                            </Typography>
                        )}
                        {item.contractType && (
                            <Typography variant="badge" sx={{color: 'text.disabled', fontSize: '12px'}}>
                                · {item.contractType}
                            </Typography>
                        )}
                    </Stack>

                    <Typography variant="titleLg" fontWeight={800}>
                        {item.propertyType || '--'}
                    </Typography>

                    {location && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{mt: 0.5}}>
                            <PlaceRoundedIcon sx={{fontSize: 15, color: 'text.disabled'}} />
                            <Typography variant="bodySm" color="text.secondary">
                                {location}
                            </Typography>
                        </Stack>
                    )}
                </Box>

                {/* چیپ‌های مشخصات کلیدی */}
                {(quickFacts.areaText || quickFacts.roomCountText || quickFacts.totalFloorText || quickFacts.direction) && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        <QuickFactChip icon={<SquareFootRoundedIcon sx={{fontSize: 15}} />} label={quickFacts.areaText} />
                        <QuickFactChip icon={<BedRoundedIcon sx={{fontSize: 15}} />} label={quickFacts.roomCountText} />
                        <QuickFactChip icon={<LayersRoundedIcon sx={{fontSize: 15}} />} label={quickFacts.totalFloorText} />
                        <QuickFactChip icon={<ExploreRoundedIcon sx={{fontSize: 15}} />} label={quickFacts.direction} />
                    </Stack>
                )}

                {/* کارت قیمت */}
                {priceMain && (
                    <Box
                        sx={{
                            p: 1.75,
                            borderRadius: 2.5,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                        }}
                    >
                        <Typography variant="labelSm" sx={{opacity: 0.85}}>
                            {priceLabel}
                        </Typography>
                        <Typography variant="titleLg" fontWeight={800} sx={{fontVariantNumeric: 'tabular-nums'}}>
                            {priceMain}{' '}
                            <Typography component="span" variant="labelSm" sx={{opacity: 0.85}}>
                                تومان
                            </Typography>
                        </Typography>
                        {priceSecondary && (
                            <Typography variant="labelSm" sx={{opacity: 0.85}}>
                                {priceSecondary}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* امکانات */}
                {amenities.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {amenities.map((amenity) => (
                            <Chip key={amenity} label={amenity} size="small" variant="outlined" />
                        ))}
                    </Stack>
                )}

                <DetailSection
                    title="مشخصات ملک"
                    icon={<GridViewRoundedIcon sx={{fontSize: 16}} />}
                    fields={specFields}
                />
                <DetailSection
                    title="جزئیات مالی"
                    icon={<PaidRoundedIcon sx={{fontSize: 16}} />}
                    fields={financialFields}
                />
                <DetailSection
                    title="مالک"
                    icon={<PersonRoundedIcon sx={{fontSize: 16}} />}
                    fields={ownerFields}
                />
                 <DetailSection
                    title="اطلاعات کارشناس و املاک"
                    icon={<PersonRoundedIcon sx={{fontSize: 16}} />}
                    fields={expertFields}
                />
                <DetailSection
                    title="درخواست‌کننده"
                    icon={<ContactPhoneRoundedIcon sx={{fontSize: 16}} />}
                    fields={requesterFields}
                />
                {/* فقط برای رکوردهای ثبت‌شده از فرم «آگهی» پر است و نمایش داده می‌شود */}
                <DetailSection
                    title="اطلاعات آگهی"
                    icon={<CampaignRoundedIcon sx={{fontSize: 16}} />}
                    fields={adFields}
                />

                {/* توضیحات */}
                {hasNotes && (
                    <Stack spacing={1.5}>
                        {isFilled(item.strongPoint) && (
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="flex-start"
                                sx={{p: 1.5, borderRadius: 2, bgcolor: 'rgba(30,97,205,0.06)'}}
                            >
                                <AutoAwesomeRoundedIcon sx={{fontSize: 17, color: 'primary.main', mt: '2px'}} />
                                <Box>
                                    <Typography variant="labelSm" fontWeight={700} color="primary.main">
                                        نقطه قوت ویژه ملک
                                    </Typography>
                                    <Typography variant="bodySm" color="text.secondary">
                                        {item.strongPoint}
                                    </Typography>
                                </Box>
                            </Stack>
                        )}

                        {isFilled(item.description) && (
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                <NotesRoundedIcon sx={{fontSize: 17, color: 'text.disabled', mt: '2px'}} />
                                <Box>
                                    <Typography variant="labelSm" fontWeight={700} color="text.disabled">
                                        توضیحات
                                    </Typography>
                                    <Typography variant="bodySm" color="text.secondary">
                                        {item.description}
                                    </Typography>
                                </Box>
                            </Stack>
                        )}
                        {isFilled(item.internalNote) && (
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="flex-start"
                                sx={{p: 1.5, borderRadius: 2, bgcolor: 'background.default'}}
                            >
                                <StickyNote2RoundedIcon sx={{fontSize: 17, color: 'text.disabled', mt: '2px'}} />
                                <Box>
                                    <Typography variant="labelSm" fontWeight={700} color="text.disabled">
                                        یادداشت داخلی
                                    </Typography>
                                    <Typography variant="bodySm" color="text.secondary" fontStyle="italic">
                                        {item.internalNote}
                                    </Typography>
                                </Box>
                            </Stack>
                        )}
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    )
}
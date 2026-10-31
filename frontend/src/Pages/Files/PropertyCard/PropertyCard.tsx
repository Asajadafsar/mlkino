import {useMemo, useState} from 'react'
import {useDispatch} from 'react-redux'
import {Box, Stack, Typography} from '@mui/material'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import SquareFootRoundedIcon from '@mui/icons-material/SquareFootRounded'
import BedRoundedIcon from '@mui/icons-material/BedRounded'
import ImageNotSupportedRoundedIcon from '@mui/icons-material/ImageNotSupportedRounded'
import {PropertyCardMenu} from './PropertyCardMenu'
import {PropertyDetailDialog} from './PropertyDetailDialog'
import {PinnedBadge} from './PinnedBadge'
import {getPropertyTypeIcon} from './PropertyTypeIcon'
import {
    STATUS_COLOR,
    isFilled,
    useDerivedPropertyInfo,
} from './propertyCardUtils'
import {PropertyType, RecordMode} from '../../../Components/PropertyRecordForm'
import {setUtil} from '../../../redux/UtilSlice'
import {DataProvider} from '../../../Core/DataProvider'

function Notch({side}: {side: 'insetInlineStart' | 'insetInlineEnd'}) {
    return (
        <Box
            sx={{
                position: 'absolute',
                [side]: -9,
                top: 0,
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
            }}
        />
    )
}

const RESOURCE_BY_MODE: Record<RecordMode, string> = {
    file: 'files',
    request: 'requests',
    ad: 'ads',
}

const ITEM_LABEL_BY_MODE: Record<RecordMode, string> = {
    file: 'فایل',
    request: 'درخواست',
    ad: 'آگهی',
}

export type PropertyCardProps = {
    item: Partial<PropertyType>
    mode?: RecordMode
    resource?: string
    onEdit?: (item: Partial<PropertyType>) => void
    onDelete?: (id?: number) => void
}

async function togglePinRequest(
    resource: string,
    id: number,
    pinned: boolean,
) {
    return DataProvider.post(`${resource}/${id}/pin`, {
        data: {pinned},
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

export function PropertyCard({
    item,
    mode = 'file',
    resource,
    onEdit,
    onDelete,
}: PropertyCardProps) {
    const [detailOpen, setDetailOpen] = useState(false)

    // وضعیت پین بودن کارت
    const [pinned, setPinned] = useState(
        Boolean((item as {pinned?: boolean}).pinned),
    )
    const [pinLoading, setPinLoading] = useState(false)

    const dispatch = useDispatch()

    const resolvedResource = resource ?? RESOURCE_BY_MODE[mode]

    const handleTogglePin = async () => {
        if (!isFilled(item.id) || pinLoading) return

        const previousPinned = pinned
        const next = !previousPinned

        // به‌روزرسانی خوش‌بینانه رابط کاربری
        setPinned(next)
        setPinLoading(true)

        try {
            await togglePinRequest(
                resolvedResource,
                item.id as number,
                next,
            )
        } catch (error: unknown) {
            setPinned(previousPinned)

            const message =
                error instanceof Error
                    ? error.message
                    : 'تغییر وضعیت سنجاق با خطا مواجه شد.'

            dispatch(
                setUtil({
                    open: true,
                    message,
                    severity: 'error',
                }),
            )
        } finally {
            setPinLoading(false)
        }
    }

    const statusColor =
        STATUS_COLOR[item.status ?? ''] ?? 'text.disabled'

    const coverImage = item.images?.[0]

    // پشتیبانی از آدرس تصویر و فایل آپلودشده
    const coverUrl = useMemo(() => {
        if (!coverImage) return undefined

        return typeof coverImage === 'string'
            ? coverImage
            : URL.createObjectURL(coverImage)
    }, [coverImage])

    const {
        location,
        areaText,
        priceMain,
        priceLabel,
        priceSecondary,
    } = useDerivedPropertyInfo(item)

    return (
        <>
            <Box
                role="button"
                tabIndex={0}
                onClick={() => setDetailOpen(true)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setDetailOpen(true)
                    }
                }}
                sx={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition:
                        'box-shadow .15s ease, transform .1s ease',
                    '&:hover': {
                        boxShadow:
                            '0 10px 24px -10px rgba(30,97,205,0.28)',
                        transform: 'translateY(-2px)',
                    },
                }}
            >
                {pinned && <PinnedBadge />}

                <PropertyCardMenu
                    id={item.id}
                    resource={resolvedResource}
                    dark={mode !== 'request' && Boolean(coverUrl)}
                    itemLabel={ITEM_LABEL_BY_MODE[mode]}
                    onEdit={onEdit ? () => onEdit(item) : undefined}
                    onDelete={onDelete}
                    mode={mode}
                    pinned={pinned}
                    onTogglePin={handleTogglePin}
                />

                {/* تصویر یا آیکون نوع ملک */}
                <Box
                    sx={{
                        width: '100%',
                        aspectRatio: '16 / 10',
                        bgcolor:
                            mode === 'request'
                                ? 'rgba(30,97,205,0.06)'
                                : 'background.default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {mode === 'request' ? (
                        getPropertyTypeIcon(item.propertyType, {
                            sx: {
                                fontSize: 40,
                                color: 'primary.main',
                            },
                        })
                    ) : coverUrl ? (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${coverUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    ) : (
                        <ImageNotSupportedRoundedIcon
                            sx={{
                                fontSize: 24,
                                color: 'text.disabled',
                            }}
                        />
                    )}
                </Box>

                {/* اطلاعات اصلی ملک */}
                <Box sx={{p: 2, pb: 1.75}}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        sx={{mb: 0.5}}
                    >
                        {item.status && (
                            <>
                                <Box
                                    sx={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        bgcolor: statusColor,
                                        flexShrink: 0,
                                    }}
                                />

                                <Typography
                                    variant="badge"
                                    sx={{
                                        color: statusColor,
                                        fontSize: '12px',
                                    }}
                                    noWrap
                                >
                                    {item.status}
                                </Typography>
                            </>
                        )}

                        {isFilled(item.id) && (
                            <Typography
                                variant="badge"
                                sx={{
                                    color: 'text.disabled',
                                    fontSize: '12px',
                                }}
                            >
                                · #{item.id}
                            </Typography>
                        )}
                    </Stack>

                    <Typography
                        variant="titleMd"
                        fontWeight={700}
                        color={
                            mode === 'request'
                                ? 'success.light'
                                : 'text.primary'
                        }
                        noWrap
                    >
                        {item.propertyType || '--'}
                    </Typography>

                    {location && (
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{mt: 0.25}}
                        >
                            <PlaceRoundedIcon
                                sx={{
                                    fontSize: 14,
                                    color: 'text.disabled',
                                    flexShrink: 0,
                                }}
                            />

                            <Typography
                                variant="bodySm"
                                color="text.secondary"
                                noWrap
                            >
                                {location}
                            </Typography>
                        </Stack>
                    )}

                    {item.contractType && (
                        <Typography
                            variant="labelSm"
                            color="text.disabled"
                            sx={{mt: 0.25}}
                        >
                            {item.contractType}
                        </Typography>
                    )}

                    {/* وضعیت ثبت فایل در دیوار */}
                    {typeof (item as Partial<PropertyType> & {
                        isAd?: boolean
                    }).isAd === 'boolean' && (
                        <Typography
                            variant="labelSm"
                            sx={{
                                display: 'block',
                                mt: 0.75,
                                color: (
                                    item as Partial<PropertyType> & {
                                        isAd?: boolean
                                    }
                                ).isAd
                                    ? 'success.main'
                                    : 'text.secondary',
                                fontWeight: 500,
                            }}
                        >
                            {(
                                item as Partial<PropertyType> & {
                                    isAd?: boolean
                                }
                            ).isAd
                                ? 'این فایل در دیوار ثبت شده است'
                                : 'این فایل در دیوار ثبت نشده است'}
                        </Typography>
                    )}
                </Box>

                {/* خط جداکننده با حاشیه نیم‌دایره‌ای */}
                <Box sx={{position: 'relative', mx: 0}}>
                    <Notch side="insetInlineStart" />
                    <Notch side="insetInlineEnd" />

                    <Box
                        sx={{
                            borderTop: '1.5px dashed',
                            borderColor: 'divider',
                            mx: 2.5,
                        }}
                    />
                </Box>

                {/* متراژ، اتاق و قیمت */}
                <Box
                    sx={{
                        p: 2,
                        pt: 1.75,
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                    }}
                >
                    {(areaText || isFilled(item.roomCount)) && (
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{mb: priceMain ? 1.5 : 0}}
                        >
                            {areaText && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                >
                                    <SquareFootRoundedIcon
                                        sx={{
                                            fontSize: 15,
                                            color: 'text.disabled',
                                        }}
                                    />

                                    <Typography
                                        variant="labelSm"
                                        color="text.secondary"
                                    >
                                        {areaText}
                                    </Typography>
                                </Stack>
                            )}

                            {isFilled(item.roomCount) && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                >
                                    <BedRoundedIcon
                                        sx={{
                                            fontSize: 15,
                                            color: 'text.disabled',
                                        }}
                                    />

                                    <Typography
                                        variant="labelSm"
                                        color="text.secondary"
                                    >
                                        {item.roomCount} خوابه
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    )}

                    {priceMain && (
                        <Box sx={{mt: 'auto'}}>
                            <Typography
                                variant="labelSm"
                                color="text.disabled"
                            >
                                {priceLabel}
                            </Typography>

                            <Typography
                                variant="titleLg"
                                fontWeight={800}
                                color="primary.main"
                                sx={{
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {priceMain}{' '}

                                <Typography
                                    component="span"
                                    variant="labelSm"
                                    color="text.disabled"
                                >
                                    تومان
                                </Typography>
                            </Typography>

                            {priceSecondary && (
                                <Typography
                                    variant="labelSm"
                                    color="text.secondary"
                                >
                                    {priceSecondary}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            <PropertyDetailDialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                item={item}
                mode={mode}
            />
        </>
    )
}
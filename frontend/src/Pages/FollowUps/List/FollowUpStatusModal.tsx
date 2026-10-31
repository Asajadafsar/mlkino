import {Box, Button, Stack, Typography} from '@mui/material'
import {FollowUpsType} from '../FollowUps'
import {CustomSelectField} from '../../../Components/Input/CustomSelectField'
import {CustomTextField} from '../../../Components/Input/CustomTextField'

const RESOURCE = 'follow-ups'

export type FollowUpVisitStatus =
    | 'visited_liked'
    | 'visited_not_liked'
    | 'not_visited'

export type FollowUpNextStatus =
    | 'revisit'
    | 'expert_meeting'
    | 'contract'
    | 'cancelled'

export type FollowUpStatusData = {
    visitStatus: FollowUpVisitStatus | ''
    nextStatus: FollowUpNextStatus | ''
    description: string
    statusDescription: string
    archive: boolean
}

type CustomModalProps = {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: React.ReactNode
}

type FollowUpStatusModalProps = {
    open: boolean
    onClose: () => void
    followUp: FollowUpsType | null
    statusData: FollowUpStatusData
    setStatusData: React.Dispatch<React.SetStateAction<FollowUpStatusData>>
    onSubmit: () => void
    CustomModal: React.ComponentType<CustomModalProps>
}

const visitStatusOptions = [
    {
        label: 'مشتری آمده بازدید و پسند کرده',
        value: 'visited_liked',
    },
    {
        label: 'مشتری آمده بازدید ولی نپسندیده',
        value: 'visited_not_liked',
    },
    {
        label: 'مشتری نیامده بازدید',
        value: 'not_visited',
    },
]

const nextStatusOptions = [
    {
        label: 'بازدید مجدد',
        value: 'revisit',
    },
    {
        label: 'جلسه با کارشناس',
        value: 'expert_meeting',
    },
    {
        label: 'ثبت قرارداد',
        value: 'contract',
    },
    {
        label: 'کنسل شده',
        value: 'cancelled',
    },
]

export function FollowUpStatusModal({
    open,
    onClose,
    followUp,
    statusData,
    setStatusData,
    onSubmit,
    CustomModal,
}: FollowUpStatusModalProps) {
    const handleVisitStatusChange = (
        value: React.SetStateAction<FollowUpStatusData>,
    ) => {
        setStatusData((prev) => {
            const next =
                typeof value === 'function'
                    ? value(prev)
                    : value

            if (next.visitStatus === 'not_visited') {
                return {
                    ...next,
                    nextStatus: '',
                    description: '',
                    statusDescription: '',
                    archive: false,
                }
            }

            if (next.visitStatus === 'visited_not_liked') {
                return {
                    ...next,
                    nextStatus: '',
                    statusDescription: '',
                    archive: false,
                }
            }

            if (next.visitStatus === 'visited_liked') {
                return {
                    ...next,
                    archive: false,
                }
            }

            return next
        })
    }

    return (
        <CustomModal
            open={open}
            onClose={onClose}
            title="تغییر وضعیت بازدید"
            subtitle="وضعیت بازدید مشتری را مشخص کنید"
        >
            {followUp && (
                <Stack spacing={2.5}>
                    {/* اطلاعات ملک و مشتری */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: '14px',
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                >
                                    ملک
                                </Typography>

                                <Typography
                                    fontSize={14}
                                    fontWeight={600}
                                >
                                    {followUp.file_name || '--'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                >
                                    مشتری
                                </Typography>

                                <Typography
                                    fontSize={14}
                                    fontWeight={600}
                                >
                                    {followUp.full_name || '--'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                >
                                    شماره تماس
                                </Typography>

                                <Typography
                                    fontSize={14}
                                    fontWeight={600}
                                    dir="ltr"
                                    textAlign="right"
                                >
                                    {followUp.phone_number || '--'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* وضعیت بازدید */}
                    <CustomSelectField
                        name="visitStatus"
                        label="وضعیت بازدید"
                        resource={RESOURCE}
                        setData={handleVisitStatusChange}
                        defaultValue={statusData.visitStatus}
                        options={visitStatusOptions}
                    />

                    {/* پسندیده */}
                    {statusData.visitStatus === 'visited_liked' && (
                        <Stack spacing={2}>
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: '10px',
                                    bgcolor: 'success.main',
                                    color: 'success.contrastText',
                                }}
                            >
                                <Typography
                                    fontSize={13}
                                    fontWeight={600}
                                >
                                    مشتری ملک را پسندیده است
                                </Typography>
                            </Box>

                            <CustomTextField
                                key="description"
                                name="description"
                                setData={setStatusData}
                                resource={RESOURCE}
                                label="توضیحات کارشناس"
                                defaultValue={statusData.description}
                                multiline
                                minRows={4}
                            />

                            <CustomSelectField
                                name="nextStatus"
                                label="وضعیت بعدی"
                                resource={RESOURCE}
                                setData={setStatusData}
                                defaultValue={statusData.nextStatus}
                                options={nextStatusOptions}
                            />

                            {statusData.nextStatus && (
                                <CustomTextField
                                    key="statusDescription"
                                    name="statusDescription"
                                    setData={setStatusData}
                                    resource={RESOURCE}
                                    label="توضیحات تغییر وضعیت"
                                    defaultValue={
                                        statusData.statusDescription
                                    }
                                    multiline
                                    minRows={4}
                                />
                            )}
                        </Stack>
                    )}

                    {/* نپسندیده */}
                    {statusData.visitStatus ===
                        'visited_not_liked' && (
                        <Stack spacing={2}>
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: '10px',
                                    bgcolor: 'warning.main',
                                    color: 'warning.contrastText',
                                }}
                            >
                                <Typography
                                    fontSize={13}
                                    fontWeight={600}
                                >
                                    مشتری ملک را نپسندیده است
                                </Typography>
                            </Box>

                            <CustomTextField
                                key="description"
                                name="description"
                                setData={setStatusData}
                                resource={RESOURCE}
                                label="توضیحات"
                                defaultValue={statusData.description}
                                multiline
                                minRows={4}
                            />

                            <Button
                                fullWidth
                                variant={
                                    statusData.archive
                                        ? 'contained'
                                        : 'outlined'
                                }
                                color="error"
                                onClick={() =>
                                    setStatusData((prev) => ({
                                        ...prev,
                                        archive: !prev.archive,
                                    }))
                                }
                                sx={{
                                    height: 44,
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                }}
                            >
                                {statusData.archive
                                    ? 'برای بایگانی انتخاب شده'
                                    : 'بایگانی کردن'}
                            </Button>
                        </Stack>
                    )}

                    {/* نیامده */}
                    {statusData.visitStatus === 'not_visited' && (
                        <Box
                            sx={{
                                py: 2,
                                px: 2,
                                borderRadius: '12px',
                                bgcolor: 'action.hover',
                                border: '1px dashed',
                                borderColor: 'divider',
                                textAlign: 'center',
                            }}
                        >
                            <Typography
                                fontSize={13}
                                color="text.secondary"
                            >
                                برای این وضعیت اطلاعات دیگری نیاز نیست.
                            </Typography>
                        </Box>
                    )}

                    {/* Footer */}
                    <Box
                        sx={{
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Stack
                            direction={{
                                xs: 'column-reverse',
                                sm: 'row',
                            }}
                            spacing={1.5}
                        >
                            <Button
                                fullWidth
                                variant="outlined"
                                color="inherit"
                                onClick={onClose}
                                sx={{
                                    height: 46,
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                }}
                            >
                                انصراف
                            </Button>

                            <Button
                                fullWidth
                                variant="contained"
                                onClick={onSubmit}
                                disabled={!statusData.visitStatus}
                                sx={{
                                    height: 46,
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                }}
                            >
                                ثبت وضعیت
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            )}
        </CustomModal>
    )
}
import {Box, Button, Stack, Typography} from '@mui/material'

import {FollowUpsType} from '../FollowUps'

import {CustomTextField} from '../../../Components/Input/CustomTextField'
import DatePickerFilter from '../../../Components/Filter/DatePicker'

const RESOURCE = 'follow-ups'

export type NewVisitData = {
    customerName: string
    date: string
}

type CustomModalProps = {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: React.ReactNode
}

type NewVisitModalProps = {
    open: boolean
    onClose: () => void
    selectedFile: FollowUpsType | null
    newVisitData: NewVisitData
    setNewVisitData: React.Dispatch<
        React.SetStateAction<NewVisitData>
    >
    onSubmit: () => void
    CustomModal: React.ComponentType<CustomModalProps>
}

export function NewVisitModal({
    open,
    onClose,
    selectedFile,
    newVisitData,
    setNewVisitData,
    onSubmit,
    CustomModal,
}: NewVisitModalProps) {
    return (
        <CustomModal
            open={open}
            onClose={onClose}
            title="بازدید جدید"
            subtitle="اطلاعات بازدید جدید را وارد کنید"
        >
            {selectedFile && (
                <Stack spacing={2.5}>
                    {/* ------------------------------------------------------ */}
                    {/* ملک                                                     */}
                    {/* ------------------------------------------------------ */}

                    <Box
                        sx={{
                            p: 2,
                            borderRadius: '14px',
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
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
                            {selectedFile.file_name || '--'}
                        </Typography>
                    </Box>

                    {/* ------------------------------------------------------ */}
                    {/* نام مشتری                                               */}
                    {/* ------------------------------------------------------ */}

                    <CustomTextField
                        key="customerName"
                        name="customerName"
                        setData={setNewVisitData}
                        resource={RESOURCE}
                        label="نام مشتری"
                        defaultValue={newVisitData.customerName}
                    />

                    {/* ------------------------------------------------------ */}
                    {/* تاریخ و ساعت                                            */}
                    {/* ------------------------------------------------------ */}

                    <DatePickerFilter
                        key="date"
                        mode="controlled"
                        item={{
                            label: 'تاریخ و ساعت بازدید',
                        }}
                        value={newVisitData.date}
                        onChange={(value) =>
                            setNewVisitData((prev) => ({
                                ...prev,
                                date: value ?? '',
                            }))
                        }
                        withTime
                    />

                    {/* ------------------------------------------------------ */}
                    {/* Footer                                                   */}
                    {/* ------------------------------------------------------ */}

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
                                disabled={
                                    !newVisitData.customerName.trim() ||
                                    !newVisitData.date
                                }
                                sx={{
                                    height: 46,
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                }}
                            >
                                ثبت بازدید
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            )}
        </CustomModal>
    )
}
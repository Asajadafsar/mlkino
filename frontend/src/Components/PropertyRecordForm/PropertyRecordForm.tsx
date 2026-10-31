import {useState} from 'react'
import {Box, Button, Stack, Tab, Tabs, Typography} from '@mui/material'
import type {Dispatch, SetStateAction} from 'react'

import {TypeGate} from './components/TypeGate'
import {BaseStep} from './steps/BaseStep'
import {FinancialStep} from './steps/FinancialStep'
import {TechnicalStep} from './steps/TechnicalStep'
import {OwnerStep} from './steps/OwnerStep'
import {ImagesStep} from './steps/ImagesStep'
import {DescriptionStep} from './steps/DescriptionStep'
import {AdTextStep} from './steps/AdTextStep'
import {MODE_TITLE, STEPS_BY_MODE, STEP_CONTENT_HEIGHT} from './constants'
import type {PropertyType, RecordMode} from './types'

export function PropertyRecordForm({
    property,
    setProperty,
    resource,
    mode = 'file',
    editMode = false
}: {
    property: PropertyType
    setProperty: Dispatch<SetStateAction<PropertyType>>
    resource: string
    mode?: RecordMode
    editMode?:boolean
}) {
    const [activeTab, setActiveTab] = useState(0)

    const steps = STEPS_BY_MODE[mode]

    const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue)
    }

    const handleChangeType = () => {
        setProperty((prev) => ({...prev, contractType: ''}))
        setActiveTab(0)
    }

    if (!property) return null

    // پیش از شروع فرم (چه ثبت فایل، چه ثبت درخواست)، نوع باید مشخص شود
    if (!property.contractType) {
        return (
            <TypeGate
                value={property.contractType}
                title={
                    mode === 'request'
                        ? 'نوع درخواست را انتخاب کنید'
                        : mode === 'ad'
                        ? 'نوع معامله دیوارکوب را انتخاب کنید'
                        : 'نوع فایل را انتخاب کنید'
                }
                onSelect={(value) =>
                    setProperty((prev) => ({
                        ...prev,
                        contractType: value,
                    }))
                }
            />
        )
    }

    const stepProps = {property, setProperty, resource}

    const stepRenderers: Record<RecordMode, Array<() => React.ReactNode>> = {
        file: [
            () => <BaseStep {...stepProps} mode={mode} editMode={editMode} />,
            () => <FinancialStep {...stepProps} mode={mode} />,
            () => <TechnicalStep {...stepProps} mode={mode} />,
            () => <OwnerStep {...stepProps} />,
            () => <ImagesStep setProperty={setProperty} />,
            () => <DescriptionStep {...stepProps} />,
        ],
        request: [
            () => <BaseStep {...stepProps} mode={mode} />,
            () => <FinancialStep {...stepProps} mode={mode} />,
            () => <TechnicalStep {...stepProps} mode={mode} />,
            () => <DescriptionStep {...stepProps} />,
        ],
        // «آگهی» همان فیلدهای فایل/درخواست را (با حذف/اضافه شدن مواردی طبق طرح آگهی) در یک
        // گام فشرده نشون می‌ده، به‌علاوه‌ی یک گام مجزا برای تنظیمات متن آگهی
        ad: [
            () => (
                <>
                    <BaseStep {...stepProps} mode={mode} />
                    <FinancialStep {...stepProps} mode={mode} />
                    <TechnicalStep {...stepProps} mode={mode} />
                </>
            ),
            () => <AdTextStep {...stepProps} />,
        ],
    }

    const renderStepContent = stepRenderers[mode][activeTab] ?? (() => null)

    return (
        <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                    {MODE_TITLE[mode]} · {property.contractType}
                </Typography>

                <Button size="small" onClick={handleChangeType}>
                    تغییر نوع
                </Button>
            </Stack>

            <Tabs
                value={activeTab}
                onChange={handleChangeTab}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    minHeight: 40,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                        minHeight: 40,
                        fontWeight: 600,
                    },
                }}
            >
                {steps.map((label) => (
                    <Tab key={label} label={label} />
                ))}
            </Tabs>

            <Box
                sx={{
                    minHeight: STEP_CONTENT_HEIGHT,
                    maxHeight: STEP_CONTENT_HEIGHT,
                    overflowY: 'auto',
                    pr: 0.5,
                    pt: 1.5,
                }}
            >
                {renderStepContent()}
            </Box>
        </Stack>
    )
}



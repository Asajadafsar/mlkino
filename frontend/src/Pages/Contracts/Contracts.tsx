import {Stack} from '@mui/material'

import DatePickerFilter from '../../Components/Filter/DatePicker'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'

export type ContractsType = {
    id: number
    file_name: string
    contract_datetime: string
    agreed_price: number
    price_difference: number
    meeting_manager: string
    owner_commission: number
    buyer_commission: number
    description: string
}

export function Contracts({
    contracts,
    setContracts,
    resource,
}: {
    contracts: ContractsType
    setContracts: React.Dispatch<React.SetStateAction<ContractsType>>
    resource: string
}) {
    return (
        <Stack>
            {contracts && (
                <GridProducer
                    sx={{
                        marginBottom: '16px',
                    }}
                    data={[
                        <CustomTextField
                            key="id"
                            name="id"
                            setData={setContracts}
                            resource={resource}
                            label="شناسه"
                            defaultValue={contracts.id}
                            disabled
                        />,

                        <CustomTextField
                            key="file_name"
                            name="file_name"
                            setData={setContracts}
                            resource={resource}
                            label="فایل انتخاب شده"
                            defaultValue={contracts.file_name}
                            disabled
                        />,

                        <DatePickerFilter
                            key="contract_datetime"
                            mode="controlled"
                            item={{
                                label: 'زمان قرارداد',
                            }}
                            value={contracts.contract_datetime}
                            onChange={(value) =>
                                setContracts((prev) => ({
                                    ...prev,
                                    contract_datetime: value ?? '',
                                }))
                            }
                            withTime
                        />,

                        <CustomTextField
                            key="agreed_price"
                            name="agreed_price"
                            setData={setContracts}
                            resource={resource}
                            label="قیمت توافق شده"
                            defaultValue={contracts.agreed_price}
                            type="number"
                        />,

                        <CustomTextField
                            key="price_difference"
                            name="price_difference"
                            setData={setContracts}
                            resource={resource}
                            label="اختلاف قیمت"
                            defaultValue={contracts.price_difference}
                            type="number"
                        />,

                        <CustomTextField
                            key="meeting_manager"
                            name="meeting_manager"
                            setData={setContracts}
                            resource={resource}
                            label="مدیر جلسه"
                            defaultValue={contracts.meeting_manager}
                        />,

                        <CustomTextField
                            key="owner_commission"
                            name="owner_commission"
                            setData={setContracts}
                            resource={resource}
                            label="کمیسیون توافق شده با مالک"
                            defaultValue={contracts.owner_commission}
                            type="number"
                        />,

                        <CustomTextField
                            key="buyer_commission"
                            name="buyer_commission"
                            setData={setContracts}
                            resource={resource}
                            label="کمیسیون توافق شده با خریدار"
                            defaultValue={contracts.buyer_commission}
                            type="number"
                        />,

                        <CustomTextField
                            key="description"
                            name="description"
                            setData={setContracts}
                            resource={resource}
                            label="توضیحات"
                            defaultValue={contracts.description}
                            multiline
                            minRows={4}
                        />,
                    ]}
                />
            )}
        </Stack>
    )
}
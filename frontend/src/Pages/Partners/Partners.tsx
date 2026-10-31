import {Box, Stack, Typography} from '@mui/material'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {GridProducer} from '../../Components/Table/GridProducer'
import LogoImage from '../../Images/melkino.png'
import { CustomSelectField } from '../../Components/Input/CustomSelectField'
import { toSelectOptions } from '../../Components/PropertyRecordForm/utils'

export type PartnersType = {
    id: number
    logo: string
    fullName: string
    phoneNumber: string
    address: string
    realEstateName: string
    status:string
}

export function Partners({
    partners,
    setPartners,
    resource,
}: {
    partners: PartnersType
    setPartners: React.Dispatch<React.SetStateAction<PartnersType>>
    resource: string
}) {
    return (
        <Stack>
            {partners && (
                <Stack gap={2}>
                    <Box>
                        <Typography variant="body2" sx={{marginBottom: '8px'}}>
                            لوگو
                        </Typography>
                        <Box
                            component="img"
                            src={LogoImage}
                            alt="لوگو"
                            sx={{
                                width: 100,
                                height: 100,
                                objectFit: 'contain',
                            }}
                        />
                    </Box>

                    <GridProducer
                        sx={{marginBottom: '16px'}}
                        data={[
                            <CustomTextField
                                name="id"
                                setData={setPartners}
                                resource={resource}
                                label="شناسه"
                                defaultValue={partners.id}
                                disabled
                            />,

                            <CustomTextField
                                name="fullName"
                                setData={setPartners}
                                resource={resource}
                                label="نام و نام خانوادگی"
                                defaultValue={partners.fullName}
                                disabled
                            />,

                            <CustomTextField
                                name="phoneNumber"
                                setData={setPartners}
                                resource={resource}
                                label="شماره تماس"
                                defaultValue={partners.phoneNumber}
                                disabled
                            />,
                            <CustomTextField
                                name="realEstateName"
                                setData={setPartners}
                                resource={resource}
                                label="نام املاکی"
                                defaultValue={partners.realEstateName}
                                disabled
                            />,
                            <CustomSelectField
                                key="status"
                                name="status"
                                setData={setPartners}
                                resource={resource}
                                label="وضعیت"
                                defaultValue={partners.status}
                                options={toSelectOptions(['رد درخواست', 'پذیرش درخواست'])}
                            />,

                            <CustomTextField
                                name="address"
                                setData={setPartners}
                                resource={resource}
                                label="آدرس"
                                defaultValue={partners.address}
                                multiline
                                minRows={4}
                                disabled
                            />,
                        ]}
                    />
                </Stack>
            )}
        </Stack>
    )
}

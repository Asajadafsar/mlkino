import {CustomTextField, GridProducer} from '../shared'
import type {StepProps} from '../types'

export function OwnerStep({property, setProperty, resource}: StepProps) {
    return (
        <GridProducer
            sx={{marginBottom: '16px'}}
            data={[
                <CustomTextField
                    key="ownerName"
                    name="ownerName"
                    setData={setProperty}
                    resource={resource}
                    label="نام مالک"
                    defaultValue={property.ownerName}
                />,

                <CustomTextField
                    key="ownerPhone"
                    name="ownerPhone"
                    setData={setProperty}
                    resource={resource}
                    label="تلفن"
                    defaultValue={property.ownerPhone}
                />,

                <CustomTextField
                    key="ownerPhone2"
                    name="ownerPhone2"
                    setData={setProperty}
                    resource={resource}
                    label="تلفن دوم"
                    defaultValue={property.ownerPhone2}
                />,

                <CustomTextField
                    key="ownerJob"
                    name="ownerJob"
                    setData={setProperty}
                    resource={resource}
                    label="شغل مالک"
                    defaultValue={property.ownerJob}
                />,
            ]}
        />
    )
}

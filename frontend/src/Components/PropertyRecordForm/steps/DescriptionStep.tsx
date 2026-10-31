import {CustomTextField, GridProducer} from '../shared'
import type {StepProps} from '../types'

export function DescriptionStep({property, setProperty, resource}: StepProps) {
    return (
        <GridProducer
            sx={{marginBottom: '16px'}}
            data={[
                <CustomTextField
                    key="description"
                    name="description"
                    setData={setProperty}
                    resource={resource}
                    label="توضیحات"
                    defaultValue={property.description}
                    multiline
                    minRows={4}
                />,

                <CustomTextField
                    key="internalNote"
                    name="internalNote"
                    setData={setProperty}
                    resource={resource}
                    label="یادداشت داخلی"
                    defaultValue={property.internalNote}
                    multiline
                    minRows={4}
                />,
                
            ]}
        />
    )
}

import {CustomImagesField} from '../shared'
import type {StepProps} from '../types'

export function ImagesStep({setProperty}: Pick<StepProps, 'setProperty'>) {
    return <CustomImagesField key="images" name="images" setData={setProperty} label="تصاویر" />
}

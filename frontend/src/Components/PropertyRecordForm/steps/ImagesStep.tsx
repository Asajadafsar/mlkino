import {useContext} from 'react'
import {usePanelSettings} from '../../../Core/PanelSettingsContext'
import {FieldScope,fieldVisible} from '../FieldScope'
import {CustomImagesField} from '../shared'
import type {StepProps} from '../types'

export function ImagesStep({setProperty}: Pick<StepProps, 'setProperty'>) {
    const {settings}=usePanelSettings();const scope=useContext(FieldScope)
    if(!fieldVisible(settings.fields,scope,'images'))return null
    return <CustomImagesField key="images" name="images" setData={setProperty} label="تصاویر" />
}

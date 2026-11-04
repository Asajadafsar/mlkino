import {Grid} from '@mui/material'
import React, {useContext} from 'react'
import {FieldScope,fieldVisible} from '../PropertyRecordForm/FieldScope'
import {usePanelSettings} from '../../Core/PanelSettingsContext'

export function GridProducer(props) {
    const {data, count} = props
    const scope=useContext(FieldScope)
    const {settings}=usePanelSettings()
    const visible=data.filter(element => element && (!scope || fieldVisible(settings.fields,scope,element.props?.name || element.props?.baseName || element.key)))
    return (
        <Grid container spacing={2} {...props}>
            {visible.map((element, index) => (
                <Grid
                    item
                    xs={count ? 12 / count : 12}
                    sm={element.key==='location'?12:count ? 12 / count : 6}
                    md={element.key==='location'?12:count ? 12 / count : 4}
                    xl={element.key==='location'?12:count ? 12 / count : 3}
                    key={index}
                >
                    {element}
                </Grid>
            ))}
        </Grid>
    )
}

import {Box} from '@mui/system'
import React from 'react'
import {PANEL_URL} from '../../Core/APP_URL'

export function SmallImage(props) {
    const {url} = props

    return <Box component={'img'} width="70px" height="70px" src={PANEL_URL + '/api/v2' + url} />
}

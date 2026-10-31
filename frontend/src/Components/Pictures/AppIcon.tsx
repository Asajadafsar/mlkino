import {Box} from '@mui/system'
import React from 'react'
import logo from '../../Images/melkino.png'

export function AppIcon(props) {
    return (
        <Box
            component="img"
            width="60px"
            height="60px"
            src={logo}
            bgcolor="black"
            borderRadius="8px"
            padding={'10px'}
        />
    )
}

import {Box, CircularProgress} from '@mui/material'
import React from 'react'

export default function Progress() {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
            }}
        >
            <CircularProgress />
        </Box>
    )
}

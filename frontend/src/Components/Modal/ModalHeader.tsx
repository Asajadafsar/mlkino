import React from 'react'
import CloseIcon from '@mui/icons-material/Close'
import {Divider, IconButton, Stack, Typography} from '@mui/material'

export function ModalHeader(props: {open: boolean; setOpen: any; title: string,onClose:()=>void}) {
    const {setOpen, title, onClose} = props
    const handleClose = () => {
        if (onClose){
            onClose()
        }
        else{
            setOpen(false)
        }
    }
    return (
        <Stack position="sticky" top={0} zIndex={10}>
            <Stack direction="row" alignItems="center" padding="12px" spacing={2} bgcolor="background.main">
                <IconButton onClick={handleClose}>
                    <CloseIcon style={{color: '#B6BFCF'}} />
                </IconButton>
                <Typography variant="body1" fontSize={'18px'} fontWeight={700}>
                    {title}
                </Typography>
            </Stack>
            <Divider />
        </Stack>
    )
}
import * as React from 'react'
import {makeStyles} from '@mui/styles'
import Modal from '@mui/material/Modal'
import {Box, Theme} from '@mui/material'
import {ModalHeader} from './ModalHeader'

export function BaseModal(props) {
    const {open, setOpen, title, onClose,style} = props
    const classes = useStyles()

    const handleClose = () => {
        if (onClose) {
            onClose()
        } else {
            setOpen(false)
        }
    }
    return (
        <Modal
            className={classes.modal}
            open={open}
            onClose={handleClose}
            sx={{display: 'flex', justifyContent: 'center', alignItems: 'center',...style}}
            
        >
            <Box className={classes.root}>
                <ModalHeader open={open} setOpen={setOpen} onClose={handleClose} title={title} />
                <Box padding="10px">{props.children}</Box>
            </Box>
        </Modal>
    )
}

const useStyles = makeStyles((theme: Theme) => ({
    modal: {
        marginLeft: 'auto',
        marginRight: 'auto',
        overflowY: 'auto',
        maxHeight: '100vh',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        borderRadius: '8px',
    },
    root: {
        width: '100%',
        background: theme.palette.background.main,
        alignSelf: 'center',
        boxShadow: '0px 10px 20px -5px rgba(42, 48, 59, 0.2)',
        margin: '10px 0px',
        overflowY: 'hidden',
        borderRadius: '8px',
    },
    modalContent: {
        overflowY: 'auto',
        maxHeight: '90vh',
        '&::-webkit-scrollbar': {
            width: '0.5rem',
        },
    },
}))

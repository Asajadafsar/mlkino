import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert, {AlertProps} from '@mui/material/Alert'
import React from 'react'
import {setUtil} from '../../redux/UtilSlice'
import {useAppDispatch, useAppSelector} from '../../redux/store'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

export function CustomizedSnackbars() {
    const util = useAppSelector((state) => state.util)
    const dispatch = useAppDispatch()

    const handleClose = () => {
        dispatch(setUtil({open: false, message: '', state: 'success'}))
    }

    return (
        <Stack spacing={2} sx={{width: '100%'}}>
            <Snackbar open={util.open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={util.severity} sx={{width: '100%'}}>
                    {util.message}
                </Alert>
            </Snackbar>
        </Stack>
    )
}

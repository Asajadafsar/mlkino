import React from "react"
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import {makeStyles} from '@mui/styles'

function Recyclerbin(props) {
    const classes = useStyles()
    return (
        <IconButton classes={{ root: classes.removeIcon }} {...props}>
            <DeleteIcon />
        </IconButton>
    )
}

const useStyles = makeStyles(theme => ({
    removeIcon: {
        border: "1px solid #B6BFCF",
        borderRadius: '0px',
        color: '#B6BFCF',
        '&:hover': {
            border: "1px solid #EB5757",
            color: '#EB5757'
        }
    },
}))

export default Recyclerbin
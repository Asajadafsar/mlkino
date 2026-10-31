import { Button } from "@mui/material"
import React from "react"
import CheckIcon from '@mui/icons-material/Check';
import {makeStyles} from '@mui/styles'

function DoneButton(props) {
    const classes = useStyles()
    return (
        <Button
            {...props}
            className={classes.doneButton}
            endIcon={<CheckIcon style={{ fontSize: "26px" }} />}>
            {props.title}
        </Button>
    )
}

const useStyles = makeStyles(theme => ({
    doneButton: {
        background: '#2A303B',
        borderRadius: '0px',
        color: 'white',
        fontSize: '20px',
        lineHeight: '24px',
        padding: '12px 20px',
        fontWeight: 700,
        marginLeft: '16px',
        '&:hover': {
            background: "#2A303B"
        }
    },
}))
export default DoneButton
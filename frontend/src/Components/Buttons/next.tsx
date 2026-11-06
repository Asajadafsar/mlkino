import { Button } from "@mui/material"
import React from "react"
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import {makeStyles} from '@mui/styles'

function NextButton(props) {
    const classes = useStyles()
    const {t, i18n, tReady, ...buttonProps} = props
    return (
        <Button
            {...buttonProps}
            className={classes.nextButton}
            endIcon={<ArrowForwardIcon style={{ fontSize: "26px" }} />}>
            مرحله بعد
        </Button>
    )
}

const useStyles = makeStyles(theme => ({
    nextButton: {
        background: '#2A303B',
        borderRadius: '0px',
        color: 'white',
        fontSize: '20px',
        lineHeight:'24px',
        padding: '12px 20px',
        fontWeight: 700,
        marginLeft: '16px',
        '&:hover': {
            background: "#2A303B"
        }
    },
}))
export default NextButton
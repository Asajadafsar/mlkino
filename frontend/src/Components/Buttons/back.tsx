import { Button } from "@mui/material"
import React from "react"
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import {makeStyles} from '@mui/styles'

function BackButton(props) {
    const classes = useStyles()
    const {t, i18n, tReady, ...buttonProps} = props
    return (
        <Button
            {...buttonProps}
            className={classes.backButton}
            startIcon={<ArrowBackIcon style={{ fontSize: "26px" }} />}>
            بازگشت
        </Button>
    )
}

const useStyles = makeStyles(theme => ({
    backButton: {
        border: "1px solid #B6BFCF",
        borderRadius: '0px',
        color: '#B6BFCF',
        fontSize: '20px',
        lineHeight:'24px',
        padding: '12px 20px',
        fontWeight: 700
    },
}))
export default BackButton
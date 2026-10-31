import { Button } from "@mui/material"
import React from "react"
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { withTranslation } from 'react-i18next';
import {makeStyles} from '@mui/styles'

function NextButton(props) {
    const classes = useStyles()
    const t = props.t
    return (
        <Button
            {...props}
            className={classes.nextButton}
            endIcon={<ArrowForwardIcon style={{ fontSize: "26px" }} />}>
            {t('button.next')}
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
export default withTranslation()(NextButton)
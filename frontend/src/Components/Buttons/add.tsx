import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import {Link} from 'react-router-dom'
import {makeStyles} from '@mui/styles'
function AddButton(props) {
    const classes = useStyles()
    const {href, noIcon, text, ...buttonProps} = props

    return (
        <Button
            component={Link}
            to={`/${String(href).replace(/^\/+/, '')}`}
            // size="large"
            variant="outlined"
            startIcon={!noIcon && <AddIcon style={{marginLeft: '8px'}} />}
            className={classes.addButton}
            {...buttonProps}
        >
            {text}
        </Button>
    )
}

const useStyles = makeStyles((theme) => ({
    addButton: {
        padding: '4px 8px 5px 16px',
        fontSize: '20px',
        fontWeight: 700,
    },
}))

export default AddButton

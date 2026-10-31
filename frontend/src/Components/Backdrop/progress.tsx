import CircularProgress from '@mui/material/CircularProgress'
import {makeStyles} from '@mui/styles'

export function ProgressBar(props) {
    const useStylesFacebook = makeStyles((theme) => ({
        root: {
            position: 'relative',
            width: '120px',
            height: '120px',
        },
        bottom: {
            color: props.white ? 'white' : '#434B59',
        },
        top: {
            color: props.white ? '#778191' : '#CAD0DB',
            animationDuration: '1500ms',
            position: 'absolute',
            left: 0,
        },
        circle: {
            strokeLinecap: 'round',
        },
    }))
    const classes = useStylesFacebook()

    return (
        <div className={classes.root}>
            <CircularProgress
                variant="determinate"
                className={classes.bottom}
                size={120}
                thickness={2}
                value={100}
            />
            <CircularProgress
                variant="indeterminate"
                disableShrink
                className={classes.top}
                classes={{
                    circle: classes.circle,
                }}
                size={120}
                thickness={2}
            />
        </div>
    )
}

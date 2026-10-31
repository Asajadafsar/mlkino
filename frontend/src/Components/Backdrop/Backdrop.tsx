import Backdrop from '@mui/material/Backdrop';
import {ProgressBar} from "./progress"
import { useAppSelector } from '../../redux/store';

export function LoadingBackdrop(props) {
    const error = useAppSelector(state => state.util)
    return (
        <div>
            <Backdrop open={error.loading} style={{zIndex:10000}}>
                <ProgressBar white />
            </Backdrop>
        </div>
    )
}

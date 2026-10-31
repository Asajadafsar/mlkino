import {Stack, Typography} from '@mui/material'
import blankImage from '../../Images/emptyTableDark.png'

export function BlankList(props) {
    return (
        <Stack alignItems={'center'} marginTop="40px">
            <img src={blankImage} width="250px" height="250px" alt='' />
            <Typography color="GrayText" mt={2}>
                لیست خالی !
            </Typography>
        </Stack>
    )
}

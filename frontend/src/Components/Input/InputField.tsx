import {alpha, Stack, TextField, Theme, Typography} from '@mui/material'
import {styled} from '@mui/styles'
import {CustomTextField} from './CustomTextField'

export function InputField(props: {
    setData: Function
    name: string
    change?: Function
    title: string
}) {
    async function changeField(event) {
        if (!props.change) {
            props.setData((prev) => {
                return {...prev, [props.name]: event.target.value}
            })
        } else {
            props.change(event)
        }
    }
    return (
        <Stack spacing={1.5}>
            <Typography color="text.primary" fontWeight={800}>
                {props.title}
            </Typography>
            <CustomTextField fullWidth onChange={changeField} />
        </Stack>
    )
}

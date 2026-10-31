import React, {useState} from 'react'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import {alpha} from '@mui/material/styles'
import {Button, Collapse, Stack} from '@mui/material'
import {BaseModal} from '../Modal/BaseModal'
import {DataProvider} from '../../Core/DataProvider'
import {useDispatch} from 'react-redux'
import {setUtil} from '../../redux/UtilSlice'

export function CustomToolbar(props) {
    const {numSelected, resource, selected, setSelected, getList} = props
    const [open, setOpen] = useState(false)
    const dispatch = useDispatch()

    async function handleDelete() {
        dispatch(setUtil({loading: true}))
        try {
            const res = await DataProvider.delete(`${resource}/`, {
                data: {
                    [props.deleteName]: selected,
                },
            })
            getList && (await getList())
            setSelected([])
            dispatch(
                setUtil({
                    open: true,
                    message: res.message,
                    severity: 'success',
                }),
            )
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error.message,
                    severity: 'error',
                }),
            )
        }
        dispatch(setUtil({loading: false}))
        setOpen(false)
    }
    return (
        <Collapse in={numSelected > 0}>
            <BaseModal open={open} setOpen={setOpen} title="توجه!" style={{maxWidth: 'sm'}}>
                <Typography mb="1rem" variant="body2" fontSize={'17px'}>
                    آیا از انجام این عمل مطمئن هستید؟
                </Typography>
                <Stack direction={'row'} spacing={2} mt={2.5}>
                    <Button variant="contained" onClick={handleDelete} size="large">
                        بله
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={(e) => setOpen(false)}
                        size="large"
                    >
                        خیر
                    </Button>
                </Stack>
            </BaseModal>
            <Toolbar
                sx={{
                    bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                }}
            >
                <Typography
                    sx={{flex: '1 1 100%', fontSize: '17px !important'}}
                    color="inherit"
                    variant="subtitle1"
                    component="div"
                >
                    {numSelected} انتخاب شده
                </Typography>

                <Tooltip title="Delete">
                    <IconButton color="secondary" onClick={(e) => setOpen(true)}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </Collapse>
    )
}

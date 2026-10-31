import {Button, Stack, Typography} from '@mui/material'
import {Box} from '@mui/system'
import {useDispatch} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {DataProvider} from '../../Core/DataProvider'
import {setUtil} from '../../redux/UtilSlice'

export function CreatePage(props) {
    const {
        title,
        resource,
        noEdit,
        formDetails,
        redirect,
        isFormData = false,
        disabled = false,
        buttonText,
        buildRequestData,
        onSuccess,
    } = props
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const formData = new FormData()

    async function saveChanges() {
        Object.entries(formDetails).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value)
            } else if (Array.isArray(value)) {
                if (value.every((item) => item instanceof File)) {
                    value.forEach((file) => {
                        formData.append(`pictures`, file)
                    })
                } else {
                    value.forEach((object) => {
                        formData.append(key, JSON.stringify(object))
                    })
                }
            } else {
                formData.append(key, String(value))
            }
        })
        try {
            dispatch(setUtil({loading: true}))
            const res = await DataProvider.post(resource, {
                data: buildRequestData ? buildRequestData(formDetails) : isFormData ? formData : formDetails,
                headers: {
                    'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
                },
            })
            if (onSuccess) await onSuccess()
            else navigate(`/${redirect ? redirect : resource}`)
            dispatch(setUtil({open: true, message: res.message, severity: 'success'}))
        } catch (error: any) {
            dispatch(setUtil({open: true, message: error.message, severity: 'error'}))
        }
        dispatch(setUtil({loading: false}))
    }
    return (
        <Box sx={{p: {xs: 2, md: 3}, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '16px'}}>
            <Stack mb={2}>
                <Stack
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                >
                    <Typography
                        variant="h2"
                        sx={{
                            fontSize: {
                                xs: '15px !important',
                                sm: '18px !important',
                            },
                            '@media (max-width: 350px)': {
                                fontSize: '14px !important',
                            },
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {title}
                    </Typography>
                    {!noEdit && (
                        <Button
                            variant="outlined"
                            onClick={saveChanges}
                            sx={{
                                width: '100px',
                                fontSize: {
                                    xs: '14px !important',
                                    sm: '16px !important',
                                },
                                py: {
                                    xs: 0.7,
                                    sm: 1,
                                },
                                whiteSpace: 'nowrap',
                            }}
                            disabled={disabled}
                        >
                            {buttonText ? buttonText : 'تایید'}
                        </Button>
                    )}
                </Stack>
            </Stack>
            {props.children}
        </Box>
    )
}

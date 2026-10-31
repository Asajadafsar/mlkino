import { Button, Stack, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { DataProvider } from '../../Core/DataProvider'
import { setUtil } from '../../redux/UtilSlice'
import {useContext, useState} from 'react'
import {CurrentUserContext} from '../../Core/CurrentUser'

export function EditPage(props) {
    const {
        title,
        resource,
        noEdit,
        formDetails,
        initialData,
        isFormData = false,
        redirect,
        noId = false,
        reload = false,
        hasChange = true,
        buildRequestData,
        disabled = false,
    } = props
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const params = useParams()
    const {user, setUser} = useContext(CurrentUserContext)
    const [saving, setSaving] = useState(false)
    const updatedFields = Object.keys(formDetails).reduce((result, key) => {
        if (formDetails[key] !== initialData[key]) result[key] = formDetails[key]
        return result
    }, {} as Record<string, any>)
    async function saveChanges() {
        if (saving) return
        if (Object.keys(updatedFields).length === 0) {
            dispatch(setUtil({ open: true, message: 'تغییری اعمال نشده است', severity: 'error' }))
            dispatch(setUtil({ loading: false }))
            return
        }
        setSaving(true)
        try {
            dispatch(setUtil({ loading: true }))
            const formData = new FormData()

            Object.entries(hasChange ? updatedFields : formDetails).forEach(([key, value]) => {
                if (value instanceof File) {
                    formData.append(key, value)
                } else {
                    formData.append(key, String(value))
                }
            })
            const res = await DataProvider.patch(
                noId ? `${resource}` : `${resource}/${params.id || formDetails.id}/`,
                {
                    data: buildRequestData ? buildRequestData(hasChange ? updatedFields : formDetails) : isFormData ? formData : updatedFields,
                },
            )
            const saved = res.data as any
            if (resource === 'users' && saved?.id === user.id) setUser({...user, ...saved})
            dispatch(
                setUtil({
                    open: true,
                    message: res.message,
                    severity: 'success',
                }),
            )
            if (reload) {
                window.location.reload()
            } else {
                navigate(redirect ? `/${redirect}` : `/${resource}`)
            }
        } catch (error: any) {
            dispatch(setUtil({ open: true, message: error.message, severity: 'error' }))
        }

        setSaving(false)
        dispatch(setUtil({ loading: false }))
    }
    return (
        <Box sx={{p: {xs: 2, md: 3}, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '16px'}}>
            <Stack mb={4}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                >
                    <Typography
                        variant="h5"
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
                    <Stack>
                        {!noEdit && Object.keys(updatedFields).length !== 0 ? (
                            <Button
                                variant="outlined"
                                onClick={saveChanges}
                                disabled={disabled || saving}
                                sx={{
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
                            >
                                ذخیره تغییرات
                            </Button>
                        ) : (<Button
                            variant="outlined"
                            onClick={() => navigate(redirect ? `/${redirect}` : `/${resource}`)}
                            sx={{
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
                        >
                            بازگشت
                        </Button>)}
                    </Stack>
                </Stack>
            </Stack>
            {props.children}
        </Box>
    )
}

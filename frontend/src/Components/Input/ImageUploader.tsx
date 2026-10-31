import {Box, Button, Stack} from '@mui/material'
import {ChangeEvent, Dispatch, SetStateAction, useState} from 'react'
import {BaseModal} from '../Modal/BaseModal'
import {CustomTextField} from './CustomTextField'
interface Props {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
    imagePreview?: string
    data: any
    setData: Dispatch<SetStateAction<any>>
    setImagePreview: Dispatch<SetStateAction<string>>
    imageName: string
}
export default function ImageUploader({
    open,
    setOpen,
    imagePreview,
    data,
    setData,
    setImagePreview,
    imageName,
}: Props) {
    const [imageFile, setImageFile] = useState<File | null>(null)
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setImagePreview(URL.createObjectURL(file))
            setImageFile(file)
        }
    }
    const handleDelete = () => {
        setOpen(false)
        setImagePreview('')
        setImageFile(null)
    }
    return (
        <BaseModal
            open={open}
            setOpen={setOpen}
            title="انتخاب تصویر"
            onClose={handleDelete}
            style={{maxWidth: 700}}
        >
            <CustomTextField name="name" type="file" onChange={handleChange} />

            <Box
                component={'img'}
                src={
                    imagePreview
                        ? imagePreview
                        : data.imageName
                        ? typeof data.imageName === 'string'
                            ? data.imageName
                            : URL.createObjectURL(data.imageName)
                        : ''
                }
                sx={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '60vh',
                    mt: 2,
                    borderRadius: 2,
                    display: `${imagePreview || data.imageName ? 'block' : 'none'}`,
                }}
            />

            <Stack direction={'row'} spacing={2} mt={1}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                        setData((prev) => ({...prev, [imageName]: imageFile}))
                        setOpen(false)
                    }}
                    disabled={!imagePreview}
                >
                    تایید
                </Button>
                <Button variant="outlined" color="primary" size="large" onClick={handleDelete}>
                    لغو
                </Button>
            </Stack>
        </BaseModal>
    )
}

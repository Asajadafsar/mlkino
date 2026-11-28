import {useEffect, useState} from 'react'
import {Box, Button, IconButton, Stack, Typography} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

const EMPTY_IMAGES: (File | string)[] = []

export function CustomImagesField({
    name,
    setData,
    label,
    images = EMPTY_IMAGES,
}: {
    name: string
    setData: React.Dispatch<React.SetStateAction<any>>
    label: string
    images?: (File | string)[]
}) {
    const [error, setError] = useState('')
    const [previews, setPreviews] = useState<string[]>([])

    useEffect(() => {
        const urls = images.map(image => typeof image === 'string' ? image : URL.createObjectURL(image))
        setPreviews(urls)
        return () => urls.filter(url => url.startsWith('blob:')).forEach(url => URL.revokeObjectURL(url))
    }, [images])

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? [])
        e.target.value = ''
        if (images.length + selected.length > 15 || selected.some(file => file.size > 5 * 1024 * 1024)) {
            setError('حداکثر ۱۵ تصویر، هرکدام تا ۵ مگابایت، قابل ثبت است.')
            return
        }
        setError('')
        setData((prev: any) => ({...prev, [name]: [...images, ...selected]}))
    }

    const handleRemove = (index: number) => {
        setError('')
        setData((prev: any) => ({...prev, [name]: images.filter((_, i) => i !== index)}))
    }

    return (
        <Stack spacing={1.5}>
            <Typography variant="subtitle2">{label}</Typography>

            <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{width: 'fit-content'}}
            >
                انتخاب تصاویر
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleSelect}
                />
            </Button>

            {error && <Typography role="alert" color="error">{error}</Typography>}
            {previews.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                    {previews.map((src, index) => (
                        <Box
                            key={index}
                            sx={{
                                position: 'relative',
                                width: 96,
                                height: 96,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Box
                                component="img"
                                src={src}
                                alt={`preview-${index}`}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => handleRemove(index)}
                                sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    color: '#fff',
                                    padding: '2px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0,0,0,0.75)',
                                    },
                                }}
                            >
                                <CloseIcon sx={{fontSize: 16}} />
                            </IconButton>
                        </Box>
                    ))}
                </Stack>
            )}
        </Stack>
    )
}

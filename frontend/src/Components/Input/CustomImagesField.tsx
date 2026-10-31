import {useEffect, useState} from 'react'
import {Box, Button, IconButton, Stack, Typography} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

export function CustomImagesField({
    name,
    setData,
    label,
}: {
    name: string
    setData: React.Dispatch<React.SetStateAction<any>>
    label: string
}) {
    const [files, setLocalFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file))
        setPreviews(urls)
        return () => urls.forEach((url) => URL.revokeObjectURL(url))
    }, [files])

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? [])
        const next = [...files, ...selected]
        setLocalFiles(next)
        setData((prev: any) => ({...prev, [name]: next}))
        e.target.value = ''
    }

    const handleRemove = (index: number) => {
        const next = files.filter((_, i) => i !== index)
        setLocalFiles(next)
        setData((prev: any) => ({...prev, [name]: next}))
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

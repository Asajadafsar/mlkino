import {Button, Link, Stack, Typography} from '@mui/material'
import type {UploadValue} from './UserTypes'

export function UploadField({label, name, value, onChange, accept = 'image/*'}: {
    label: string
    name: string
    value: UploadValue
    onChange: (value: UploadValue) => void
    accept?: string
}) {
    return (
        <Stack spacing={1}>
            <Typography variant="body2">{label}</Typography>
            {typeof value === 'string' && value && (
                <Link href={value} target="_blank" rel="noopener noreferrer">مشاهده فایل فعلی</Link>
            )}
            {value instanceof File && <Typography variant="caption">{value.name}</Typography>}
            <Stack direction="row" gap={1}>
                <Button component="label" variant="outlined">
                    انتخاب فایل
                    <input
                        hidden
                        type="file"
                        name={name}
                        accept={accept}
                        onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) onChange(file)
                            event.target.value = ''
                        }}
                    />
                </Button>
                {value && <Button color="error" onClick={() => onChange(null)}>حذف فایل</Button>}
            </Stack>
        </Stack>
    )
}

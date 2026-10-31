import {Autocomplete, Chip, TextField} from '@mui/material'

export function MultiValueField({
    label,
    value,
    onChange,
}: {
    label: string
    value: string[]
    onChange: (next: string[]) => void
}) {
    return (
        <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={value}
            onChange={(_, next) => onChange(next as string[])}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                    <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({index})}
                        key={option}
                    />
                ))
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder="افزودن و اینتر بزنید"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '15px',
                        },
                    }}
                />
            )}
        />
    )
}

import {Checkbox, FormControlLabel, FormGroup, FormLabel, Stack} from '@mui/material'

export function CustomCheckboxGroupField({
    name,
    setData,
    label,
    defaultValue,
    options,
}: {
    name: string
    setData: React.Dispatch<React.SetStateAction<any>>
    label: string
    defaultValue?: string[]
    options: string[]
}) {
    const selected = defaultValue ?? []

    const toggleOption = (option: string) => {
        setData((prev: any) => {
            const current: string[] = prev[name] ?? []
            const next = current.includes(option)
                ? current.filter((item) => item !== option)
                : [...current, option]
            return {...prev, [name]: next}
        })
    }

    return (
        <FormGroup>
            <FormLabel component="legend" sx={{marginBottom: '8px'}}>
                {label}
            </FormLabel>
            <Stack direction="row" flexWrap="wrap">
                {options.map((option) => (
                    <FormControlLabel
                        key={option}
                        label={option}
                        control={
                            <Checkbox
                                checked={selected.includes(option)}
                                onChange={() => toggleOption(option)}
                            />
                        }
                    />
                ))}
            </Stack>
        </FormGroup>
    )
}

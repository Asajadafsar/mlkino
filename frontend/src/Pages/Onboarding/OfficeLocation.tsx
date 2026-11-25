import {useEffect, useState} from 'react'
import {Alert, Autocomplete, TextField} from '@mui/material'
import api from '../../Core/Request'

const levels = ['province', 'city', 'district', 'neighborhood'] as const
const labels = ['استان', 'شهر', 'منطقه', 'محله']

export default function OfficeLocation({initial}: {initial?: Record<string, string | boolean | null>}) {
    const [values, setValues] = useState<string[]>(() => levels.map(key => String(initial?.['office_' + key] || '')))
    const [options, setOptions] = useState<string[][]>([[], [], [], []])
    const [error, setError] = useState(false)
    const [province, city, district] = values
    useEffect(() => {
        const controller = new AbortController()
        setError(false)
        const limit = district ? 4 : city ? 3 : province ? 2 : 1
        Promise.all(levels.map(async (level, index) => {
            if (index >= limit) return []
            const {data} = await api.get('locations/', {signal: controller.signal, params: {
                level, all: true, province: index > 0 ? province : undefined,
                city: index > 1 ? city : undefined, district: index > 2 ? district : undefined,
            }})
            return data.data.results.map((row: {name: string}) => row.name)
        })).then(next => {if (!controller.signal.aborted) setOptions(next)})
          .catch(() => {if (!controller.signal.aborted) setError(true)})
        return () => controller.abort()
    }, [province, city, district])
    return <>
        <div className="onboarding-location">
            {levels.map((key, index) => <div key={key}>
                <input type="hidden" name={'office_' + key} value={values[index]}/>
                <Autocomplete freeSolo={index > 1} size="small" value={values[index] || null} options={options[index]}
                    disabled={index > 0 && !values[index - 1]}
                    onChange={(_, value) => setValues(previous => previous.map((item, i) => i < index ? item : i === index ? (value || '') : ''))}
                    onInputChange={(_, value, reason) => {
                        if (index > 1 && reason === 'input') setValues(previous => previous.map((item, i) => i < index ? item : i === index ? value : ''))
                    }}
                    renderInput={params => <TextField {...params} label={labels[index]} required/>}/>
            </div>)}
        </div>
        {error && <Alert severity="error">فهرست محدوده‌ها دریافت نشد.</Alert>}
    </>
}

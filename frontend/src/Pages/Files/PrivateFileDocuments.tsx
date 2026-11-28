import {useEffect, useState} from 'react'
import {Alert, Button, Stack} from '@mui/material'
import {PANEL_URL} from '../../Core/APP_URL'
import api from '../../Core/Request'
import {apiErrorMessage} from '../../Core/ApiError'

type Document = {index: number; name: string}

export default function PrivateFileDocuments({propertyId}: {propertyId: number}) {
    const path = `workflows/properties/${propertyId}/documents/`
    const [documents, setDocuments] = useState<Document[]>([])
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let active = true
        api.get(path).then(response => {
            if (active) setDocuments(response.data.data)
        }).catch(reason => {
            if (active) setError(apiErrorMessage(reason, 'دریافت مدارک انجام نشد.'))
        })
        return () => {active = false}
    }, [path])

    const upload = async (file: File) => {
        const payload = new FormData()
        payload.append('document', file)
        setError('')
        setBusy(true)
        try {
            const response = await api.post(path, payload)
            setDocuments(previous => [...previous, response.data.data])
        } catch (reason) {
            setError(apiErrorMessage(reason, 'بارگذاری مدرک انجام نشد.'))
        } finally {
            setBusy(false)
        }
    }

    return <Stack spacing={1}>
        {error && <Alert severity="error">{error}</Alert>}
        <Button component="label" disabled={busy}>
            بارگذاری مدرک خصوصی (اختیاری)
            <input type="file" accept="image/*,application/pdf" hidden onChange={event => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (file) void upload(file)
            }}/>
        </Button>
        {documents.map(document => <Button key={document.index} component="a" href={`${PANEL_URL}/${path}${document.index}/`}>{document.name}</Button>)}
    </Stack>
}

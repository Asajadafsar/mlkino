import {Alert, Button, LinearProgress} from '@mui/material'
import {useCallback, useEffect, useState, type Dispatch, type SetStateAction} from 'react'
import {useSelector} from 'react-redux'
import {useLocation, useParams} from 'react-router-dom'
import {selectIsSuperAdmin} from '../../../redux/RoleSlice'
import {buildUserRequestData, isAgencyUpdateValid} from '../../User/UserRequestData'
import {EditPage} from '../../../Components/Table/EditPage'
import {DataProvider} from '../../../Core/DataProvider'
import {normalizeManagedUser} from '../../User/normalizeManagedUser'
import {Agency, type AgencyType} from '../Agency'

const resource = 'users'

export function AgencyEdit() {
    const isSuperAdmin = useSelector(selectIsSuperAdmin)
    const {id: routeId} = useParams()
    const state = useLocation().state as {row?: AgencyType} | null
    const id = Number(routeId ?? state?.row?.id)
    const [agency, setAgency] = useState<AgencyType | null>(null)
    const [initialData, setInitialData] = useState<AgencyType | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [retry, setRetry] = useState(0)
    const updateAgency = useCallback<Dispatch<SetStateAction<AgencyType>>>((update) => {
        setAgency((previous) => previous ? typeof update === 'function' ? update(previous) : update : previous)
    }, [])

    useEffect(() => {
        let active = true
        setLoading(true)
        setError('')
        const load = async () => {
            if (!Number.isInteger(id) || id < 1) {
                setError('شناسه املاکی معتبر نیست.')
                setLoading(false)
                return
            }
            try {
                const response = await DataProvider.get<AgencyType>(`${resource}/${id}/`)
                if (active) {
                    setAgency(normalizeManagedUser(response.data))
                    setInitialData(normalizeManagedUser(response.data))
                }
            } catch (error: any) {
                if (active) setError(error.message || 'خطا در دریافت جزئیات املاکی')
            } finally {
                if (active) setLoading(false)
            }
        }
        load()
        return () => {active = false}
    }, [id, retry])

    if (loading) return <LinearProgress aria-label="دریافت جزئیات املاکی" />
    if (error) return <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry((value) => value + 1)}>تلاش مجدد</Button>}>{error}</Alert>
    if (!agency || !initialData) return null

    return (
        <EditPage
            resource={resource}
            title="جزئیات املاک"
            formDetails={agency}
            initialData={initialData}
            isFormData={true}
            buildRequestData={(values: Record<string, unknown>) => buildUserRequestData(values, 'agency', isSuperAdmin)}
            disabled={!isAgencyUpdateValid(agency, initialData)}
            redirect="users/agencies"
        >
            <Agency agency={agency} setAgency={updateAgency} resource={resource} editMode />
        </EditPage>
    )
}

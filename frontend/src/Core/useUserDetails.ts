import {useCallback, useEffect, useState, Dispatch, SetStateAction} from 'react'
import {useParams} from 'react-router-dom'
import {normalizeManagedUser} from '../Pages/User/normalizeManagedUser'
import {DataProvider} from './DataProvider'

export function useUserDetails<T>() {
    const {id} = useParams()
    const [data, setData] = useState<T | null>(null)
    const [initial, setInitial] = useState<T | null>(null)
    const [error, setError] = useState('')
    useEffect(() => {
        let active = true
        setData(null)
        setInitial(null)
        setError('')
        DataProvider.get<T>(`users/${id}/`).then(response => {
            if (active) {const user = normalizeManagedUser(response.data); setData(user); setInitial(user)}
        }).catch(error => {if (active) setError(error.message || 'دریافت کاربر انجام نشد')})
        return () => {active = false}
    }, [id])
    const update = useCallback<Dispatch<SetStateAction<T>>>(value => {
        setData(previous => previous === null ? previous : typeof value === 'function' ? (value as (previous: T) => T)(previous) : value)
    }, [])
    return {data, initial, setData: update, error}
}

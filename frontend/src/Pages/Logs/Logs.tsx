import {Stack} from '@mui/material'
import type {Dispatch, SetStateAction} from 'react'
import {CustomTextField} from '../../Components/Input/CustomTextField'
import {CustomSelectField} from '../../Components/Input/CustomSelectField'
import {GridProducer} from '../../Components/Table/GridProducer'
import {formatDate} from '../../Core/FormatDate'

export type LogsType = {
    id: number
    request_id: string
    created_at: string
    actor: number | null
    actor_name: string | null
    real_actor: number | null
    real_actor_name: string | null
    impersonation_session: string | null
    event: string
    category: string
    method: string
    path: string
    status_code: number
    duration_ms: number
    ip_address: string | null
    user_agent: string
    metadata: {
        impersonated: boolean
        authenticated: boolean
    }
}

type LogField = {
    name: Exclude<keyof LogsType, 'id' | 'metadata'>
    label: string
    numeric?: boolean
    nullable?: boolean
    multiline?: boolean
}

const logFields: LogField[] = [
    {name: 'request_id', label: 'شناسه درخواست'},
    {name: 'created_at', label: 'تاریخ ثبت'},
    {name: 'actor', label: 'شناسه کاربر', numeric: true, nullable: true},
    {name: 'actor_name', label: 'نام کاربر', nullable: true},
    {name: 'real_actor', label: 'شناسه کاربر اصلی', numeric: true, nullable: true},
    {name: 'real_actor_name', label: 'نام کاربر اصلی', nullable: true},
    {name: 'impersonation_session', label: 'شناسه نشست ورود به جای کاربر', nullable: true},
    {name: 'event', label: 'رویداد'},
    {name: 'category', label: 'دسته‌بندی'},
    {name: 'method', label: 'متد درخواست'},
    {name: 'path', label: 'مسیر درخواست'},
    {name: 'status_code', label: 'کد پاسخ', numeric: true},
    {name: 'duration_ms', label: 'مدت درخواست (میلی‌ثانیه)', numeric: true},
    {name: 'ip_address', label: 'آدرس IP', nullable: true},
    {name: 'user_agent', label: 'مشخصات مرورگر', multiline: true},
]

export function Logs({
    logs,
    setLogs,
    resource,
}: {
    logs: LogsType
    setLogs: Dispatch<SetStateAction<LogsType>>
    resource: string
}) {
    return (
        <Stack>
            {logs && (
                <GridProducer
                    sx={{marginBottom: '16px'}}
                    data={[
                        <CustomTextField
                            key="id"
                            name="id"
                            data-resource={resource}
                            label="شناسه"
                            value={logs.id}
                            disabled
                        />,
                        ...logFields.map(({name, label, numeric, nullable, multiline}) => (
                            <CustomTextField
                                key={name}
                                name={name}
                                data-resource={resource}
                                label={label}
                                disabled
                                value={
                                    name === 'created_at'
                                        ? formatDate(logs.created_at)
                                        : (logs[name] ?? '')
                                }
                                InputProps={{readOnly: name === 'created_at'}}
                                type={numeric ? 'number' : 'text'}
                                multiline={multiline}
                                change={(event) => {
                                    const rawValue = event.target.value
                                    if (numeric && rawValue === '' && !nullable) return
                                    const value =
                                        nullable && rawValue === ''
                                            ? null
                                            : numeric
                                              ? Number(rawValue)
                                              : rawValue
                                    if (typeof value === 'number' && !Number.isFinite(value)) return
                                    setLogs((prev) => ({...prev, [name]: value}))
                                }}
                            />
                        )),
                        ...(
                            [
                                ['impersonated', 'ورود به جای کاربر'],
                                ['authenticated', 'احراز هویت شده'],
                            ] as const
                        ).map(([name, label]) => (
                            <CustomSelectField<LogsType['metadata']>
                                key={name}
                                name={name}
                                setData={(update) => {
                                    setLogs((prev) => {
                                        const next =
                                            typeof update === 'function'
                                                ? update(prev.metadata)
                                                : update
                                        return {
                                            ...prev,
                                            metadata: {
                                                ...prev.metadata,
                                                [name]: String(next[name]) === 'true',
                                            },
                                        }
                                    })
                                }}
                                resource={resource}
                                label={label}
                                disabled
                                value={String(logs.metadata[name])}
                                options={[
                                    {label: 'بله', value: 'true'},
                                    {label: 'خیر', value: 'false'},
                                ]}
                            />
                        )),
                    ]}
                />
            )}
        </Stack>
    )
}

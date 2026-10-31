import {AxiosRequestConfig} from 'axios'
import {JsonParam, NumberParam, QueryParamConfig, StringParam} from 'use-query-params'

type QueryParamGenericConfig<T> = QueryParamConfig<T | null | undefined, T>

export type UserQueryParamType = {
    ordering?: QueryParamGenericConfig<string>
    page?: QueryParamGenericConfig<number>
    search?: QueryParamGenericConfig<string>
    page_size?: QueryParamGenericConfig<number>
}

type QueryType = {
    ordering?: string | null
    page?: number | null
    search?: string | null
    date?: {[key: string]: {from?: Date; to?: Date}} | null
    page_size?: number | null
}

export type ApiParams = QueryType & {
    data?: any
    onUploadProgress?: AxiosRequestConfig<any>['onUploadProgress']
    headers?: {[key: string]: string}
}

export function createQueryParam(tableHeadCells?: any[]) {
    const queryParams = {
        ordering: StringParam,
        page: NumberParam,
        search: StringParam,
        date: JsonParam,
        page_size: NumberParam,
    }

    tableHeadCells?.forEach((cell) => {
        const fieldName = cell.field
        queryParams[fieldName] = StringParam
    })

    return queryParams
}

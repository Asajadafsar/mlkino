    import {ApiResponse, query} from './Request'
    import {AxiosRequestConfig} from 'axios'
    import {ApiParams} from './QueryParams'
    import {PANEL_URL} from './APP_URL'

    async function HttpRequest<DataType>(url: string, options: AxiosRequestConfig = {}) {
        const data = await query<DataType>({
            url,
            withCredentials: true,
            ...options,
            headers: {
                'Accept-Language': 'fa',
                ...options.headers,
            },
        })

        return data
    }

    export class DataProvider {
        static baseUrl = PANEL_URL

        static async post<DataType>(resource: string, params?: ApiParams) {
            const url = `${this.baseUrl}/${resource}`

            const options: AxiosRequestConfig = {
                method: 'POST',
                data: params?.data,
                onUploadProgress: params?.onUploadProgress,
            }

            return HttpRequest<ApiResponse<DataType>>(url, options)
        }

        static async get<DataType>(resource: string, params?: ApiParams) {
            const url = `${this.baseUrl}/${resource}`

            const options: AxiosRequestConfig = {
                method: 'GET',
                params,
                onUploadProgress: params?.onUploadProgress,
            }

            return HttpRequest<ApiResponse<DataType>>(url, options)
        }

        static async patch<DataType>(resource: string, params?: ApiParams) {
            const url = `${this.baseUrl}/${resource}`

            const options: AxiosRequestConfig = {
                method: 'PATCH',
                data: params?.data,
                onUploadProgress: params?.onUploadProgress,
            }

            return HttpRequest<ApiResponse<DataType>>(url, options)
        }

        static async put<DataType>(resource: string, params?: ApiParams) {
            const url = `${this.baseUrl}/${resource}`

            const options: AxiosRequestConfig = {
                method: 'PUT',
                data: params?.data,
                onUploadProgress: params?.onUploadProgress,
            }

            return HttpRequest<ApiResponse<DataType>>(url, options)
        }

        static async delete<DataType>(resource: string, params?: ApiParams) {
            const url = `${this.baseUrl}/${resource}`

            const options: AxiosRequestConfig = {
                method: 'DELETE',
                data: params?.data,
                onUploadProgress: params?.onUploadProgress,
            }

            return HttpRequest<ApiResponse<DataType>>(url, options)
        }
    }
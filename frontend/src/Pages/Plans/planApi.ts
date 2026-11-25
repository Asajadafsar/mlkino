import api from '../../Core/Request'
import {ACCOUNTS_URL} from '../../Core/APP_URL'

export const PlanDemoStore = {
    async get<T>(resource: string) {
        return api.get<T>(ACCOUNTS_URL + '/' + resource)
    },
    async post(resource: string, params: {data: unknown}) {
        return api.post(ACCOUNTS_URL + '/' + resource, params.data)
    },
    async patch(resource: string, params: {data: unknown}) {
        return api.patch(ACCOUNTS_URL + '/' + resource, params.data)
    },
    async delete(resource: string) {
        return api.delete(ACCOUNTS_URL + '/' + resource)
    },
}

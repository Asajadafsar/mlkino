import axios from 'axios'
import {ACCOUNTS_URL} from './APP_URL'
import {installCsrf} from './Csrf'

test('bootstraps cross-origin CSRF, shares it for concurrent writes and never leaks it to other servers',async()=>{
 const bootstrap=jest.spyOn(axios,'get').mockResolvedValue({data:{csrfToken:'masked-token'}})
 const requests:any[]=[]
 const client=axios.create({adapter:async config=>{requests.push(config);return {data:{},status:200,statusText:'OK',headers:{},config}}})
 installCsrf(client)
 await client.get(`${ACCOUNTS_URL}/session/`)
 expect(bootstrap).not.toHaveBeenCalled()
 await Promise.all([client.post(`${ACCOUNTS_URL}/login/password/`,{}),client.post(`${ACCOUNTS_URL}/logout/`,{})])
 expect(bootstrap).toHaveBeenCalledTimes(1)
 expect(bootstrap).toHaveBeenCalledWith(`${ACCOUNTS_URL}/csrf/`,expect.objectContaining({withCredentials:true}))
 expect(requests[1].headers['X-CSRFToken']).toBe('masked-token')
 expect(requests[1].withCredentials).toBe(true)
 expect(requests[1].xsrfCookieName).toBe('')
 await client.post('https://untrusted.example/upload',{})
 expect(requests[3].headers['X-CSRFToken']).toBeUndefined()
 bootstrap.mockRestore()
})

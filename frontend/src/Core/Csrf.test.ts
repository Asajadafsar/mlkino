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

const fresh=()=>{
 jest.resetModules()
 return {axios:require('axios').default,...require('./Csrf')}
}

test('a missing cookie is detected before sending the password',async()=>{
 const {axios,getCsrfToken,installCsrf}=fresh()
 const bootstrap=jest.spyOn(axios,'get').mockResolvedValue({data:{csrfToken:'masked',csrfCookiePresent:false}})
 const send=jest.fn()
 const client=axios.create({adapter:send});installCsrf(client)
 await expect(client.post(`${ACCOUNTS_URL}/login/password/`,{password:'test-only'})).rejects.toThrow('proxy')
 expect(bootstrap).toHaveBeenCalledTimes(2)
 expect(send).not.toHaveBeenCalled()
 bootstrap.mockRestore()
})

test('first visit confirms that the newly set cookie survived before a write',async()=>{
 const {axios,getCsrfToken}=fresh()
 const bootstrap=jest.spyOn(axios,'get').mockResolvedValueOnce({data:{csrfToken:'first',csrfCookiePresent:false}}).mockResolvedValueOnce({data:{csrfToken:'confirmed',csrfCookiePresent:true}})
 expect(await getCsrfToken()).toBe('confirmed')
 expect(bootstrap).toHaveBeenCalledTimes(2)
 bootstrap.mockRestore()
})

test.each([false,true])('CSRF rejection is retried at most once (always rejected=%s)',async alwaysRejected=>{
 const {axios,installCsrf}=fresh()
 const bootstrap=jest.spyOn(axios,'get').mockResolvedValueOnce({data:{csrfToken:'old'}}).mockResolvedValueOnce({data:{csrfToken:'fresh'}})
 let sends=0
 const client=axios.create({adapter:async(config:any)=>{
  sends++
  if(sends===1||alwaysRejected)throw {config,response:{status:403,data:{error_code:'csrf_failed'}}}
  expect(config.headers['X-CSRFToken']).toBe('fresh')
  return {data:{ok:true},status:200,statusText:'OK',headers:{},config}
 }})
 installCsrf(client)
 const result=client.post(`${ACCOUNTS_URL}/login/password/`,{})
 if(alwaysRejected)await expect(result).rejects.toMatchObject({response:{status:403}})
 else expect((await result).status).toBe(200)
 expect(sends).toBe(2)
 expect(bootstrap).toHaveBeenCalledTimes(2)
 bootstrap.mockRestore()
})

/** @jest-environment node */
const http = require('http')
const {createLocalApiProxy,localCookie}=require('./setupProxy')
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const close=server=>new Promise(resolve=>server.close(resolve))

test('loopback proxy keeps login cookies first-party and rejects forged origins/hosts',async()=>{
 let calls=0
 const upstream=http.createServer((req,res)=>{
  calls++
  expect(req.headers.origin).toBe(`http://127.0.0.1:${upstream.address().port}`)
  if(req.method==='GET'){
   res.setHeader('Set-Cookie','csrftoken=test-secret; Path=/; HttpOnly; Secure; SameSite=None')
   return res.end(JSON.stringify({csrfToken:'test-token'}))
  }
  expect(req.headers.cookie).toBe('csrftoken=test-secret')
  expect(req.headers['x-csrftoken']).toBe('test-token')
  res.end(JSON.stringify({ok:true}))
 })
 await listen(upstream)
 const handler=createLocalApiProxy(`http://127.0.0.1:${upstream.address().port}`)
 const proxy=http.createServer((req,res)=>handler(req,res,()=>{res.statusCode=404;res.end()}))
 await listen(proxy)
 const origin=`http://localhost:${proxy.address().port}`
 const request=(path,method='GET',headers={})=>new Promise((resolve,reject)=>{
  const outgoing=http.request({hostname:'127.0.0.1',port:proxy.address().port,path,method,headers:{Host:`localhost:${proxy.address().port}`,Origin:origin,...headers}},res=>{let body='';res.on('data',data=>body+=data);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}))})
  outgoing.on('error',reject);outgoing.end()
 })
 try{
  const bootstrap=await request('/api/accounts/csrf/')
  expect(bootstrap.status).toBe(200)
  expect(bootstrap.headers['set-cookie'][0]).toBe('csrftoken=test-secret; Path=/; HttpOnly; SameSite=Lax')
  const response=await request('/api/accounts/login/password/','POST',{Cookie:'csrftoken=test-secret','X-CSRFToken':JSON.parse(bootstrap.body).csrfToken})
  expect(response.status).toBe(200)
  expect(JSON.parse(response.body)).toEqual({ok:true})
  expect((await request('/api/accounts/login/password/','POST',{Origin:'https://evil.example'})).status).toBe(403)
  expect((await request('/api/accounts/csrf/','GET',{Host:'evil.example'})).status).toBe(403)
  expect((await request('/api/accounts/login/password/','POST',{Origin:''})).status).toBe(403)
  expect(calls).toBe(2)
  expect((await request('/login')).status).toBe(404)
  expect(localCookie('csrftoken=x; Domain=api.mlkino.com; HttpOnly; Secure; SameSite=None',true)).toBe('csrftoken=x; HttpOnly; Secure; SameSite=Lax')
 } finally {await close(proxy);await close(upstream)}
})

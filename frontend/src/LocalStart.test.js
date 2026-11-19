/** @jest-environment node */
const {configureLocalEnvironment}=require('../scripts/start-local.cjs')

test('ordinary npm start selects the server proxy on port 3000 without shell env syntax',()=>{
 const env={}
 expect(configureLocalEnvironment(env)).toEqual({port:'3000',apiOrigin:'https://api.mlkino.com',proxy:true})
 expect(env.REACT_APP_API_URL).toBe('https://api.mlkino.com')
})

test('explicit local backend and custom port are preserved',()=>{
 const env={PORT:'3005',REACT_APP_API_URL:'http://localhost:8000'}
 expect(configureLocalEnvironment(env)).toEqual({port:'3005',apiOrigin:'http://localhost:8000',proxy:false})
})

test('start:server selects the proxy even if an old environment points at local Django',()=>{
 const env={REACT_APP_API_URL:'http://localhost:8000'}
 expect(configureLocalEnvironment(env,true).proxy).toBe(true)
 expect(env.REACT_APP_API_URL).toBe('https://api.mlkino.com')
})

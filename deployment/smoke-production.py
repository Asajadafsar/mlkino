#!/usr/bin/env python3
"""Run after approved deployment. Prompts securely; never saves login credentials/tokens."""
import argparse,asyncio,getpass,http.cookiejar,json,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--chat-id',type=int);args=p.parse_args()
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
phone=input('Production test-user phone: ').strip();password=getpass.getpass('Password (not stored): ')
request=urllib.request.Request('https://api.mlkino.com/accounts/login/password/',data=json.dumps({'phone':phone,'password':password}).encode(),headers={'Content-Type':'application/json','Origin':'https://panel.mlkino.com'})
with client.open(request,timeout=20) as response:
    assert response.status==200
    assert response.headers.get('Access-Control-Allow-Origin')=='https://panel.mlkino.com'
del password,request
with client.open('https://api.mlkino.com/accounts/profile/',timeout=20) as response:assert response.status==200
for cookie in jar:
    if cookie.name in ['accessToken','refreshToken']:
        assert cookie.secure and cookie.has_nonstandard_attr('HttpOnly')
header='; '.join(f'{c.name}={c.value}' for c in jar if c.domain.endswith('api.mlkino.com'))
async def verify(path):
    import websockets
    async with websockets.connect('wss://api.mlkino.com'+path,origin='https://panel.mlkino.com',additional_headers={'Cookie':header},open_timeout=20) as ws:
        initial=json.loads(await asyncio.wait_for(ws.recv(),10));assert initial['event'] in ['inbox.connected','chat.connected']
        await ws.send(json.dumps({'event':'chat.ping','data':{}}))
        while True:
            event=json.loads(await asyncio.wait_for(ws.recv(),10))
            if event['event']=='chat.pong':break
        print(path,'authenticated connection and ping/pong OK')
asyncio.run(verify('/ws/inbox/'))
if args.chat_id:asyncio.run(verify(f'/ws/chats/{args.chat_id}/'))
print('API profile and secure cookie flow OK. Complete two-user message/read/typing tests separately.')

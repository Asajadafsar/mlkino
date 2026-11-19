"""Non-destructive HTTPS CORS/CSRF smoke test: no users, SMS or identity lookups.

python3 deployment/check-cors-production.py --interface en0
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile

parser=argparse.ArgumentParser()
parser.add_argument('--interface')
args=parser.parse_args()
base='https://api.mlkino.com'
results=[]

with tempfile.TemporaryDirectory(prefix='mlkino-cors-check-') as folder:
    folder=Path(folder)
    cookie=folder/'cookies.txt'
    def request(path,origin,method='GET',headers=None,data=None,use_cookie=False):
        command=['curl','-sS','--connect-timeout','10','--max-time','20','-D',str(folder/'headers'),'-o',str(folder/'body'),'-X',method]
        if args.interface:command+=['--interface',args.interface]
        command+=['-H','Origin: '+origin]
        for key,value in (headers or {}).items():command+=['-H',key+': '+value]
        if use_cookie:command+=['-b',str(cookie),'-c',str(cookie)]
        if data is not None:command+=['--data-binary',data]
        subprocess.run([*command,base+path],check=True)
        raw=(folder/'headers').read_text().replace('\r','').strip().split('\n\n')[-1]
        lines=raw.splitlines();status=int(lines[0].split()[1]);response_headers={}
        for line in lines[1:]:
            if ':' in line:
                key,value=line.split(':',1);response_headers.setdefault(key.lower(),[]).append(value.strip())
        return status,response_headers,(folder/'body').read_bytes()

    def cors(headers,origin,allowed=True):
        if allowed:
            assert headers.get('access-control-allow-origin')==[origin],headers
            assert headers.get('access-control-allow-credentials')==['true'],headers
        else:
            assert 'access-control-allow-origin' not in headers,headers
            assert 'access-control-allow-credentials' not in headers,headers

    for origin in ('http://localhost:3000','http://127.0.0.1:3000','https://mlkino.com'):
        for path in ('/accounts/login/password/','/api/accounts/login/password/','/panel/users/','/api/panel/users/'):
            status,headers,_=request(path,origin,'OPTIONS',{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'Content-Type,X-CSRFToken'})
            assert status==200 and 'location' not in headers,(status,headers)
            cors(headers,origin)
            assert {'content-type','x-csrftoken'}<=set(','.join(headers['access-control-allow-headers']).lower().replace(' ','').split(','))
        results.append({'origin':origin,'preflight_four_routes':'passed'})
    origin='http://localhost:3000'
    status,headers,body=request('/accounts/csrf/',origin,use_cookie=True)
    assert status==200
    cors(headers,origin)
    token=json.loads(body)['csrfToken']
    flags=';'.join(headers['set-cookie']).lower()
    assert all(flag in flags for flag in ('csrftoken=','secure','httponly','samesite=none'))
    assert 'domain=' not in flags
    assert 'no-store' in ','.join(headers.get('cache-control',[]))
    for path in ('/accounts/login/password/','/api/accounts/login/password/'):
        status,headers,body=request(path,origin,'POST',{'Content-Type':'application/json','X-CSRFToken':token},'{}',True)
        assert status==400,(status,body)
        cors(headers,origin)
    for send_cookie in (False,True):
        supplied={'Content-Type':'application/json'}
        if not send_cookie:supplied['X-CSRFToken']=token
        status,headers,body=request('/accounts/login/password/',origin,'POST',supplied,'{}',send_cookie)
        assert status==403 and json.loads(body)['error_code']=='csrf_failed',(status,body)
        cors(headers,origin)
    for path,expected in (('/accounts/session/',401),('/api/accounts/session/',401),('/accounts/missing/',404)):
        status,headers,_=request(path,origin)
        assert status==expected,(path,status)
        cors(headers,origin)
    bad='https://untrusted.example'
    status,headers,_=request('/accounts/login/password/',bad,'OPTIONS',{'Access-Control-Request-Method':'POST'})
    cors(headers,bad,False)
    status,headers,body=request('/accounts/login/password/',bad,'POST',{'X-CSRFToken':token,'Content-Type':'application/json'},'{}',True)
    assert status==403 and json.loads(body)['error_code']=='untrusted_origin'
    cors(headers,bad,False)
    # Nginx rejects the declared body length at the header stage; no large upload is sent.
    for candidate in (origin,bad):
        status,headers,_=request('/accounts/login/password/',candidate,'POST',{'Content-Length':'52428801','Expect':'100-continue'},'')
        assert status==413,(status,headers)
        cors(headers,candidate,candidate==origin)
    results.append({'csrf_bootstrap':'passed','secure_httponly_host_only_cookie':'passed','valid_token_with_cookie':'passed',
        'missing_token_or_cookie_rejected':'passed','untrusted_origin_rejected':'passed','error_401_403_404_cors':'passed','nginx_413_cors':'passed'})
print(json.dumps(results,indent=2))

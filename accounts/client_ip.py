"""Resolve client addresses only through explicitly trusted reverse proxies."""
import ipaddress
import os
from django.conf import settings

def get_client_ip(request):
    def parse(value):
        try:return ipaddress.ip_address(str(value).strip())
        except (ValueError,TypeError):return None
    remote=parse(request.META.get('REMOTE_ADDR'))
    missing=getattr(settings,'MLKINO_TRUST_PROXY_HEADERS_WITHOUT_REMOTE',False) or os.environ.get('MLKINO_TRUST_PROXY_HEADERS_WITHOUT_REMOTE')=='1'
    if remote is None:
        real=parse(request.META.get('HTTP_X_REAL_IP')) if missing else None
        return str(real) if real else None
    configured=getattr(settings,'MLKINO_TRUSTED_PROXIES',os.environ.get('MLKINO_TRUSTED_PROXIES',''))
    if isinstance(configured,str):configured=configured.split(',')
    networks=[]
    for item in configured:
        try:networks.append(ipaddress.ip_network(item.strip(),strict=False))
        except ValueError:pass
    trusted=lambda ip:any(ip in network for network in networks)
    if not trusted(remote):return str(remote)
    hops=[parse(value) for value in request.META.get('HTTP_X_FORWARDED_FOR','').split(',') if value.strip()]
    if not hops or any(ip is None for ip in hops):return str(remote)
    return str(next((ip for ip in reversed(hops) if not trusted(ip)),hops[0]))

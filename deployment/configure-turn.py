#!/usr/bin/env python3
"""Configure authenticated coturn on the production host after package installation."""
import os
import pathlib
import secrets
import shutil
import subprocess

assert os.geteuid() == 0
backup = pathlib.Path('/var/backups/mlkino/calls-20261031-004')
backup.mkdir(mode=0o700, parents=True, exist_ok=False)
config = pathlib.Path('/etc/turnserver.conf')
if config.exists(): shutil.copy2(config, backup/'turnserver.conf')
env = pathlib.Path('/etc/mlkino/release.env')
shutil.copy2(env, backup/'release.env')
secret = secrets.token_urlsafe(48)
assert 'MLKINO_TURN_SECRET=' not in env.read_text(), 'Existing TURN setup requires review'
with env.open('a') as f: f.write('\nMLKINO_TURN_SECRET='+secret+'\n')
os.chmod(env, 0o600)
config.write_text('''listening-port=3478
listening-ip=212.80.20.75
relay-ip=212.80.20.75
min-port=49160
max-port=49260
fingerprint
use-auth-secret
realm=api.mlkino.com
server-name=api.mlkino.com
no-tls
no-dtls
no-cli
no-multicast-peers
no-tcp-relay
user-quota=12
total-quota=300
max-bps=1000000
bps-capacity=30000000
stale-nonce=600
no-software-attribute
log-file=syslog
simple-log
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=224.0.0.0-255.255.255.255
denied-peer-ip=::1
denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff
static-auth-secret='''+secret+'\n')
shutil.chown(config, user='root', group='turnserver');config.chmod(0o640)
subprocess.run(['systemctl', 'enable', '--now', 'coturn'], check=True)
subprocess.run(['systemctl', 'restart', 'coturn'], check=True)
subprocess.run(['systemctl', 'is-active', '--quiet', 'coturn'], check=True)
print('Authenticated TURN configured; secret retained on server. Backup:', backup)

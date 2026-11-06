#!/usr/bin/env python3
"""Loopback-only SPA preview. The directory contains built public assets only."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import sys
root=Path(sys.argv[1]).resolve()
class SPA(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
    def do_GET(self):
        target=self.translate_path(self.path.split('?',1)[0])
        if not Path(target).exists() and not Path(self.path.split('?',1)[0]).suffix:self.path='/index.html'
        return super().do_GET()
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY');self.send_header('Cache-Control','no-cache');super().end_headers()
ThreadingHTTPServer(('127.0.0.1',4200),SPA).serve_forever()

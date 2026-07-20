#!/usr/bin/env python3
"""静态托管 exhibits/，修正 .mjs 的 MIME（python -m http.server 会当成 text/plain，导致播放器模块加载失败）。"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8199


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(SimpleHTTPRequestHandler, 'extensions_map', {}),
        '.mjs': 'text/javascript',
        '.js': 'text/javascript',
        '.json': 'application/json',
    }


if __name__ == '__main__':
    with HTTPServer(('', PORT), Handler) as httpd:
        print(f'exhibits static server: http://127.0.0.1:{PORT}/studio.html')
        print(f'view exhibit: http://127.0.0.1:{PORT}/craft-001/')
        httpd.serve_forever()

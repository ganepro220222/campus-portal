"""Normalize all exhibits/*.bat to CRLF (Windows cmd requirement)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
for path in ROOT.rglob('*.bat'):
    text = path.read_bytes().decode('utf-8-sig')
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    path.write_bytes(text.replace('\n', '\r\n').encode('utf-8'))
    print('CRLF', path.relative_to(ROOT))

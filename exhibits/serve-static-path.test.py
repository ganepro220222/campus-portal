"""serve.py 静态守卫与 Node studio-static-path.mjs 对齐。"""
from __future__ import annotations

import importlib.util
from email.message import Message
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _load():
    spec = importlib.util.spec_from_file_location('serve', ROOT / 'serve.py')
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    m = _load()
    assert m.decode_static_rel('/') == 'studio.html'
    assert m.decode_static_rel('/craft-001/config.json') == 'craft-001/config.json'
    assert m.deny_static_rel_reason('craft-001/config.json') == ''
    assert m.deny_static_rel_reason('_panoramas/hall.jpg') == ''
    assert m.deny_static_rel_reason('../exhibits-upload/x') == 'traversal'
    assert m.deny_static_rel_reason('_server/studio-server.mjs') == 'private'
    assert m.deny_static_rel_reason('craft-001/.bak/config.1.json') == 'hidden'
    root = (ROOT).resolve()
    assert m.is_resolved_inside_root(root, root / 'studio.html') is True
    assert m.is_resolved_inside_root(root, (root / '../exhibits-upload/x').resolve()) is False

    same = Message()
    same['Host'] = '127.0.0.1:8888'
    same['Origin'] = 'http://127.0.0.1:8888'
    assert m.deny_studio_write_reason(same) == ''

    cross = Message()
    cross['Host'] = '127.0.0.1:8888'
    cross['Origin'] = 'http://127.0.0.1:8898'
    cross['X-Forwarded-Host'] = '127.0.0.1:8898'
    assert m.deny_studio_write_reason(cross) == 'origin-mismatch'

    site = Message()
    site['Host'] = '127.0.0.1:8888'
    site['Sec-Fetch-Site'] = 'cross-site'
    assert m.deny_studio_write_reason(site) == 'cross-site'
    assert m.deny_studio_write_content_type('text/plain;charset=UTF-8') == 'content-type'
    assert m.deny_studio_write_content_type('application/json;charset=UTF-8') == ''
    print('[serve-static-path.test] PASS')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

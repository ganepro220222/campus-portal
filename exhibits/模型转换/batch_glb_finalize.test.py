"""无 trimesh：测输出已存在时清掉 .tmp_ GLB。"""
from __future__ import annotations

import hashlib
import importlib
import os
import sys
import tempfile
from unittest.mock import MagicMock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
for name in ("trimesh", "numpy", "PIL", "PIL.Image"):
    sys.modules.setdefault(name, MagicMock())

batch_glb = importlib.import_module("batch_glb")


def main() -> int:
    with tempfile.TemporaryDirectory() as out:
        payload = b"already-there"
        digest = hashlib.sha1(payload).hexdigest()[:8]
        existing = os.path.join(out, f"dup-{digest}.glb")
        open(existing, "wb").write(payload)
        fd, temp_path = tempfile.mkstemp(suffix=".glb", prefix=".tmp_", dir=out)
        os.close(fd)
        open(temp_path, "wb").write(payload)
        final_path, out_name, err = batch_glb._finalize_output(temp_path, "dup", out, False)
        assert final_path is None
        assert "输出已存在" in (err or "")
        assert out_name
        leftovers = [n for n in os.listdir(out) if n.startswith(".tmp_")]
        assert leftovers == [], leftovers
        assert os.path.isfile(existing)
    print("[batch_glb_finalize.test] PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

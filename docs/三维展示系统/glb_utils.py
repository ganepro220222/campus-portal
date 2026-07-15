"""
GLB 资产处理公共工具（供 obj2glb.py / batch_glb.py 复用）
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import struct
from typing import Any

try:
    import numpy as np
    import trimesh
    from PIL import Image
except ImportError as e:
    raise SystemExit("缺少依赖，请执行：pip install trimesh pillow numpy") from e

# 统一归一化目标：最长边缩放到此长度（单位与模型一致）
TARGET_SIZE = 3.0

RISKY_EXTENSIONS = {
    "KHR_draco_mesh_compression",
    "EXT_meshopt_compression",
}


def file_sha1(path: str) -> str:
    digest = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_glb_json(path: str) -> dict | None:
    """读取 GLB 的 JSON 块。失败返回 None。"""
    try:
        with open(path, "rb") as f:
            head = f.read(12)
            if len(head) < 12:
                return None
            magic, version, _ = struct.unpack("<4sII", head)
            if magic != b"glTF" or version != 2:
                return None

            chunk_head = f.read(8)
            if len(chunk_head) < 8:
                return None
            length, ctype = struct.unpack("<I4s", chunk_head)
            if ctype.decode(errors="ignore").strip("\x00") != "JSON":
                return None
            return json.loads(f.read(length).decode("utf-8"))
    except Exception:
        return None


def glb_stats(path: str) -> dict | None:
    """统计 GLB 关键信息，并收集入库前 warnings。"""
    gltf = read_glb_json(path)
    if not gltf:
        return None

    images = gltf.get("images", [])
    buffers = gltf.get("buffers", [])
    extensions = gltf.get("extensionsUsed", []) or []

    embedded_images = all("bufferView" in img for img in images) if images else True
    external_buffers = any("uri" in buf for buf in buffers)

    warnings: list[str] = []
    if not embedded_images:
        warnings.append("贴图外链")
    if external_buffers:
        warnings.append("buffer外链")
    for ext in extensions:
        if ext in RISKY_EXTENSIONS:
            warnings.append(f"扩展:{ext}")

    return {
        "meshes": len(gltf.get("meshes", [])),
        "materials": len(gltf.get("materials", [])),
        "images": len(images),
        "embedded": embedded_images and not external_buffers,
        "extensions": extensions,
        "warnings": warnings,
    }


def has_alpha(image: Image.Image) -> bool:
    if image.mode in ("RGBA", "LA"):
        return True
    if image.mode == "P" and "transparency" in image.info:
        return True
    return False


def optimize_texture(
    scene,
    max_size: int | None = None,
    quality: int = 85,
    texture_format: str = "auto",
    reencode: bool = True,
) -> list[str]:
    """
    优化场景贴图。

    texture_format: auto | jpeg | png
    reencode=False 时仅按需缩放，保留原编码（适合已调好的 PBR 贴图）。
    返回每条贴图的处理说明，写入 manifest 备注。
    """
    notes: list[str] = []
    for geom_name, geom in scene.geometry.items():
        material = getattr(geom.visual, "material", None)
        if material is None:
            continue
        image = getattr(material, "image", None)
        if image is None:
            continue

        w, h = image.size
        if max_size and max(w, h) > max_size:
            ratio = max_size / max(w, h)
            image = image.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
            notes.append(f"{geom_name}:缩放至{image.size[0]}x{image.size[1]}")

        if not reencode:
            material.image = image
            notes.append(f"{geom_name}:保留原编码")
            continue

        fmt = texture_format
        if fmt == "auto":
            fmt = "png" if has_alpha(image) else "jpeg"

        buf = io.BytesIO()
        if fmt == "jpeg":
            image.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
            note = f"{geom_name}:JPEG(q={quality})"
        else:
            image.save(buf, format="PNG", optimize=True)
            note = f"{geom_name}:PNG"
        buf.seek(0)
        material.image = Image.open(buf)
        notes.append(note)

    return notes


def compute_transform(path: str, target_size: float = TARGET_SIZE) -> dict | None:
    """
    计算归一化参数。

    策略（与实施方案一致）：
    - offsetX/Y/Z：几何中心归零，适合绕中心旋转（H5 / XR-FRAME 默认）
    - floorOffsetY：底面 Y 对齐到 0，适合“放在展台/地面”展示（可选）
    """
    try:
        scene = trimesh.load(path, force="scene")
        bounds = scene.bounds
        if bounds is None:
            return None

        size = bounds[1] - bounds[0]
        center = (bounds[1] + bounds[0]) / 2.0
        longest = float(np.max(size))
        if longest <= 0:
            return None

        scale = target_size / longest
        return {
            "scale": round(scale, 5),
            "offsetX": round(float(-center[0] * scale), 5),
            "offsetY": round(float(-center[1] * scale), 5),
            "offsetZ": round(float(-center[2] * scale), 5),
            "floorOffsetY": round(float(-bounds[0][1] * scale), 5),
            "rawSize": [round(float(v), 4) for v in size],
            "bboxMin": [round(float(v), 4) for v in bounds[0]],
            "bboxMax": [round(float(v), 4) for v in bounds[1]],
            "recommendedCameraDistance": round(target_size * 2.8, 2),
        }
    except Exception as e:
        raise RuntimeError(f"归一化计算失败：{e}") from e


def build_output_basename(src_path: str, input_root: str) -> str:
    """根据相对路径 + 内容哈希生成唯一输出 basename，避免同名覆盖。"""
    rel = os.path.relpath(src_path, input_root)
    stem = os.path.splitext(rel)[0]
    safe = stem.replace(os.sep, "__").replace(" ", "_")
    digest = file_sha1(src_path)[:8]
    return f"{safe}-{digest}"


def collect_input_files(input_dir: str, recursive: bool = True) -> list[str]:
    """收集 .zip / .glb / .obj 输入文件。"""
    allowed = (".zip", ".glb", ".obj")
    files: list[str] = []
    if recursive:
        for dirpath, _, filenames in os.walk(input_dir):
            for fn in sorted(filenames):
                if fn.lower().endswith(allowed):
                    files.append(os.path.join(dirpath, fn))
    else:
        for fn in sorted(os.listdir(input_dir)):
            if fn.lower().endswith(allowed):
                files.append(os.path.join(input_dir, fn))
    return files

"""
GLB 资产处理公共工具（供 obj2glb.py / batch_glb.py 复用）
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import struct

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

# MTL 中可能引用贴图的前缀
_MTL_MAP_PREFIXES = (
    "map_ka", "map_kd", "map_ks", "map_ke", "map_ns", "map_d", "map_bump",
    "bump", "disp", "decal", "refl",
)


def file_sha1(path: str) -> str:
    digest = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_output_stem(src_path: str, input_root: str) -> str:
    """根据来源相对路径生成安全文件名主干（不含哈希后缀）。"""
    rel = os.path.relpath(src_path, input_root)
    stem = os.path.splitext(rel)[0]
    return stem.replace(os.sep, "__").replace(" ", "_")


def build_output_name_from_glb(stem: str, glb_path: str) -> str:
    """根据最终 GLB 内容哈希生成输出文件名，确保 CDN 缓存随内容变化失效。"""
    digest = file_sha1(glb_path)[:8]
    return f"{stem}-{digest}.glb"


def _resolve_texture_path(mtl_dir: str, map_path: str) -> str | None:
    """将 MTL 中的相对贴图路径解析为绝对路径。"""
    map_path = map_path.strip().strip('"').strip("'")
    if not map_path or map_path.startswith("#"):
        return None
    candidate = os.path.normpath(os.path.join(mtl_dir, map_path.replace("\\", "/")))
    return candidate if os.path.isfile(candidate) else None


def _extract_map_path(line: str) -> str | None:
    """从 MTL map 行提取贴图路径，支持引号路径与 -option 参数。"""
    lower = line.lower().strip()
    if not any(lower.startswith(p) for p in _MTL_MAP_PREFIXES):
        return None
    space = line.find(" ")
    if space < 0:
        return None
    rest = line[space + 1 :].strip()
    if not rest:
        return None

    # 引号包裹路径（可含空格）
    if rest[0] in "\"'":
        quote = rest[0]
        end = rest.find(quote, 1)
        if end > 1:
            return rest[1:end]

    # 无引号：跳过 -option [value] 后，余下整体视为路径
    tokens = rest.split()
    i = 0
    while i < len(tokens):
        if tokens[i].startswith("-"):
            i += 2 if i + 1 < len(tokens) else 1
        else:
            break
    if i >= len(tokens):
        return None
    return " ".join(tokens[i:])


def _textures_from_mtl(mtl_path: str) -> list[str]:
    textures: list[str] = []
    mtl_dir = os.path.dirname(os.path.abspath(mtl_path))
    with open(mtl_path, encoding="utf-8", errors="ignore") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            map_path = _extract_map_path(line)
            if not map_path:
                continue
            resolved = _resolve_texture_path(mtl_dir, map_path)
            if resolved:
                textures.append(resolved)
    return textures


def hash_obj_bundle(obj_path: str) -> str:
    """
    计算 OBJ 资产包内容哈希：纳入 .obj、.mtl 及贴图**文件内容**。
    使用相对 obj 目录的路径作为键（非绝对路径），便于跨机器追溯。
    输出 CDN 文件名仍以 glbSha1 为准。
    """
    obj_abs = os.path.abspath(obj_path)
    obj_dir = os.path.dirname(obj_abs)
    bundle_abs: list[str] = [obj_abs]

    with open(obj_abs, encoding="utf-8", errors="ignore") as f:
        for raw in f:
            if raw.lower().startswith("mtllib "):
                mtl_name = raw.split(None, 1)[1].strip().strip('"').strip("'")
                mtl_path = os.path.normpath(os.path.join(obj_dir, mtl_name))
                if os.path.isfile(mtl_path):
                    bundle_abs.append(os.path.abspath(mtl_path))
                    bundle_abs.extend(_textures_from_mtl(mtl_path))

    digest = hashlib.sha1()
    for abs_path in sorted(set(bundle_abs)):
        rel_key = os.path.relpath(abs_path, obj_dir).replace("\\", "/")
        digest.update(rel_key.encode("utf-8"))
        digest.update(file_sha1(abs_path).encode("ascii"))
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
        # 检查是否真有非不透明像素
        if image.mode == "RGBA":
            alpha = image.getchannel("A")
            if alpha.getextrema()[0] < 255:
                return True
            return False
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
    allow_alpha_loss: bool = False,
) -> list[str]:
    """
    优化场景贴图（主要处理 diffuse/baseColor 单图，不覆盖完整 PBR 贴图集）。

    texture_format: auto | jpeg | png
    allow_alpha_loss: 仅当显式 jpeg 且贴图含透明时，为 True 才允许转 RGB 丢 alpha。
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
        elif fmt == "jpeg" and has_alpha(image):
            if allow_alpha_loss:
                notes.append(f"{geom_name}:JPEG丢弃alpha(已确认)")
            else:
                fmt = "png"
                notes.append(f"{geom_name}:有alpha改PNG(未加--allow-alpha-loss)")

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


def compute_transform(path: str, target_size: float = TARGET_SIZE) -> dict:
    """
    计算归一化参数。无法计算时抛出 RuntimeError（空 mesh / 无效 bounds）。

    策略（与实施方案一致）：
    - offsetX/Y/Z：几何中心归零，适合绕中心旋转（H5 / XR-FRAME 默认）
    - floorOffsetY：底面 Y 对齐到 0，适合“放在展台/地面”展示（可选）
    """
    try:
        scene = trimesh.load(path, force="scene")
        bounds = scene.bounds
        if bounds is None:
            raise RuntimeError("无法计算包围盒 / 模型为空")

        size = bounds[1] - bounds[0]
        center = (bounds[1] + bounds[0]) / 2.0
        longest = float(np.max(size))
        if longest <= 0:
            raise RuntimeError("无法计算包围盒 / 模型尺度无效")

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
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"归一化计算失败：{e}") from e


def collect_input_files(
    input_dir: str,
    recursive: bool = True,
    exclude_dirs: set[str] | None = None,
) -> list[str]:
    """
    收集 .zip / .glb / .obj 输入文件。
    exclude_dirs: 绝对路径集合，扫描时跳过（用于排除输出目录等）。
    """
    allowed = (".zip", ".glb", ".obj")
    exclude_abs = {os.path.abspath(p) for p in (exclude_dirs or set())}
    input_abs = os.path.abspath(input_dir)
    files: list[str] = []

    if recursive:
        for dirpath, dirnames, filenames in os.walk(input_abs):
            current = os.path.abspath(dirpath)
            # 不进入排除目录
            dirnames[:] = [
                d for d in dirnames
                if os.path.abspath(os.path.join(current, d)) not in exclude_abs
            ]
            if current in exclude_abs:
                continue
            for fn in sorted(filenames):
                if fn.lower().endswith(allowed):
                    files.append(os.path.join(current, fn))
    else:
        for fn in sorted(os.listdir(input_abs)):
            if fn.lower().endswith(allowed):
                files.append(os.path.join(input_abs, fn))

    return files


def output_exclusion_for_input(input_dir: str, output_dir: str) -> set[str]:
    """若输出目录是输入目录的**真子目录**，返回应排除的绝对路径（不含相等情形）。"""
    input_abs = os.path.abspath(input_dir)
    output_abs = os.path.abspath(output_dir)
    if output_abs.startswith(input_abs + os.sep):
        return {output_abs}
    return set()

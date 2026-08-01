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
# 注意 "norm"：PBR 扩展写法的法线贴图键。漏掉它会导致法线贴图既不进资产包哈希
# （换图不换 objBundleSha1），也解析不到法线贴图。
_MTL_MAP_PREFIXES = (
    "map_ka", "map_kd", "map_ks", "map_ke", "map_ns", "map_d", "map_bump",
    "bump", "norm", "disp", "decal", "refl",
)

# MTL 里表示法线/凹凸的键（OBJ 生态没有统一写法，三种都得认）
_MTL_NORMAL_KEYS = ("norm", "map_bump", "bump")

# OBJ/MTL 格式里根本没有「金属度」这个概念。glTF 规范中 metallicFactor 缺省为 1.0，
# 也就是「全金属」——只反射环境、不吃漫反射，在偏暗环境里直接发黑。
# 因此从 OBJ 转出来的资产必须显式写 0，这是唯一诚实的默认值。
OBJ_DEFAULT_METALLIC = 0.0
# MTL 无 Ns 时给一个器物类常见的粗糙度，避免落到规范默认的 1.0（完全无高光）
OBJ_FALLBACK_ROUGHNESS = 0.6


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


def _parse_mtllib_names(line: str) -> list[str]:
    """解析 mtllib 行，支持同行多个文件名与引号路径。"""
    lower = line.lower()
    if not lower.startswith("mtllib "):
        return []
    rest = line.split(None, 1)[1].strip() if len(line.split(None, 1)) > 1 else ""
    if not rest:
        return []
    names: list[str] = []
    i = 0
    while i < len(rest):
        ch = rest[i]
        if ch in "\"'":
            end = rest.find(ch, i + 1)
            if end <= i:
                break
            names.append(rest[i + 1:end])
            i = end + 1
        elif ch.isspace():
            i += 1
        else:
            j = i
            while j < len(rest) and not rest[j].isspace():
                j += 1
            names.append(rest[i:j].strip('"').strip("'"))
            i = j
    return [n for n in names if n]


def find_mtls_for_obj(obj_path: str) -> list[str]:
    """读取 OBJ 的全部 mtllib 指令，按声明顺序返回存在的 .mtl 绝对路径（去重）。"""
    obj_abs = os.path.abspath(obj_path)
    obj_dir = os.path.dirname(obj_abs)
    found: list[str] = []
    seen: set[str] = set()
    try:
        with open(obj_abs, encoding="utf-8", errors="ignore") as f:
            for raw in f:
                if raw.lower().startswith("mtllib "):
                    for name in _parse_mtllib_names(raw):
                        path = os.path.normpath(os.path.join(obj_dir, name))
                        if os.path.isfile(path):
                            abs_path = os.path.abspath(path)
                            if abs_path not in seen:
                                seen.add(abs_path)
                                found.append(abs_path)
    except OSError:
        return []
    return found


def find_mtl_for_obj(obj_path: str) -> str | None:
    """读取 OBJ 的 mtllib 指令，返回第一个存在的 .mtl 绝对路径。"""
    mtls = find_mtls_for_obj(obj_path)
    return mtls[0] if mtls else None


def parse_obj_normal_maps(obj_path: str) -> dict[str, str]:
    """合并 OBJ 引用的全部 MTL 中的法线/凹凸贴图；同名材质以后声明的为准。"""
    merged: dict[str, str] = {}
    for mtl_path in find_mtls_for_obj(obj_path):
        merged.update(parse_mtl_normal_maps(mtl_path))
    return merged


def parse_mtl_normal_maps(mtl_path: str) -> dict[str, str]:
    """
    解析 MTL，按材质名返回法线/凹凸贴图的绝对路径 {材质名: 贴图路径}。
    trimesh 只会带走 diffuse，这些图不接手动接就会被静默丢弃。
    """
    result: dict[str, str] = {}
    if not mtl_path or not os.path.isfile(mtl_path):
        return result
    mtl_dir = os.path.dirname(os.path.abspath(mtl_path))
    current = ""
    with open(mtl_path, encoding="utf-8", errors="ignore") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            lower = line.lower()
            if lower.startswith("newmtl "):
                current = line.split(None, 1)[1].strip()
                continue
            key = lower.split(None, 1)[0] if " " in lower else lower
            if key not in _MTL_NORMAL_KEYS:
                continue
            map_path = _extract_map_path(line)
            if not map_path:
                continue
            resolved = _resolve_texture_path(mtl_dir, map_path)
            # 同一材质出现多次时，norm 优先于 bump（前者是真法线图）
            if resolved and (current not in result or key == "norm"):
                result[current] = resolved
    return result


def obj_declares_normals(obj_path: str) -> bool:
    """
    源 OBJ 是否自带顶点法线（vn）。
    没有 vn 时平滑组（s）信息无法还原，必须由我们生成法线，
    否则 glTF 规范要求按面法线渲染，圆润器物会变成多面体。
    """
    try:
        with open(obj_path, encoding="utf-8", errors="ignore") as f:
            for raw in f:
                if raw.startswith("vn ") or raw.startswith("vn\t"):
                    return True
    except OSError:
        return False
    return False


def hash_obj_bundle(obj_path: str) -> str:
    """
    计算 OBJ 资产包内容哈希：纳入 .obj、.mtl 及贴图**文件内容**。
    使用相对 obj 目录的路径作为键（非绝对路径），便于跨机器追溯。
    输出 CDN 文件名仍以 glbSha1 为准。
    """
    obj_abs = os.path.abspath(obj_path)
    obj_dir = os.path.dirname(obj_abs)
    bundle_abs: list[str] = [obj_abs]

    for mtl_path in find_mtls_for_obj(obj_abs):
        bundle_abs.append(mtl_path)
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


def ensure_scene_normals(scene, mode: str = "auto", source_has_vn: bool = True) -> list[str]:
    """
    保证导出的 GLB 带 NORMAL 属性。

    trimesh 只有在顶点法线**已被计算过**时才会写入 NORMAL；源 OBJ 无 vn 时
    默认导出只有 POSITION/TEXCOORD_0，按 glTF 规范只能按面法线渲染 → 圆润器物变多面体。

    mode: auto（有 vn 就沿用，没有则生成平滑法线）/ smooth（强制平滑）/ flat（强制硬边）
    """
    notes: list[str] = []
    for name, geom in scene.geometry.items():
        if not hasattr(geom, "vertices") or not hasattr(geom, "faces"):
            continue
        try:
            if mode == "flat":
                geom.unmerge_vertices()          # 拆开共享顶点，得到真正的硬边
                _ = geom.vertex_normals
                notes.append(f"{name}:硬边法线")
            elif mode == "smooth" or not source_has_vn:
                _ = geom.vertex_normals          # 触发计算并入缓存，导出才会带 NORMAL
                notes.append(
                    f"{name}:{'强制' if mode == 'smooth' else '源文件无 vn，已'}生成平滑法线"
                )
            else:
                _ = geom.vertex_normals          # 沿用源法线，同样需要触发缓存
        except Exception as e:                    # 退化网格等极端情况不应中断转换
            notes.append(f"{name}:法线生成失败（{e}），将按面法线渲染")
    return notes


def _fit_normal_map(image, max_size: int | None):
    """法线贴图只缩放、绝不转 JPEG：有损压缩会在法线上产生明显块状伪影。"""
    w, h = image.size
    if max_size and max(w, h) > max_size:
        ratio = max_size / max(w, h)
        image = image.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    return image.convert("RGB")


def upgrade_materials_to_pbr(
    scene,
    normal_maps: dict[str, str] | None = None,
    metallic: float = OBJ_DEFAULT_METALLIC,
    roughness: float | None = None,
    double_sided: bool | None = None,
    max_texture: int | None = None,
) -> list[str]:
    """
    把 OBJ 带来的 SimpleMaterial 升级为显式 PBR 材质：

    1. 显式写 metallicFactor（默认 0）——不写的话 glTF 规范按 1.0 处理，模型会发黑
    2. roughnessFactor 缺失时补一个合理值，避免落到规范默认的 1.0
    3. 把 MTL 里的法线/凹凸贴图挂上 normalTexture（trimesh 默认只带 diffuse）

    须在 optimize_texture 之后调用：后者写的是 SimpleMaterial.image，
    to_pbr() 正是从该字段取 baseColorTexture。
    """
    from trimesh.visual.material import PBRMaterial

    normal_maps = normal_maps or {}
    notes: list[str] = []
    for geom_name, geom in scene.geometry.items():
        visual = getattr(geom, "visual", None)
        material = getattr(visual, "material", None)
        if visual is None or material is None:
            continue

        mat_name = getattr(material, "name", None) or ""
        if isinstance(material, PBRMaterial):
            pbr = material
        elif hasattr(material, "to_pbr"):
            pbr = material.to_pbr()
        else:
            pbr = PBRMaterial(name=mat_name)
        if mat_name and not getattr(pbr, "name", None):
            pbr.name = mat_name

        before = pbr.metallicFactor
        pbr.metallicFactor = float(metallic)
        if before is None:
            notes.append(f"{geom_name}:补写 metallicFactor={metallic}（原缺失＝规范默认 1.0 全金属）")
        elif abs(float(before) - float(metallic)) > 1e-6:
            notes.append(f"{geom_name}:metallicFactor {before}→{metallic}")

        if roughness is not None:
            pbr.roughnessFactor = float(roughness)
        elif pbr.roughnessFactor is None:
            pbr.roughnessFactor = OBJ_FALLBACK_ROUGHNESS
            notes.append(f"{geom_name}:补写 roughnessFactor={OBJ_FALLBACK_ROUGHNESS}（MTL 无 Ns）")

        # 法线贴图：按材质名匹配，只有一个材质时允许唯一兜底
        src = normal_maps.get(mat_name)
        if src is None and len(normal_maps) == 1 and len(scene.geometry) == 1:
            src = next(iter(normal_maps.values()))
        if src and getattr(pbr, "normalTexture", None) is None:
            try:
                pbr.normalTexture = _fit_normal_map(Image.open(src), max_texture)
                notes.append(f"{geom_name}:挂上法线贴图 {os.path.basename(src)}")
            except Exception as e:
                notes.append(f"{geom_name}:法线贴图读取失败（{e}），已跳过")

        if double_sided is not None:
            pbr.doubleSided = bool(double_sided)

        visual.material = pbr
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


def audit_gltf(gltf: dict) -> dict:
    """
    资产体检（纯函数，只看 glTF JSON）。
    返回 {'issues': [...], 'info': {...}}，issues 每项含 level/code/text。
    level: error＝观感一定出问题；warn＝多半有问题；note＝提示。
    """
    issues: list[dict] = []
    materials = gltf.get("materials", []) or []
    meshes = gltf.get("meshes", []) or []
    accessors = gltf.get("accessors", []) or []
    images = gltf.get("images", []) or []

    def add(level, code, text):
        issues.append({"level": level, "code": code, "text": text})

    # ── 材质 ──
    metal_bad, rough_missing, no_normal_tex = [], [], []
    for i, m in enumerate(materials):
        label = m.get("name") or f"#{i}"
        pbr = m.get("pbrMetallicRoughness", {}) or {}
        metal = pbr.get("metallicFactor")
        if metal is None:
            metal_bad.append(f"{label}(缺省=1.0)")
        elif metal > 0.6 and "metallicRoughnessTexture" not in pbr:
            metal_bad.append(f"{label}({metal})")
        if pbr.get("roughnessFactor") is None and "metallicRoughnessTexture" not in pbr:
            rough_missing.append(label)
        if "normalTexture" not in m:
            no_normal_tex.append(label)
    if metal_bad:
        add("error", "metallic",
            f"金属度过高或缺省：{', '.join(metal_bad)}。金属材质只反射环境，"
            f"在偏暗环境里会发黑——加多少灯都救不回来。用 --fix 修复或重新转换。")
    if rough_missing:
        add("warn", "roughness",
            f"缺 roughnessFactor：{', '.join(rough_missing)}（规范默认 1.0＝完全无高光，表面会发闷）")

    # ── 几何 ──
    tris = verts = 0
    prim_total = no_normal = no_uv = 0
    for mesh in meshes:
        for prim in mesh.get("primitives", []) or []:
            prim_total += 1
            attrs = prim.get("attributes", {}) or {}
            if "NORMAL" not in attrs:
                no_normal += 1
            if "TEXCOORD_0" not in attrs:
                no_uv += 1
            if "indices" in prim and prim["indices"] < len(accessors):
                tris += accessors[prim["indices"]].get("count", 0) // 3
            elif "POSITION" in attrs and attrs["POSITION"] < len(accessors):
                tris += accessors[attrs["POSITION"]].get("count", 0) // 3
            if "POSITION" in attrs and attrs["POSITION"] < len(accessors):
                verts += accessors[attrs["POSITION"]].get("count", 0)
    if no_normal:
        add("error", "normal",
            f"{no_normal}/{prim_total} 个网格没有法线（NORMAL）。按 glTF 规范只能按面法线渲染，"
            f"圆润器物会变成多面体。须用带 vn 的源文件重新转换。")
    if no_uv and images:
        add("warn", "uv", f"{no_uv}/{prim_total} 个网格没有 UV，但文件里有贴图——贴图不会显示")
    if tris > 500_000:
        add("warn", "tris", f"三角面 {tris:,} 偏多，移动端可能卡顿（建议减面到 30 万以内）")

    # ── 打包完整性 ──
    if any("uri" in b for b in gltf.get("buffers", []) or []):
        add("error", "buffer", "buffer 外链，模型无法独立分发")
    if images and not all("bufferView" in im for im in images):
        add("error", "image", "贴图外链，模型无法独立分发")
    for ext in gltf.get("extensionsUsed", []) or []:
        if ext in RISKY_EXTENSIONS:
            add("note", "ext", f"使用了扩展 {ext}，播放器已内置解码器，可正常显示")
    if not images:
        add("note", "notex", "没有贴图，模型将只有纯色")
    elif no_normal_tex and len(no_normal_tex) == len(materials):
        add("note", "nonormaltex", "没有法线贴图，表面细节（浮雕/錾刻/木纹）会偏平")

    return {
        "issues": issues,
        "info": {
            "materials": len(materials), "meshes": len(meshes), "primitives": prim_total,
            "images": len(images), "triangles": tris, "vertices": verts,
        },
    }


def audit_glb_file(path: str) -> dict | None:
    gltf = read_glb_json(path)
    return audit_gltf(gltf) if gltf else None


def format_audit(report: dict) -> str:
    """把体检结果排成给人看的文本，错误在前。"""
    icon = {"error": "✗", "warn": "!", "note": "·"}
    order = {"error": 0, "warn": 1, "note": 2}
    info = report["info"]
    lines = [
        f"  网格 {info['meshes']} · 材质 {info['materials']} · 贴图 {info['images']}"
        f" · 三角面 {info['triangles']:,} · 顶点 {info['vertices']:,}"
    ]
    issues = sorted(report["issues"], key=lambda x: order.get(x["level"], 9))
    if not issues:
        lines.append("  ✓ 未发现问题")
    for it in issues:
        lines.append(f"  {icon.get(it['level'], '·')} {it['text']}")
    return "\n".join(lines)


def patch_gltf_materials(gltf: dict, metallic: float = OBJ_DEFAULT_METALLIC) -> tuple[dict, list[str]]:
    """
    只改 JSON、不动二进制的无损修复：给缺失/过高的 metallicFactor 写上正确值，
    顺带补 roughnessFactor。用于抢救已经转好的 GLB（无需回头找原始 OBJ）。
    法线缺失无法在此修复——那需要重新转换，体检报告会说明。
    """
    notes: list[str] = []
    for i, m in enumerate(gltf.get("materials", []) or []):
        label = m.get("name") or f"#{i}"
        pbr = m.setdefault("pbrMetallicRoughness", {})
        if "metallicRoughnessTexture" in pbr:
            continue                                   # 有金属度贴图，说明是正经 PBR 资产，别动
        old = pbr.get("metallicFactor")
        if old is None or old > 0.6:
            pbr["metallicFactor"] = float(metallic)
            notes.append(f"{label}:metallicFactor {'缺省(1.0)' if old is None else old}→{metallic}")
        if pbr.get("roughnessFactor") is None:
            pbr["roughnessFactor"] = OBJ_FALLBACK_ROUGHNESS
            notes.append(f"{label}:补写 roughnessFactor={OBJ_FALLBACK_ROUGHNESS}")
    return gltf, notes


def read_glb(path: str) -> tuple[dict, bytes] | None:
    """读出 GLB 的 JSON 块与 BIN 块。"""
    with open(path, "rb") as f:
        data = f.read()
    if len(data) < 20 or data[:4] != b"glTF":
        return None
    version, total = struct.unpack("<II", data[4:12])
    if version != 2 or total > len(data):
        return None
    offset, gltf, binary = 12, None, b""
    while offset + 8 <= len(data):
        length, ctype = struct.unpack("<I4s", data[offset:offset + 8])
        body = data[offset + 8:offset + 8 + length]
        if len(body) < length:
            return None
        kind = ctype.decode("ascii", errors="ignore").strip("\x00")
        if kind == "JSON":
            try:
                gltf = json.loads(body.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                return None
        elif kind == "BIN":
            binary = body
        offset += 8 + length
    return (gltf, binary) if gltf is not None else None


def write_glb(path: str, gltf: dict, binary: bytes) -> None:
    """按 glTF 2.0 规范写回 GLB：两个块各自 4 字节对齐，JSON 补空格、BIN 补 0。"""
    json_bytes = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    bin_bytes = binary + b"\x00" * ((4 - len(binary) % 4) % 4) if binary else b""

    total = 12 + 8 + len(json_bytes) + (8 + len(bin_bytes) if bin_bytes else 0)
    out = bytearray()
    out += struct.pack("<4sII", b"glTF", 2, total)
    out += struct.pack("<I4s", len(json_bytes), b"JSON") + json_bytes
    if bin_bytes:
        out += struct.pack("<I4s", len(bin_bytes), b"BIN\x00") + bin_bytes
    with open(path, "wb") as f:
        f.write(bytes(out))


def fix_glb_file(src: str, dst: str | None = None, metallic: float = OBJ_DEFAULT_METALLIC) -> tuple[bool, list[str]]:
    """就地（或另存）修复一个已有的 GLB。返回 (是否有改动, 说明)。"""
    parsed = read_glb(src)
    if parsed is None:
        return False, ["不是有效的 GLB 2.0 文件"]
    gltf, binary = parsed
    gltf, notes = patch_gltf_materials(gltf, metallic=metallic)
    if not notes:
        return False, ["无需修复"]
    write_glb(dst or src, gltf, binary)
    return True, notes


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

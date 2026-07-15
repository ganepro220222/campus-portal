"""
工艺品三维模型 · 批量处理工具

支持三类输入，自动识别：
  1. 离线包 zip      → 直接提取内部现成的 GLB（无需转换，最快）
  2. 现成的 .glb     → 直接使用
  3. .obj + .mtl + 贴图 → 转换为 GLB

处理完成后统一输出：
  - 归一化的 GLB 文件
  - manifest.csv：包含每个模型的缩放/居中参数，可直接导入数据库

依赖：pip install trimesh pillow numpy

用法：
  python batch_glb.py 输入目录 -o 输出目录
  python batch_glb.py 输入目录 -o 输出目录 --max-texture 2048
"""

import argparse
import csv
import io
import json
import os
import shutil
import struct
import sys
import zipfile

try:
    import numpy as np
    import trimesh
    from PIL import Image
except ImportError:
    print("缺少依赖，请执行：pip install trimesh pillow numpy")
    sys.exit(1)


# 统一归一化目标：所有模型缩放到这个高度，保证展示时大小一致
TARGET_SIZE = 3.0


# ══════════════════════════════════════════════════════════
# GLB 解析与校验
# ══════════════════════════════════════════════════════════

def read_glb_json(path):
    """读取 GLB 的 JSON 块，用于校验和统计。失败返回 None"""
    try:
        with open(path, "rb") as f:
            head = f.read(12)
            if len(head) < 12:
                return None
            magic, _, _ = struct.unpack("<4sII", head)
            if magic != b"glTF":
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


def glb_stats(path):
    """统计 GLB 的关键信息"""
    gltf = read_glb_json(path)
    if not gltf:
        return None

    images = gltf.get("images", [])
    embedded = all("bufferView" in img for img in images) if images else True

    return {
        "meshes": len(gltf.get("meshes", [])),
        "materials": len(gltf.get("materials", [])),
        "images": len(images),
        "embedded": embedded,   # 贴图是否内嵌（外链会导致线上加载失败）
        "extensions": gltf.get("extensionsUsed", []),
    }


# ══════════════════════════════════════════════════════════
# 归一化：计算缩放与居中偏移
# ══════════════════════════════════════════════════════════

def compute_transform(path):
    """
    加载模型计算包围盒，得出统一展示所需的缩放与偏移。
    这两个值存入数据库，前端加载时套用，保证所有工艺品大小一致、居中摆放。
    """
    try:
        scene = trimesh.load(path, force="scene")
        bounds = scene.bounds  # [[minX,minY,minZ], [maxX,maxY,maxZ]]
        if bounds is None:
            return None

        size = bounds[1] - bounds[0]
        center = (bounds[1] + bounds[0]) / 2.0
        longest = float(np.max(size))
        if longest <= 0:
            return None

        scale = TARGET_SIZE / longest

        return {
            "scale": round(scale, 5),
            # 缩放后把几何中心移到原点，Y 轴另外抬到底面贴合地面
            "offsetX": round(float(-center[0] * scale), 5),
            "offsetY": round(float(-center[1] * scale), 5),
            "offsetZ": round(float(-center[2] * scale), 5),
            "rawSize": [round(float(v), 4) for v in size],
        }
    except Exception as e:
        print(f"      归一化计算失败：{e}")
        return None


# ══════════════════════════════════════════════════════════
# 输入类型一：离线包 zip → 提取内部 GLB
# ══════════════════════════════════════════════════════════

def extract_glb_from_zip(zip_path, out_path):
    """
    从第三方离线包中提取现成的 GLB。
    包内通常有多个 GLB（不同清晰度），取体积最大的那个（质量最好）。
    """
    try:
        with zipfile.ZipFile(zip_path) as zf:
            candidates = [
                info for info in zf.infolist()
                if info.filename.lower().endswith(".glb") and info.file_size > 0
            ]
            if not candidates:
                return None, "包内未找到 GLB"

            # 取最大的，通常是主模型（小的可能是低模或缩略预览）
            best = max(candidates, key=lambda i: i.file_size)

            with zf.open(best) as src, open(out_path, "wb") as dst:
                shutil.copyfileobj(src, dst)

            return best.filename, None
    except Exception as e:
        return None, str(e)


# ══════════════════════════════════════════════════════════
# 输入类型三：OBJ → GLB 转换
# ══════════════════════════════════════════════════════════

def optimize_texture(scene, max_size, quality=85):
    """
    缩放贴图并以 JPEG 重新编码。

    注意：缩放后必须显式重编码为 JPEG。若交由导出器处理，
    它会存成无损 PNG，体积反而远大于原始 JPEG 贴图。
    """
    for _, geom in scene.geometry.items():
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

        buf = io.BytesIO()
        image.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
        buf.seek(0)
        material.image = Image.open(buf)


def convert_obj(obj_path, out_path, max_texture=None):
    """OBJ + MTL + 贴图 → 自包含 GLB"""
    try:
        scene = trimesh.load(obj_path, force="scene")
        optimize_texture(scene, max_texture)
        scene.export(out_path)
        return None
    except Exception as e:
        return str(e)


# ══════════════════════════════════════════════════════════
# 主流程
# ══════════════════════════════════════════════════════════

def process_one(src_path, out_dir, max_texture):
    """处理单个输入，返回结果字典"""
    name = os.path.splitext(os.path.basename(src_path))[0]
    ext = os.path.splitext(src_path)[1].lower()
    out_path = os.path.join(out_dir, f"{name}.glb")

    result = {
        "名称": name,
        "来源文件": os.path.basename(src_path),
        "处理方式": "",
        "GLB文件": f"{name}.glb",
        "体积MB": "",
        "网格数": "",
        "材质数": "",
        "贴图内嵌": "",
        "scale": "",
        "offsetX": "",
        "offsetY": "",
        "offsetZ": "",
        "状态": "",
        "备注": "",
    }

    # ── 分派处理方式 ──
    if ext == ".zip":
        inner, err = extract_glb_from_zip(src_path, out_path)
        if err:
            result["状态"] = "失败"
            result["备注"] = err
            return result
        result["处理方式"] = "从离线包提取"
        result["备注"] = f"内部路径 {inner}"

    elif ext == ".glb":
        shutil.copy(src_path, out_path)
        result["处理方式"] = "直接使用"

    elif ext == ".obj":
        err = convert_obj(src_path, out_path, max_texture)
        if err:
            result["状态"] = "失败"
            result["备注"] = err
            return result
        result["处理方式"] = "OBJ 转换"

    else:
        result["状态"] = "跳过"
        result["备注"] = f"不支持的格式 {ext}"
        return result

    # ── 校验 GLB ──
    stats = glb_stats(out_path)
    if not stats:
        result["状态"] = "失败"
        result["备注"] = "GLB 格式校验不通过"
        return result

    result["网格数"] = stats["meshes"]
    result["材质数"] = stats["materials"]
    result["贴图内嵌"] = "是" if stats["embedded"] else "否（外链，需修复）"
    result["体积MB"] = round(os.path.getsize(out_path) / 1024 / 1024, 2)

    if stats["extensions"]:
        result["备注"] += f" | 扩展: {','.join(stats['extensions'])}"

    # ── 计算归一化参数 ──
    tf = compute_transform(out_path)
    if tf:
        result["scale"] = tf["scale"]
        result["offsetX"] = tf["offsetX"]
        result["offsetY"] = tf["offsetY"]
        result["offsetZ"] = tf["offsetZ"]
        result["状态"] = "成功"
    else:
        result["状态"] = "成功（归一化失败，需手动调整）"

    return result


def main():
    parser = argparse.ArgumentParser(description="工艺品三维模型批量处理")
    parser.add_argument("input", help="输入目录（放 zip / glb / obj 文件）")
    parser.add_argument("-o", "--output", default="output_glb", help="输出目录")
    parser.add_argument("-m", "--max-texture", type=int, default=None,
                        help="贴图最大边长（仅对 OBJ 转换生效），建议 2048")
    args = parser.parse_args()

    if not os.path.isdir(args.input):
        print(f"输入目录不存在：{args.input}")
        sys.exit(1)

    os.makedirs(args.output, exist_ok=True)

    # 收集待处理文件
    files = []
    for fn in sorted(os.listdir(args.input)):
        if fn.lower().endswith((".zip", ".glb", ".obj")):
            files.append(os.path.join(args.input, fn))

    if not files:
        print("未找到可处理的文件（支持 .zip / .glb / .obj）")
        sys.exit(1)

    print(f"发现 {len(files)} 个待处理文件\n")

    results = []
    ok = fail = 0

    for i, path in enumerate(files, 1):
        fname = os.path.basename(path)
        print(f"[{i}/{len(files)}] {fname}")

        r = process_one(path, args.output, args.max_texture)
        results.append(r)

        if r["状态"].startswith("成功"):
            ok += 1
            print(f"      ✓ {r['处理方式']} · {r['体积MB']}MB · "
                  f"缩放 {r['scale']} · 贴图内嵌 {r['贴图内嵌']}")
        else:
            fail += 1
            print(f"      ✗ {r['状态']}：{r['备注']}")

    # ── 输出清单 ──
    manifest = os.path.join(args.output, "manifest.csv")
    with open(manifest, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)

    print(f"\n{'='*52}")
    print(f"完成：成功 {ok} 个，失败 {fail} 个")
    print(f"GLB 输出目录：{args.output}/")
    print(f"清单文件：{manifest}")
    print(f"\n清单中的 scale / offsetX / offsetY / offsetZ 四列可直接导入数据库 transform_json 字段。")


if __name__ == "__main__":
    main()

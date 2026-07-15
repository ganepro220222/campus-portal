"""
工艺品三维模型 · 批量处理工具

支持三类输入，自动识别：
  1. 离线包 zip      → 提取内部 GLB（多候选时取最大并 warning）
  2. 现成的 .glb     → 校验后复制
  3. .obj + .mtl + 贴图 → 转换为自包含 GLB

不支持 FBX；FBX 请先用 Blender 导出为 GLB/OBJ。

依赖：pip install trimesh pillow numpy

用法：
  python batch_glb.py 输入目录 -o 输出目录
  python batch_glb.py 输入目录 -o 输出目录 --recursive --max-texture 2048
  python batch_glb.py 输入目录 -o 输出目录 --texture-format auto --no-reencode
"""
from __future__ import annotations

import argparse
import csv
import os
import shutil
import sys
import zipfile

from glb_utils import (
    build_output_basename,
    collect_input_files,
    compute_transform,
    file_sha1,
    glb_stats,
    optimize_texture,
)

try:
    import trimesh
except ImportError:
    print("缺少依赖，请执行：pip install trimesh pillow numpy")
    sys.exit(1)


def extract_glb_from_zip(zip_path: str, out_path: str) -> tuple[str | None, str | None, str | None]:
    """
    从 zip 提取 GLB。返回 (内部路径, warning, error)。
    多 GLB 时取体积最大者，并给出 warning。
    """
    try:
        with zipfile.ZipFile(zip_path) as zf:
            candidates = [
                info for info in zf.infolist()
                if info.filename.lower().endswith(".glb") and info.file_size > 0
            ]
            if not candidates:
                return None, None, "包内未找到 GLB"

            best = max(candidates, key=lambda i: i.file_size)
            warning = None
            if len(candidates) > 1:
                names = ", ".join(c.filename for c in sorted(candidates, key=lambda i: -i.file_size)[:3])
                warning = f"包内含 {len(candidates)} 个 GLB，已取最大：{best.filename}（候选：{names}）"

            with zf.open(best) as src, open(out_path, "wb") as dst:
                shutil.copyfileobj(src, dst)

            return best.filename, warning, None
    except Exception as e:
        return None, None, str(e)


def convert_obj(
    obj_path: str,
    out_path: str,
    max_texture: int | None,
    quality: int,
    texture_format: str,
    reencode: bool,
) -> tuple[str | None, list[str]]:
    try:
        scene = trimesh.load(obj_path, force="scene")
        notes = optimize_texture(
            scene,
            max_size=max_texture,
            quality=quality,
            texture_format=texture_format,
            reencode=reencode,
        )
        scene.export(out_path)
        return None, notes
    except Exception as e:
        return str(e), []


def process_one(
    src_path: str,
    input_root: str,
    out_dir: str,
    max_texture: int | None,
    quality: int,
    texture_format: str,
    reencode: bool,
    overwrite: bool,
) -> dict:
    ext = os.path.splitext(src_path)[1].lower()
    rel_path = os.path.relpath(src_path, input_root)
    base = build_output_basename(src_path, input_root)
    out_name = f"{base}.glb"
    out_path = os.path.join(out_dir, out_name)

    result = {
        "名称": os.path.splitext(os.path.basename(src_path))[0],
        "来源相对路径": rel_path,
        "sha1": file_sha1(src_path),
        "处理方式": "",
        "GLB文件": out_name,
        "体积MB": "",
        "网格数": "",
        "材质数": "",
        "贴图内嵌": "",
        "scale": "",
        "offsetX": "",
        "offsetY": "",
        "offsetZ": "",
        "floorOffsetY": "",
        "状态": "",
        "备注": "",
    }

    if os.path.exists(out_path) and not overwrite:
        result["状态"] = "失败"
        result["备注"] = f"输出已存在：{out_name}（加 --overwrite 覆盖）"
        return result

    texture_notes: list[str] = []

    if ext == ".zip":
        inner, warning, err = extract_glb_from_zip(src_path, out_path)
        if err:
            result["状态"] = "失败"
            result["备注"] = err
            return result
        result["处理方式"] = "从离线包提取"
        result["备注"] = f"内部路径 {inner}"
        if warning:
            result["备注"] += f" | {warning}"

    elif ext == ".glb":
        shutil.copy2(src_path, out_path)
        result["处理方式"] = "直接使用"

    elif ext == ".obj":
        err, texture_notes = convert_obj(
            src_path, out_path, max_texture, quality, texture_format, reencode
        )
        if err:
            result["状态"] = "失败"
            result["备注"] = err
            return result
        result["处理方式"] = "OBJ 转换"
        if texture_notes:
            result["备注"] = "贴图处理：" + "; ".join(texture_notes)

    else:
        result["状态"] = "跳过"
        result["备注"] = f"不支持的格式 {ext}（FBX 请先导出为 GLB/OBJ）"
        return result

    stats = glb_stats(out_path)
    if not stats:
        result["状态"] = "失败"
        result["备注"] = (result["备注"] + " | " if result["备注"] else "") + "GLB 格式校验不通过"
        return result

    result["网格数"] = stats["meshes"]
    result["材质数"] = stats["materials"]
    result["贴图内嵌"] = "是" if stats["embedded"] else "否（外链，需修复）"
    result["体积MB"] = round(os.path.getsize(out_path) / 1024 / 1024, 2)

    extra: list[str] = []
    if stats["extensions"]:
        extra.append("扩展:" + ",".join(stats["extensions"]))
    if stats["warnings"]:
        extra.append("警告:" + ",".join(stats["warnings"]))
    if extra:
        result["备注"] = (result["备注"] + " | " if result["备注"] else "") + "; ".join(extra)

    try:
        tf = compute_transform(out_path)
        result["scale"] = tf["scale"]
        result["offsetX"] = tf["offsetX"]
        result["offsetY"] = tf["offsetY"]
        result["offsetZ"] = tf["offsetZ"]
        result["floorOffsetY"] = tf["floorOffsetY"]
        result["状态"] = "成功"
    except RuntimeError as e:
        result["状态"] = "成功（归一化失败，需手动调整）"
        result["备注"] = (result["备注"] + " | " if result["备注"] else "") + str(e)

    return result


def main():
    parser = argparse.ArgumentParser(description="工艺品三维模型批量处理")
    parser.add_argument("input", help="输入目录（zip / glb / obj）")
    parser.add_argument("-o", "--output", default="output_glb", help="输出目录")
    parser.add_argument("-m", "--max-texture", type=int, default=None,
                        help="贴图最大边长（仅 OBJ 转换），建议 2048")
    parser.add_argument("-q", "--quality", type=int, default=85,
                        help="JPEG 质量 1-100（默认 85）")
    parser.add_argument(
        "--texture-format",
        choices=["auto", "jpeg", "png"],
        default="auto",
        help="贴图重编码格式；auto=有透明通道用 PNG，否则 JPEG（默认 auto）",
    )
    parser.add_argument(
        "--no-reencode",
        action="store_true",
        help="不重编码贴图，仅按需缩放（适合已是 PBR 贴图的 GLB 源）",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        default=True,
        help="递归扫描子目录（默认开启）",
    )
    parser.add_argument(
        "--no-recursive",
        action="store_false",
        dest="recursive",
        help="只扫描输入目录第一层",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="允许覆盖已存在的输出 GLB",
    )
    args = parser.parse_args()

    if not os.path.isdir(args.input):
        print(f"输入目录不存在：{args.input}")
        sys.exit(1)
    if not 1 <= args.quality <= 100:
        print("--quality 必须在 1~100 之间")
        sys.exit(1)

    os.makedirs(args.output, exist_ok=True)
    files = collect_input_files(args.input, recursive=args.recursive)
    if not files:
        print("未找到可处理的文件（支持 .zip / .glb / .obj；FBX 请先导出）")
        sys.exit(1)

    print(f"发现 {len(files)} 个待处理文件（recursive={args.recursive}）\n")

    results = []
    ok = fail = 0
    for i, path in enumerate(files, 1):
        print(f"[{i}/{len(files)}] {os.path.relpath(path, args.input)}")
        r = process_one(
            path,
            args.input,
            args.output,
            args.max_texture,
            args.quality,
            args.texture_format,
            not args.no_reencode,
            args.overwrite,
        )
        results.append(r)
        if r["状态"].startswith("成功"):
            ok += 1
            print(f"      ✓ {r['处理方式']} → {r['GLB文件']} · {r['体积MB']}MB · scale={r['scale']}")
        else:
            fail += 1
            print(f"      ✗ {r['状态']}：{r['备注']}")

    manifest = os.path.join(args.output, "manifest.csv")
    with open(manifest, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)

    print(f"\n{'=' * 52}")
    print(f"完成：成功 {ok} 个，失败 {fail} 个")
    print(f"GLB 输出目录：{args.output}/")
    print(f"清单文件：{manifest}")
    print("transform_json 建议字段：scale, offsetX, offsetY, offsetZ（中心归零）；"
          "展台模式可用 floorOffsetY。")


if __name__ == "__main__":
    main()

"""
工艺品三维模型 · 批量处理工具

支持三类输入，自动识别：
  1. 离线包 zip      → 提取内部 GLB（多候选时取最大并 warning）
  2. 现成的 .glb     → 校验后复制
  3. .obj + .mtl + 贴图 → 转换为自包含 GLB

不支持 FBX；FBX 请先用 Blender 导出为 GLB/OBJ。

OBJ 转换会自动修正金属度（规范缺省＝全金属→发黑）、补法线（无 vn 时防止变多面体）、
接回 MTL 的法线贴图；直接给进来的 GLB 也会做一次无损材质修复（只改 JSON、不动几何）。
manifest.csv 增加「三角面」「体检」两列，体检不通过的会写明原因。

依赖：pip install trimesh pillow numpy

用法：
  python batch_glb.py 输入目录 -o 输出目录
  python batch_glb.py 输入目录 -o 输出目录 --max-texture 2048
  python batch_glb.py 输入目录 -o 输出目录 --texture-format auto
  python batch_glb.py 输入目录 -o 输出目录 --normals flat   # 硬表面模型
"""
from __future__ import annotations

import argparse
import csv
import os
import shutil
import sys
import tempfile
import zipfile

from input_scan import validate_output_dir

from glb_utils import (
    audit_glb_file,
    build_output_name_from_glb,
    collect_input_files,
    compute_transform,
    ensure_scene_normals,
    file_sha1,
    find_mtl_for_obj,
    fix_glb_file,
    glb_stats,
    hash_obj_bundle,
    obj_declares_normals,
    optimize_texture,
    output_exclusion_for_input,
    parse_obj_normal_maps,
    safe_output_stem,
    safe_relpath,
    upgrade_materials_to_pbr,
)

try:
    import trimesh
except ImportError:
    print("缺少依赖，请执行：pip install trimesh pillow numpy")
    sys.exit(1)


def extract_glb_from_zip(zip_path: str, out_path: str) -> tuple[str | None, str | None, str | None]:
    """从 zip 提取 GLB。返回 (内部路径, warning, error)。"""
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
    allow_alpha_loss: bool,
    normals: str = "auto",
    metallic: float = 0.0,
    keep_normal_map: bool = True,
    double_sided: bool | None = None,
) -> tuple[str | None, list[str]]:
    try:
        scene = trimesh.load(obj_path, force="scene")
        notes = optimize_texture(
            scene,
            max_size=max_texture,
            quality=quality,
            texture_format=texture_format,
            reencode=reencode,
            allow_alpha_loss=allow_alpha_loss,
        )
        # 无 vn 时补法线，否则 GLB 不带 NORMAL，圆润器物会渲染成多面体
        notes += ensure_scene_normals(
            scene, mode=normals, source_has_vn=obj_declares_normals(obj_path)
        )
        # 显式写 metallicFactor（不写＝规范默认全金属），并接回 MTL 的法线贴图
        normal_maps = parse_obj_normal_maps(obj_path) if keep_normal_map else {}
        notes += upgrade_materials_to_pbr(
            scene, normal_maps=normal_maps, metallic=metallic, max_texture=max_texture,
            double_sided=double_sided,
        )
        scene.export(out_path, include_normals=True)
        return None, notes
    except Exception as e:
        return str(e), []


def _finalize_output(
    temp_path: str,
    stem: str,
    out_dir: str,
    overwrite: bool,
) -> tuple[str | None, str | None, str | None]:
    """
    根据临时 GLB 内容哈希确定最终文件名并落盘。
    返回 (final_path, out_name, error)。
    """
    out_name = build_output_name_from_glb(stem, temp_path)
    final_path = os.path.join(out_dir, out_name)

    if os.path.exists(final_path) and not overwrite:
        return None, out_name, f"输出已存在：{out_name}（加 --overwrite 覆盖）"

    shutil.move(temp_path, final_path)
    return final_path, out_name, None


RESULT_FIELDS = [
    "名称",
    "来源相对路径",
    "sourceSha1",
    "objBundleSha1",
    "glbSha1",
    "处理方式",
    "GLB文件",
    "体积MB",
    "网格数",
    "材质数",
    "贴图内嵌",
    "三角面",
    "体检",
    "scale",
    "offsetX",
    "offsetY",
    "offsetZ",
    "floorOffsetY",
    "状态",
    "备注",
]


def empty_result(src_path: str, input_root: str) -> dict:
    """构造固定 schema 的空结果行，供 process_one / main 异常路径共用。"""
    result = {k: "" for k in RESULT_FIELDS}
    result["名称"] = os.path.splitext(os.path.basename(src_path))[0]
    result["来源相对路径"] = safe_relpath(src_path, input_root)
    return result


def process_one(
    src_path: str,
    input_root: str,
    out_dir: str,
    max_texture: int | None,
    quality: int,
    texture_format: str,
    reencode: bool,
    allow_alpha_loss: bool,
    overwrite: bool,
    normals: str = "auto",
    metallic: float = 0.0,
    keep_normal_map: bool = True,
    fix_glb: bool = True,
    double_sided: bool | None = None,
) -> dict:
    result = empty_result(src_path, input_root)
    temp_path = ""
    try:
        ext = os.path.splitext(src_path)[1].lower()
        stem = safe_output_stem(src_path, input_root)
        result["sourceSha1"] = file_sha1(src_path)

        if ext == ".obj":
            try:
                result["objBundleSha1"] = hash_obj_bundle(src_path)
            except Exception as e:
                result["备注"] = f"资产包哈希失败：{e}"

        fd, temp_path = tempfile.mkstemp(suffix=".glb", prefix=".tmp_", dir=out_dir)
        os.close(fd)

        texture_notes: list[str] = []

        if ext == ".zip":
            inner, warning, err = extract_glb_from_zip(src_path, temp_path)
            if err:
                result["状态"] = "失败"
                result["备注"] = err
                return result
            result["处理方式"] = "从离线包提取"
            result["备注"] = f"内部路径 {inner}"
            if warning:
                result["备注"] += f" | {warning}"

        elif ext == ".glb":
            shutil.copy2(src_path, temp_path)
            result["处理方式"] = "原样复制（不压缩贴图）"

        elif ext == ".obj":
            err, texture_notes = convert_obj(
                src_path,
                temp_path,
                max_texture,
                quality,
                texture_format,
                reencode,
                allow_alpha_loss,
                normals,
                metallic,
                keep_normal_map,
                double_sided,
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

        # 直接给进来的 GLB（含离线包里的）也做一次无损修复：只改 JSON，不动几何
        if fix_glb and ext in (".zip", ".glb"):
            changed, fix_notes = fix_glb_file(temp_path, metallic=metallic)
            if fix_notes and fix_notes != ["无需修复"]:
                prefix = "材质修复：" if changed else "材质检查："
                result["备注"] = (result["备注"] + " | " if result["备注"] else "") \
                    + prefix + "; ".join(fix_notes)
            if changed:
                result["处理方式"] += " + 材质修复"

        stats = glb_stats(temp_path)
        if not stats:
            result["状态"] = "失败"
            result["备注"] = (result["备注"] + " | " if result["备注"] else "") + "GLB 格式校验不通过"
            return result

        final_path, out_name, fin_err = _finalize_output(temp_path, stem, out_dir, overwrite)
        temp_path = ""  # 已 move，无需清理
        if fin_err:
            result["状态"] = "失败"
            result["备注"] = fin_err
            result["GLB文件"] = out_name
            return result

        result["GLB文件"] = out_name
        result["glbSha1"] = file_sha1(final_path)
        result["网格数"] = stats["meshes"]
        result["材质数"] = stats["materials"]
        result["贴图内嵌"] = "是" if stats["embedded"] else "否（外链，需修复）"
        result["体积MB"] = round(os.path.getsize(final_path) / 1024 / 1024, 2)

        audit = audit_glb_file(final_path)
        if audit:
            result["三角面"] = audit["info"]["triangles"]
            blockers = [i["text"] for i in audit["issues"] if i["level"] in ("error", "warn")]
            result["体检"] = "；".join(blockers) if blockers else "通过"

        extra: list[str] = []
        if stats["extensions"]:
            extra.append("扩展:" + ",".join(stats["extensions"]))
        if stats["warnings"]:
            extra.append("警告:" + ",".join(stats["warnings"]))
        if extra:
            result["备注"] = (result["备注"] + " | " if result["备注"] else "") + "; ".join(extra)

        try:
            tf = compute_transform(final_path)
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

    except Exception as e:
        result["状态"] = "失败"
        result["备注"] = (result["备注"] + " | " if result["备注"] else "") \
            + f"处理异常：{type(e).__name__}: {e}"
        return result

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def main():
    parser = argparse.ArgumentParser(description="工艺品三维模型批量处理")
    parser.add_argument("input", help="输入目录（zip / glb / obj）")
    parser.add_argument("-o", "--output", default="output_glb", help="输出目录")
    parser.add_argument(
        "-m", "--max-texture", type=int, default=None,
        help="贴图最大边长（仅 OBJ 转换），建议 2048",
    )
    parser.add_argument(
        "-q", "--quality", type=int, default=85,
        help="JPEG 质量 1-100（仅 OBJ 且重编码为 JPEG 时生效）",
    )
    parser.add_argument(
        "--texture-format",
        choices=["auto", "jpeg", "png"],
        default="auto",
        help="贴图重编码（仅 OBJ）；auto=有透明用 PNG，否则 JPEG",
    )
    parser.add_argument(
        "--no-reencode",
        action="store_true",
        help="仅 OBJ 转换时生效：不重编码贴图，仅按需缩放；GLB 输入始终原样复制",
    )
    parser.add_argument(
        "--normals", choices=["auto", "smooth", "flat"], default="auto",
        help="auto=有 vn 沿用、无 vn 生成平滑法线（默认）；smooth=强制平滑；flat=强制硬边",
    )
    parser.add_argument(
        "--metallic", type=float, default=0.0,
        help="金属度，默认 0。OBJ 没有金属度概念，不写会被规范当成 1.0（全金属→发黑）",
    )
    parser.add_argument(
        "--no-normal-map", action="store_true",
        help="不要接 MTL 里的法线/凹凸贴图（默认会接）",
    )
    parser.add_argument(
        "--double-sided", dest="double_sided", action="store_true", default=None,
        help="强制双面渲染（法线朝向混乱、从某些角度看有破洞时用）",
    )
    parser.add_argument(
        "--no-fix", action="store_true",
        help="不要对直接给进来的 GLB 做无损材质修复（默认会修）",
    )
    parser.add_argument(
        "--allow-alpha-loss",
        action="store_true",
        help="仅 OBJ 且 --texture-format jpeg 时：允许丢弃透明通道（默认改 PNG 保留 alpha）",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        default=True,
        help="递归扫描子目录（默认开启）；输出目录若在输入树下会自动排除",
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
    if not 0 <= args.metallic <= 1:
        print("--metallic 必须在 0~1 之间")
        sys.exit(1)

    input_abs = os.path.abspath(args.input)
    output_abs = os.path.abspath(args.output)
    same_err = validate_output_dir([input_abs], output_abs)
    if same_err:
        print(f"错误：{same_err}请使用独立目录（例如 -o 处理结果）")
        sys.exit(1)

    os.makedirs(args.output, exist_ok=True)
    exclude = output_exclusion_for_input(args.input, args.output)
    if exclude:
        print(f"已排除输出目录（避免重复处理产物）：{os.path.abspath(args.output)}")

    files = collect_input_files(args.input, recursive=args.recursive, exclude_dirs=exclude)
    if not files:
        print("未找到可处理的文件（支持 .zip / .glb / .obj；FBX 请先导出）")
        sys.exit(5)

    print(f"发现 {len(files)} 个待处理文件（recursive={args.recursive}）\n")

    results = []
    ok = fail = 0
    for i, path in enumerate(files, 1):
        print(f"[{i}/{len(files)}] {os.path.relpath(path, args.input)}")
        try:
            r = process_one(
                path,
                args.input,
                args.output,
                args.max_texture,
                args.quality,
                args.texture_format,
                not args.no_reencode,
                args.allow_alpha_loss,
                args.overwrite,
                args.normals,
                args.metallic,
                not args.no_normal_map,
                not args.no_fix,
            )
        except Exception as e:
            r = empty_result(path, args.input)
            r["状态"] = "失败"
            r["备注"] = f"处理异常：{type(e).__name__}: {e}"
        results.append(r)
        if r["状态"].startswith("成功"):
            ok += 1
            glb_sha = r.get("glbSha1") or ""
            sha_hint = f" · glbSha1={glb_sha[:8]}" if len(glb_sha) >= 8 else ""
            print(f"      ✓ {r['处理方式']} → {r['GLB文件']} · {r['体积MB']}MB{sha_hint}")
            if r.get("体检"):
                print(f"        体检：{r['体检']}")
        else:
            fail += 1
            print(f"      ✗ {r['状态']}：{r['备注']}")

    manifest = os.path.join(args.output, "manifest.csv")
    with open(manifest, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=RESULT_FIELDS)
        writer.writeheader()
        writer.writerows(results)

    print(f"\n{'=' * 52}")
    print(f"完成：成功 {ok} 个，失败 {fail} 个")
    print(f"GLB 输出目录：{args.output}/")
    print(f"清单文件：{manifest}")
    print("输出文件名以 glbSha1 为准；OBJ 另记录 objBundleSha1 便于追溯 MTL/贴图变更。")
    return fail


if __name__ == "__main__":
    try:
        n_fail = main()
    except SystemExit:
        raise
    sys.exit(4 if n_fail else 0)

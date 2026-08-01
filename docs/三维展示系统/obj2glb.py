"""
OBJ → GLB 本地转换工具
将 obj + mtl + 贴图 转换为自包含的 GLB 文件（贴图内嵌，无外部依赖）

转换时自动修正三处 OBJ 管线的固有缺陷（都会直接影响观感）：
  1. 金属度：OBJ/MTL 没有金属度概念，而 glTF 规范里 metallicFactor 缺省＝1.0（全金属），
     模型在偏暗环境里会发黑、加多少灯都救不回来。这里显式写 0。
  2. 法线：源文件无 vn 时自动生成平滑法线，否则按规范只能按面法线渲染，圆润器物变多面体。
  3. 法线贴图：把 MTL 里的 norm / map_Bump 接到 glTF 的 normalTexture（默认只会带走 diffuse）。
转换结束会打印一份资产体检报告。

依赖：pip install trimesh pillow numpy
用法：
  python obj2glb.py 模型.obj
  python obj2glb.py 模型.obj --output 输出.glb
  python obj2glb.py 模型.obj --max-texture 2048 --sidecar
  python obj2glb.py 模型.obj --output-dir ./out   # 按 GLB 内容哈希命名
  python obj2glb.py 模型.obj --normals flat       # 硬表面模型（建筑/器械）
  python obj2glb.py --fix 已转好的.glb            # 体检并无损修复旧文件
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile

try:
    import trimesh
except ImportError:
    print("缺少依赖，请先执行：pip install trimesh pillow numpy")
    sys.exit(1)

from glb_utils import (
    audit_glb_file,
    fix_glb_file,
    build_output_name_from_glb,
    compute_transform,
    ensure_scene_normals,
    file_sha1,
    find_mtl_for_obj,
    format_audit,
    glb_stats,
    hash_obj_bundle,
    obj_declares_normals,
    optimize_texture,
    parse_mtl_normal_maps,
    safe_output_stem,
    upgrade_materials_to_pbr,
)


def convert(
    obj_path: str,
    output_path: str | None = None,
    output_dir: str | None = None,
    max_texture: int | None = None,
    quality: int = 85,
    texture_format: str = "auto",
    reencode: bool = True,
    allow_alpha_loss: bool = False,
    sidecar: bool = False,
    normals: str = "auto",
    metallic: float = 0.0,
    roughness: float | None = None,
    double_sided: bool | None = None,
    keep_normal_map: bool = True,
) -> bool:
    if not os.path.isfile(obj_path):
        print(f"文件不存在：{obj_path}")
        return False

    print(f"读取：{obj_path}")
    try:
        bundle_sha1 = hash_obj_bundle(obj_path)
        print(f"  资产包 SHA1：{bundle_sha1[:12]}…（obj+mtl+贴图）")
    except Exception as e:
        bundle_sha1 = ""
        print(f"  警告：资产包哈希失败：{e}")

    scene = trimesh.load(obj_path, force="scene")

    total_vertices = 0
    total_faces = 0
    for name, geom in scene.geometry.items():
        total_vertices += len(geom.vertices)
        total_faces += len(geom.faces)
        material = getattr(geom.visual, "material", None)
        image = getattr(material, "image", None) if material else None
        texture_info = f"{image.size[0]}x{image.size[1]}" if image else "无贴图"
        print(f"  网格 {name}：{len(geom.vertices):,} 顶点 / {len(geom.faces):,} 面 / 贴图 {texture_info}")

    notes = optimize_texture(
        scene,
        max_size=max_texture,
        quality=quality,
        texture_format=texture_format,
        reencode=reencode,
        allow_alpha_loss=allow_alpha_loss,
    )
    for note in notes:
        print(f"  贴图：{note}")

    # 法线：源无 vn 时必须生成，否则 GLB 不带 NORMAL，圆润器物会渲染成多面体
    has_vn = obj_declares_normals(obj_path)
    for note in ensure_scene_normals(scene, mode=normals, source_has_vn=has_vn):
        print(f"  法线：{note}")

    # 材质：显式写 metallicFactor（不写＝规范默认全金属），并接回 MTL 的法线贴图
    normal_maps = parse_mtl_normal_maps(find_mtl_for_obj(obj_path) or "") if keep_normal_map else {}
    for note in upgrade_materials_to_pbr(
        scene, normal_maps=normal_maps, metallic=metallic, roughness=roughness,
        double_sided=double_sided, max_texture=max_texture,
    ):
        print(f"  材质：{note}")

    fd, temp_path = tempfile.mkstemp(suffix=".glb", prefix=".tmp_")
    os.close(fd)
    try:
        scene.export(temp_path, include_normals=True)

        stats = glb_stats(temp_path)
        if not stats:
            print("错误：输出不是有效的 GLB 2.0 文件")
            return False

        glb_sha1 = file_sha1(temp_path)
        size_mb = os.path.getsize(temp_path) / 1024 / 1024

        if output_path:
            final_path = output_path
            os.makedirs(os.path.dirname(os.path.abspath(final_path)) or ".", exist_ok=True)
            with open(temp_path, "rb") as src, open(final_path, "wb") as dst:
                dst.write(src.read())
        elif output_dir:
            os.makedirs(output_dir, exist_ok=True)
            stem = safe_output_stem(obj_path, os.path.dirname(obj_path) or ".")
            out_name = build_output_name_from_glb(stem, temp_path)
            final_path = os.path.join(output_dir, out_name)
            with open(temp_path, "rb") as src, open(final_path, "wb") as dst:
                dst.write(src.read())
        else:
            default_stem = os.path.splitext(obj_path)[0]
            final_path = f"{default_stem}-{glb_sha1[:8]}.glb"
            with open(temp_path, "rb") as src, open(final_path, "wb") as dst:
                dst.write(src.read())

        print(f"\n输出：{final_path}")
        print(f"体积：{size_mb:.2f} MB")
        print(f"glbSha1：{glb_sha1}")
        print(f"合计：{total_vertices:,} 顶点 / {total_faces:,} 面")
        print(f"贴图内嵌：{'是' if stats['embedded'] else '否（需修复）'}")
        if stats["warnings"]:
            print(f"警告：{', '.join(stats['warnings'])}")

        audit = audit_glb_file(final_path)
        if audit:
            print("\n资产体检：")
            print(format_audit(audit))

        if sidecar:
            try:
                tf = compute_transform(final_path)
                sidecar_path = os.path.splitext(final_path)[0] + ".transform.json"
                payload = {
                    "source": os.path.basename(obj_path),
                    "glb": os.path.basename(final_path),
                    "sourceSha1": file_sha1(obj_path),
                    "objBundleSha1": bundle_sha1,
                    "glbSha1": glb_sha1,
                    "sizeMb": round(size_mb, 2),
                    "vertices": total_vertices,
                    "faces": total_faces,
                    "textureNotes": notes,
                    "glbStats": stats,
                    "transform": {
                        "scale": tf["scale"],
                        "offsetX": tf["offsetX"],
                        "offsetY": tf["offsetY"],
                        "offsetZ": tf["offsetZ"],
                        "floorOffsetY": tf["floorOffsetY"],
                    },
                    "recommendedCameraDistance": tf["recommendedCameraDistance"],
                }
                with open(sidecar_path, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                print(f"归一化参数：{sidecar_path}")
            except RuntimeError as e:
                print(f"警告：{e}")

        return True
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def run_fix(glb_path: str, metallic: float) -> bool:
    """体检并修复一个现成的 GLB（金属度/粗糙度）。法线缺失需重新转换，报告里会说明。"""
    if not os.path.isfile(glb_path):
        print(f"文件不存在：{glb_path}")
        return False
    before = audit_glb_file(glb_path)
    if before is None:
        print("不是有效的 GLB 2.0 文件")
        return False
    print(f"体检：{glb_path}")
    print(format_audit(before))

    changed, notes = fix_glb_file(glb_path, metallic=metallic)
    print("\n修复：" + ("；".join(notes) if notes else "无"))
    if changed:
        after = audit_glb_file(glb_path)
        print(f"新 glbSha1：{file_sha1(glb_path)}")
        print("\n修复后体检：")
        print(format_audit(after))
    return True


def main():
    parser = argparse.ArgumentParser(description="OBJ → GLB 转换工具")
    parser.add_argument("input", nargs="?", help="输入的 .obj 文件路径（用 --fix 时可省略）")
    parser.add_argument("-o", "--output", help="指定输出 .glb 路径（不按时会按 glbSha1 命名）")
    parser.add_argument(
        "--output-dir",
        help="输出到目录，文件名={相对路径}-{glbSha1前8}.glb",
    )
    parser.add_argument(
        "-m", "--max-texture", type=int,
        help="贴图最大边长，超出则等比缩小（建议 1024 或 2048）",
    )
    parser.add_argument(
        "-q", "--quality", type=int, default=85,
        help="JPEG 编码质量 1-100（默认 85）",
    )
    parser.add_argument(
        "--texture-format",
        choices=["auto", "jpeg", "png"],
        default="auto",
        help="贴图重编码；auto=有透明用 PNG，否则 JPEG",
    )
    parser.add_argument(
        "--no-reencode",
        action="store_true",
        help="不重编码贴图，仅按需缩放",
    )
    parser.add_argument(
        "--allow-alpha-loss",
        action="store_true",
        help="--texture-format jpeg 时允许丢弃透明通道（默认改 PNG）",
    )
    parser.add_argument(
        "--sidecar",
        action="store_true",
        help="输出 .transform.json（含 sourceSha1 / objBundleSha1 / glbSha1）",
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
        "--roughness", type=float,
        help="粗糙度；不指定则按 MTL 的 Ns 换算，换算不出时用 0.6",
    )
    parser.add_argument(
        "--double-sided", dest="double_sided", action="store_true", default=None,
        help="强制双面渲染（法线朝向混乱、从某些角度看有破洞时用）",
    )
    parser.add_argument(
        "--no-normal-map", action="store_true",
        help="不要接 MTL 里的法线/凹凸贴图（默认会接）",
    )
    parser.add_argument(
        "--fix", metavar="GLB",
        help="修复已转好的 GLB（只改 JSON、不动几何），并输出体检报告",
    )
    args = parser.parse_args()

    if args.fix:
        sys.exit(0 if run_fix(args.fix, args.metallic) else 1)
    if not args.input:
        parser.error("需要输入的 .obj 文件路径，或用 --fix 修复现成 GLB")

    if args.output and args.output_dir:
        print("不能同时指定 --output 与 --output-dir")
        sys.exit(1)
    if args.max_texture is not None and args.max_texture <= 0:
        print("--max-texture 必须为正整数")
        sys.exit(1)
    if not 1 <= args.quality <= 100:
        print("--quality 必须在 1~100 之间")
        sys.exit(1)

    success = convert(
        args.input,
        args.output,
        args.output_dir,
        args.max_texture,
        args.quality,
        args.texture_format,
        not args.no_reencode,
        args.allow_alpha_loss,
        args.sidecar,
        args.normals,
        args.metallic,
        args.roughness,
        args.double_sided,
        not args.no_normal_map,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

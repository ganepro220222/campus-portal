"""
OBJ → GLB 本地转换工具
将 obj + mtl + 贴图 转换为自包含的 GLB 文件（贴图内嵌，无外部依赖）

依赖：pip install trimesh pillow numpy
用法：
  python obj2glb.py 模型.obj
  python obj2glb.py 模型.obj --output 输出.glb
  python obj2glb.py 模型.obj --max-texture 2048
  python obj2glb.py 模型.obj --texture-format auto --sidecar
"""
from __future__ import annotations

import argparse
import json
import os
import sys

try:
    import trimesh
except ImportError:
    print("缺少依赖，请先执行：pip install trimesh pillow numpy")
    sys.exit(1)

from glb_utils import compute_transform, glb_stats, optimize_texture


def convert(
    obj_path: str,
    output_path: str | None = None,
    max_texture: int | None = None,
    quality: int = 85,
    texture_format: str = "auto",
    reencode: bool = True,
    sidecar: bool = False,
) -> bool:
    if not os.path.isfile(obj_path):
        print(f"文件不存在：{obj_path}")
        return False

    if output_path is None:
        output_path = os.path.splitext(obj_path)[0] + ".glb"

    print(f"读取：{obj_path}")
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
    )
    for note in notes:
        print(f"  贴图：{note}")

    scene.export(output_path)
    size_mb = os.path.getsize(output_path) / 1024 / 1024

    stats = glb_stats(output_path)
    if not stats:
        print("错误：输出不是有效的 GLB 2.0 文件")
        return False

    print(f"\n输出：{output_path}")
    print(f"体积：{size_mb:.2f} MB")
    print(f"合计：{total_vertices:,} 顶点 / {total_faces:,} 面")
    print(f"贴图内嵌：{'是' if stats['embedded'] else '否（需修复）'}")
    if stats["warnings"]:
        print(f"警告：{', '.join(stats['warnings'])}")

    if sidecar:
        try:
            tf = compute_transform(output_path)
            sidecar_path = os.path.splitext(output_path)[0] + ".transform.json"
            payload = {
                "source": os.path.basename(obj_path),
                "glb": os.path.basename(output_path),
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


def main():
    parser = argparse.ArgumentParser(description="OBJ → GLB 转换工具")
    parser.add_argument("input", help="输入的 .obj 文件路径")
    parser.add_argument("-o", "--output", help="输出的 .glb 文件路径（默认同名）")
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
        "--sidecar",
        action="store_true",
        help="输出 .transform.json 侧车文件（含归一化参数与 GLB 校验）",
    )
    args = parser.parse_args()

    if args.max_texture is not None and args.max_texture <= 0:
        print("--max-texture 必须为正整数")
        sys.exit(1)
    if not 1 <= args.quality <= 100:
        print("--quality 必须在 1~100 之间")
        sys.exit(1)

    success = convert(
        args.input,
        args.output,
        args.max_texture,
        args.quality,
        args.texture_format,
        not args.no_reencode,
        args.sidecar,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

"""
OBJ → GLB 本地转换工具
将 obj + mtl + 贴图 转换为自包含的 GLB 文件（贴图内嵌，无外部依赖）

依赖：pip install trimesh pillow numpy
用法：python obj2glb.py 模型.obj
     python obj2glb.py 模型.obj --output 输出.glb
     python obj2glb.py 模型.obj --max-texture 2048   # 压缩贴图尺寸，减小体积
"""
import argparse
import io
import os
import sys

try:
    import trimesh
    from PIL import Image
except ImportError:
    print("缺少依赖，请先执行：pip install trimesh pillow numpy")
    sys.exit(1)


def optimize_texture(scene, max_size=None, quality=85):
    """
    优化贴图：按需缩放，并统一以 JPEG 重新编码。

    注意：缩放后必须重新编码为 JPEG。若直接交给导出器，
    它会以无损 PNG 保存，反而使体积远大于原始的 JPEG 贴图。
    """
    for name, geom in scene.geometry.items():
        material = getattr(geom.visual, "material", None)
        if material is None:
            continue
        image = getattr(material, "image", None)
        if image is None:
            continue

        width, height = image.size

        # 按需等比缩放
        if max_size and max(width, height) > max_size:
            ratio = max_size / max(width, height)
            new_size = (int(width * ratio), int(height * ratio))
            image = image.resize(new_size, Image.LANCZOS)
            print(f"  贴图缩放：{width}x{height} → {new_size[0]}x{new_size[1]}")

        # 以 JPEG 重新编码，避免导出器落回无损 PNG
        buffer = io.BytesIO()
        image.convert("RGB").save(buffer, format="JPEG", quality=quality, optimize=True)
        buffer.seek(0)
        material.image = Image.open(buffer)
        print(f"  贴图编码：JPEG（质量 {quality}）")


def convert(obj_path, output_path=None, max_texture=None, quality=85):
    if not os.path.isfile(obj_path):
        print(f"文件不存在：{obj_path}")
        return False

    if output_path is None:
        output_path = os.path.splitext(obj_path)[0] + ".glb"

    print(f"读取：{obj_path}")
    # force='scene' 保证材质和贴图被完整加载
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

    # 始终重新编码贴图为 JPEG；若指定了 max_texture 则同时缩放
    optimize_texture(scene, max_texture, quality)

    scene.export(output_path)
    size_mb = os.path.getsize(output_path) / 1024 / 1024

    print(f"\n输出：{output_path}")
    print(f"体积：{size_mb:.2f} MB")
    print(f"合计：{total_vertices:,} 顶点 / {total_faces:,} 面")
    print("贴图已内嵌，该文件可独立使用，无需附带 mtl 或图片。")
    return True


def main():
    parser = argparse.ArgumentParser(description="OBJ → GLB 转换工具")
    parser.add_argument("input", help="输入的 .obj 文件路径")
    parser.add_argument("-o", "--output", help="输出的 .glb 文件路径（默认同名）")
    parser.add_argument(
        "-m",
        "--max-texture",
        type=int,
        help="贴图最大边长，超出则等比缩小（建议 1024 或 2048，可大幅减小体积）",
    )
    parser.add_argument(
        "-q",
        "--quality",
        type=int,
        default=85,
        help="贴图 JPEG 编码质量 1-100（默认 85，越低体积越小）",
    )
    args = parser.parse_args()

    success = convert(args.input, args.output, args.max_texture, args.quality)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

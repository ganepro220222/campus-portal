#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""护栏：顶栏那张屋檐图必须和当前的令牌一致。

屋檐在小程序里是一张 PNG（miniapp/assets/images/nav-eave.png），
因为 WXML 不渲染内联 SVG、WXSS 的 background-image 又不收本地路径。
PNG 里解析不了 var()，所以颜色是**烤进去**的 ——
这就意味着它和 app.wxss 的令牌脱了钩：谁改了 --tile 而忘了重新生成，
屋檐会静静地停在旧配色上，没有任何报错，只有肉眼能发现。

所以这条护栏去数像素：把当前令牌的几个关键色拿出来，
逐个到 PNG 的调色板里找最近的一个，差得太远就说明图过期了。
容差留 8 —— 图是量化到 255 色存的，颜色会有一两级的偏移。

改了 --tile / --tile-* / --wood-* / --gold 之后：
    node scripts/build-navbar-eave.mjs
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PNG = os.path.join(ROOT, 'miniapp/assets/images/nav-eave.png')
APP_WXSS = os.path.join(ROOT, 'miniapp/app.wxss')

# 只盯**平涂**的那几个令牌。
# --tile-hi / --gold / --wood-20 / --wood-30 在屋檐上都是带透明度画的，
# 落到像素上已经和底色混过，找不到纯色，拿它们判会误报。
WATCH = ['tile', 'tile-2', 'tile-dark', 'wood-50', 'wood-70', 'wood-85', 'wood-90', 'wood-95']
TOL = 8
HASH_FILE = os.path.join(ROOT, 'scripts/nav-eave.hash')


def tokens():
    s = io.open(APP_WXSS, encoding='utf-8').read()
    t = {}
    for k, v in re.findall(r'--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});', s):
        t.setdefault(k, v.upper())      # 只认第一次出现的，后面的是覆写
    return t


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def baked_svg():
    """把屋檐 SVG 现烤一遍（令牌换成字面色）。

    直接 import 生成脚本，不走子进程 stdout：Windows 会把 \\n 转成 \\r\\n，
    指纹就和生成时对不上。"""
    import importlib.util
    path = os.path.join(ROOT, 'design', 'demo', 'v2', '_ornaments.py')
    spec = importlib.util.spec_from_file_location('_ornaments_eave', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    svg = mod.eave(height=46, top=6, ridge=5, yc=29, rise=15, pitch=8.0, sub=True)
    t = tokens()
    svg = re.sub(r'var\(--([a-z0-9-]+)\)', lambda m: t.get(m.group(1), m.group(0)), svg)
    return svg.replace('\r\n', '\n')


def baked_svg_hash():
    """像素比对只能说明「图大致是这个配色」；真正要挡的是
    「令牌改了、图没重新生成」。SVG 是确定性生成的，
    拿它的 sha256 和生成时记下的那一份比，一个字节的差别都跑不掉。"""
    import hashlib
    return hashlib.sha256(baked_svg().encode('utf-8')).hexdigest()


def check_palette(errs):
    """像素配色。没装 Pillow 时返回 None，调用方仍须核对指纹。"""
    try:
        from PIL import Image
    except ImportError:
        print('  – 没装 Pillow，跳过屋檐像素配色检查（指纹仍会核对）')
        return None
    im = Image.open(PNG).convert('RGBA')
    palette = {p[1][:3] for p in (im.getcolors(maxcolors=1 << 20) or []) if p[1][3] > 200}
    if not palette:
        errs.append('屋檐图里一个不透明像素都没有')
        return 0

    t = tokens()
    for name in WATCH:
        if name not in t:
            errs.append('app.wxss 里没有 --%s，屋檐用得到这个令牌' % name)
            continue
        want = rgb(t[name])
        best = min(palette, key=lambda c: max(abs(c[i] - want[i]) for i in range(3)))
        d = max(abs(best[i] - want[i]) for i in range(3))
        if d > TOL:
            errs.append(
                '--%s 现在是 %s，屋檐图里最接近的颜色是 #%02X%02X%02X（差 %d）——'
                '图是旧配色烤的，请重跑 node scripts/build-navbar-eave.mjs'
                % (name, t[name], best[0], best[1], best[2], d))
    return len(palette)


def check_hash(errs):
    """指纹：最硬的一条。令牌改了而图没重新生成，这里一定红。"""
    if os.path.exists(HASH_FILE):
        want = io.open(HASH_FILE, encoding='utf-8').read().strip()
        got = baked_svg_hash()
        if want != got:
            errs.append('屋檐的 SVG 指纹对不上（记录 %s…，现算 %s…）——'
                        '多半是改了令牌却没重新生成图，请跑 '
                        'node scripts/build-navbar-eave.mjs' % (want[:12], got[:12]))
    else:
        errs.append('找不到 %s，请跑 node scripts/build-navbar-eave.mjs'
                    % os.path.relpath(HASH_FILE, ROOT))


def main():
    errs = []
    if not os.path.exists(PNG):
        print('✗ 找不到 %s，先跑 node scripts/build-navbar-eave.mjs'
              % os.path.relpath(PNG, ROOT))
        sys.exit(1)

    palette_n = check_palette(errs)
    check_hash(errs)

    if errs:
        print('check-navbar-eave 发现问题：')
        for e in errs:
            print('  ✗ ' + e)
        sys.exit(1)
    kb = os.path.getsize(PNG) // 1024
    if palette_n is None:
        print('✓ 顶栏屋檐 SVG 指纹与当前令牌一致（图 %d KB；像素配色因未装 Pillow 未量）'
              % kb)
    else:
        print('✓ 顶栏屋檐图与当前令牌一致（量了 %d 个色，图 %d KB / %d 色）'
              % (len(WATCH), kb, palette_n))


if __name__ == '__main__':
    main()

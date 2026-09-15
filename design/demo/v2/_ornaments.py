#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成「书院·檐棂印」里几处靠数学摆放的纹样，直接写回 HTML 的 GEN 标记之间。

为什么要生成而不是手写：
  屋檐上的筒瓦、瓦当、滴水、椽头都要沿着起翘曲线排布，坐标是算出来的；
  莲花瓣要绕圆心旋转 N 份；冰裂纹要递归劈分多边形。手写这些必然出错。

用法：python3 design/demo/v2/_ornaments.py
"""
import io
import math
import os
import random
import re

HERE = os.path.dirname(os.path.abspath(__file__))


# ─────────────────────────────────────────────────────────────
# 檐：正脊 + 吻 + 筒瓦 + 檐口（瓦当与滴水相间）+ 椽头 + 额枋
# 原来那版是几排虚线，远看像窗帘的荷叶边。差别在于「构件」——
# 真屋檐是一件件瓦和椽拼起来的，不是几条装饰线。
# ─────────────────────────────────────────────────────────────
def eave(width=375, height=62, top=8, ridge=7, yc=38, rise=20, pitch=9.0, sub=False, power=8):
    """yc 是屋檐在正中的高度，rise 是两端翼角起翘的幅度。

    幂次很关键：真屋檐正面看是「中间一条近乎平直的檐口，只在最外两端
    急促翘起」。幂次太低（2 次、3 次）会变成整幅下垂的弧，远看就是
    一块挂着的布——第一版就栽在这儿。8 次方让中间 70% 几乎不动，
    翘全部集中在最外侧，才是翼角。"""
    def y_edge(x):
        t = (x - width / 2) / (width / 2)
        return yc - rise * abs(t) ** power

    def curve_path(dy=0.0):
        pts = [f"{x},{y_edge(x) + dy:.2f}" for x in range(0, width + 1, 5)]
        return "M" + " L".join(pts)

    def face_path(y_top):
        """瓦面闭合路径。注意不能写成 `... V{y} {curve}` ——
        SVG 的 V 后面跟坐标对会被当成额外的 V 参数，画出两条乱线，
        顶上那排白点就是这么来的。老老实实用 L 逐点回描。"""
        back = " ".join(f"L{x},{y_edge(x):.2f}" for x in range(width, -1, -5))
        return f"M0,{y_top} H{width} {back} Z"

    out = [f'<svg class="eave{" eave--sub" if sub else ""}" viewBox="0 0 {width} {height}" '
           f'preserveAspectRatio="none" aria-hidden="true">']

    # 瓦面。加一层从脊到檐的明暗，屋面才有"斜下来"的坡度感
    gid = f"g{int(yc)}{int(rise)}{'s' if sub else 'f'}"
    out.append(f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
               f'<stop offset="0" stop-color="var(--tile-dark)" stop-opacity=".55"/>'
               f'<stop offset=".55" stop-color="var(--tile-dark)" stop-opacity="0"/>'
               f'<stop offset="1" stop-color="var(--tile-hi)" stop-opacity=".22"/>'
               f'</linearGradient></defs>')
    out.append(f'<path d="{face_path(top)}" fill="var(--tile)"/>')

    # 筒瓦：一根根凸起的瓦垄，左亮右暗才有筒的圆转
    n = int(width / pitch)
    xs = [(i + 0.5) * width / n for i in range(n)]
    for x in xs:
        ye = y_edge(x)
        # 筒瓦是半圆截面：中间亮、两侧暗，宽度只占一半，另一半是板瓦沟
        out.append(f'<path d="M{x:.2f},{top} V{ye:.2f}" stroke="var(--tile-2)" '
                   f'stroke-width="{pitch * 0.42:.2f}"/>')
        out.append(f'<path d="M{x - pitch * 0.07:.2f},{top} V{ye:.2f}" stroke="var(--tile-hi)" '
                   f'stroke-width=".8" opacity=".30"/>')
        out.append(f'<path d="M{x + pitch * 0.2:.2f},{top} V{ye:.2f}" stroke="var(--tile-dark)" '
                   f'stroke-width=".9" opacity=".30"/>')

    # 正脊 + 两端的吻
    out.append(f'<path d="{face_path(top)}" fill="url(%23{gid})"/>')

    # 正脊：坐在瓦面顶上，两端各一只鸱吻（原来画在负坐标里，被裁没了）
    for sx, flip in ((9, 1), (width - 9, -1)):
        out.append(
            f'<path d="M{sx - 3 * flip},{top + 2} C{sx - 3 * flip},{top - 4} {sx + 7 * flip},{top - 3} '
            f'{sx + 7 * flip},{top - 7.5}" fill="none" stroke="var(--tile-dark)" '
            f'stroke-width="4.6" stroke-linecap="round"/>')
    out.append(f'<rect x="0" y="{top - 1}" width="{width}" height="{ridge}" rx="1" fill="var(--tile-dark)"/>')
    out.append(f'<rect x="0" y="{top - 1}" width="{width}" height="{ridge * 0.40:.2f}" '
               f'fill="var(--tile-hi)" opacity=".22"/>')

    # 檐口线
    out.append(f'<path d="{curve_path()}" fill="none" stroke="var(--tile-dark)" stroke-width="1.6"/>')
    out.append(f'<path d="{curve_path(-1.6)}" fill="none" stroke="var(--gold)" stroke-width=".9" opacity=".7"/>')

    # 檐口：筒瓦头上是瓦当（圆），板瓦沟里是滴水（如意形垂片），两者相间
    for x in xs:
        ye = y_edge(x)
        out.append(f'<circle cx="{x:.2f}" cy="{ye + 2.6:.2f}" r="3.1" fill="var(--tile-2)" '
                   f'stroke="var(--tile-dark)" stroke-width=".6"/>')
        out.append(f'<circle cx="{x:.2f}" cy="{ye + 2.6:.2f}" r="1.1" fill="var(--tile-dark)" opacity=".6"/>')
    for i in range(n + 1):
        x = i * width / n
        ye = y_edge(x)
        w = pitch * 0.28
        out.append(
            f'<path d="M{x - w:.2f},{ye + .4:.2f} L{x + w:.2f},{ye + .4:.2f} '
            f'L{x + w * .68:.2f},{ye + 3.4:.2f} Q{x:.2f},{ye + 6.2:.2f} {x - w * .68:.2f},{ye + 3.4:.2f} Z" '
            f'fill="var(--tile)" stroke="var(--tile-dark)" stroke-width=".55" opacity=".92"/>')

    if not sub:
        # 檐檩：一条木梁把椽头串起来。少了这条，方块就是一排浮着的积木。
        out.append(f'<path d="{curve_path(9.5)}" fill="none" stroke="var(--wood-dark)" stroke-width="3.4"/>')
        out.append(f'<path d="{curve_path(8.6)}" fill="none" stroke="var(--wood-mid)" stroke-width="1.1" opacity=".8"/>')
        # 椽头：这里才是木头
        step = pitch * 2
        m = int(width / step)
        for i in range(m + 1):
            x = (i + 0.5) * width / m
            ye = y_edge(x) + 11.4
            out.append(f'<rect x="{x - 3.2:.2f}" y="{ye:.2f}" width="6.4" height="5.2" rx=".8" '
                       f'fill="var(--wood)" stroke="var(--wood-dark)" stroke-width=".6"/>')
            out.append(f'<rect x="{x - 3.2:.2f}" y="{ye + .3:.2f}" width="6.4" height="1.2" rx=".6" '
                       f'fill="var(--wood-pale)" opacity=".65"/>')

    out.append('</svg>')
    return "\n    ".join(out)


# ─────────────────────────────────────────────────────────────
# 瓦当：莲花纹。原来那版是几个同心圆加一圈点，被读成盾牌/纽扣，
# 因为同心圆本身没有文化指向。莲瓣瓦当是唐宋寺观书院最常见的一种，
# 形状一出来就不会认错。
# ─────────────────────────────────────────────────────────────
def wadang(size=54, petals=8):
    c = size / 2
    out = [f'<svg viewBox="0 0 {size} {size}" aria-hidden="true">']
    out.append(f'<circle cx="{c}" cy="{c}" r="{c - 1.1:.2f}" fill="none" '
               f'stroke="var(--wood-dark)" stroke-width="1.1" opacity=".55"/>')
    out.append(f'<circle cx="{c}" cy="{c}" r="{c - 3.4:.2f}" fill="none" '
               f'stroke="var(--wood-mid)" stroke-width=".8" opacity=".5"/>')
    # 联珠纹
    beads = 20
    for i in range(beads):
        a = 2 * math.pi * i / beads
        r = c - 5.4
        out.append(f'<circle cx="{c + r * math.cos(a):.2f}" cy="{c + r * math.sin(a):.2f}" r="1.0" '
                   f'fill="var(--wood-mid)" opacity=".75"/>')
    # 莲瓣
    r_out, r_in = c - 8.6, c - 17.0
    for i in range(petals):
        a = 2 * math.pi * i / petals - math.pi / 2
        half = math.pi / petals * 0.86
        x0, y0 = c + r_in * math.cos(a - half), c + r_in * math.sin(a - half)
        x1, y1 = c + r_in * math.cos(a + half), c + r_in * math.sin(a + half)
        tx, ty = c + r_out * math.cos(a), c + r_out * math.sin(a)
        cx1, cy1 = c + r_out * 0.94 * math.cos(a - half * .62), c + r_out * 0.94 * math.sin(a - half * .62)
        cx2, cy2 = c + r_out * 0.94 * math.cos(a + half * .62), c + r_out * 0.94 * math.sin(a + half * .62)
        out.append(f'<path d="M{x0:.2f},{y0:.2f} C{cx1:.2f},{cy1:.2f} {tx:.2f},{ty:.2f} {tx:.2f},{ty:.2f} '
                   f'C{tx:.2f},{ty:.2f} {cx2:.2f},{cy2:.2f} {x1:.2f},{y1:.2f}" '
                   f'fill="var(--wood-light)" fill-opacity=".30" '
                   f'stroke="var(--wood-mid)" stroke-width=".85" stroke-linejoin="round"/>')
    out.append(f'<circle cx="{c}" cy="{c}" r="{r_in:.2f}" fill="none" '
               f'stroke="var(--wood-mid)" stroke-width=".9" opacity=".7"/>')
    out.append('</svg>')
    return "\n          ".join(out)


# ─────────────────────────────────────────────────────────────
# 冰裂纹：递归劈分多边形。
# 原来的步步锦画得太规整，被看成棋盘格；冰裂是无规则的，
# 一眼就是中式窗棂/瓷器开片，不会认成网格纸。
# ─────────────────────────────────────────────────────────────
def ice_crack(w=343, h=124, cols=9, rows=4, jitter=.36, seed=20260315):
    """冰裂纹。

    先试过「递归劈分多边形」，切出来全是细长条，怎么调都收不住——
    因为每一刀都可能横贯整块，早期那几刀会一直留在画面上。
    换成「抖动网格 + 随机对角线」：格子大小天然相近、没有细长条，
    角点各自乱走，就是冰裂那种"大体相当但每块都不一样"的样子。"""
    rnd = random.Random(seed)
    cw, ch = w / cols, h / rows
    pt = {}
    for r in range(rows + 1):
        for c in range(cols + 1):
            x, y = c * cw, r * ch
            # 边界上的点只沿着边界滑动，保证四边是齐的
            if 0 < c < cols:
                x += rnd.uniform(-jitter, jitter) * cw
            if 0 < r < rows:
                y += rnd.uniform(-jitter, jitter) * ch
            pt[(c, r)] = (x, y)

    seen, seg = set(), []

    def edge(a, b):
        key = tuple(sorted((a, b)))
        if key in seen:
            return
        seen.add(key)
        (x1, y1), (x2, y2) = pt[a], pt[b]
        seg.append(f"M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}")

    for r in range(rows + 1):
        for c in range(cols + 1):
            if c < cols:
                edge((c, r), (c + 1, r))
            if r < rows:
                edge((c, r), (c, r + 1))
    for r in range(rows):
        for c in range(cols):
            k = rnd.random()
            if k < .34:
                edge((c, r), (c + 1, r + 1))
            elif k < .62:
                edge((c + 1, r), (c, r + 1))

    d = " ".join(seg)
    return (f'<svg class="ice" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            f'<path d="{d}" fill="none" stroke="var(--wood-pale)" stroke-width="1.6" '
            f'stroke-linecap="round" opacity=".7" transform="translate(0,1.2)"/>'
            f'<path d="{d}" fill="none" stroke="var(--wood-mid)" stroke-width="1.1" '
            f'stroke-linecap="round" opacity=".42"/></svg>')


ENTRIES = [('闻', '书院动态'), ('览', '展馆展示'), ('讲', '课程中心'),
           ('籍', '资源下载'), ('集', '活动报名')]


def entries():
    w = wadang()
    parts = []
    for ch, label in ENTRIES:
        parts.append(f'''<div class="entry">
        <div class="wadang">
          {w}
          <span class="song">{ch}</span>
        </div>
        <div class="entry-label">{label}</div>
      </div>''')
    return "\n      ".join(parts)


def inject(path, blocks):
    p = os.path.join(HERE, path)
    s = io.open(p, encoding="utf-8").read()
    for name, html in blocks.items():
        pat = re.compile(r"(<!-- GEN:%s -->).*?(<!-- /GEN:%s -->)" % (name, name), re.S)
        if not pat.search(s):
            raise SystemExit(f"{path} 里没有 GEN:{name} 标记")
        s = pat.sub(lambda m: m.group(1) + "\n    " + html + "\n    " + m.group(2), s)
    io.open(p, "w", encoding="utf-8").write(s)
    print(f"✓ {path}：{', '.join(blocks)}")


if __name__ == "__main__":
    full, small = eave(), eave(height=36, top=6, ridge=5, yc=22, rise=12, pitch=9.0, sub=True)
    ice, ent = ice_crack(), entries()
    for f in ("home.html", "home-indigo.html"):
        inject(f, {"eave": full, "ice": ice, "entries": ent})
    inject("login.html", {"eave": full})
    inject("news-detail.html", {"eave": small})

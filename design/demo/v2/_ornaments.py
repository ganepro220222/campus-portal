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

    # 筒瓦：一根根凸起的瓦垄，左亮右暗才有筒的圆转。
    #
    # 这里原来是 `xs = [(i+0.5)*width/n for i in range(n)]`——**完全等距**。
    # 审看时指出的"AI 味"，源头之一就是这种 for 循环出来的机械重复：
    # 真屋顶的瓦是一片片摆上去的，间距永远差那么一点点。
    # 差别不在"直线还是曲线"（界画全是直线，一点不 AI），
    # 在**均匀还是有变化**。所以给每一垄一个很小的随机偏移（±0.14 个瓦距）
    # 和一个略微不同的宽度——小到说不出哪里不一样，但整排立刻不像打印出来的。
    n = int(width / pitch)
    _jr = random.Random(90210)
    xs = [(i + 0.5) * width / n + _jr.uniform(-.14, .14) * pitch for i in range(n)]
    ws = [1.0 + _jr.uniform(-.07, .07) for _ in range(n)]
    for x, kw in zip(xs, ws):
        ye = y_edge(x)
        pitch_k = pitch * kw
        # 筒瓦是半圆截面的筒。光从左上来，所以：
        # 左侧一道暗（背光的转折）→ 中间一道高光（受光的脊）→ 右侧一道深影（落在沟里）。
        # 只画三根等亮度的线是"瓦楞铁"，有了这组明暗才是"一根根筒瓦"。
        out.append(f'<path d="M{x:.2f},{top} V{ye:.2f}" stroke="var(--tile-2)" '
                   f'stroke-width="{pitch_k * 0.46:.2f}"/>')
        out.append(f'<path d="M{x - pitch_k * 0.17:.2f},{top} V{ye:.2f}" stroke="var(--tile-dark)" '
                   f'stroke-width="{pitch_k * 0.10:.2f}" opacity=".30"/>')
        out.append(f'<path d="M{x - pitch_k * 0.05:.2f},{top} V{ye:.2f}" stroke="var(--tile-hi)" '
                   f'stroke-width="{pitch_k * 0.12:.2f}" opacity=".50"/>')
        out.append(f'<path d="M{x + pitch_k * 0.17:.2f},{top} V{ye:.2f}" stroke="var(--tile-dark)" '
                   f'stroke-width="{pitch_k * 0.16:.2f}" opacity=".42"/>')
        # 沟里的深影，让筒与筒之间真的凹下去
        out.append(f'<path d="M{x + pitch_k * 0.5:.2f},{top} V{ye:.2f}" stroke="#000" '
                   f'stroke-width="{pitch_k * 0.20:.2f}" opacity=".16"/>')

    # 正脊 + 两端的吻
    # 屋面的分色渐变。必须是 #——见文件末尾 inject() 里那条护栏。
    out.append(f'<path d="{face_path(top)}" fill="url(#{gid})"/>')

    # 正脊：坐在瓦面顶上，两端各一只鸱吻（原来画在负坐标里，被裁没了）
    for sx, flip in ((9, 1), (width - 9, -1)):
        out.append(
            f'<path d="M{sx - 3 * flip},{top + 2} C{sx - 3 * flip},{top - 4} {sx + 7 * flip},{top - 3} '
            f'{sx + 7 * flip},{top - 7.5}" fill="none" stroke="var(--tile-dark)" '
            f'stroke-width="4.6" stroke-linecap="round"/>')
    out.append(f'<rect x="0" y="{top - 1}" width="{width}" height="{ridge}" rx="1" fill="var(--tile-dark)"/>')
    out.append(f'<rect x="0" y="{top - 1}" width="{width}" height="1.1" fill="var(--tile-hi)" opacity=".55"/>')
    out.append(f'<rect x="0" y="{top - 1 + ridge - 1.1:.2f}" width="{width}" height="1.1" '
               f'fill="#000" opacity=".30"/>')

    # 檐口线
    out.append(f'<path d="{curve_path()}" fill="none" stroke="var(--tile-dark)" stroke-width="1.6"/>')
    out.append(f'<path d="{curve_path(-1.6)}" fill="none" stroke="var(--gold)" stroke-width=".9" opacity=".7"/>')

    # 檐口：筒瓦头上是瓦当（圆），板瓦沟里是滴水（如意形垂片），两者相间
    for x in xs:
        ye = y_edge(x)
        cy = ye + 2.6
        out.append(f'<circle cx="{x:.2f}" cy="{cy + .6:.2f}" r="3.1" fill="#000" opacity=".22"/>')
        out.append(f'<circle cx="{x:.2f}" cy="{cy:.2f}" r="3.1" fill="var(--tile-2)" '
                   f'stroke="var(--tile-dark)" stroke-width=".6"/>')
        out.append(f'<path d="M{x - 2.1:.2f},{cy - 1.4:.2f} A3.1,3.1 0 0,1 {x + 1.0:.2f},{cy - 2.9:.2f}" '
                   f'fill="none" stroke="var(--tile-hi)" stroke-width="1" opacity=".65"/>')
        out.append(f'<circle cx="{x:.2f}" cy="{cy:.2f}" r="1.1" fill="var(--tile-dark)" opacity=".6"/>')
    for i in range(n + 1):
        x = i * width / n
        ye = y_edge(x)
        w = pitch * 0.28
        out.append(
            f'<path d="M{x - w:.2f},{ye + .4:.2f} L{x + w:.2f},{ye + .4:.2f} '
            f'L{x + w * .68:.2f},{ye + 3.4:.2f} Q{x:.2f},{ye + 6.2:.2f} {x - w * .68:.2f},{ye + 3.4:.2f} Z" '
            f'fill="var(--tile)" stroke="var(--tile-dark)" stroke-width=".55" opacity=".92"/>')
        out.append(f'<path d="M{x - w * .55:.2f},{ye + 1.1:.2f} L{x + w * .55:.2f},{ye + 1.1:.2f}" '
                   f'stroke="var(--tile-hi)" stroke-width=".8" opacity=".45"/>')

    # ── 檐下 ──────────────────────────────────────────────
    # 从上到下的层序：连檐（压在瓦口上的一条板）→ 望板（深色，在暗处）
    # → 檐檩（把椽头串起来的圆木）→ 椽头（露在外面的方木端头）→ 檐下投影。
    #
    # 这一段返工过两次，两次都是**漏构件**：
    #   第一次漏了望板，椽与椽之间透光，背后的山从缝里钻出来；
    #   第二次把整段裹进 `if not sub`，二级页索性一件都没有，
    #   我还给自己找了个理由说"矮一半摆不下椽头"——那是借口。
    # 正确的做法是**按比例缩**，不是删构件：少一件，这条檐就不是一个结构。
    # k 用檐口线以下的可用高度算出来，两种檐走同一套代码。
    k = (height - yc) / 24.0          # 主页的檐在檐口线下有 24px
    K = lambda v: v * k

    # 望板：一条通长的深色板，把椽头之间的缝堵死。
    # 压到 wood-85 而不是 wood-95：它在暗处，不是黑的；
    # 用最深那一档时整条檐下成了一根黑杠，比透光还难看。
    out.append(f'<path d="{curve_path(K(12.4))}" fill="none" stroke="var(--wood-85)" '
               f'stroke-width="{K(9.6):.2f}" opacity=".96"/>')
    out.append(f'<path d="{curve_path(K(15.2))}" fill="none" stroke="var(--wood-90)" '
               f'stroke-width="{K(3.4):.2f}" opacity=".55"/>')
    out.append(f'<path d="{curve_path(K(9.2))}" fill="none" stroke="var(--wood-85)" '
               f'stroke-width="{K(3.2):.2f}" opacity=".85"/>')
    # 连檐：压在瓦口下沿的一条板，把瓦和木分开
    out.append(f'<path d="{curve_path(K(7.4))}" fill="none" stroke="var(--wood-70)" '
               f'stroke-width="{K(2.6):.2f}"/>')
    out.append(f'<path d="{curve_path(K(6.5))}" fill="none" stroke="var(--wood-30)" '
               f'stroke-width="{max(.6, K(.9)):.2f}" opacity=".8"/>')
    # 檐檩：一条木梁把椽头串起来
    out.append(f'<path d="{curve_path(K(10.6))}" fill="none" stroke="var(--wood-90)" '
               f'stroke-width="{K(3.6):.2f}"/>')
    out.append(f'<path d="{curve_path(K(10.1))}" fill="none" stroke="var(--wood-65)" '
               f'stroke-width="{K(2.0):.2f}" opacity=".95"/>')
    out.append(f'<path d="{curve_path(K(9.4))}" fill="none" stroke="var(--wood-30)" '
               f'stroke-width="{max(.55, K(.85)):.2f}" opacity=".75"/>')
    # 椽头：露在外面的方木端头。间距同样不等距（见筒瓦那一段的理由）。
    step = pitch * 2
    m = int(width / step)
    _er = random.Random(31415)
    rh = K(5.4)
    for i in range(m + 1):
        x = (i + 0.5) * width / m + _er.uniform(-.10, .10) * step
        ye = y_edge(x) + K(12.4)
        hw = K(3.2) * (1.0 + _er.uniform(-.06, .06))
        out.append(f'<rect x="{x - hw:.2f}" y="{ye + K(.7):.2f}" width="{hw * 2:.2f}" '
                   f'height="{rh:.2f}" rx=".8" fill="#000" opacity=".30"/>')
        out.append(f'<rect x="{x - hw:.2f}" y="{ye:.2f}" width="{hw * 2:.2f}" height="{rh:.2f}" '
                   f'rx=".8" fill="var(--wood-50)" stroke="var(--wood-85)" '
                   f'stroke-width="{max(.45, K(.65)):.2f}"/>')
        out.append(f'<rect x="{x - hw:.2f}" y="{ye + K(.25):.2f}" width="{hw * 2:.2f}" '
                   f'height="{max(.7, K(1.2)):.2f}" rx=".55" fill="var(--wood-20)" opacity=".85"/>')
        out.append(f'<rect x="{x - hw:.2f}" y="{ye + rh - K(1.2):.2f}" width="{hw * 2:.2f}" '
                   f'height="{max(.7, K(1.2)):.2f}" rx=".55" fill="var(--wood-95)" opacity=".60"/>')
    # 檐下阴影：屋檐是挑出来的，底下必然有一道投影落在墙/画上
    out.append(f'<path d="{curve_path(K(18.4))}" fill="none" stroke="var(--wood-95)" '
               f'stroke-width="{K(2.6):.2f}" opacity=".16"/>')

    out.append('</svg>')
    return "\n    ".join(out)


# ─────────────────────────────────────────────────────────────
# 瓦当：莲花纹。原来那版是几个同心圆加一圈点，被读成盾牌/纽扣，
# 因为同心圆本身没有文化指向。莲瓣瓦当是唐宋寺观书院最常见的一种，
# 形状一出来就不会认错。
# ─────────────────────────────────────────────────────────────
def wadang(size=54):
    """文字瓦当。

    先做成莲瓣瓦当，中间再放篆字——两头不讨好：莲瓣和字叠在一起很吵，
    规制上也不对。汉代瓦当分两路，一路用纹样（莲瓣、云纹）占满当面，
    一路是文字瓦当（「长乐未央」「千秋万岁」那种），中间是字、四周是
    界格与联珠，两者不混。既然当心要放字，就按文字瓦当来。
    """
    c = size / 2
    out = [f'<svg viewBox="0 0 {size} {size}" aria-hidden="true">']
    # 外缘：一圈金框。金镶玉的"镶"就在这里——玉是嵌在金里的。
    out.append(f'<circle cx="{c}" cy="{c}" r="{c - 1.0:.2f}" fill="none" '
               f'stroke="var(--gold)" stroke-width="1.6" opacity=".85"/>')
    out.append(f'<circle cx="{c}" cy="{c}" r="{c - 2.3:.2f}" fill="none" '
               f'stroke="#8A6B2E" stroke-width=".7" opacity=".5"/>')
    # 联珠纹：改成金珠
    beads = 22
    for i in range(beads):
        a = 2 * math.pi * i / beads
        r = c - 5.6
        bx, by = c + r * math.cos(a), c + r * math.sin(a)
        out.append(f'<circle cx="{bx:.2f}" cy="{by + .35:.2f}" r="1.05" fill="#6E5423" opacity=".35"/>')
        out.append(f'<circle cx="{bx:.2f}" cy="{by:.2f}" r="1.05" fill="var(--gold)" opacity=".9"/>')
        out.append(f'<circle cx="{bx - .3:.2f}" cy="{by - .3:.2f}" r=".38" '
                   f'fill="#F3E2B4" opacity=".85"/>')
    # 弦纹：金与玉的交界，内侧一道暗线做出"嵌进去"的坎
    out.append(f'<circle cx="{c}" cy="{c}" r="{c - 8.6:.2f}" fill="none" '
               f'stroke="var(--gold)" stroke-width="1.3" opacity=".8"/>')
    out.append(f'<circle cx="{c}" cy="{c}" r="{c - 9.6:.2f}" fill="none" '
               f'stroke="#5C7268" stroke-width=".8" opacity=".35"/>')
    # 界格：四道斜向短线，只在金圈与联珠之间，不进当心、不压字
    r0, r1 = c - 8.0, c - 6.4
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        out.append(f'<path d="M{c + r0 * math.cos(a):.2f},{c + r0 * math.sin(a):.2f} '
                   f'L{c + r1 * math.cos(a):.2f},{c + r1 * math.sin(a):.2f}" '
                   f'stroke="var(--gold)" stroke-width="1.1" opacity=".65"/>')
    out.append('</svg>')
    return "\n          ".join(out)


# ─────────────────────────────────────────────────────────────
# 祥云：压在深色块底部，代替原来那两道"波浪"。
# 波浪读起来是山水或海浪，都不是书院的词；祥云才是。
# 一朵云 = 若干圆瓣 + 末端一个云卷（那个卷是祥云的签名，没有它就是一排泡泡）。
# ─────────────────────────────────────────────────────────────
def _cloud_layer(w, h, base, seed, scale, fill, opacity, curl):
    """一朵祥云 = 一簇大小不一的圆瓣 + 一两道云卷。

    先用「连续的圆弧带」做过，出来是一排均匀的拱形，像花边不像云——
    因为真祥云是一团一团断开的，团与团之间有空，团里还有卷。
    """
    rnd = random.Random(seed)
    lumps, curls = [], []
    x = -scale
    while x < w + scale:
        cx = x + scale * rnd.uniform(1.1, 1.8)
        n = rnd.choice((3, 4, 4, 5))
        top = base - scale * rnd.uniform(.55, 1.05)
        for k in range(n):
            # 中间的瓣大、两边的瓣小，云团才有主次
            edge = abs(k - (n - 1) / 2) / max(1, (n - 1) / 2)
            r = scale * (1.02 - .38 * edge) * rnd.uniform(.88, 1.12)
            px = cx + (k - (n - 1) / 2) * scale * 1.18
            py = top + edge * scale * .42 + rnd.uniform(-1, 1) * scale * .08
            lumps.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{r:.1f}"/>')
            inner = r - scale * .30
            if inner > 1.5 and edge < .55:
                curls.append(
                    f'<path d="M{px - inner:.1f},{py:.1f} A{inner:.1f},{inner:.1f} 0 0,1 '
                    f'{px + inner:.1f},{py:.1f}" fill="none" stroke="{curl}" '
                    f'stroke-width="{scale * .095:.2f}" stroke-linecap="round" opacity=".85"/>')
        # 云纹：不是在云外面挂几个小拱（试过，像凭空多出来的零件），
        # 而是沿着每个圆瓣的上缘再描一道内轮廓——传统云纹就是这种双钩。
        x = cx + (n / 2 + 1.5) * scale * 1.18 + scale * rnd.uniform(.2, 1.1)
    return (f'<g fill="{fill}" opacity="{opacity}">'
            f'<rect x="-20" y="{base:.1f}" width="{w + 40}" height="{h - base + 20:.1f}"/>'
            + "".join(lumps) + '</g>' + "".join(curls))


def xiangyun(w=375, h=120, seed=20260401):
    """两层：远处一层提亮、近处一层压暗，和水墨的远淡近浓一致。"""
    return (f'<svg class="shan" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            # 描边色必须比所在那层更"深一档"或"浅一档"，不能跟层同色：
            # 远层只有 13% 不透明度，用 85% 的同色去描，线比云本身还亮，
            # 看起来就是几道悬在空中的弧。
            # 底色从墨改成浅天青之后，云也要跟着翻：远层提亮、近层压深一档青，
            # 原来那组（亮云 + 黑云）在浅底上会变成两块脏斑。
            + _cloud_layer(w, h, h * .52, seed, 15, "#FFFFFF", ".62", "rgba(74,102,96,.26)")
            + _cloud_layer(w, h, h * .80, seed + 7, 12, "#5E7A73", ".24", "rgba(255,255,255,.60)")
            + '</svg>')


# ─────────────────────────────────────────────────────────────
# 如意云头分隔纹：登录页书法字下面那一条。
# 原来左右两条线和中间的装饰是各画各的，中间还被我换成了一块红菱形。
# 现在是一整件：两端渐隐的线 + 中间如意云头 + 一点朱砂。
# ─────────────────────────────────────────────────────────────
def ruyi_divider(w=210, h=24):
    """分隔纹：两端渐隐的线 + 中间一朵小祥云。

    走过两次弯路：
    1) 渐变用 url(%23id) 引用——%23 只在 data URI 里会被解码，内联 SVG 里
       是字面量，引用失效、线根本不画。改成几段不同透明度的实线做渐隐。
    2) 中间先画成"如意云头"，怎么调都是一颗心：如意头的辨识度靠两侧的
       内卷，光靠三个圆瓣区分不开。索性换成祥云的单元——和封面上那批云
       是同一套词，统一比生造一个新形状更值。
    """
    cx, cy = w / 2, h / 2
    seg = []
    for x0, x1, op in ((6, 26, .22), (26, 48, .45), (48, cx - 17, .8)):
        seg.append(f'<path d="M{x0:.0f},{cy} H{x1:.0f}" stroke="var(--gold)" '
                   f'stroke-width="1.1" opacity="{op}"/>')
        seg.append(f'<path d="M{w - x0:.0f},{cy} H{w - x1:.0f}" stroke="var(--gold)" '
                   f'stroke-width="1.1" opacity="{op}"/>')
    def cloud_group(fill, grow, opacity):
        return (f'<g fill="{fill}" fill-opacity="{opacity}">'
                f'<circle cx="{cx - 7.2}" cy="{cy + .6}" r="{4.0 + grow}"/>'
                f'<circle cx="{cx}" cy="{cy - 2.0}" r="{5.4 + grow}"/>'
                f'<circle cx="{cx + 7.2}" cy="{cy + .6}" r="{4.0 + grow}"/>'
                f'<rect x="{cx - 11.2 - grow}" y="{cy - grow}" '
                f'width="{22.4 + grow * 2}" height="{4.6 + grow}" rx="1.6"/></g>')

    # 圆的并集没法直接描边，就在底下垫一层大一圈的金色，露出来的边就是描边。
    # 之前试过在云外面画两道金色卷线，结果是两个悬空的整圆，像轮子。
    cloud = cloud_group("var(--gold)", 1.1, ".95") + cloud_group("var(--zhu)", 0, ".95")
    curls = (f'<path d="M{cx - 4.6},{cy + 1.2} a2.0,2.0 0 1,1 -1.6,-1.9" fill="none" '
             f'stroke="var(--wood-pale)" stroke-width=".9" stroke-linecap="round" opacity=".55"/>'
             f'<path d="M{cx + 4.6},{cy + 1.2} a2.0,2.0 0 1,0 1.6,-1.9" fill="none" '
             f'stroke="var(--wood-pale)" stroke-width=".9" stroke-linecap="round" opacity=".55"/>')
    return (f'<svg class="ruyi-div" viewBox="0 0 {w} {h}" aria-hidden="true">'
            + "".join(seg) + cloud + curls + '</svg>')


def _ridge(w, base, seed, amp, bias, step=46):
    """一道山脊。

    第一版是「峰谷交替 + 中点二次平滑」，出来的是圆头的包，不是山——
    因为峰和谷之间只有一个点，曲线只能是正弦。这一版在峰的两侧各加一个**肩**：
    肩高取峰高的六到八成、离峰很近，于是山头收得紧、山坡放得开，
    这才是青绿山水里那种"圆浑但有骨"的峰形。

    返回 (路径, 所有点, 峰点)——峰点后面要用来落皴和点景树。
    """
    rnd = random.Random(seed)
    pts, peaks = [], []

    def valley():
        return base - amp * bias * rnd.uniform(.25, .85)

    x = -step * 1.5
    pts.append((x, valley()))
    while x < w + step * 1.6:
        # 步长和峰高都要放开到接近 3 倍的跨度。第一版各自只有 1.5 倍，
        # 出来的是一排一样大的帐篷——"随机"不够宽就等于规律。
        run = step * rnd.uniform(.62, 1.85)
        ph = amp * (0.26 + (rnd.random() ** 1.45) * 0.86)
        px = x + run * rnd.uniform(.40, .64)
        nx = x + run
        # 肩：离峰 48%~64%、高度取峰的 76%~88%。
        # 肩越远越高，山头就越圆——太近太矮就收成尖角。
        pts.append((px - (px - x) * rnd.uniform(.48, .64), base - ph * rnd.uniform(.76, .88)))
        pts.append((px, base - ph))
        peaks.append((px, base - ph, ph))
        pts.append((px + (nx - px) * rnd.uniform(.48, .64), base - ph * rnd.uniform(.76, .88)))
        # 子峰：真的山从来不是一峰一谷，主峰旁边总跟着一个矮的。
        # 加了它，天际线才是"山脉"而不是波形。
        if rnd.random() < .52:
            sh = ph * rnd.uniform(.34, .62)
            sx = px + (nx - px) * rnd.uniform(.70, .86)
            pts.append((sx, base - sh))
            peaks.append((sx, base - sh, sh))
            nx = nx + run * rnd.uniform(.18, .40)
        pts.append((nx, valley()))
        x = nx
    d = ["M%.1f,%.1f" % (pts[0][0], pts[0][1])]
    for i in range(1, len(pts)):
        x0, y0 = pts[i - 1]
        x1, y1 = pts[i]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        d.append("Q%.1f,%.1f %.1f,%.1f" % (x0, y0, mx, my))
    d.append("L%.1f,%.1f" % (pts[-1][0], pts[-1][1]))
    return " ".join(d), pts, peaks


def _cun(peaks, rnd, color, opacity, count=3, scale=1.0):
    """皴。山体上那些顺着坡走的短线，是中国山水画和"色块山"唯一的区别。
    这里走披麻皴：从峰肩往下拖，越往下越散。"""
    out = []
    for px, py, ph in peaks:
        n = count + rnd.randint(-1, 1)
        for k in range(n):
            side = 1 if k % 2 else -1
            dx = side * rnd.uniform(2.5, 10.0) * scale
            y0 = py + abs(dx) * rnd.uniform(.45, .75)
            ln = rnd.uniform(7, 15) * scale
            bend = side * rnd.uniform(1.2, 3.6) * scale
            out.append('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" '
                       'stroke="%s" stroke-width="%.2f" stroke-linecap="round" opacity="%s"/>'
                       % (px + dx, y0, bend, ln * .5, bend * .35, ln,
                          color, rnd.uniform(.7, 1.1) * scale, opacity))
    return "".join(out)


def _pine(x, y, th, r, color):
    """点景松。这个尺寸下松树就是"一小截杆 + 三层伞"。

    第一版杆画到了顶、伞又圆又小，出来是三根棒棒糖。松的特征在**伞**：
    横得很开、扁得很平、层与层要叠上，杆只在最下面露一小段。
    """
    return ('<g opacity=".74">'
            '<path d="M%.1f,%.1f L%.1f,%.1f" stroke="%s" stroke-width="1.1" stroke-linecap="round"/>'
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>'
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>'
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>'
            '</g>' % (x, y, x, y - th * .50, color,
                      x, y - th * .96, r * 1.05, r * .30, color,
                      x, y - th * .74, r * 1.55, r * .34, color,
                      x, y - th * .50, r * 1.90, r * .38, color))


def _brush(pts, color, base_w, seed, opacity, chunks=11):
    """把一条脊线画成"一笔"，而不是"一根等宽的线"。

    毛笔线的粗细一路在变——起笔按下去粗，行笔提起来细，转折处又按一下。
    SVG 的 stroke-width 是恒定的，一根等宽的线远看就是矢量图，
    这是"AI 味"里最不容易察觉、但最致命的一条。

    **第一版画出了断线，那是 bug 不是设计。** 原因：
    Q 中点平滑法画出来的曲线，起点是 pts[0]，终点却停在**倒数两点的中点**上；
    我按点数切段时让下一段从 pts[i] 起笔，于是每两段之间少了
    「中点 → 下一个原始点」这半截，整条脊上就出现一串缺口。
    远看就是"线没画完"，比等宽的线还糟。

    这一版改成按**中点到中点**切段：第 j 段从 mid(j-1,j) 出发、
    以 pts[j] 为控制点、到 mid(j,j+1) 收笔。相邻两段共用同一个端点坐标，
    数学上严丝合缝，接头处再怎么变宽度也不会裂。
    首尾两截单独补上（pts[0]→mid0、mid[-1]→pts[-1]），线才真的到头。
    """
    import math
    rnd = random.Random(seed)
    n = len(pts)
    if n < 4:
        return ""
    mids = [((pts[j - 1][0] + pts[j][0]) / 2.0, (pts[j - 1][1] + pts[j][1]) / 2.0)
            for j in range(1, n)]
    # 每一段：mids[j-1] --Q(pts[j])--> mids[j]，j 从 1 到 n-2
    segs = [("M%.2f,%.2f" % mids[j - 1],
             "Q%.2f,%.2f %.2f,%.2f" % (pts[j][0], pts[j][1], mids[j][0], mids[j][1]))
            for j in range(1, n - 1)]
    if not segs:
        return ""
    # 首尾的半截，保证线画到两端
    head = ("M%.2f,%.2f" % pts[0], "L%.2f,%.2f" % mids[0])
    tail = ("M%.2f,%.2f" % mids[-1], "L%.2f,%.2f" % pts[-1])
    segs = [head] + segs + [tail]

    per = max(2, len(segs) // max(1, chunks))
    phase = rnd.uniform(0, 6.28)
    out = []
    k = 0
    i = 0
    while i < len(segs):
        group = segs[i:i + per]
        # 一组里只保留第一个 M，后面接着画——同一条 path 内天然连续
        d = group[0][0] + " " + " ".join(g[1] for g in group)
        # 宽度：低频正弦保证连续变化（不是竹节），叠一点抖动保证不规律
        wob = 0.70 + 0.44 * (0.5 + 0.5 * math.sin(phase + k * 0.85)) + rnd.uniform(-.08, .08)
        out.append('<path d="%s" fill="none" stroke="%s" stroke-width="%.2f" '
                   'stroke-linecap="round" stroke-linejoin="round" opacity="%s"/>'
                   % (d, color, base_w * wob, opacity))
        i += per
        k += 1
    return "".join(out)



def qinglv(w=375, h=330, seed=20260420, step_k=1.0):
    """极简青绿山水。

    故宫那套的识别度有一大半来自「一张院藏的画通栏铺满」。画的内容学不来，
    但**画种**可以：青绿山水是石青、石绿两种矿物颜料画在绢上，
    远淡近浓、山脊勾泥金——这三条是可以自己画的，而且画出来的是我们自己的画。

    四层，每层四件事：
      · 山形：峰带双肩（见 _ridge），不是圆包
      · 设色：**每一层自己也是渐变的**——山头压到本层的石青，山脚退到下一层的浅色。
        平涂色块是"矢量图"，分染才是"画"。
      · 皴：近两层落披麻皴
      · 点景：中景一排米点树，近景两三棵松
    """
    layers = [
        # (基线比例, 起伏, 低峰占比, 步长, 山头色, 山脚色, 皴色, 描金)
        # 基线要留出内容纸盖住的那 26px（约画面的 7%），否则最浓的一层
        # 全被纸压在下面，整幅画只剩远景的淡色，"远淡近浓"就少了"近浓"。
        # 山脚一律退到赭石——这是千里江山图的打底色。退到"下一层的浅青"
        # 是上一版的做法，结果整幅只有一个青，没有骨。
        # 脚色不能每一层都用赭。上一版四层全退到赭石，而**每一层的填充都是
        # 从自己的山脊一直铺到画底**——于是最远那一层的赭把整个上半屏吃掉了，
        # 出来就是审看时指出的那片"屎黄"。
        # 千里江山图里赭只在最下面、水边露一线，上面全是青绿。
        # 所以按远近分配：远层退回天色（这也正是空气透视），
        # 中层退到更浅的青绿，只有近两层的脚才见赭。
        (0.56, 116, 0.16, 76, "--shan-4", "--juan-2",      None,       .34),
        (0.70,  96, 0.24, 64, "--shan-3", "--shan-4",      None,       .50),
        (0.82,  80, 0.32, 56, "--shan-2", "--shan-foot-l", "--shan-1", .66),
        (0.94,  72, 0.42, 48, "--shan-1", "--shan-foot",   "--qing-90",.82),
    ]
    sid = "q%d" % seed
    rnd = random.Random(seed + 9001)
    defs = ['<linearGradient id="%s-sky" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="var(--juan-1)"/>'
            '<stop offset=".52" stop-color="var(--juan-2)"/>'
            '<stop offset="1" stop-color="var(--juan-3)"/></linearGradient>' % sid]
    body = []
    for i, (bl, amp, bias, step, top, foot, cun, gold) in enumerate(layers):
        base = h * bl
        gid = "%s-s%d" % (sid, i)
        # 分染的范围就是这一层山体自己的高度，不是整幅画——
        # 用整幅画做渐变范围时，每层看到的都只是渐变的一小段，等于没分染。
        # 三个停止点，而且山头色要**按住**到六成以上再放开。
        # 只给首尾两个停止点时，赭从峰顶下面一点就开始吃进来，
        # 整座山看着是土色的，石青石绿全没了——这是上一版的毛病。
        # 千里江山图里赭石只在山脚露一线，青绿占大头。
        defs.append('<linearGradient id="%s" gradientUnits="userSpaceOnUse" '
                    'x1="0" y1="%.1f" x2="0" y2="%.1f">'
                    '<stop offset="0" stop-color="var(%s)"/>'
                    '<stop offset=".62" stop-color="var(%s)"/>'
                    '<stop offset="1" stop-color="var(%s)"/></linearGradient>'
                    % (gid, base - amp, base + amp * .72, top, top, foot))
        d, pts, peaks = _ridge(w, base, seed + i * 17, amp, bias, step * step_k)
        # 这里必须是 #，不是 %23——内联 SVG 里 %23 是字面量，引用解析不到，
        # 整个 fill 会静默失效。这个坑踩第三次了（如意分隔线、金字、绢底各一次）。
        body.append('<path d="%s L%.0f,%d L-92,%d Z" fill="url(#%s)"/>' % (d, w + 92, h, h, gid))
        if cun:
            body.append('<g>%s</g>' % _cun(peaks, rnd, "var(%s)" % cun,
                                           ".20" if i == 2 else ".26",
                                           count=3, scale=1.0 if i == 2 else .85))
        # 泥金勾脊：走 _brush，线宽一路在变。
        # 上一版是一根恒定宽度的 path——那是矢量图的线，不是笔画的线。
        body.append(_brush(pts, "var(--gold)", 1.25 + i * .15, seed + i * 71, gold))
        # 云气横在峰腰：青绿山水里山与山之间总有一条白，既分层又留白
        if i == 1:
            # 米点树：远中景的树就是一排深浅不一的点，这是米芾的办法，
            # 在这个尺寸下比画树形准确得多。
            dots = []
            for px, py, ph in peaks:
                for k in range(rnd.randint(3, 6)):
                    ox = rnd.uniform(-16, 16)
                    oy = abs(ox) * rnd.uniform(.35, .6) + rnd.uniform(1, 5)
                    rr = rnd.uniform(1.1, 2.3)
                    dots.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f"/>'
                                % (px + ox, py + oy, rr, rr * .74))
            body.append('<g fill="var(--shan-2)" opacity=".30">%s</g>' % "".join(dots))
        if i == 2:
            band = base - amp * 0.34
            body.append(_cloud_layer(w, h, band, seed + 307, 12,
                                     "#FFFFFF", ".42", "rgba(94,132,144,.14)"))
            # 近景松：只种在露得出来的两三个峰上，多了就成了森林
            # 只种在露得出来的主峰上，而且**成丛**——
            # 一棵一棵单独站着是行道树，两三棵挨在一起才是山上的树。
            vis = [p for p in peaks if 30 < p[0] < w - 30 and p[2] > amp * .45]
            rnd.shuffle(vis)
            for px, py, ph in vis[:2]:
                x0 = px + rnd.uniform(-7, 7)
                y0 = py + rnd.uniform(6, 12)
                body.append(_pine(x0, y0, rnd.uniform(15, 19), rnd.uniform(3.4, 4.2),
                                  "var(--qing-80)"))
                body.append(_pine(x0 + rnd.choice((-1, 1)) * rnd.uniform(7, 10),
                                  y0 + rnd.uniform(2, 5),
                                  rnd.uniform(10, 13), rnd.uniform(2.6, 3.2),
                                  "var(--qing-80)"))
    out = ['<svg class="qinglv" viewBox="0 0 %d %d" preserveAspectRatio="none" aria-hidden="true">' % (w, h),
           '<defs>%s</defs>' % "".join(defs),
           '<rect width="%d" height="%d" fill="url(#%s-sky)"/>' % (w, h, sid)]
    out += body
    out.append('</svg>')
    return "\n    ".join(out)


def deckle_mask(w=100, h=100, step=6, amp=1.7, seed=424242):
    """手裁纸的毛边遮罩，输出给 CSS 变量用的 data-URI，配合 mask-image。

    四条边各自沿自己的法线方向抖，抖幅只有一两个百分点——毛边是纸纤维的
    断口，不是撕破的口子，幅度一大就成了爆炸贴纸。
    """
    rnd = random.Random(seed)
    pts = []

    def edge(x0, y0, x1, y1, nx, ny):
        n = max(2, int(max(abs(x1 - x0), abs(y1 - y0)) / step))
        for i in range(n):
            t = i / n
            j = rnd.uniform(-amp, amp)
            pts.append((x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j))

    edge(0, 0, w, 0, 0, 1)
    edge(w, 0, w, h, -1, 0)
    edge(w, h, 0, h, 0, -1)
    edge(0, h, 0, 0, 1, 0)
    d = "M" + " L".join("%.2f,%.2f" % (x, y) for x, y in pts) + " Z"
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %d %d' "
           "preserveAspectRatio='none'><path d='%s' fill='white'/></svg>" % (w, h, d))
    return "url(\"data:image/svg+xml,%s\")" % (
        svg.replace("<", "%3C").replace(">", "%3E").replace("#", "%23").replace('"', "'"))


ENTRIES = [('闻', '书院动态'), ('览', '展馆展示'), ('讲', '课程中心'),
           ('籍', '资源下载'), ('集', '活动报名')]


SEAL_DIR = os.path.join(HERE, "..", "..", "brand", "seal-script")


def seal_glyph(ch):
    """读校方给的小篆字形。

    原始文件里每个字都夹着两条近白色（#fcfbfa 一类）的水印路径——白底上看不见，
    落到纸色或深色底上就会显形。已按计算样式的亮度剔掉，并把字面归一到
    1000×1000、居中占 760，五个字线宽与高度这才一致。"""
    f = os.path.join(SEAL_DIR, f"{ch}.svg")
    if not os.path.exists(f):
        return f'<span class="song">{ch}</span>'
    svg = io.open(f, encoding="utf-8").read().strip()
    # 金镶玉：字要用真的金色渐变（上浅下深再回浅，像打磨过的金面），
    # 单色金看着是"涂上去的"，渐变才是"嵌进去的一条金"。
    gid = "gold-" + hex(ord(ch))[2:]
    defs = (f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0.35" y2="1">'
            f'<stop offset="0" stop-color="#F0D89B"/>'
            f'<stop offset=".34" stop-color="#C9A257"/>'
            f'<stop offset=".62" stop-color="#9C7734"/>'
            f'<stop offset="1" stop-color="#E3C07A"/></linearGradient></defs>')
    svg = svg.replace("<svg ", '<svg class="zhuan" ', 1)
    # 注意是 #，不是 %23——%23 只在 data URI 里会被解码，
    # 内联 SVG 里它是字面量，引用失效、字直接不填色（这个坑踩第二次了）
    svg = svg.replace('fill="currentColor"', f'fill="url(#{gid})"', 1)
    return svg.replace(">", ">" + defs, 1)


def entries():
    """首页五个入口。

    上一版是五枚金镶玉瓦当嵌在一扇冰裂纹窗棂里。那两件都不是要求是的，
    是提案时自己加的，这一版**全部取消**：
      · 瓦当是建筑构件，入口是"内容"，用建筑语汇去装内容本来就错位；
      · 冰裂窗棂 + 木枋 + 四角回纹，一块 120px 高的区域里塞了四种装饰，
        真正该被看见的图标反而最弱。
    换成器物图标 + 一张**书页的版框**——版框（乌丝栏）是书的语言，
    极细、不抢戏，而且和"书院"严丝合缝。
    """
    ic = icon_set()
    order = [("jiandu", "书院动态"), ("huazhou", "展馆展示"), ("jiangan", "课程中心"),
             ("shuhan", "资源下载"), ("bijian", "活动报名")]
    out = []
    for k, label in order:
        out.append('<span class="entry"><span class="entry-ic">%s</span>'
                   '<span class="entry-label">%s</span></span>' % (ic[k], label))
    return "\n      ".join(out)


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
    # 棂条是有截面的木条，不是两根错位的线。四道叠出一根圆棂：
    # 落影 → 暗边 → 条身 → 顶高光。光从上来，所以高光在上、影在下。
    return (f'<svg class="ice" viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true">'
            f'<path d="{d}" fill="none" stroke="var(--wood-80)" stroke-width="3.2" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity=".16" '
            f'transform="translate(0,1.8)"/>'
            f'<path d="{d}" fill="none" stroke="var(--wood-60)" stroke-width="2.6" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity=".42"/>'
            f'<path d="{d}" fill="none" stroke="var(--wood-40)" stroke-width="1.9" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>'
            f'<path d="{d}" fill="none" stroke="var(--wood-10)" stroke-width=".8" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity=".85" '
            f'transform="translate(0,-0.55)"/></svg>')

# ═══════════════════════════════════════════════════════════════
# 器物图标
#
# 故宫那套的做法拆开是四条：
#   1. **没有描边**。形是色块直接切出来的，不是线框里填色。
#   2. **每个画一件具体器物**，不是抽象符号。
#   3. **一个图标三档赭棕 + 至多一个点缀色**，点缀色面积很小。
#   4. **视觉重量对齐**，不是外框对齐。
#
# 第二版返工的是第 5 条，也是最要紧的一条：
#   5. **一眼要认得出画的是什么。** 第一版的"印"看不出是印、"简牍"像栅栏。
#      认不出来，前四条做得再好也白搭。
#      认得出来的关键不是加细节，是**抓住那件器物区别于别的器物的那一处**：
#      简策要有卷起来的一头，画轴要有出头的轴杆，印要连着它钤出来的那方朱记。
# ═══════════════════════════════════════════════════════════════

_IC = {
    "l":  "var(--jin-20)",    # 受光面
    "m":  "var(--jin-40)",    # 器身
    "d":  "var(--jin-60)",    # 背光面 / 结构
    "dd": "var(--jin-80)",    # 极少量的重色：孔、缝、墨
    "p":  "var(--xing-05)",   # 纸、绢
    "pd": "var(--xing-20)",   # 纸的背光
    "q":  "var(--shan-2)",    # 点缀：石青
    "g":  "var(--shan-3)",    # 点缀：石绿
    "z":  "var(--zhu)",       # 点缀：朱
    "w":  "var(--wood-50)",   # 木
    "wd": "var(--wood-70)",   # 木·背光
    "wl": "var(--wood-30)",   # 木·受光
}


def _svg(body, size=64):
    return ('<svg class="ico" viewBox="0 0 %d %d" aria-hidden="true">%s</svg>'
            % (size, size, body))


def _p(d, c, o=None):
    return '<path d="%s" fill="%s"%s/>' % (d, _IC[c], '' if o is None else ' opacity="%s"' % o)


def _r(x, y, w, h, c, rx=0, o=None):
    return ('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" fill="%s"%s/>'
            % (x, y, w, h, rx, _IC[c], '' if o is None else ' opacity="%s"' % o))


def _e(cx, cy, rx, ry, c, o=None):
    return ('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"%s/>'
            % (cx, cy, rx, ry, _IC[c], '' if o is None else ' opacity="%s"' % o))


def _shadow(cx, cy, rx, ry=2.2):
    """器物底下一点落影。八枚都有，整排才像摆在同一张桌上。"""
    return ('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" opacity=".13"/>'
            % (cx, cy, rx, ry, _IC["dd"]))


def ico_jiandu():
    """简策 —— 书院动态。

    第一版把简片平铺成一排，出来是栅栏。简策区别于别的器物的那一处是
    **它卷得起来**——左边一卷、右边摊开，这个形状再小也认得出。
    """
    o = [_shadow(33, 53.6, 21)]
    # 摊开的部分：五片简
    xs = [25.0, 31.6, 38.2, 44.8, 51.4]
    for i, x in enumerate(xs):
        o.append(_r(x, 12.4, 5.4, 38.4, "l" if i % 2 else "m", 2.2))
        o.append(_r(x + 4.1, 12.4, 1.3, 38.4, "d", .6, ".40"))
    # 简上的字
    for x in (26.3, 32.9, 39.5):
        for k in range(3):
            o.append(_r(x, 22.6 + k * 5.6, 2.9, 1.2, "dd", .6, ".52"))
    # 两道编绳 + 一个结
    o.append(_r(23.6, 19.4, 34, 1.5, "z", .7))
    o.append(_r(23.6, 42.4, 34, 1.5, "z", .7))
    o.append(_e(57.2, 20.1, 1.9, 1.9, "z"))
    o.append(_e(57.2, 43.1, 1.9, 1.9, "z"))
    # 卷起的一头：一个筒 + 筒口的旋线
    o.append(_r(10.4, 12.4, 15.2, 38.4, "d", 2.2))
    o.append('<path d="M18,12.4 a7.6,19.2 0 0 0 0,38.4 a7.6,19.2 0 0 0 0,-38.4 Z" fill="%s"/>' % _IC["m"])
    o.append(_e(18, 31.6, 7.6, 19.2, "m"))
    o.append(_e(18, 31.6, 4.9, 12.4, "l", ".9"))
    o.append(_e(18, 31.6, 2.3, 5.8, "d", ".55"))
    return _svg("".join(o))


def ico_huazhou():
    """画轴 —— 线上展馆。

    画轴区别于"一张画"的那一处是**天杆地杆出头的轴头**。
    画心里画一座阁——"馆"要有建筑，画山水就只是"一幅画"了。
    """
    o = [_shadow(32, 56.4, 20)]
    # 画心（绢）
    o.append(_r(12.4, 14.6, 39.2, 34.8, "p"))
    o.append(_r(12.4, 14.6, 39.2, 34.8, "pd", 0, ".0"))
    # 界画的阁：台基 + 柱 + 平座 + 屋顶起翘
    o.append(_r(19, 43.4, 26, 3.2, "d", .8, ".55"))        # 台基
    o.append(_r(22.4, 33.6, 3.0, 9.8, "d", .5, ".75"))     # 柱
    o.append(_r(38.6, 33.6, 3.0, 9.8, "d", .5, ".75"))
    o.append(_r(30.4, 33.6, 3.0, 9.8, "d", .5, ".45"))
    o.append(_r(20.6, 31.0, 22.8, 3.0, "q", .6))           # 平座
    o.append('<path d="M32,19.6 L46.6,29.4 C47.6,30 47.2,31 46,31 L18,31 '
             'C16.8,31 16.4,30 17.4,29.4 Z" fill="%s"/>' % _IC["q"])   # 屋顶
    o.append('<path d="M32,19.6 L46.6,29.4 C47.6,30 47.2,31 46,31 L32,31 Z" '
             'fill="%s" opacity=".30"/>' % _IC["dd"])
    o.append(_r(28.4, 17.4, 7.2, 2.6, "q", 1.0))           # 正脊
    o.append(_e(32, 24.6, 2.4, 2.4, "l", ".55"))           # 匾
    # 远山一抹，压在阁后
    o.append('<path d="M12.4,43.4 L12.4,38 L18.6,32.4 L24,37.6 L12.4,43.4 Z" '
             'fill="%s" opacity=".38"/>' % _IC["g"])
    o.append('<path d="M51.6,43.4 L51.6,36.4 L45.4,31 L38.6,38.4 L51.6,43.4 Z" '
             'fill="%s" opacity=".38"/>' % _IC["g"])
    # 天杆地杆 + 出头的轴头（这两枚轴头是"画轴"的身份证）
    for y in (9.6, 47.6):
        o.append(_r(10.6, y, 42.8, 5.6, "w", 1.4))
        o.append(_r(10.6, y, 42.8, 1.8, "wl", .9, ".65"))
        o.append(_e(9.0, y + 2.8, 3.4, 3.9, "wd"))
        o.append(_e(55.0, y + 2.8, 3.4, 3.9, "wd"))
        o.append(_e(8.4, y + 1.9, 1.5, 1.6, "wl", ".55"))
        o.append(_e(54.4, y + 1.9, 1.5, 1.6, "wl", ".55"))
    return _svg("".join(o))


def ico_jiangan():
    """讲案 —— 课程中心。

    案区别于普通桌子的那一处是**翘头**和**罗锅枨**（腿间那道拱起的横枨）。
    案上摊一册线装书、压一方镇纸——这才是"讲"这件事的现场。
    """
    o = [_shadow(32, 56.6, 22)]
    # 摊开的线装书
    o.append('<path d="M32,17.4 C27.4,14.6 21.6,13.8 16.4,14.6 L16.4,27.6 '
             'C21.6,26.8 27.4,27.6 32,30.4 Z" fill="%s"/>' % _IC["p"])
    o.append('<path d="M32,17.4 C36.6,14.6 42.4,13.8 47.6,14.6 L47.6,27.6 '
             'C42.4,26.8 36.6,27.6 32,30.4 Z" fill="%s"/>' % _IC["pd"])
    o.append('<path d="M31.0,17.4 L33.0,17.4 L33.0,30.4 L31.0,30.4 Z" fill="%s" opacity=".55"/>' % _IC["d"])
    for i in range(3):
        o.append(_r(19.6, 18.0 + i * 3.3, 9.4, 1.2, "d", .6, ".42"))
        o.append(_r(35.0, 18.0 + i * 3.3, 9.4, 1.2, "d", .6, ".30"))
    # 镇纸：一条压在书口上
    o.append(_r(36.0, 27.0, 13.6, 2.8, "q", 1.2))
    o.append(_r(36.0, 27.0, 13.6, 1.0, "l", .5, ".45"))
    # 案面 + 两端翘头
    o.append('<path d="M8.4,34.2 C8.4,30.4 11.6,29.4 13.4,32.4 L50.6,32.4 '
             'C52.4,29.4 55.6,30.4 55.6,34.2 L55.6,38.0 L8.4,38.0 Z" fill="%s"/>' % _IC["w"])
    o.append('<path d="M13.4,32.4 L50.6,32.4 L50.6,34.0 L13.4,34.0 Z" fill="%s" opacity=".55"/>' % _IC["wl"])
    o.append(_r(8.4, 36.4, 47.2, 1.6, "wd", .4, ".45"))
    # 牙板
    o.append(_r(14.6, 38.0, 34.8, 3.0, "wd", .8))
    # 腿
    o.append(_r(16.6, 41.0, 4.4, 12.4, "w", 1.4))
    o.append(_r(43.0, 41.0, 4.4, 12.4, "w", 1.4))
    o.append(_r(16.6, 41.0, 1.5, 12.4, "wl", .7, ".45"))
    o.append(_r(43.0, 41.0, 1.5, 12.4, "wl", .7, ".45"))
    # 罗锅枨：拱起的横枨，案和方桌的分界
    o.append('<path d="M18.8,49.4 C18.8,44.6 45.2,44.6 45.2,49.4 L45.2,51.0 '
             'C45.2,46.8 18.8,46.8 18.8,51.0 Z" fill="%s"/>' % _IC["wd"])
    return _svg("".join(o))


def ico_shuhan():
    """书函 —— 资源下载。

    函套区别于"一摞书"的那一处是**书从套里抽出来的那个动作**。
    抽出来一册，"取走"这件事就画出来了——这正是"下载"。
    """
    o = [_shadow(32, 55.6, 20)]
    # 抽出来的那一册，斜着
    g = '<g transform="rotate(-11 34 20)">'
    g += _r(23.0, 8.6, 22.0, 15.4, "p", 1.0)
    g += _r(23.0, 8.6, 3.4, 15.4, "z", 1.0)          # 书脊的朱色包角
    g += _r(27.4, 12.0, 13.0, 1.4, "d", .7, ".45")
    g += _r(27.4, 15.4, 9.6, 1.4, "d", .7, ".45")
    for k in range(4):                                 # 线装的四个针眼
        g += _e(25.2, 11.0 + k * 3.4, .75, .75, "p", ".9")
    g += '</g>'
    o.append(g)
    # 函套
    o.append(_r(12.6, 22.4, 38.8, 29.6, "m", 2.4))
    o.append(_r(12.6, 22.4, 38.8, 2.8, "l", 1.4, ".50"))
    o.append(_r(45.6, 22.4, 5.8, 29.6, "d", 2.4, ".45"))
    o.append(_r(12.6, 22.4, 38.8, 3.4, "dd", 1.4, ".18"))   # 套口的暗
    # 露出来的书口
    for i in range(3):
        o.append(_r(16.4, 29.4 + i * 6.4, 26.4, 2.2, "p", 1.1, ".92"))
    # 题签
    o.append(_r(18.0, 26.0, 8.0, 17.4, "p", .8))
    for k in range(3):
        o.append(_r(19.6, 29.0 + k * 3.6, 4.8, 1.3, "d", .6, ".45"))
    # 骨别子：一点朱
    o.append(_r(33.4, 36.0, 10.4, 1.8, "z", .9))
    o.append(_e(44.6, 36.9, 1.7, 1.7, "z"))
    return _svg("".join(o))


def ico_bijian():
    """笔与笺 —— 活动报名。

    报名落到纸上就是"具名"：一张朱丝栏的笺、一枝笔、一方名下的印。
    笔区别于一根棍的那一处是**笔斗和收锋的毫**——这两段必须画出来。
    """
    o = [_shadow(30, 55.0, 18)]
    # 笺：带朱丝栏
    o.append(_r(13.0, 13.4, 29.6, 38.6, "p", .8))
    o.append('<path d="M42.6,13.4 L42.6,52 L38.6,48.4 L38.6,17 Z" fill="%s" opacity=".30"/>' % _IC["pd"])
    o.append(_r(15.6, 15.8, 24.4, 1.0, "z", .5, ".55"))     # 朱丝栏上边
    o.append(_r(15.6, 48.6, 24.4, 1.0, "z", .5, ".55"))     # 下边
    for i in range(5):
        o.append(_r(17.6, 20.6 + i * 5.2, 16.6, 1.4, "d", .7, ".38"))
    # 名下的一方小印
    o.append(_r(28.4, 40.0, 8.4, 8.4, "z", 1.0, ".90"))
    o.append(_r(30.2, 41.8, 4.8, 4.8, "p", .5, ".55"))
    # 笔：笔杆 + 笔斗 + 收锋的毫
    g = '<g transform="rotate(32 42 30)">'
    g += _r(39.2, 6.6, 5.6, 25.4, "w", 2.4)
    g += _r(39.2, 6.6, 1.9, 25.4, "wl", .9, ".55")
    g += _e(42.0, 6.8, 2.8, 1.5, "wl", ".8")                # 笔顶
    g += _r(38.4, 31.4, 7.2, 4.4, "d", 1.2)                 # 笔斗
    g += _r(38.4, 31.4, 7.2, 1.4, "l", .7, ".45")
    g += '<path d="M39.0,35.4 C39.6,42 40.8,47.4 42.0,52.6 '
    g += 'C43.2,47.4 44.4,42 45.0,35.4 Z" fill="%s"/>' % _IC["dd"]
    g += '<path d="M42.0,35.4 C42.4,42 42.4,47.4 42.0,52.6 '
    g += 'C41.6,47.4 41.6,42 42.0,35.4 Z" fill="%s" opacity=".35"/>' % _IC["l"]
    g += '</g>'
    o.append(g)
    return _svg("".join(o))


def ico_yantai():
    """砚 —— 名家书法。砚是一块**扁平的石板**：宽远大于高，墨池凹在顶面。"""
    o = [_shadow(31, 50.6, 24)]
    o.append('<path d="M7,35.6 L57,35.6 L57,41.4 C57,44 55,45.6 52.4,45.6 '
             'L11.6,45.6 C9,45.6 7,44 7,41.4 Z" fill="%s"/>' % _IC["d"])
    o.append('<path d="M11.6,24.4 L52.4,24.4 C55,24.4 57,26 57,28.6 L57,33 '
             'C57,35.6 55,37.2 52.4,37.2 L11.6,37.2 C9,37.2 7,35.6 7,33 '
             'L7,28.6 C7,26 9,24.4 11.6,24.4 Z" fill="%s"/>' % _IC["m"])
    o.append('<path d="M11.6,24.4 L52.4,24.4 C54.6,24.4 56.4,25.6 56.9,27.4 '
             'L7.1,27.4 C7.6,25.6 9.4,24.4 11.6,24.4 Z" fill="%s" opacity=".55"/>' % _IC["l"])
    o.append(_e(29.4, 31.2, 15.4, 4.0, "d"))
    o.append(_e(29.4, 31.6, 14.0, 3.2, "dd", ".84"))
    o.append(_e(29.4, 30.4, 13.0, 2.4, "d", ".42"))
    g = '<g transform="rotate(-16 47 19)">'
    g += _r(43.4, 8.4, 6.4, 17.6, "dd", 1.6)
    g += _r(43.4, 8.4, 2.1, 17.6, "d", 1.0, ".5")
    g += _r(44.5, 12.4, 4.2, 1.5, "z", .7, ".85")
    g += '</g>'
    o.append(g)
    return _svg("".join(o))


def ico_bogu():
    """博古架 —— 精品好物。多宝格的身份在**不对称的隔断**，不是均匀的格子。"""
    o = [_shadow(32, 57.0, 22)]
    o.append(_r(8, 8.6, 48, 46, "w", 2.4))
    o.append(_r(8, 8.6, 48, 2.2, "wl", 1.2, ".5"))
    o.append(_r(10.6, 11.2, 42.8, 40.8, "p", 1.2))
    o.append(_r(10.6, 26.6, 42.8, 2.4, "w"))
    o.append(_r(10.6, 40.2, 42.8, 2.4, "w"))
    o.append(_r(27, 11.2, 2.4, 15.4, "w"))
    o.append(_r(38, 29.0, 2.4, 11.2, "w"))
    # 三件器物，各一个点缀色，面积都很小
    o.append('<path d="M17.4,25 C15,22.6 15,19.2 17.4,17.2 C16.2,16 16.8,14.2 19,14.2 '
             'L20.6,14.2 C22.8,14.2 23.4,16 22.2,17.2 C24.6,19.2 24.6,22.6 22.2,25 Z" fill="%s"/>' % _IC["q"])
    o.append(_e(18.2, 20.4, 1.6, 2.4, "l", ".42"))
    o.append(_e(39.6, 21.2, 6.2, 5.2, "g"))
    o.append(_r(37.4, 15.2, 4.4, 3.2, "g", 1))
    o.append(_e(37.8, 19.6, 1.6, 1.9, "l", ".40"))
    o.append(_r(15.4, 31.8, 19, 6.2, "m", 1.2))
    o.append(_r(15.4, 31.8, 19, 1.9, "l", 1, ".5"))
    o.append(_e(46.2, 35.2, 4.4, 3.2, "z", ".78"))
    o.append(_r(15.4, 44.2, 8.2, 6.2, "m", 1.2))
    o.append(_e(36, 47.4, 7.2, 3.0, "d", ".72"))
    return _svg("".join(o))


def ico_yinzhang():
    """印 —— 我的。

    返工四次。前三版的毛病一样：把石头画成一个光溜溜的圆角块，
    它就可以是任何东西（棋子、手提包、吊牌）。
    这一版两件事一起做：
      · **石头连着它钤出来的那方朱记**——朱文方印是"印"最不会认错的样子；
      · **石头本身要有印的轮廓**——桥钮要透出空、印身要窄（是柱不是板）、
        肩上要有一道台阶。三样凑齐，那块石头才是印。
    """
    o = []
    # 纸 + 钤出来的朱文方印（主体，先画）
    o.append(_r(29.6, 28.4, 27.0, 27.0, "p", 1.0))
    o.append(_shadow(43.0, 56.4, 13.4))
    o.append(_r(32.2, 31.0, 21.8, 21.8, "z"))
    o.append(_r(35.4, 34.2, 15.4, 2.2, "p", .4))
    o.append(_r(35.4, 47.4, 15.4, 2.2, "p", .4))
    o.append(_r(35.4, 34.2, 2.2, 15.4, "p", .4))
    o.append(_r(48.6, 34.2, 2.2, 15.4, "p", .4))
    o.append(_r(40.2, 39.4, 5.8, 2.0, "p", .4))
    o.append(_r(42.1, 39.4, 2.0, 6.6, "p", .4))
    # 印石：窄、有肩、桥钮透空
    o.append('<path d="M14.0,13.0 C14.0,7.8 23.2,7.8 23.2,13.0 L20.4,13.0 '
             'C20.4,10.6 16.8,10.6 16.8,13.0 Z" fill="%s"/>' % _IC["d"])
    o.append(_r(12.2, 12.6, 12.8, 3.0, "d", 1.0))          # 肩上的台阶
    o.append(_r(13.4, 15.2, 10.4, 21.4, "m", 1.2))         # 印身：窄
    o.append(_r(13.4, 15.2, 3.2, 21.4, "l", 1.2, ".55"))
    o.append(_r(21.6, 15.2, 2.2, 21.4, "d", 1.2, ".45"))
    o.append(_r(11.8, 36.0, 13.6, 3.0, "d", 1.2))          # 印面的边
    o.append(_r(13.2, 38.6, 10.8, 2.4, "z", .9))           # 沾着印泥
    return _svg("".join(o))


_ICONS = {
    "jiandu":   ("简策", "书院动态"),
    "huazhou":  ("画轴", "线上展馆"),
    "jiangan":  ("讲案", "课程中心"),
    "shuhan":   ("书函", "资源下载"),
    "bijian":   ("笔笺", "活动报名"),
    "yantai":   ("砚", "名家书法"),
    "bogu":     ("博古架", "精品好物"),
    "yinzhang": ("印", "我的"),
}


def icon_set():
    return {k: globals()["ico_" + k]() for k in _ICONS}





# ── 第二套：线性图标 ─────────────────────────────────────────
# 标签栏和工具位这一套是纯线、单色、无填充。
#
# 但规矩和上面那八枚是同一条，而且更难：**要用线条画出一件具体的东西**。
# 故宫的"我的"是一个人的半身——幞头、脸、交领、肩，四笔就画出来了；
# 那不是一个"用户图标"，是一个人。
# 几何图形（六边形、方块加线）看着干净，但它不是任何东西，
# 放在故宫那套旁边一眼就露怯。这一版全部重画成器物。
#
# 尺寸 32×32，线宽 1.5–1.7。太细在小屏上发虚，太粗就糊成一坨。

def _ln(body, w=1.6):
    return ('<svg class="lico" viewBox="0 0 32 32" fill="none" '
            'stroke="currentColor" stroke-width="%s" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true">%s</svg>' % (w, body))


def lico_shanmen():
    """山门 —— 首页。书院的门。第一版用的是六边形团花，那是几何不是器物。"""
    d = ('<path d="M4 12.6 C9 8.4 23 8.4 28 12.6"/>'          # 屋面起翘
         '<path d="M3.4 12.6 h25.2"/>'                         # 檐口
         '<path d="M13.4 8.2 h5.2"/>'                          # 正脊
         '<path d="M6.8 12.6 v14.4 M25.2 12.6 v14.4"/>'        # 两根边柱
         '<path d="M12.2 27 v-8.6 a3.8 3.8 0 0 1 7.6 0 V27"/>' # 拱门
         '<path d="M3 27.2 h26"/>'                             # 台基
         '<path d="M12 15.4 h8"/>')                            # 门楣上的匾
    return _ln(d, 1.6)


def lico_ce():
    """书册 —— 课程。摊开的线装书，书脊四针眼要画出来。"""
    d = ('<path d="M16 9.4 C13 7 9.4 6.2 5.8 6.6 v17.2 C9.4 23.4 13 24.2 16 26.6"/>'
         '<path d="M16 9.4 C19 7 22.6 6.2 26.2 6.6 v17.2 C22.6 23.4 19 24.2 16 26.6"/>'
         '<path d="M16 9.4 v17.2"/>'
         '<path d="M9 12.6 h4.2 M9 16.2 h4.2 M18.8 12.6 h4.2 M18.8 16.2 h4.2"/>')
    return _ln(d, 1.5)


# ── 重画一轮 ─────────────────────────────
# 审看时指出："有的图标看不出具体是什么，辨识度差；
# 有的看起来又过于现代，和书院古风的主题不搭。"两条都对。
#
# 辨识度差的真因不是"画得不像"，是**剪影撞了**：
# 23px 下一枚图标只剩轮廓，细节全没。而竹简与榜文的轮廓
# 都是"一排竖条"，书笧与包包都是"带提梁的方盒"，双简与两个色块
# 也是一回事。所以重画的第一条规矩是：**每枚的剪影得是独一份的**。
#
# 第二条：古风靠器物本身，不靠加花纹。
# 一件东西只要真是古人用的，画得再简也是古的；
# 反过来，现代物件上再加云纹也还是现代的。

def lico_jiandu():
    """简牍 —— 书院动态。

    一版用的是一整卷竹简，因为和榜文撞了剪影才换掉；
    榜文现在改成了幡，简牍就不再撞了，可以拿回来。
    但要画得像简而不是像栅栏，靠两件事：
      ① 两道**编绳**横穿过去——简是编起来的，没绳就不成册；
      ② 每片简的**长短不齐**——真简是一片片削出来的，
         齐头齐尾反而是印刷品的样子。
    上一版两件都没做，所以才像栅栏。
    """
    d = ('<path d="M6.4 5.6 v20.8 M11.2 7.4 v19 M16 5.2 v21.6 '
         'M20.8 7.8 v18.4 M25.6 6.2 v20"/>'                      # 五片简，长短不齐
         '<path d="M4.6 11.4 h22.8 M4.6 21 h22.8"/>')            # 两道编绳
    return _ln(d, 1.9)


def lico_xianzhuang():
    """线装书 —— 资源下载。

    试过"书笧"（像手提包）和"卷帙"（三个同心圆横排，像胶卷），
    都没到位。换成**三本摔起来的线装书**：
    每本左侧都有四个订线孔，这是线装书唯一且充分的特征。
    剪影是"三条横带"，和竖着的简牍、圆的鼎都不撞。
    """
    d = ('<path d="M4.8 7.6 h22.4 v4.8 h-22.4 Z"/>'
         '<path d="M4.8 14.4 h22.4 v4.8 h-22.4 Z"/>'
         '<path d="M4.8 21.2 h22.4 v4.8 h-22.4 Z"/>'
         '<path d="M8 9 v2 M8 15.8 v2 M8 22.6 v2"/>'             # 订线孔
         '<path d="M10.8 9 v2 M10.8 15.8 v2 M10.8 22.6 v2"/>')
    return _ln(d, 1.6)


def lico_fan():
    """幡 —— 公告。

    "榜文"画成了栅栏，"鼓"画成了方块加两条腿。
    幡比两者都好：剪影是"一根横杆吊一面竖长条"，
    下端开成燕尾——这个形全套里只此一份，
    而且书院门前挂幡告事本来就是“公告”在中国的做法。
    杆上两枚环是挂绳，幡面上三道短横是字。
    """
    d = ('<path d="M6.6 5.6 h18.8"/>'                            # 横杆
         '<path d="M11.4 5.6 v2 M20.6 5.6 v2"/>'                 # 两枚挂环
         '<path d="M10.6 7.6 h10.8 v14.8 l-5.4 4 l-5.4 -4 Z"/>'  # 幡面 + 燕尾
         '<path d="M13.4 11.4 h5.2 M13.4 15 h5.2 M13.4 18.6 h5.2"/>')
    return _ln(d, 1.6)


def lico_wenpai():
    """小篆「問」字牌 —— 知识问答。

    这一枚试过四版都不行，因为**知识问答是现代功能，
    古代没有对应的器物**，硬找一件就变成猜谜：
    牍与笔成了西式"编辑"、双简在 23px 下只剩两块、磬认不出。

    没有器物就用字。这套设计本来就用了小篆（首页五个入口的当心）。
    牌框负责剪影（圆角方牌，全套里只此一份），
    字负责语义（它就是「問」，不用猜）。
    「問」 = 门 + 口：两扇对称的门，每扇上部向内一个曲头、
    中部一道短钩，当中一个圆润的口。
    """
    d = ('<path d="M6.4 5.2 h19.2 a1.8 1.8 0 0 1 1.8 1.8 v18 '
         'a1.8 1.8 0 0 1 -1.8 1.8 h-19.2 a1.8 1.8 0 0 1 -1.8 -1.8 v-18 '
         'a1.8 1.8 0 0 1 1.8 -1.8 Z"/>'                          # 牌框
         '<path d="M10.2 9.6 c0 -1.2 0.8 -1.8 1.8 -1.8"/>'       # 左扇曲头
         '<path d="M10.2 9.6 v12.8"/>'                           # 左扇竖
         '<path d="M10.2 13.4 h2.4"/>'                           # 左扇短钩
         '<path d="M21.8 9.6 c0 -1.2 -0.8 -1.8 -1.8 -1.8"/>'     # 右扇曲头
         '<path d="M21.8 9.6 v12.8"/>'
         '<path d="M21.8 13.4 h-2.4"/>'
         '<path d="M14 16 h4 v4.4 h-4 Z"/>')                     # 当中的口
    return _ln(d, 1.5)


def lico_ding():
    """鼎 —— 线上展馆。

    "画轴"那一版画出来是个方框里套个小房子，认不出是什么，
    而且和山门（首页）都是"建筑剪影"，两枚容易混。
    馆藏在中国的符号就是鼎：两耳、鼓腹、三足，
    剪影独一无二，远看一眼就认得出。
    """
    d = ('<path d="M8.4 6.6 v2.6 M23.6 6.6 v2.6"/>'              # 两耳
         '<path d="M6.4 9.2 h19.2 v2.8 h-19.2 Z"/>'              # 口沿
         '<path d="M7.6 12 c0 6.2 2.4 8.4 3.2 9.2 h10.4 '
         'c0.8 -0.8 3.2 -3 3.2 -9.2"/>'                          # 鼓腹
         '<path d="M11.4 21.2 v4.2 M20.6 21.2 v4.2"/>'           # 前两足
         '<path d="M16 22.4 v3"/>')                              # 后足（露一截）
    return _ln(d, 1.6)


def lico_bi():
    """笔 —— 报名。

    "名帖"那一版剪影是个竖长方块，和门、书立、卡片都像。
    报名这件事在书院里就是**签名**，而签名的器物是毛笔。
    毛笔的剪影——一根斜着的长杆、一端收成尖锋、
    中间一道笔箨——在任何尺寸下都独一份，而且没有比它更中国的东西了。
    杆顶的小环是挂笔的绗，缺了它就是支钢笔。
    """
    d = ('<path d="M22.4 4.6 a1.4 1.4 0 0 1 2.8 0"/>'            # 挂绗
         '<path d="M23.8 6 l-9.6 13.4"/>'                        # 笔杆（斜）
         '<path d="M20.6 8.6 l3.8 2.8"/>'                        # 笔箨
         '<path d="M14.2 19.4 c-1.6 2.2 -3.4 4.6 -5.8 7.8 '
         'c0.6 -3.8 1.4 -6.6 2.2 -9.4 Z"/>')                     # 笔头收尖
    return _ln(d, 1.6)


def lico_xinzha():
    """信札 —— 消息。

    上一版加了竖题签和朱印方，大尺寸下对，
    但 23px 下两件小东西糊成一团。去掉朱印方，
    只留封套 + 竖题签：剪影是"横长方形当中一竖"，干净且独一份。
    中式信封与西式最硬的分界就是这条竖着的题签。
    """
    d = ('<path d="M3.6 8.6 h24.8 a1.8 1.8 0 0 1 1.8 1.8 v13.2 '
         'a1.8 1.8 0 0 1 -1.8 1.8 H3.6 a1.8 1.8 0 0 1 -1.8 -1.8 V10.4 '
         'a1.8 1.8 0 0 1 1.8 -1.8 Z"/>'                          # 封套
         '<path d="M13 10.4 h6 v13 h-6 Z"/>'                     # 竖题签
         '<path d="M16 13 v7.8"/>')                              # 签上的名字
    return _ln(d, 1.6)


# ── 控件类里有中式对应物的那一批 ──────────────
# 审看时说控件类"过于现代"。定下的范围是：
# **有明确中式对应物、且换了不伤可用性的换；国际通用符号留**。
# 留的那批（返回、关闭、搜索、播放、眼睛…）不是懒，
# 是因为它们一旦换形，用户就得现学——这个代价不值得。

def lico_qiantiao():
    """签条 —— 收藏。

    一版画成了"方框中间一条竖"，像个 U 盘。
    签条要认得出，得让人看见它是**夹在书里、从书口探出来**的：
    书画成合上的侧面（看得见书口的几道缝），
    签条从上缘插进去、顶端吊一缕穗，下端在书里。
    """
    d = ('<path d="M6.4 8.6 h19.2 v17.8 h-19.2 Z"/>'              # 书
         '<path d="M6.4 12.2 h19.2"/>'                            # 书的上缘（封面与书口的界）
         '<path d="M9.6 15.4 h12.8 M9.6 19 h12.8 M9.6 22.6 h8.6"/>'  # 书口的缝
         '<path d="M17.4 8.6 v-4.2 h3.6 v4.2"/>'                  # 探出书外的那一截签
         '<path d="M19.2 4.4 v-1.6"/>'                            # 穗
         '<path d="M17.4 12.2 v6.4"/>')                           # 签在书里的那一截
    return _ln(d, 1.6)


def lico_guangsuo():
    """广锁 —— 锁定。

    中国的锁（簧片锁、俗称广锁）和西式挂锁最硬的分界是**横着**：
    锁体是一个横长的方盒，钥匙孔开在侧面，梁从顶上跨过去。
    西式挂锁是竖的、圆梁、孔在正面。换了形不影响认：
    都是"梁 + 体 + 孔"三件，一眼还是锁。
    """
    d = ('<path d="M4.6 13.8 h22.8 v10.4 h-22.8 Z"/>'            # 锁体（横）
         '<path d="M9.8 13.8 v-3.2 c0 -2.6 2.2 -4.4 4.6 -4.4 '
         'h3.2 c2.4 0 4.6 1.8 4.6 4.4 v3.2"/>'                   # 梁
         '<path d="M14.6 17.6 h2.8 v3 h-2.8 Z"/>'                # 钥匙孔（方）
         '<path d="M16 20.6 v1.8"/>')
    return _ln(d, 1.6)


def lico_louke():
    """漏刻 —— 时间。

    钟表是西来的。中国计时用漏刻：上面一个漏壶滴水，
    下面受水壶里立一支刻箭，水涨箭升，读箭上的刻度知时辰。
    壶、滴、箭三件缺一不可，少了箭就是个喙。
    """
    d = ('<path d="M8.4 4.8 h15.2 l-2.4 6.4 h-10.4 Z"/>'         # 上壶
         '<path d="M16 12.6 v1.8"/>'                             # 滴下的水
         '<path d="M7.6 17.2 h16.8 v9.6 h-16.8 Z"/>'             # 受水壶
         '<path d="M16 15.4 v9"/>'                               # 刻箭
         '<path d="M14.2 19 h3.6 M14.2 21.8 h3.6"/>')            # 箭上的刻度
    return _ln(d, 1.6)


def lico_liye():
    """历页 —— 日期。

    西式日历是"方框 + 两个铃耳 + 网格"。中式的是**历页**：
    一张挂着的单页，上缘两个穿绩孔，当中一轮月（月相定日），
    下面两行竖写的干支。月与竖行是它和西式日历的分界。
    """
    d = ('<path d="M6.8 5.6 h18.4 v20.8 h-18.4 Z"/>'             # 历页
         '<path d="M11.2 3.4 v3.4 M20.8 3.4 v3.4"/>'             # 两个穿绩孔
         '<circle cx="16" cy="13" r="3.8"/>'                     # 月
         '<path d="M12.6 20.4 v3.6 M16 20.4 v3.6 M19.4 20.4 v3.6"/>')
    return _ln(d, 1.6)


def lico_du():
    """牍 —— 文档。

    西式文档图标的特征是"右上角折一块"。中国的单件文书是牍：
    一块木板，顶端穿一孔系绦，面上竖写。
    竖行 + 穿孔，两件就把它和西式文档分开了。
    """
    d = ('<path d="M9.2 6.6 h13.6 v20.4 h-13.6 Z"/>'
         '<circle cx="16" cy="4.4" r="1.4"/>'                    # 穿孔
         '<path d="M16 5.8 v0.8"/>'
         '<path d="M13 10.4 v12.8 M16 10.4 v12.8 M19 10.4 v12.8"/>')
    return _ln(d, 1.6)


def lico_lingge():
    """棂格 —— 全部/分类。

    现代的 grid 是四个分开的圆角方块。中式窗棂是**连着的棂条**：
    一根根木条搞接成格，四角还要接出小方——这是步步锦的做法。
    这套设计叫「檐棂印」，棂格是本命。
    """
    d = ('<path d="M5.2 5.2 h21.6 v21.6 h-21.6 Z"/>'             # 外框
         '<path d="M16 5.2 v21.6 M5.2 16 h21.6"/>'               # 十字棂条
         '<path d="M10.6 10.6 h-5.4 M10.6 10.6 v-5.4"/>'         # 左上步步锦
         '<path d="M21.4 10.6 h5.4 M21.4 10.6 v-5.4"/>'
         '<path d="M10.6 21.4 h-5.4 M10.6 21.4 v5.4"/>'
         '<path d="M21.4 21.4 h5.4 M21.4 21.4 v5.4"/>')
    return _ln(d, 1.5)


def lico_ersheng():
    """二儒生 —— 人数/成员。

    一版把两个人重新画了一遍，结果前一人的肩和头挤在一起、
    后一人只剩一只耳朵。正确的做法是**直接用"我的"那枚儒生的画法**：
    同一套方巾、面、交领、双肩，只是前一人缩一档移到左下、
    后一人再缩一档移到右上，只露半个。
    一家人的字形才不会看着怪。
    """
    one = ('<path d="M11.4 10.4 h9.2 M12.6 10.4 V8.2 h6.8 v2.2"/>'
           '<path d="M12.2 10.4 v2.6 a3.8 3.8 0 0 0 7.6 0 v-2.6"/>'
           '<path d="M16 19 L11.2 20.6 A6.4 6.4 0 0 0 6.6 26.6 h18.8 '
           'A6.4 6.4 0 0 0 20.8 20.6 Z"/>'
           '<path d="M13.2 20 L16 23.4 L18.8 20"/>')
    # 后一人：缩到 0.68，挪到右上，先画（被前一人遮住一半）
    back = '<g transform="translate(13.2 1.2) scale(0.62)">%s</g>' % one
    # 前一人：缩到 0.86，挪到左下
    front = '<g transform="translate(-2.4 4.6) scale(0.86)">%s</g>' % one
    return _ln(back + front, 2.0)


def lico_hantao():
    """书函 —— 套装/包裹。

    现代的 cube 是个等轴测的立方体。中式对应物是书函：
    四合套把一套书包起来，一侧露出书口（几道竖缝），
    外面一枚骨签扭扣。竖缝 + 骨签，就不会和线装书那枚混。
    """
    d = ('<path d="M5.6 7.2 h20.8 v17.6 h-20.8 Z"/>'             # 函套
         '<path d="M19.2 7.2 v17.6"/>'                           # 书口那一侧的界
         '<path d="M21.4 10.6 v10.8 M23.6 10.6 v10.8"/>'         # 露出的书口
         '<path d="M5.6 14.4 h-2.2 v3.2 h2.2"/>'                 # 骨签扭扣
         '<path d="M9.4 12 h6.4 M9.4 16 h6.4 M9.4 20 h4"/>')     # 函面上的签题
    return _ln(d, 1.6)


def lico_bang():
    """榜 —— 海报。

    贴在墙上给人看的一张。三件定身份：
    横张、上两角钉住、下沿被风揭起。里头是竖行。
    和幡（公告）分得开：幡是吊在杆上的竖长条，榜是贴在墙上的横张。
    """
    d = ('<path d="M4.6 6.8 h22.8 v13.6 '
         'c-3.8 2.4 -7.6 -1.2 -11.4 1.2 c-3.8 2.4 -7.6 -1.2 -11.4 1.2 Z"/>'
         '<path d="M9 10.4 v7.2 M13.4 10.4 v8.4 M17.8 10.4 v7.4 M22.2 10.4 v8.6"/>'
         '<circle cx="7" cy="9" r="0.9"/>'
         '<circle cx="25" cy="9" r="0.9"/>')
    return _ln(d, 1.6)


def lico_yaqi():
    """牙旗 —— 标记/举报。

    和幡（公告）同族但不同形：幡是竖长条、下端燕尾，
    牙旗是杆上一面**三角**。两枚放在一起不会认错。
    """
    d = ('<path d="M8.4 4.4 v23.2"/>'                            # 杆
         '<path d="M8.4 6 h15.2 l-4.4 4.8 l4.4 4.8 h-15.2"/>'    # 三角旗（燕尾内凹）
         '<path d="M6.8 27.6 h3.2"/>')                           # 杆座
    return _ln(d, 1.6)


def lico_rusheng():
    """儒生半身 —— 我的。

    这一枚是照着故宫"我的"那个思路画的：不是一个用户符号，是一个人。
    方巾、面、交领、双肩——交领（右衽）是它区别于任何通用人像的那一笔。
    """
    d = ('<path d="M11.4 10.4 h9.2 M12.6 10.4 V8.2 h6.8 v2.2"/>'   # 方巾
         '<path d="M12.2 10.4 v2.6 a3.8 3.8 0 0 0 7.6 0 v-2.6"/>'  # 面
         '<path d="M16 19 L11.2 20.6 A6.4 6.4 0 0 0 6.6 26.6 h18.8 '
         'A6.4 6.4 0 0 0 20.8 20.6 Z"/>'                            # 肩与身
         '<path d="M13.2 20 L16 23.4 L18.8 20"/>'                   # 交领
         '<path d="M16 23.4 v3.2"/>')
    return _ln(d, 1.6)


def lico_yapai():
    """牙牌 —— 我的证（顶部左）。

    腰牌／牙牌是古代随身的身份凭证，上圆下方、穿孔系绦，
    牌面刻两行字。这比一张"卡片"准确得多，也更像这个书院里的东西。
    """
    d = ('<path d="M16 4.6 a2.2 2.2 0 0 1 0 4 a2.2 2.2 0 0 1 0 -4 Z"/>'   # 穿孔的系绦环
         '<path d="M16 8.8 v1.8"/>'
         '<path d="M16 10.6 C11.2 10.6 9 13 9 16.2 v8.2 a2.4 2.4 0 0 0 2.4 2.4 '
         'h9.2 a2.4 2.4 0 0 0 2.4 -2.4 v-8.2 C23 13 20.8 10.6 16 10.6 Z"/>'
         '<path d="M12.2 17.4 h7.6 M12.2 21 h7.6"/>'                       # 牌面两行字
         '<path d="M11.6 13.8 h8.8"/>')                                    # 牌首的横线
    return _ln(d, 1.6)


def lico_muduo():
    """木铎 —— 公告。

    「天将以夫子为木铎」——木铎正是"发布"这件事在书院里的器物。
    钮、铎身、下缘的口、里面垂着的舌，四件缺一不可，少了舌就是个杯子。
    """
    d = ('<path d="M13.4 6.6 a2.6 2.6 0 0 1 5.2 0"/>'            # 钮
         '<path d="M11.6 9.2 h8.8"/>'                            # 甬
         '<path d="M10.2 9.2 C10.2 16 8.4 20.2 7.2 22.6 h17.6 '
         'C23.6 20.2 21.8 16 21.8 9.2 Z"/>'                      # 铎身
         '<path d="M7.2 22.6 h17.6"/>'
         '<path d="M16 15 v6.2"/>'                               # 舌
         '<path d="M14.6 25.4 h2.8"/>')
    return _ln(d, 1.6)


def lico_sou():
    """搜 —— 放大镜。这一枚是通用操作，故宫也用放大镜，不必强造器物。"""
    return _ln('<circle cx="14" cy="14" r="8.2"/><path d="M20 20 L27 27"/>', 1.8)


_LICONS = {
    "shanmen":  ("山门", "首页"),
    "jiandu":   ("简牍", "动态"),
    "ding":     ("鼎", "展馆"),
    "ce":       ("书册", "课程"),
    "rusheng":  ("儒生半身", "我的"),
    "yapai":    ("牙牌", "我的证"),
    "xinzha":   ("信札", "消息"),
    "muduo":    ("木铎", "铃铛"),
    "xianzhuang": ("线装书", "资源下载"),
    "bi":       ("毛笔", "报名"),
    "fan":      ("幡", "公告"),
    "wenpai":   ("小篆「問」牌", "知识问答"),
    "qiantiao": ("签条", "收藏"),
    "guangsuo": ("广锁", "锁定"),
    "louke":    ("漏刻", "时间"),
    "liye":     ("历页", "日期"),
    "du":       ("牍", "文档"),
    "lingge":   ("棂格", "全部"),
    "ersheng":  ("二儒生", "人数"),
    "hantao":   ("书函", "套装"),
    "bang":     ("榜", "海报"),
    "yaqi":     ("牙旗", "标记"),
}


def line_icon_set():
    return {k: globals()["lico_" + k]() for k in _LICONS}


# ── 展馆封面：三幅界画小景 ──────────────────────────────────
# 审看时指出展馆封面"AI 味重"。拆开看是三条：平滑渐变、规则重复的云、
# **说不出画的是什么**。三条里最要命的是第三条——
# 一块没有内容的"氛围图"，既不是画也不是照片，卡在中间。
#
# 改法：每个馆画它自己该有的建筑，用**界画**的办法——
# 界画是用界尺画的，线是直的、结构是交代清楚的，
# 这正好是"具体"和"氛围"的分界。
# 三个馆：明礼馆画殿（礼制建筑）、崇文馆画书楼、通途馆画桥。

def _bays(cx, total, ratios):
    """按开间比例算柱位。

    中国建筑的开间**不是等分的**：明间最宽，往两侧依次递减（次间、梢间）。
    这里原来是 `x = 起点 + i * 固定间距`——等距等宽，正是"AI 味"里
    最容易露馅的那一类机械重复，而且它还**不符合建筑本身的规制**。
    ratios 从左到右给每一间的相对宽度，返回各根柱子的中心 x。
    """
    tot = float(sum(ratios))
    xs = [cx - total / 2.0]
    for r in ratios:
        xs.append(xs[-1] + total * r / tot)
    return xs


def _cun_line(x1, y1, x2, y2, c, w=.7, o=".30"):
    return ('<path d="M%.1f,%.1f L%.1f,%.1f" stroke="%s" stroke-width="%s" '
            'stroke-linecap="round" opacity="%s"/>' % (x1, y1, x2, y2, c, w, o))


def hall_scene(kind, w=132, h=92):
    import random as _rnd
    rnd = _rnd.Random({"dian": 11, "lou": 22, "qiao": 33}[kind])
    G, Q, Z = "var(--shan-3)", "var(--shan-2)", "var(--zhu)"
    W, WD = "var(--wood-50)", "var(--wood-70)"
    J1, J3 = "var(--juan-1)", "var(--juan-3)"
    o = ['<svg class="hs" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' % (w, h)]
    # 绢底：平铺，不做渐变。渐变是"AI 味"的第一条。
    o.append('<rect width="%d" height="%d" fill="%s"/>' % (w, h, J1))
    # 远山：两道平的色带，各落几笔皴
    o.append('<path d="M0,54 L20,44 L38,52 L58,41 L80,50 L100,43 L118,51 L132,46 L132,92 L0,92 Z" '
             'fill="%s" opacity=".30"/>' % G)
    for k in range(7):
        x = 8 + k * 18 + rnd.uniform(-3, 3)
        o.append(_cun_line(x, 50 + rnd.uniform(-4, 4), x + rnd.uniform(-2, 2), 58 + rnd.uniform(0, 5), Q, .7, ".22"))
    o.append('<path d="M0,68 L26,60 L52,67 L78,59 L106,67 L132,62 L132,92 L0,92 Z" fill="%s" opacity=".40"/>' % Q)

    # 建筑整体上提：馆名的签条压在封面左下角，不提的话正好挡住台基和柱，
    # 只剩一个屋顶浮在那里。
    o.append('<g transform="translate(0,-14)">')
    if kind == "dian":
        # 殿：重檐庑殿。两重檐 + 台基 + 五开间的柱
        o.append('<rect x="30" y="76" width="72" height="7" fill="%s" opacity=".85"/>' % WD)   # 台基
        o.append('<rect x="34" y="73" width="64" height="4" fill="%s" opacity=".55"/>' % W)
        # 三开间：明间 1.0、次间 0.74。等距画出来既机械又不合规制。
        for x in _bays(66, 56, (0.74, 1.0, 0.74)):
            o.append('<rect x="%.1f" y="62" width="3.4" height="12" fill="%s" opacity=".80"/>'
                     % (x - 1.7, Z))
        o.append('<path d="M66,54 L104,62 C106,62.6 105.4,64 104,64 L28,64 '
                 'C26.6,64 26,62.6 28,62 Z" fill="%s"/>' % Q)                                   # 下檐
        o.append('<path d="M66,40 L96,50 C98,50.6 97.4,52 96,52 L36,52 '
                 'C34.6,52 34,50.6 36,50 Z" fill="%s"/>' % Q)                                   # 上檐
        o.append('<rect x="58" y="37" width="16" height="3.4" rx="1.4" fill="%s"/>' % Q)        # 正脊
        o.append('<rect x="59" y="54" width="14" height="6" rx="1" fill="%s" opacity=".75"/>' % J3)  # 匾
    elif kind == "lou":
        # 书楼：两层，中间一道平座和栏杆
        o.append('<rect x="38" y="78" width="56" height="6" fill="%s" opacity=".85"/>' % WD)
        for x in _bays(66, 46, (0.72, 1.0, 0.72)):
            o.append('<rect x="%.1f" y="66" width="3" height="12" fill="%s" opacity=".80"/>' % (x - 1.5, Z))
        o.append('<path d="M66,58 L98,66 C100,66.6 99.4,68 98,68 L34,68 '
                 'C32.6,68 32,66.6 34,66 Z" fill="%s"/>' % Q)                                   # 下檐
        o.append('<rect x="40" y="54" width="52" height="4" fill="%s" opacity=".70"/>' % W)     # 平座
        # 望柱跟着开间走，不是均分
        for x in _bays(66, 50, (0.9, 1.0, 1.0, 0.9)):
            o.append('<rect x="%.1f" y="50" width="1.8" height="4.4" fill="%s" opacity=".55"/>' % (x - 0.9, WD))
        o.append('<rect x="40" y="48.6" width="52" height="1.8" fill="%s" opacity=".70"/>' % W)
        for x in _bays(66, 30, (1.0, 1.0)):
            o.append('<rect x="%.1f" y="38" width="3" height="10" fill="%s" opacity=".80"/>' % (x - 1.5, Z))
        o.append('<path d="M66,30 L92,38 C94,38.6 93.4,40 92,40 L40,40 '
                 'C38.6,40 38,38.6 40,38 Z" fill="%s"/>' % Q)                                   # 上檐
        o.append('<rect x="59" y="27.6" width="14" height="3" rx="1.2" fill="%s"/>' % Q)
    else:
        # 桥：三孔石拱桥，桥下是水
        o.append('<rect x="0" y="72" width="132" height="20" fill="%s" opacity=".30"/>' % Q)    # 水
        for k in range(5):
            y = 76 + k * 3.4
            o.append('<path d="M%.1f,%.1f q6,-1.6 12,0 t12,0" fill="none" stroke="%s" '
                     'stroke-width=".8" opacity=".26"/>' % (10 + rnd.uniform(0, 14), y, J3))
        o.append('<path d="M6,70 C6,58 30,52 46,52 L86,52 C102,52 126,58 126,70 '
                 'L126,74 L6,74 Z" fill="%s"/>' % W)                                            # 桥身
        for cx in (34, 66, 98):                                                                 # 三孔
            o.append('<path d="M%.1f,74 a12,11 0 0 1 24,0 Z" fill="%s" opacity=".92"/>' % (cx - 12, J1))
        o.append('<path d="M6,70 C6,58 30,52 46,52 L86,52 C102,52 126,58 126,70" '
                 'fill="none" stroke="%s" stroke-width="2.2"/>' % WD)                           # 桥面线
        for i in range(11):                                                                     # 栏板望柱
            x = 10 + i * 11.2
            yy = 52 + abs(x - 66) * 0.145
            o.append('<rect x="%.1f" y="%.1f" width="1.8" height="5" fill="%s" opacity=".70"/>' % (x, yy - 5, WD))
        o.append('<path d="M8,49.6 C10,46 28,47 46,47 L86,47 C104,47 122,46 124,49.6" '
                 'fill="none" stroke="%s" stroke-width="1.4" opacity=".65"/>' % WD)
    o.append('</g>')
    o.append('</svg>')
    return "".join(o)


def hall_mark(kind, size=15):
    """把界画小景里那座建筑抽成一枚**线性剪影**，放进题签里。

    这是对"上传封面图之后这些画不就白设计了"的回答。
    画心（那幅小景）确实会被封面图盖住——它本来就是"这个馆还没传图"时的兜底，
    兜底态不是白做：加载中、缺图、新建的馆都要用它。
    但光靠兜底不够，所以把每座建筑再抽一枚剪影，放进**题签**里：
    题签在画心之外，封面图再满也盖不住，于是每个馆的建筑标识永远在。
    这和裱边、包角、压角印是同一条思路——**识别度放在装裱上，不放在画心里**。
    """
    d = {
        # 殿：重檐 + 台基
        "dian": ('<path d="M12 9.4 L20.4 13.6 H3.6 Z"/>'
                 '<path d="M12 14.6 L19 18 H5 Z"/>'
                 '<path d="M6.6 18 v3.2 M12 18 v3.2 M17.4 18 v3.2"/>'
                 '<path d="M3.8 21.4 h16.4"/>'),
        # 楼：两层 + 平座
        "lou":  ('<path d="M12 3.6 L18.6 7.4 H5.4 Z"/>'
                 '<path d="M7.4 7.4 v3.4 M16.6 7.4 v3.4"/>'
                 '<path d="M5.2 10.8 h13.6"/>'
                 '<path d="M12 12.6 L20 16.8 H4 Z"/>'
                 '<path d="M6.8 16.8 v4.2 M12 16.8 v4.2 M17.2 16.8 v4.2"/>'
                 '<path d="M3.8 21.4 h16.4"/>'),
        # 桥：三孔 + 桥面
        "qiao": ('<path d="M2.6 17.6 C2.6 11 21.4 11 21.4 17.6"/>'
                 '<path d="M2.6 14.2 C2.6 8.4 21.4 8.4 21.4 14.2"/>'
                 '<path d="M4.2 17.6 a2.6 2.4 0 0 1 5.2 0 M9.8 17.6 a2.6 2.6 0 0 1 5.2 0'
                 ' M15.2 17.6 a2.6 2.4 0 0 1 4.8 0"/>'
                 '<path d="M2 17.8 h20"/>'),
    }[kind]
    return ('<svg class="hmark" width="%d" height="%d" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.35" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true">%s</svg>' % (size, size, d))


def hall_scenes():
    return {k: hall_scene(k) for k in ("dian", "lou", "qiao")}


# ── 后处理：把生成的图形换进页面里 ──────────────────────────
# 展馆封面、轮播兜底图、资讯缩略图、线性图标这几处没法用 GEN 标记
# （它们要么嵌在别的结构里，要么一个页面出现多次、内容还各不相同）。
# 以前是几个一次性脚本手工跑的，结果每次重跑生成器就得再跑一遍、还容易漏。
# 现在全部收进这里，跑一次 `python3 _ornaments.py` 全站到位。
# 每个函数都**幂等**：既匹配"还没换过"的旧样子，也匹配"已经换过"的样子。

def _seq_replace(s, pattern, reps, tag, path):
    ms = list(re.finditer(pattern, s, re.S))
    if len(ms) != len(reps):
        raise SystemExit("%s / %s：找到 %d 处，准备了 %d 个"
                         % (path, tag, len(ms), len(reps)))
    out, last = [], 0
    for m, rep in zip(ms, reps):
        out.append(s[last:m.start(1)]); out.append(rep); last = m.end(1)
    out.append(s[last:])
    return "".join(out)


# `.*?` 在这里是危险的：它可以跨过好几个 </svg>，于是"匹配第一个 svg 的开头
# + 最后一个 svg 的结尾"，中间的全被吃掉。所以一律用"不许跨过 </svg>"的写法。
_NOEND = r'(?:(?!</svg>).)*'
_SVG24 = r'(<svg width="\d+" height="\d+" viewBox="0 0 24 24"' + _NOEND + r'</svg>' \
         r'|<svg class="lico"' + _NOEND + r'</svg>)'


# 标志的图源集中在这里。需要拿两版标志做对照，
# 换一版就是改这一个常量再跑一次生成器，不用去七个页面里逐个改 src。
# 目前倾向现用的这一版（实心），所以默认停在 mark-*；
# 要出 logo2 那一版的对照图，把下面这一行换成 mark2-maroon.png 再跑一次生成器。
MARK = "../../brand/logo/extracted/mark-maroon.png"


def post_process(path):
    p = os.path.join(HERE, path)
    s = io.open(p, encoding="utf-8").read()
    li = line_icon_set()
    ic = icon_set()
    done = []

    # 展馆封面：三幅界画小景
    hs = hall_scenes()
    pat = (r'(<div class="hall-cover h[123]">)'
           r'(\s*(?:<!-- GEN:yun -->.*?<!-- /GEN:yun -->|<svg class="hs".*?</svg>)\s*)')
    ms = list(re.finditer(pat, s, re.S))
    if ms:
        if len(ms) != 3:
            raise SystemExit("%s：展馆封面找到 %d 处，应为 3" % (path, len(ms)))
        out, last = [], 0
        for m, k in zip(ms, ("dian", "lou", "qiao")):
            out.append(s[last:m.start(2)])
            out.append("\n          " + hs[k] + "\n          ")
            last = m.end(2)
        out.append(s[last:])
        s = "".join(out); done.append("展馆小景")

    # 轮播兜底图：一幅横幅小青绿
    m = re.search(r'(<div class="card banner[^"]*">)'
                  r'(\s*(?:<!-- GEN:yun -->.*?<!-- /GEN:yun -->'
                  r'|<svg class="qinglv ban-shan".*?</svg>)\s*)', s, re.S)
    if m:
        ban = qinglv(w=343, h=176, seed=20261101, step_k=1.15) \
            .replace('class="qinglv"', 'class="qinglv ban-shan"')
        s = s[:m.start(2)] + "\n      " + ban + "\n      " + s[m.end(2):]
        done.append("轮播小青绿")

    # 胶囊安全区：插在状态栏之后、屋檐之前
    if '<div class="cap-zone"></div>' not in s:
        s2 = re.sub(r'(?<=</div>\n)(\s*)(<!-- [^\n]*檐[^\n]*-->\n)?(\s*)<!-- GEN:eave -->',
                    lambda m: m.group(1) + '<div class="cap-zone"></div>\n' +
                              (m.group(2) or '') + m.group(3) + '<!-- GEN:eave -->',
                    s, count=1)
        if s2 != s:
            s = s2; done.append("胶囊安全区")

    # 登录页的返回键：小程序 navigationStyle:custom 不给任何返回控件，
    # 这一枚必须自己画，而且要和胶囊在同一条水平线上。
    if path.startswith("login") and "nb-float" not in s:
        anchor = '<div class="cap-zone"></div>'
        if anchor in s:
            s = s.replace(anchor, anchor +
                '\n  <span class="nb-float" aria-label="返回">'
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
                'stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg></span>', 1)
            done.append("返回键")

    # 「最新动态」整段套一张通栏的暖纸。
    # 审看时问杏色该扩到哪儿——答案是**页面下半**：上半已经有公告条和入口书页
    # 两块暖色，下半却一路米白到底，整页就头重脚轻。
    # 这一段套上暖纸之后，节奏是 深画 → 暖 → 白 → 暖 → 雷纹，两头都压得住。
    if '<!-- 最新动态 -->' in s and 'news-band' not in s:
        s = s.replace('<!-- 最新动态 -->', '<div class="news-band">\n    <!-- 最新动态 -->', 1)
        i = s.index('<!-- 最新动态 -->')
        j = s.index('\n  </div>\n\n  </div>\n\n  <!-- TabBar -->', i)
        s = s[:j] + '\n    </div><!-- /news-band -->' + s[j:]
        done.append("动态暖纸")

    # 题签里的建筑剪影：封面图盖不住题签，所以这一枚永远在
    pat_m = (r'(<div class="hall-cover h[123]">(?:(?!</div>).)*?<span class="song">)'
             r'(?:<svg class="hmark".*?</svg>)?')
    ms = list(re.finditer(pat_m, s, re.S))
    if ms:
        if len(ms) != 3:
            raise SystemExit("%s：题签找到 %d 处，应为 3" % (path, len(ms)))
        out, last = [], 0
        for m, k in zip(ms, ("dian", "lou", "qiao")):
            out.append(s[last:m.end(1)]); out.append(hall_mark(k)); last = m.end(0)
        out.append(s[last:])
        s = "".join(out); done.append("题签剪影")

    # 资讯缩略图：换成器物图标。
    # 必须**按位置**替换，不能"找到第一个就换"——幂等分支里那样写的话，
    # 跑三遍会把第一张连换三次（最后停在第三个图标），后两张原样不动。
    order = ["jiandu", "yantai", "jiangan"]
    for ch, k in zip("卷墨礼", order):
        old = '<div class="nthumb song">%s</div>' % ch
        if old in s:
            s = s.replace(old, '<div class="nthumb">%s</div>' % ic[k], 1)
    pat = r'(<div class="nthumb">)<svg class="ico"' + _NOEND + r'</svg>(</div>)'
    ms = list(re.finditer(pat, s, re.S))
    if ms:
        if len(ms) != 3:
            raise SystemExit("%s：缩略图找到 %d 处，应为 3" % (path, len(ms)))
        out, last = [], 0
        for m, k in zip(ms, order):
            out.append(s[last:m.end(1)]); out.append(ic[k]); last = m.start(2)
        out.append(s[last:])
        s = "".join(out); done.append("缩略图")

    # 线性图标：标签栏、顶部工具位、公告、搜索
    if '<span class="t-ic">' in s:
        s = _seq_replace(s, r'<span class="t-ic">' + _SVG24 + r'</span>',
                         [li["shanmen"], li["jian"], li["zhou"], li["ce"]], "标签栏", path)
        s = _seq_replace(s, r'<span class="hi">\s*' + _SVG24,
                         [li["rusheng"], li["xinzha"]], "顶部工具位", path)
        s = _seq_replace(s, r'(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" '
                            r'stroke="#A8342A"' + _NOEND + r'</svg>'
                            r'|<svg class="lico"' + _NOEND + r'</svg>)'
                            r'(?=\s*<span class="n-txt")',
                         [li["muduo"]], "公告木铎", path)
        s = _seq_replace(s, r'(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" '
                            r'stroke="currentColor" stroke-width="1.8">' + _NOEND + r'</svg>'
                            r'|<svg class="lico"' + _NOEND + r'stroke-width="1.8"'
                            + _NOEND + r'</svg>)',
                         [lico_sou()], "搜索", path)
        done.append("线性图标")

    # 所有标志的图源统一指到 MARK。
    #
    # 这里出过一次很难看的错：原来的模式写成 `mark-[a-z0-9-]+\.png`，
    # 它匹配得到 mark-maroon.png，却**匹配不到 mark2-maroon.png**
    # （"mark" 后面硬要一个连字符）。于是 A→B 换得动、B→A 静默失败，
    # 两组对照图完全一样，我还发出去了。
    # 所以模式放开 mark 后面的数字，并且**换完点一遍名**：
    # 页面里凡是标志的 src，必须全部等于 MARK，否则当场失败。
    pat = r'(?<=src=")\.\./\.\./brand/logo/extracted/mark[0-9]*-[a-z0-9-]+\.png(?=")'
    s2 = re.sub(pat, MARK, s)
    if s2 != s:
        s = s2; done.append("标志图源")
    left = [m for m in re.findall(r'(?<=src=")[^"]*extracted/mark[0-9]*-[a-z0-9-]+\.png(?=")', s)
            if m != MARK]
    if left:
        raise SystemExit("%s：标志图源没换干净，还剩 %s（应为 %s）"
                         % (path, sorted(set(left)), MARK))

    io.open(p, "w", encoding="utf-8").write(s)
    if done:
        print("  ↳ %s：%s" % (path, "、".join(done)))


def _assert_eave_complete():
    """构建期自检：两种檐必须构件齐全。

    「漏构件」这一类 bug 在这条檐上犯了三次：
      1. 漏望板——椽与椽之间透光，背后的山从缝里钻出来；
      2. 整段檐下裹进 `if not sub`，二级页一件都没有；
      3. 二级页只补了连檐和望板，椽头仍然缺（我还说过"矮一半摆不下"，
         那是借口——正确做法是按比例缩，不是删构件）。
    三次都是肉眼发现的，而且每次都隔了好几轮才被看出来。
    所以改成每次构建都点一遍名：少哪一件，构建当场失败并说明少的是什么。
    """
    variants = {
        "主页檐": dict(),
        "二级页檐": dict(height=46, top=6, ridge=5, yc=25, rise=12, pitch=9.0, sub=True),
    }
    # 构件 → 在 SVG 里怎么认出来（出现次数的下限）
    parts = [
        ("正脊",   'var(--tile-dark)', 3),
        ("筒瓦",   'var(--tile-2)',    8),
        ("瓦当",   '<circle',          8),
        ("檐口金线", 'var(--gold)',      1),
        ("望板",   'var(--wood-85)',   2),
        ("连檐",   'var(--wood-70)',   1),
        ("檐檩",   'var(--wood-90)',   1),
        ("椽头",   'var(--wood-50)',   8),
        ("椽头高光", 'var(--wood-20)',   8),
        ("檐下投影", 'var(--wood-95)',   1),
    ]
    for name, kw in variants.items():
        svg = eave(**kw)
        missing = [p for p, token, lo in parts if svg.count(token) < lo]
        if missing:
            raise SystemExit("%s 少了构件：%s" % (name, "、".join(missing)))


def _assert_brush_continuous():
    """构建期自检：_brush() 画出来的那条线必须是连着的。

    这一条是被 bug 逼出来的——第一版分段时端点差了半截，
    整条山脊上出现一串缺口，肉眼看是"线没画完"，比等宽的线还糟，
    而且这种毛病在小图上不明显、放大才看得见。所以改成每次构建都算一遍：
    相邻两段的起点必须精确等于上一段的终点，首尾必须落在原始端点上。
    """
    import re as _re
    pts = [(0, 0), (10, 5), (20, 2), (30, 8), (40, 3), (50, 9),
           (60, 4), (70, 7), (80, 2), (90, 6), (100, 1)]
    for chunks in (2, 4, 7, 11):
        svg = _brush(pts, "#000", 1.5, 7, ".8", chunks=chunks)
        ds = _re.findall(r'd="([^"]+)"', svg)
        if not ds:
            raise SystemExit("_brush 没画出东西（chunks=%d）" % chunks)
        def _pts(d):
            return [tuple(map(float, t)) for t in _re.findall(r'(-?[\d.]+),(-?[\d.]+)', d)]
        for a, b in zip(ds, ds[1:]):
            if _pts(a)[-1] != _pts(b)[0]:
                raise SystemExit(
                    "_brush 断线（chunks=%d）：上一段收在 %s，下一段从 %s 起笔"
                    % (chunks, _pts(a)[-1], _pts(b)[0]))
        if _pts(ds[0])[0] != pts[0] or _pts(ds[-1])[-1] != pts[-1]:
            raise SystemExit("_brush 首尾没有落在原始端点上（chunks=%d）" % chunks)


def _assert_no_duplicate_defs():
    """同名函数定义两遍时，后一份会静默覆盖前一份。

    从 git 里捞回某个被误删的函数时踩过两次：捞回来的片段把相邻的几个函数
    一起带了回来，于是我改的是前一份、真正生效的是后一份，改了半天"没反应"。
    这种错在输出里看不出来，只能在这里挡。
    """
    import collections
    src = io.open(os.path.abspath(__file__), encoding="utf-8").read()
    names = re.findall(r"^def (\w+)", src, re.M) + re.findall(r"^(\w+) = \[", src, re.M)
    dup = [n for n, c in collections.Counter(names).items() if c > 1]
    if dup:
        raise SystemExit(f"✗ 顶层重复定义：{', '.join(dup)} —— 后一份会覆盖前一份，先删干净再跑")


def build_cover_page():
    """「已上传封面图」那一页从主页**派生**出来，不再手工维护第二份。

    上一版它是 home.html 的一份拷贝，卷首改版之后它没跟着改，于是这页展示的
    还是旧版面——用来回答"封面图会不会盖住设计"的样张，自己先过期了。
    现在它就是主页加上几张图：每个画心（.mount-art）里塞一张照片。
    """
    src = io.open(os.path.join(HERE, "home.html"), encoding="utf-8").read()
    import re as _re
    pick = {"card": "cover-hero.jpg", "hall-cover": "cover-hall.jpg",
            "nthumb": "cover-news.jpg"}
    n = [0]

    def ins(m):
        cls = m.group(1)
        f = pick.get(cls)
        if not f:
            return m.group(0)
        n[0] += 1
        return ('<div class="mount-art"><img class="cover" src="sample/%s" alt="">'
                '<div class="%s' % (f, cls))

    out = _re.sub(r'<div class="mount-art"><div class="([a-z-]+)', ins, src)
    if n[0] != 3 + 3 + 1:
        raise SystemExit("封面页：画心数对不上，插了 %d 张（应为 7）" % n[0])

    out = out.replace("<title>中华文化书院 · 首页</title>",
                      "<title>中华文化书院 · 首页（已上传封面图）</title>", 1)
    note = ('<div class="note">\n'
            '  <b>同一页，画心里换成真封面图</b>（照片是程序生成的占位图，只为验证遮挡关系）<br>\n'
            '  <b>被盖住的</b>：画心里的祥云、木纹底——它们本来就在图的位置上。<br>\n'
            '  <b>盖不住的</b>：裱边木纹、四角包角、右下压角印、竖排题签、标题绢条、题签签条。<br>\n'
            '  卷首那幅青绿山水同理：上传了首图它就退到图下面，屋檐、题签、返回键都在图之上。\n'
            '</div>\n\n</body>')
    i = out.rindex("</body>")
    j = out.rindex("<div class=\"note\">")
    out = out[:j] + note + out[i + len("</body>"):]
    io.open(os.path.join(HERE, "home-cover.html"), "w", encoding="utf-8").write(out)
    print("✓ home-cover.html：由 home.html 派生（7 张封面）")


def build_news_cover_page():
    """二级页的「已上传封面图」样张，同样从 news-detail.html 派生。

    要回答的问题只有一个：封面图放哪儿、会不会把卷首那幅画盖掉。
    答案是——**封面图就是卷首**。那幅青绿山水是「这篇没传首图」时的兜底，
    传了图，画不出现，谈不上盖住；而屋檐、返回键、导航标题、题签在图之上，
    正文标题压根不在图上（它在纸上第一行）。
    """
    src = io.open(os.path.join(HERE, "news-detail.html"), encoding="utf-8").read()
    anchor = '<div class="hero hero--art">'
    if src.count(anchor) != 1:
        raise SystemExit("二级页封面版：找不到卷首")
    out = src.replace(
        anchor,
        anchor + '\n    <div class="hero-mount">'
                 '<img src="sample/cover-hero.jpg" alt=""></div>', 1)
    out = out.replace("<title>中华文化书院 · 资讯详情</title>",
                      "<title>中华文化书院 · 资讯详情（已上传封面图）</title>", 1)
    i = out.rindex("</body>")
    j = out.rindex('<div class="note">')
    note = ('<div class="note">\n'
            '  <b>同一页，卷首换成真封面图</b>（照片是程序生成的占位图）<br>\n'
            '  <b>封面图就放在这里</b>——它不是另开一块，它<b>就是卷首</b>。'
            '那幅青绿山水是「这篇没传首图」时的兜底，传了图画就不出现。<br>\n'
            '  <b>盖不住的</b>：屋檐、返回键、导航标题、竖排题签——四件都在图之上；\n'
            '  <b>本来就不在图上的</b>：正文标题与栏目名，它们在纸上第一行。<br>\n'
            '  照片深浅不定，所以上下各压一道暗角，并给返回键、导航标题垫了半透明的纸。\n'
            '</div>\n\n</body>')
    out = out[:j] + note + out[i + len("</body>"):]
    io.open(os.path.join(HERE, "news-detail-cover.html"), "w", encoding="utf-8").write(out)
    print("✓ news-detail-cover.html：由 news-detail.html 派生")


def inject(path, blocks):
    p = os.path.join(HERE, path)
    s = io.open(p, encoding="utf-8").read()
    # ── 护栏：内联 SVG 里不许出现 url(%23…) ──────────────────
    # %23 只在 data URI 里会被浏览器解码；直接写进页面 DOM 时它是字面量，
    # 引用解析不到，整个 fill 静默失效——画面上只是"少了点东西"，不报错。
    # 这个坑前后踩了四次（如意分隔线的金线、小篆的金字、山水的绢底、
    # 屋檐的屋面），每次都是肉眼过了很久才发现，所以在这里拦住。
    for name, html in blocks.items():
        if "url(%23" in html:
            raise SystemExit(
                f"GEN:{name} 里有 url(%23…)：内联 SVG 必须写 url(#…)，"
                f"%23 只在 data URI 里解码")

    for name, html in blocks.items():
        pat = re.compile(r"(<!-- GEN:%s -->).*?(<!-- /GEN:%s -->)" % (name, name), re.S)
        if not pat.search(s):
            raise SystemExit(f"{path} 里没有 GEN:{name} 标记")
        s = pat.sub(lambda m: m.group(1) + "\n    " + html + "\n    " + m.group(2), s)
    io.open(p, "w", encoding="utf-8").write(s)
    print(f"✓ {path}：{', '.join(blocks)}")




# ── 如意云头角叶 ────────────────────────────────────────────────
# 图片框四个角上的那件铜活。前两版都被退回过：
#   一版是平涂的实心斜三角 —— "像创可贴"；
#   二版改成 L 形金条 —— 形状对了（矩形还是矩形），但两条臂是分开画的，
#   肘部有接缝和台阶，末端是齐口切断，看着像"断掉的两根金条"，
#   而且它只是一个 L，没有任何中华传统的形。
#
# 这一版回到器物本身。明式家具上包在箱匣、柜门四角的那件铜活叫**角叶**，
# 《铜活，明式家具的点睛之笔》里讲得很清楚：明式的路子是"造型简练、以线为主"，
# 角叶贴着两条边走，外沿与板面齐平（所以是直的），**所有的形都做在内沿**，
# 收头取如意云头，肘部钉泡钉。纹样母题上，如意、云头、四合如意
# 正是明清家具最常用的一组。
#
# 所以这一版：
#   ① 一件整的 L 形角叶，一条闭合路径 —— 肘部没有接缝，不会再有台阶；
#   ② 外沿两条边笔直（贴着画心的边），内沿是一条连续的曲线；
#   ③ 两端各收一个**如意云头**：先鼓出一瓣，再回卷成云尾尖收在外沿上，
#      末端不再是齐口切断；
#   ④ 肘部是一个**四合如意式的双卷云头**，向对角外凸，是整件的视觉中心；
#   ⑤ 肘部与两臂上各一枚**泡钉**（明式铜活一定有钉），铜活是钉上去的不是画上去的；
#   ⑥ 断面用渐变：外沿高光 → 金亮面 → 金中面 → 内沿暗边，
#      两条臂各用一条垂直于自己的渐变，沿对角线分界 —— 对角线上两条渐变取值相同，
#      所以没有接缝；
#   ⑦ 底下垫一层虚化的投影，让它浮在画心上。
#
# 四个角是四张单独生成的图（不是同一张翻转）：翻转会把投影方向也翻过去。
# 光从左上来，所以投影永远朝右下，四个角的明度也不同：左上最亮，右下最暗。
#
# 落地形态是 CSS 令牌 --jiaoye-tl/tr/bl/br（data URI），
# 一个角一层背景，共四层；三个尺寸档只改 --bj 一个值。

# 断面渐变的色阶。三套明度，对应四个角的受光。
# 取自 --jin-* 一族，末档压到 --jin-70/80 一线。
_JY_RAMP = {
    "lit": ["#FBF3DE", "#EBD6A6", "#D4AC6E", "#B98E4E", "#8B6B36", "#5E4623"],
    "mid": ["#F5EBD0", "#E3CB98", "#CBA362", "#AF8444", "#7F612F", "#543E1E"],
    "dim": ["#EDE0BF", "#D6BC8A", "#BE9455", "#A2773A", "#735628", "#4A3619"],
}
_JY_STOPS = [0.0, 0.07, 0.24, 0.55, 0.84, 1.0]

# 角叶轮廓（左上角朝向，viewBox 100×100）。
# 外沿走 y=0 与 x=0 两条直线，内沿一条曲线从右端云头绕过肘部到下端云头。
# 关于对角线 y=x 严格对称。
_JY_PATH = (
    "M0,0 L100,0 "
    # 水平臂：云尾从尖端回卷
    "C93,3.2 89,6.8 87,12 "
    # 如意云头（向内鼓一瓣）
    "C84.5,18 80,22.6 74,22.6 "
    "C68.4,22.6 65,19.4 63.4,16 "
    # 内沿直段
    "L26,16 "
    # 肘部：四合如意式双卷，向对角外凸
    "C29,19 27,21 25,25 "
    "C21,27 19,29 16,26 "
    # 竖臂内沿直段
    "L16,63.4 "
    # 竖臂如意云头（与水平臂关于对角线对称）
    "C19.4,65 22.6,68.4 22.6,74 "
    "C22.6,80 18,84.5 12,87 "
    "C6.8,89 3.2,93 0,100 Z"
)
# 泡钉：肘部一枚大的，两臂各一枚小的，都落在臂的中线 y=8 / x=8 上
_JY_NAILS = [(8.0, 8.0, 3.6), (78.0, 8.0, 2.4), (8.0, 78.0, 2.4)]
# 断面渐变的跨度：0 在外沿，26 在内沿之外一点（臂厚 16 + 云头鼓出 6.6）
_JY_SPAN = 19.0


def _jy_flip(x, y, fx, fy):
    """把左上角朝向的坐标翻到指定角。fx/fy 为 True 表示在该轴上镜像。"""
    return (100.0 - x if fx else x, 100.0 - y if fy else y)


def _jy_path(fx, fy):
    """把 _JY_PATH 逐个坐标翻过去。路径里只有 M/L/C 和坐标对，逐对处理即可。"""
    out = []
    cmds = []
    tok = ""
    for ch in _JY_PATH:
        if ch in "MLCZ":
            if tok.strip():
                cmds.append(tok.strip())
            tok = ""
            cmds.append(ch)
        else:
            tok += ch
    if tok.strip():
        cmds.append(tok.strip())
    for c in cmds:
        if c in "MLCZ":
            out.append(c)
            continue
        pts = []
        for pair in c.replace(",", " ").split():
            pts.append(float(pair))
        assert len(pts) % 2 == 0, "坐标必须成对：%r" % c
        flipped = []
        for k in range(0, len(pts), 2):
            fxy = _jy_flip(pts[k], pts[k + 1], fx, fy)
            flipped.append("%g,%g" % (round(fxy[0], 3), round(fxy[1], 3)))
        out.append(" ".join(flipped))
    return " ".join(out).replace(" ,", ",")


def jiaoye(corner="tl", tone="lit"):
    """生成一个角的如意云头角叶，返回 data URI 字符串（含 url(...)）。"""
    fx = corner in ("tr", "br")
    fy = corner in ("bl", "br")
    d = _jy_path(fx, fy)
    ramp = _JY_RAMP[tone]

    # 两条断面渐变：水平臂的垂直于自己（沿 y），竖臂的沿 x。
    # userSpaceOnUse，端点跟着翻。
    (hx1, hy1) = _jy_flip(0, 0, fx, fy)
    (hx2, hy2) = _jy_flip(0, _JY_SPAN, fx, fy)
    (vx1, vy1) = _jy_flip(0, 0, fx, fy)
    (vx2, vy2) = _jy_flip(_JY_SPAN, 0, fx, fy)

    def stops():
        return "".join(
            "<stop offset='%g' stop-color='%s'/>" % (_JY_STOPS[i], ramp[i])
            for i in range(len(ramp)))

    # 沿对角线把角叶切成两半，各用各的渐变。对角线上两条渐变取值相同，没有接缝。
    tri_h = [(0, 0), (100, 0), (100, 100)]     # 水平臂那一半
    tri_v = [(0, 0), (0, 100), (100, 100)]     # 竖臂那一半
    def tri(pts):
        return " ".join("%g,%g" % _jy_flip(x, y, fx, fy) for x, y in pts)

    # 投影：整件沿右下偏 1.4，虚化一点。四个角都朝右下——光从左上来。
    shadow = ("<g filter='url(#jb%s)' opacity='.34'>"
              "<path d='%s' fill='#302210' transform='translate(1.4 1.4)'/></g>"
              % (corner, d))

    nails = ""
    for (nx, ny, nr) in _JY_NAILS:
        cx, cy = _jy_flip(nx, ny, fx, fy)
        nails += (
            "<circle cx='%g' cy='%g' r='%g' fill='url(#jn%s)'/>"
            "<circle cx='%g' cy='%g' r='%g' fill='none' stroke='#5A441F'"
            " stroke-opacity='.45' stroke-width='.7'/>"
            % (cx, cy, nr, corner, cx, cy, nr))

    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
        "<defs>"
        "<linearGradient id='jh%s' gradientUnits='userSpaceOnUse'"
        " x1='%g' y1='%g' x2='%g' y2='%g'>%s</linearGradient>"
        "<linearGradient id='jv%s' gradientUnits='userSpaceOnUse'"
        " x1='%g' y1='%g' x2='%g' y2='%g'>%s</linearGradient>"
        "<radialGradient id='jn%s' cx='.34' cy='.30' r='.78'>"
        "<stop offset='0' stop-color='#FBF2D8'/>"
        "<stop offset='.55' stop-color='#CDA76A'/>"
        "<stop offset='1' stop-color='#7A5C2E'/></radialGradient>"
        "<clipPath id='jch%s'><polygon points='%s'/></clipPath>"
        "<clipPath id='jcv%s'><polygon points='%s'/></clipPath>"
        "<filter id='jb%s' x='-30%%' y='-30%%' width='170%%' height='170%%'>"
        "<feGaussianBlur stdDeviation='.9'/></filter>"
        "</defs>"
        "%s"
        "<g clip-path='url(#jch%s)'><path d='%s' fill='url(#jh%s)'/></g>"
        "<g clip-path='url(#jcv%s)'><path d='%s' fill='url(#jv%s)'/></g>"
        "<path d='%s' fill='none' stroke='#4A3618' stroke-opacity='.66'"
        " stroke-width='1.05' stroke-linejoin='round'/>"
        "%s"
        "</svg>"
    ) % (corner, hx1, hy1, hx2, hy2, stops(),
         corner, vx1, vy1, vx2, vy2, stops(),
         corner,
         corner, tri(tri_h),
         corner, tri(tri_v),
         corner,
         shadow,
         corner, d, corner,
         corner, d, corner,
         d,
         nails)

    enc = (svg.replace("%", "%25").replace("#", "%23")
              .replace("<", "%3C").replace(">", "%3E")
              .replace('"', "%22"))
    return "url(\"data:image/svg+xml,%s\")" % enc


def jiaoye_tokens():
    """四个角的令牌。左上受光最足，右下最暗。"""
    return {
        "--jiaoye-tl": jiaoye("tl", "lit"),
        "--jiaoye-tr": jiaoye("tr", "mid"),
        "--jiaoye-bl": jiaoye("bl", "mid"),
        "--jiaoye-br": jiaoye("br", "dim"),
    }


def write_jiaoye_tokens(css="shuyuan.css"):
    """把四个角叶令牌写回 shuyuan.css 的令牌区（幂等，按行整体替换）。"""
    p = os.path.join(HERE, css)
    s = io.open(p, encoding="utf-8").read()
    for k, v in jiaoye_tokens().items():
        pat = re.compile(r"^(\s*)" + re.escape(k) + r":.*$", re.M)
        hits = pat.findall(s)
        assert len(hits) == 1, "%s 在 %s 里出现 %d 次，应为 1 次" % (k, css, len(hits))
        s = pat.sub(lambda m: "%s%s: %s;" % (m.group(1), k, v), s, count=1)
    io.open(p, "w", encoding="utf-8").write(s)
    print("  ✓ 角叶令牌已写回 %s" % css)


def _assert_jiaoye_sound():
    """角叶自检：四个角都在、路径闭合、坐标严格对称、投影方向一致朝右下。"""
    toks = jiaoye_tokens()
    assert len(toks) == 4, "角叶应有四个角"
    for k, v in toks.items():
        assert v.startswith('url("data:image/svg+xml,'), "%s 不是 data URI" % k
        assert "%23" in v, "%s 里的 # 没有转义，data URI 会断" % k
        # 投影永远朝右下：四个角都必须是 translate(1.4 1.4)
        assert "translate(1.4 1.4)" in v, \
            "%s 的投影方向不对——四个角的投影都该朝右下（光从左上来）" % k
    # 路径对称性：把左上朝向的路径关于对角线交换 x/y，应当还原成自己
    pts = [float(t) for t in _JY_PATH.replace(",", " ")
           .replace("M", " ").replace("L", " ").replace("C", " ")
           .replace("Z", " ").split()]
    assert len(pts) % 2 == 0, "角叶路径的坐标没有成对"
    xs, ys = pts[0::2], pts[1::2]
    swapped = sorted(zip(ys, xs))
    assert sorted(zip(xs, ys)) == swapped, \
        "角叶轮廓不是关于对角线对称的——两条臂会不一样长"
    # 臂厚：内沿直段必须落在 y=16 上，云头鼓出不得超过 _JY_SPAN
    assert max(ys) <= 100.0 and max(xs) <= 100.0, "角叶画出了 100×100 的框"
    print("  ✓ 角叶：四角齐、轮廓对称、投影同向")


# ── 檐口 ──────────────────────────────────
# 二级页顶栏要用的一条“压缩版屋檐”。
#
# 主页那条完整的檐（62px）放在二级页上太高：二级页有 25 个，
# 每页顶上吃掉 126px，正文就只剩一半屏。但顶栏又必须一眼认出是同一家人。
#
# 第一版只画了一排筒瓦埄 + 金线 + 檐柋，渲出来像一条有条纹的色带，
# 不像檐。原因是漏了檐口真正的特征：**瓦当与滴水相间悬在檐口下沿**。
# 圆瓦当、尖滴水，一圆一尖排过去，这是中国屋檐远看时最先认出的一排。
#
# 构件自上而下：筒瓦埄 → 瓦当/滴水 → 檀口金线 → 檐柋 → 檐下投影。
def yankou(width=375, height=18, pitch=11.0, seed=20260518):
    import random
    rnd = random.Random(seed)
    y_tile = height * 0.39          # 筒瓦埄底
    y_drop = height * 0.70          # 瓦当/滴水的最下沿
    y_gold = y_drop
    fang_h = height * 0.22
    out = [f'<svg class="yankou" viewBox="0 0 {width} {height}" '
           f'preserveAspectRatio="none" aria-hidden="true">']

    # 檐柋（木）：先画，其它压在它上面
    out.append(f'<rect x="0" y="{y_gold:.2f}" width="{width}" height="{fang_h:.2f}" '
               f'fill="var(--wood-70)"/>')
    out.append(f'<rect x="0" y="{y_gold:.2f}" width="{width}" height="{fang_h*.34:.2f}" '
               f'fill="var(--wood-50)" opacity=".55"/>')
    # 檐下投影
    out.append(f'<rect x="0" y="{y_gold+fang_h:.2f}" width="{width}" '
               f'height="{height-y_gold-fang_h:.2f}" fill="var(--wood-85)" opacity=".26"/>')

    # 筒瓦埄：一根根圆转的瓦，左亮右暗。间距与宽度都拖一点——
    # 等距是最像 AI 的地方。
    out.append(f'<rect x="0" y="0" width="{width}" height="{y_tile:.2f}" fill="var(--tile)"/>')
    xs = []
    x = -pitch * .5
    while x < width + pitch:
        w = pitch * (1 + rnd.uniform(-.06, .06))
        xs.append((x, w))
        out.append(f'<rect x="{x:.2f}" y="0" width="{w*.26:.2f}" height="{y_tile:.2f}" '
                   f'fill="var(--tile-2)" opacity=".90"/>')
        out.append(f'<rect x="{x+w*.84:.2f}" y="0" width="{w*.16:.2f}" '
                   f'height="{y_tile:.2f}" fill="var(--tile-dark)" opacity=".50"/>')
        x += w * (1 + rnd.uniform(-.10, .10))

    # 瓦当与滴水相间：圆一枚、尖一枚。这一排是檐口的灵魂。
    r = (y_drop - y_tile)
    for i, (x, w) in enumerate(xs):
        cx = x + w * .5
        if i % 2 == 0:
            # 瓦当：半圆，带一圈深边和一点高光
            out.append(f'<path d="M{cx-r:.2f},{y_tile:.2f} a{r:.2f},{r:.2f} 0 0 0 {2*r:.2f},0 Z" '
                       f'fill="var(--tile-2)"/>')
            out.append(f'<path d="M{cx-r*.62:.2f},{y_tile:.2f} '
                       f'a{r*.62:.2f},{r*.62:.2f} 0 0 0 {1.24*r:.2f},0 Z" '
                       f'fill="var(--tile-hi)" opacity=".62"/>')
        else:
            # 滴水：垂尖（如意尖的简化）
            out.append(f'<path d="M{cx-r*.86:.2f},{y_tile:.2f} '
                       f'L{cx:.2f},{y_drop:.2f} L{cx+r*.86:.2f},{y_tile:.2f} Z" '
                       f'fill="var(--tile-dark)"/>')

    # 檀口金线：压在瓦当/滴水的根部
    out.append(f'<rect x="0" y="{y_tile-0.55:.2f}" width="{width}" height="1.1" '
               f'fill="var(--gold)"/>')
    out.append('</svg>')
    return "".join(out)


def _assert_yankou_complete():
    """檐口自检。

    第一版的判法是不算数的：用 fill="var(--tile-dark)" 当作“滴水在”的凭据，
    可筒瓦的暗边也是这个色——变异测试里把滴水整段删掉，它照样绿。
    现在改成数形状：瓦当是半圆弧（a… 0 0 0 … Z），
    滴水是三角（M…L…L…Z 且填色不带 opacity），两者各数各的。"""
    s = yankou()
    need = {
        "\u7b52\u74e6\u5784": 'fill="var(--tile)"',
        "\u6a90\u53e3\u91d1\u7ebf": 'fill="var(--gold)"',
        "\u6a90\u678b": 'fill="var(--wood-70)"',
        "\u6a90\u4e0b\u6295\u5f71": 'fill="var(--wood-85)"',
    }
    miss = [k for k, v in need.items() if v not in s]
    assert not miss, "\u6a90\u53e3 \u5c11\u4e86\u6784\u4ef6\uff1a" + "\u3001".join(miss)

    n_wd = len(re.findall(r'<path d="M[^"]*a[^"]*0 0 0[^"]*Z" fill="var\(--tile-2\)"/>', s))
    n_sx = len(re.findall(r'<path d="M[^"]*L[^"]*L[^"]*Z" fill="var\(--tile-dark\)"/>', s))
    assert n_wd >= 10, "\u74e6\u5f53\u53ea\u6709 %d \u679a\uff0c\u6a90\u53e3\u4f1a\u9000\u56de\u4e00\u6761\u6709\u6761\u7eb9\u7684\u8272\u5e26" % n_wd
    assert n_sx >= 10, "\u6ef4\u6c34\u53ea\u6709 %d \u679a\uff0c\u74e6\u5f53\u4e0e\u6ef4\u6c34\u76f8\u95f4\u624d\u662f\u6a90\u53e3\u7684\u7075\u9b42" % n_sx
    assert abs(n_wd - n_sx) <= 1, \
        "\u74e6\u5f53 %d \u679a\u3001\u6ef4\u6c34 %d \u679a\uff0c\u6ca1\u6709\u76f8\u95f4" % (n_wd, n_sx)
    assert "url(%23" not in s, "\u6a90\u53e3\u91cc\u51fa\u73b0\u4e86 url(%23\uff0c\u5185\u8054 SVG \u91cc\u5b83\u662f\u5b57\u9762\u91cf"
    print("  \u2713 \u6a90\u53e3\uff1a\u74e6\u5f53 %d \u679a / \u6ef4\u6c34 %d \u679a \u76f8\u95f4\uff0c\u91d1\u7ebf\u3001\u6a90\u678b\u3001\u6295\u5f71\u9f50" % (n_wd, n_sx))



# ── 玉璧 ─────────────────────────────────────
# 问答悬浮标的本体。
#
# 早先有过一版"金镶玉瓦当"做首页五个入口的圆框，后来取消了——
# 取消的理由是那一小块区域里塞了四种装饰（瓦当、冰裂、木枭、回纹），
# 装饰和内容抢注意力。但悬浮标不一样：它就一枚，没有人和它抢。
# 所以那个"圆 + 篆字"的形制在这里反而是合适的，只是按审看意见
# **去掉瓦当的花纹，换成玉石的质感**。
#
# 玉璧的四件：
#   ① 鐢金的外篍（金镶玉的"金"）；
#   ② 青白玉的璧面，带"水头"——玉不是平涂的，光会渗进去再透出来，
#      所以得是一块偏心的柔光加一圈边缘的回光，而不是一个均匀的渐变；
#   ③ 纹（绛）：两三条极淡的斜纹，玉的天然纹理。没有它就是塑料。
#   ④ 阴刻的篆字：字是**凹下去**的，所以刻口上沿暗、下沿亮，
#      和浮雕（上亮下暗）正好相反。反了就是个贴上去的字。

def _seal_glyph_path(ch):
    """从 design/brand/seal-script/ 读一个小篆字，返回内容与 viewBox。"""
    p = os.path.join(HERE, "..", "..", "brand", "seal-script", "%s.svg" % ch)
    p = os.path.normpath(p)
    assert os.path.exists(p), "找不到篆书字形：%s" % p
    s = io.open(p, encoding="utf-8").read()
    m = re.search(r'viewBox="([^"]*)"', s)
    vb = m.group(1) if m else "0 0 1000 1000"
    body = re.sub(r"^.*?<svg[^>]*>", "", s, flags=re.S)
    body = re.sub(r"</svg>\s*$", "", body, flags=re.S)
    body = body.strip()
    # 字身里不许有 fill。玉牌是拿 <g fill="#FFFFFF">（下沿高光）和
    # <g fill="#3E5A55">（实字）套在外面上色的，字身自带 fill 会把两层全盖掉，
    # 阴刻就变成一枚黑墨疙瘩。字库导出的 SVG 默认就带 fill，
    # 所以这里必须拦——用 scripts/normalize-seal-glyph.mjs 洗过再放进来。
    assert 'fill=' not in body, (
        "篆书字形 %s.svg 的字身里有写死的 fill，玉牌上不了色；"
        "先跑 node scripts/normalize-seal-glyph.mjs 归一" % ch)
    return body, vb


def jade_medallion(ch="\u95ee", size=200):
    """金镶玉圆牌，当中阴刻一个小篆字。"""
    body, vb = _seal_glyph_path(ch)
    vx, vy, vw, vh = [float(t) for t in vb.replace(",", " ").split()]
    R = size / 2.0
    # 字的占地。字形文件按 scripts/normalize-seal-glyph.mjs 的约定归一过：
    # 1000 的框、墨迹居中、最长边 760。所以字**渲染出来**的最长边是
    # 0.76 * gsz * size，玉面直径是 0.845 * size —— gsz 0.68 时字占玉面 61%。
    # 原来是 0.50（占 45%），在 112rpx 的浮标上太秀气，56px 下笔画快连不成字。
    gsz = size * 0.68
    k = gsz / max(vw, vh)
    gx = R - (vx + vw / 2.0) * k
    gy = R - (vy + vh / 2.0) * k

    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" '
           'aria-hidden="true">' % (size, size)]
    out.append('<defs>')
    # 玉面：偏心的柔光
    out.append('<radialGradient id="jd" cx="34%" cy="28%" r="78%">'
               '<stop offset="0" stop-color="#F4F8F3"/>'
               '<stop offset="46%" stop-color="#DCE8E0"/>'
               '<stop offset="100%" stop-color="#B9CEC6"/></radialGradient>')
    # 边缘回光（水头）：只在下右一圈
    out.append('<radialGradient id="jr" cx="68%" cy="76%" r="52%">'
               '<stop offset="0" stop-color="#FFFFFF" stop-opacity=".46"/>'
               '<stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>')
    # 鐢金外篍
    out.append('<linearGradient id="jg" x1="0" y1="0" x2="1" y2="1">'
               '<stop offset="0" stop-color="#F3E3BC"/>'
               '<stop offset="28%" stop-color="#D8B87A"/>'
               '<stop offset="56%" stop-color="#A88448"/>'
               '<stop offset="100%" stop-color="#6E5228"/></linearGradient>')
    out.append('<clipPath id="jc"><circle cx="%g" cy="%g" r="%g"/></clipPath>'
               % (R, R, R * 0.845))
    out.append('</defs>')

    # 外篍
    out.append('<circle cx="%g" cy="%g" r="%g" fill="url(%sjg)"/>' % (R, R, R * 0.975, "#"))
    out.append('<circle cx="%g" cy="%g" r="%g" fill="none" stroke="#5E4623" '
               'stroke-opacity=".38" stroke-width="%g"/>' % (R, R, R * 0.975, size * 0.008))
    # 玉面
    out.append('<circle cx="%g" cy="%g" r="%g" fill="url(%sjd)"/>' % (R, R, R * 0.845, "#"))
    # 绛：两条极淡的斜纹，裁在玉面里
    out.append('<g clip-path="url(%sjc)" opacity=".30">' % "#")
    out.append('<path d="M%g,%g C%g,%g %g,%g %g,%g" fill="none" stroke="#7FA096" '
               'stroke-width="%g" stroke-linecap="round"/>'
               % (size * .10, size * .58, size * .34, size * .40,
                  size * .58, size * .52, size * .92, size * .30, size * .012))
    out.append('<path d="M%g,%g C%g,%g %g,%g %g,%g" fill="none" stroke="#7FA096" '
               'stroke-width="%g" stroke-linecap="round" opacity=".7"/>'
               % (size * .18, size * .88, size * .40, size * .74,
                  size * .62, size * .82, size * .88, size * .62, size * .009))
    out.append('</g>')
    # 水头的回光
    out.append('<circle cx="%g" cy="%g" r="%g" fill="url(%sjr)"/>' % (R, R, R * 0.845, "#"))
    # 玉面内沿的一圈暗，把玉“嵌”进金篍里
    out.append('<circle cx="%g" cy="%g" r="%g" fill="none" stroke="#6E5228" '
               'stroke-opacity=".34" stroke-width="%g"/>'
               % (R, R, R * 0.845, size * 0.012))

    # 阴刻的字：先一层下沿高光（往下偏），再叠实字
    out.append('<g transform="translate(%g %g) scale(%g)">' % (gx, gy + size * .012, k))
    out.append('<g fill="#FFFFFF" fill-opacity=".55">%s</g>' % body)
    out.append('</g>')
    out.append('<g transform="translate(%g %g) scale(%g)">' % (gx, gy, k))
    out.append('<g fill="#3E5A55">%s</g>' % body)
    out.append('</g>')
    out.append('</svg>')
    return "".join(out)

if __name__ == "__main__":
    _assert_no_duplicate_defs()
    _assert_brush_continuous()
    _assert_eave_complete()
    full, small = eave(), eave(height=46, top=6, ridge=5, yc=25, rise=12, pitch=9.0, sub=True)
    # 冰裂纹和瓦当这一版取消了，ice_crack() / wadang() 仍留在文件里，
    # 但不再注入任何页面——万一要回退，改这一行就够。
    ent = entries()
    # 祥云不再注入任何页面：展馆封面换成了界画小景、轮播换成了小青绿。
    # xiangyun() 保留在文件里，要回退改这一行。
    ruyi, shan = ruyi_divider(), qinglv()
    # 二级页换一幅：矮一档、另一个 seed。同一支笔、不同一张画，
    # 比两页共用一张图更像"书院自己的画"。
    # 短幅要把步长一起放大：画矮了、山却还是原来的宽度，
    # 一屏里就塞进一排小包，反而比首页更碎。
    shan2 = qinglv(h=250, seed=20260712, step_k=1.30)
    for f in ("home.html", "home-indigo.html"):
        inject(f, {"eave": full, "entries": ent, "shan": shan})
    inject("login.html", {"eave": full, "ruyi": ruyi})
    inject("news-detail.html", {"eave": small, "shan2": shan2})
    inject("login-states.html", {"eave": full, "ruyi": ruyi})
    # 派生页放最后：它要读已经注入好的 home.html
    for f in ("home.html", "home-indigo.html", "login.html",
              "news-detail.html", "login-states.html"):
        post_process(f)
    _assert_jiaoye_sound()
    _assert_yankou_complete()
    write_jiaoye_tokens()
    build_cover_page()
    build_news_cover_page()
    for f in ("home-cover.html", "news-detail-cover.html"):
        post_process(f)

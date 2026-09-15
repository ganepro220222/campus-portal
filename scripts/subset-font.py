#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重新生成内嵌宋体的字集与子集文件。

平时不用跑；只有在**护栏报出「写死的汉字不在子集内」**、或者要换字体时才跑。

前置：
    pip install fonttools brotli
    下载思源宋体可变字体（SIL OFL 1.1，可商用可嵌入可子集化）：
    https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf

用法：
    python3 scripts/subset-font.py /path/to/NotoSerifSC[wght].ttf
    node scripts/build-font-subset.js

字集 = GB2312 一级 3755 字（实测覆盖本项目真实语料 99.8% 字次）
     + 仓库里出现过的全部汉字（小程序、后台、文档、种子数据、设计稿）
     + 书法/印章/题签会用到的繁体雅字
     + ASCII、中文标点、全角数字

只做一个字重 400：中文标题靠字号和留白建立层级，不靠加粗；
再来一个 700 要多占约 900KB base64，主包放不下。
"""
import os
import re
import subprocess
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARSET_OUT = os.path.join(ROOT, 'design/fonts/subset-charset.txt')
FONT_OUT = os.path.join(ROOT, 'design/fonts/shuyuan-serif-400.woff2')
WEIGHT = 400

CORPUS_GLOBS = [
    'miniapp/**/*.wxml', 'miniapp/**/*.js', 'miniapp/**/*.json', 'miniapp/**/*.wxss',
    'admin/src/**/*.vue', 'admin/src/**/*.js',
    'design/demo/**/*.html',
    'docs/**/*.md', '*.md',
    'sql/**/*.sql',
    'backend/src/main/resources/**/*.md',
]

# 书法字、印章、题签、古文引文会用到，但不在 GB2312 一级里
EXTRA = (
    '書學華國藝術館院講堂師禮樂詩經史子集琴棋畫墨硯筆紙卷軸碑帖拓篆隸楷行草'
    '風雅頌賦詞曲聯匾額齋廬軒閣樓臺亭榭橋津渡舟車轍驛徑道路傳承弘揚統優秀'
    '中民族復興夢想貴州交通職業大陽雲端'
)


def gb2312_level1():
    out = []
    for qu in range(16, 56):          # 一级汉字：16-55 区
        for wei in range(1, 95):
            try:
                out.append(bytes([qu + 0xA0, wei + 0xA0]).decode('gb2312'))
            except Exception:
                pass
    return out


def corpus_chars():
    """扫全仓库的中文。标了 font-subset-allow 的字要排除——那些字是**故意**留在
    子集外用来演示回退观感的，收进来就把演示作废了。"""
    blob = []
    excluded = set()
    for pattern in CORPUS_GLOBS:
        for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
            if 'node_modules' in path:
                continue
            try:
                text = open(path, encoding='utf-8', errors='ignore').read()
            except Exception:
                continue
            for m in re.finditer(r'font-subset-allow:\s*([^\s*/\->]+)', text):
                excluded.update(m.group(1))
            blob.append(text)
    return [c for c in re.findall(r'[一-鿿]', ''.join(blob)) if c not in excluded]


def build_charset():
    ascii_printable = [chr(c) for c in range(0x20, 0x7F)]
    cjk_punct = list('　、。〃〈〉《》「」『』【】〔〕・〜！＂＃＄％＆＇（）＊＋，－．／'
                     '：；＜＝＞？＠［＼］＾＿｀｛｜｝～“”‘’…—·¥°℃×÷±§¶†‡•‰′″〇№')
    full_digits = [chr(c) for c in range(0xFF10, 0xFF1A)]
    chars = set(gb2312_level1()) | set(corpus_chars()) | set(EXTRA)
    chars |= set(ascii_printable) | set(cjk_punct) | set(full_digits)
    return ''.join(sorted(chars))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    if not os.path.exists(src):
        print(f'✗ 找不到源字体 {src}')
        sys.exit(1)

    charset = build_charset()
    os.makedirs(os.path.dirname(CHARSET_OUT), exist_ok=True)
    with open(CHARSET_OUT, 'w', encoding='utf-8') as f:
        f.write(charset)
    han = len([c for c in charset if '一' <= c <= '鿿'])
    print(f'✓ 字集 {len(charset)} 字符（汉字 {han}）→ {os.path.relpath(CHARSET_OUT, ROOT)}')

    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    static = os.path.join(ROOT, f'.font-static-{WEIGHT}.ttf')
    font = TTFont(src)
    if 'fvar' in font:
        instancer.instantiateVariableFont(font, {'wght': WEIGHT}, inplace=True)
    font.save(static)

    subprocess.run([
        'pyftsubset', static,
        f'--text-file={CHARSET_OUT}',
        '--layout-features=', '--no-hinting', '--desubroutinize',
        '--drop-tables+=GSUB,GPOS,GDEF,BASE,JSTF,DSIG,LTSH,VDMX,hdmx,kern,vhea,vmtx',
        '--name-IDs=', '--notdef-outline',
        '--flavor=woff2', f'--output-file={FONT_OUT}',
    ], check=True)
    os.remove(static)

    size = os.path.getsize(FONT_OUT)
    print(f'✓ 子集字体 {size / 1024:.0f} KB → {os.path.relpath(FONT_OUT, ROOT)}')
    print(f'  base64 后约 {((size + 2) // 3 * 4) / 1024:.0f} KB')
    print('  接着执行：node scripts/build-font-subset.js')


if __name__ == '__main__':
    main()

# 设计素材库

存放校方品牌资产、UI 元素与参考稿的**源文件**，供界面设计与开发导出使用。

> 小程序运行时资源放在 `miniapp/assets/`，本目录不放可直接引用的压缩图。

---

## 目录说明

| 目录 | 用途 |
|------|------|
| `brand/logo/` | 校徽：矢量源文件、透明底高清 PNG、反白版 |
| `brand/wordmark/` | 校名组合：横版/竖版、中英文 |
| `ui/icons/` | 功能入口、Tab、操作类图标（优先 SVG） |
| `ui/patterns/` | 背景纹理、装饰线、纹样 |
| `ui/tags/` | 栏目标签、角标样式（如「书院动态」） |
| `demo/` | HTML 演示稿及配套截图（`demo/v2/` 是「书院·檐棂印」方向稿） |
| `fonts/` | 内嵌宋体的**源文件与字集清单**，见下节 |
| `refs/` | 其他参考：设计稿导出、配色表、字体说明 |

---

## 命名规范

- 小写英文 + 连字符，例如：`logo-master.svg`、`wordmark-cn-horizontal.png`
- 同一资源多规格：`logo-master@2x.png`、`logo-master@3x.png`
- 反白/深色背景专用：`logo-white.svg`、`wordmark-white.png`
- 避免中文文件名、空格、`(1)` 后缀

---

## 推荐格式

| 类型 | 源文件 | 说明 |
|------|--------|------|
| 校徽、校名 | SVG 优先 | 无损缩放；无矢量时用透明 PNG，宽度建议 ≥ 1000px |
| 图标 | SVG | 导出 PNG 时再放入 `miniapp/assets/` |
| 照片 | JPG / PNG 原图 | 仅放本目录，小程序内另做压缩 |
| 设计源稿 | AI / PSD / Figma 导出 | 仅存档，不放入 miniapp 包 |

---

## 品牌色参考（与 demo 一致）

| 名称 | 色值 | 用途 |
|------|------|------|
| 海军蓝 | `#2B356E` | 主色、导航、按钮 |
| 深蓝 | `#1E2654` | 渐变、深色背景 |
| 学院蓝 | `#3F57B5` | 强调、链接 |
| 金色 | `#BE9C44` | 装饰线、角标、重点按钮 |
| 纸张底 | `#F5F8FC` | 页面背景 |
| 正文 | `#1F2547` | 主要文字 |

正式稿以校方 VIS 手册为准，上表仅供开发对齐 demo 使用。

---

## 字体（内嵌宋体子集）

| 文件 | 说明 |
|------|------|
| `fonts/shuyuan-serif-400.woff2` | 思源宋体 Noto Serif SC 的子集，单字重 400，约 689 KB |
| `fonts/subset-charset.txt` | 子集包含的 4009 个字符 |

授权：思源宋体是 **SIL OFL 1.1**，可商用、可嵌入、可子集化。

它被 `scripts/build-font-subset.js` 转成 base64 写进
`miniapp/styles/font-shuyuan-song.wxss`，由 `app.wxss` 引入，`.serif` 走这个字体。

**为什么内嵌而不用 `wx.loadFontFace`**：后者只收网络地址，要配 `downloadFile`
合法域名，还必须返回 `Access-Control-Allow-Origin: *`（设成 `servicewechat.com`
时 iOS 能过、安卓挂），荣耀 / vivo 等机型对字体 CORS 的校验更严 —— 做不到
「所有设备都正常显示」。内嵌进代码包则不走网络、不需要白名单、没有机型分裂；
`font-family` 回退栈保持完整，万一没生效就退回系统字，不会白屏也不会豆腐块。

**要改字集**（护栏报「写死的汉字不在子集内」时）：

```bash
pip install fonttools brotli
python3 scripts/subset-font.py /path/to/NotoSerifSC[wght].ttf
node scripts/build-font-subset.js
npm run check:font-subset
```

Canvas 画的文字吃不到自定义字体（微信的硬限制），海报里的文案不受这套字体影响。

---

## 使用流程

1. 校方或设计方提供的原稿 → 放入对应子目录（保留最高质量版本）
2. 需要上线的小程序资源 → 从本目录导出，压缩后放入 `miniapp/assets/images/` 或 `miniapp/assets/icons/`
3. 当前 `miniapp/assets/images/` 内的校徽、校名为占位图，收到正式素材后替换

---

## 待补充清单

- [ ] 校徽 SVG / 高清透明 PNG（@2x、@3x）
- [ ] 校名横版、竖版（透明底）
- [ ] 反白版 logo / wordmark（登录页深色背景用）
- [ ] 校方 VIS 色值与字体规范（如有）
- [ ] TabBar 图标（81×81 px，PNG）
- [ ] 功能入口图标（5 个主入口）

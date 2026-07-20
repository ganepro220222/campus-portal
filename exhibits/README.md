# 云端书院 · 立体鉴赏系统

纯前端 3D 展品播放器与编辑器，Three.js 自托管于 `vendor/`，不依赖外部 CDN。

## 目录结构

```
exhibits/
  player.html          # 播放器 + 编辑器（全站共用一份）
  player.view.html     # 仅观看版（node build-viewer.mjs 从 player.html 生成）
  build-viewer.mjs     # 生成/更新 player.view.html
  leader-geom.js       # 引线/面板布局纯函数（player 与 player.view 均依赖）
  leader-geom.test.mjs # 几何单元测试（node leader-geom.test.mjs）
  serve.py             # Python 静态服务（修正 MIME，无 Node 时用）
  start.sh / start.bat # 一键启动（Git Bash / Windows）
  vendor/              # Three.js 与 Draco / Basis 解码器
  studio.html          # 工作台：列出全部展品，点卡片进入编辑或预览
  manifest.json        # 展品目录清单（启用保存服务时可自动扫描，无需手改）
  craft-001/
    config.json        # 该展品的配置（标题、相机、材质、热点、光照、语音等）
    assets/            # model.glb、panorama.jpg、poster.jpg、音频等
    index.html         # 跳转壳 → ../player.html?ex=craft-001（不透传 mode=edit）
  craft-002/ …         # 每件展品仅含一份 config 与 assets
```

- 全站共用一份播放器代码：升级或修复只需改一处。
- 新增展品：复制 `craft-XXX/` 目录并填写数据；有保存服务时刷新工作台即可出现，否则在 `manifest.json` 的 `exhibits` 中加一行目录名。

## 本地运行

在 **`exhibits/` 目录** 下启动（Git Bash）：

```bash
cd /d/shuyuan/exhibits
bash start.sh
# 或指定端口：bash start.sh 8199
```

Windows 双击或 CMD：`start.bat`（可选参数 `start.bat 8199`）

启动后访问：

| 用途 | 地址 |
|---|---|
| 工作台 | `http://127.0.0.1:8199/studio.html` |
| 观看展品 | `http://127.0.0.1:8199/craft-001/` |
| 编辑展品 | `http://127.0.0.1:8199/player.html?ex=craft-001&mode=edit` |

`start.sh` 优先用 Node 工作台服务（含保存 API）；无 Node 时自动改用 `python serve.py`。

**不要用** `python -m http.server`（曾导致播放器卡在「正在加载」；若必须用，请改用 `python serve.py 8199`）。

须通过 HTTP 访问，不能直接双击 HTML 文件。

## 常用地址

| 用途 | 地址 |
|---|---|
| 工作台 | `…/studio.html` |
| 观看某展品 | `…/player.view.html?ex=craft-001` 或 `…/craft-001/` |
| 编辑某展品 | `…/player.html?ex=craft-001&mode=edit` |

## 编辑器功能

- **基本信息**：名称、副标题（实时更新左上角）。
- **用户端按钮**：勾选终端用户可见的功能（自动旋转、热点、重置、全屏、光源预设）。
- **资产**：从 URL 加载模型（相对或绝对路径；跨域需服务器允许 CORS）、本地 `.glb` 预览、查看当前模型路径。
- **模型摆放**：缩放、适配尺寸、位移 XYZ、旋转 Y°、复位模型。
- **相机**：视场角、自动旋转速度、最近/最远距离、旋转轴 Y 偏移（默认 0 为模型中轴）、保存当前视角为默认。
- **材质**：全局曝光、环境光强度、金属度、粗糙度；按材质名分组覆盖。
- **灯光**：环境光、主光、补光、轮廓光 的强度与颜色。
- **环境 IBL**：全景背景开关、更换全景图地址。
- **热点与面板**：面板样式（实底 / 毛玻璃 / 透明等）、热点颜色与大小、脉冲开关。
- **热点**：Shift+点击模型表面新增；拖拽或数字输入微调位置；编辑标题与文案；更新聚焦机位；绑定语音。
- **语音讲解**：新增/删除音频、修改名称与地址；多条时自动出现下拉切换。
- **预设**：从当前状态新建（含曝光、环境光、背景与四光源）；可选是否显示为前台按钮（最多 4 个）。
- **性能**：帧率、绘制调用、三角面、顶点、材质、贴图、像素比等，超阈值时提示。
- **保存与导出**：保存到服务器（需配置保存服务）、导出 `config.json`、导出仅观看版 `player.view.html`、截取当前帧为封面、配置校验。

所有滑条均配有数字输入框，可直接键入精确值。

## 观看端交互

- **热点**：双环标记，可自定义颜色；点击后桌面端以引线连接信息面板，面板优先落在模型投影外的留白区；移动端面板就近显示并限制在视口内（无引线）。
- **信息面板**：多种样式可选（实底、毛玻璃、透明等）。
- **语音讲解**：左上角播放器（播放/暂停、进度、时长）；多条可下拉切换；热点可绑定自动播放。
- **加载**：封面占位 → 模型淡入 → 全景 IBL 后台加载；不支持 WebGL 或加载失败时有提示与重试。

## 新增一件展品

```
exhibits/craft-XXX/
  config.json     # 复制一份并修改标题、模型、相机、热点等
  assets/         # model.glb、panorama.jpg（2:1 等距柱状）、poster.jpg、音频
  index.html      # 跳转壳（参考 craft-001/index.html，改 ex 参数即可）
```

## 上线说明

- **公开访问（观看版）**：须在同一目录下保持相对路径部署以下文件：
  - `player.view.html`（编辑器「导出仅观看版」生成）
  - `leader-geom.js`（播放器模块依赖，遗漏会导致浏览器加载失败）
  - `vendor/`（Three.js 与解码器）
  - 各展品数据目录（`craft-XXX/config.json`、`assets/` 等）
  - 外链可指向 `…/craft-001/` 或 `…/player.view.html?ex=craft-001`
- **编辑入口**：完整 `player.html` 与 `studio.html` 应放在受保护路径（登录鉴权或 IP 限制），勿与公开展品同路径暴露。公开站点的 `craft-XXX/index.html` 跳转壳应指向 `player.view.html`，勿暴露带 `mode=edit` 的完整版。
- **缓存**：`config.json` 不宜长期 CDN 缓存，保存后应能立即读到新版本；静态资源可加版本号或 hash 避免浏览器旧缓存。
- **保存服务**：浏览器内直接保存需启动 `_server/` 中的参考服务，详见 `_server/README.md`。

## 无障碍与兼容

- **快捷键**：Tab 在热点与按钮间移动，Enter/空格 打开热点，Esc 关闭讲解面板，空格 播放/暂停语音。
- **无障碍**：热点与按钮具备语义标签；背面不可见热点移出 Tab 序；`prefers-reduced-motion` 下停用脉冲与自动旋转。
- **压缩模型**：支持 Draco 几何压缩与 KTX2/Basis 贴图压缩（解码器在 `vendor/`，按需加载）。
- **移动端**：手机端限制像素比以省电控温，桌面端可更高像素比以保持清晰。

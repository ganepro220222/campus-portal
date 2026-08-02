# 云端书院 · 立体鉴赏系统

纯前端 3D 展品播放器与编辑器，Three.js 自托管于 `vendor/`，不依赖外部 CDN。

## 目录结构

```
exhibits/
  player.html          # 播放器 + 编辑器（全站共用一份）
  player.view.html     # 仅观看版（node build-viewer.mjs 从 player.html 生成）
  build-viewer.mjs     # 生成/校验 player.view.html（node build-viewer.mjs [--check]）
  package.json         # exhibits 目录 ESM（Node 测试用）
  leader-geom.js       # 引线/面板布局纯函数（player 与 player.view 均依赖）
  leader-geom.test.mjs # 几何单元测试（node leader-geom.test.mjs）
  light-rig.mjs        # 灯光方位换算与亮度诊断纯函数（player 与 player.view 均依赖）
  light-rig.test.mjs   # 灯光单元测试（node light-rig.test.mjs）
  serve.py             # Python 本地服务（含保存 API；便携环境用）
  打开工作台.bat       # 启动服务并打开浏览器
  停止服务.bat         # 停止本地服务
  安装便携环境.bat     # 首次：下载便携 Python（可整夹复制到其他电脑）
  使用说明.txt         # 本地使用简明说明
  模型转换/            # OBJ→GLB 批处理与图形转换器（见 模型转换/使用说明.md）
  _launch/             # 启动脚本逻辑（勿删）
  _dev/                # Git Bash / Mac / Linux 脚本
  _runtime/            # 便携 Python（安装后生成）
  vendor/              # Three.js 与 Draco / Basis 解码器
  studio.html          # 工作台：列出全部展品，可排序 / 筛选，点卡片进入编辑或预览
  studio-batch.mjs     # 工作台批量字段适用性与 ops 收集（studio.html 模块依赖）
  studio-sort.mjs      # 工作台排序 / 筛选 / 背景分组纯函数（studio.html 模块依赖）
  studio-sort.test.mjs # 排序筛选单元测试（node studio-sort.test.mjs）
  manifest.json        # 展品目录清单（启用保存服务时可自动扫描，无需手改）
  craft-001/
    config.json        # 该展品的配置（标题、相机、材质、热点、光照、语音等）
    assets/            # model.glb、panorama.jpg、poster.jpg、音频等
    index.html         # 公开跳转壳 → ../player.view.html?ex=craft-001（不透传 mode=edit）
  craft-002/ …         # 每件展品仅含一份 config 与 assets
```

- 全站共用一份播放器代码：升级或修复只需改一处。
- 新增展品：复制 `craft-XXX/` 目录并填写数据；有保存服务时刷新工作台即可出现，否则在 `manifest.json` 的 `exhibits` 中加一行目录名。

## 本地运行

### 日常使用

1. **首次**：双击 **`安装便携环境.bat`**（联网一次，约 12MB 便携 Python 写入 `_runtime/python/`）
2. **可复制整个 `exhibits/` 文件夹**到其他 Windows 电脑，无需重复安装
3. **编辑**：双击 **`打开工作台.bat`** → 启动服务并打开浏览器
4. **结束**：双击 **`停止服务.bat`**

说明见 **`使用说明.txt`**。本机若已装 Node，可跳过便携环境安装。

### 开发

```bash
cd exhibits
bash _dev/start.sh
bash _dev/stop.sh
```

启动顺序：便携 Python → 本机 Node → 本机 Python。勿用 `python -m http.server`（无保存 API，且 .mjs MIME 不正确）。

须通过 HTTP 访问，不能直接双击 HTML 文件。

## 测试

```bash
cd exhibits
npm install
npx playwright install chromium   # 首次运行 E2E 需要

npm test                          # 几何单元测试 + 静态依赖检查
npm run check:deps                # 仅校验 HTML module import 资源存在
npm run test:e2e                  # Playwright 浏览器测试（smoke + 3D 播放器 + 工作台）
npm run test:ci                   # 单元 + deps + viewer 同步校验 + E2E（CI 同款）
```

E2E 分四类：`e2e/smoke.spec.mjs`（公开入口、几何 fallback，约 15 秒）、`e2e/player.spec.mjs`（3D 模型串行，约 2 分钟）、`e2e/studio.spec.mjs`（工作台启动、排序筛选、批量保存，约 40 秒）、`e2e/lighting.spec.mjs`（灯光角度/启用/跟随相机/地面反射光/落地阴影/环境预设/预设方案，约 90 秒）。本地若 8199 端口已有服务，Playwright 会复用，无需重复启动。

3D 用例默认 **1 worker**（与 CI 一致），避免 Windows 上并行 WebGL 导致 `browserContext.close` / trace 写入超时。需要本地 trace 时可设 `PW_TRACE=on`；需要多 worker 时可设 `PW_WORKERS=2`（不推荐在 Windows 跑全量 3D）。

## 常用地址

| 用途 | 地址 |
|---|---|
| 工作台 | `…/studio.html` |
| 观看某展品 | `…/player.view.html?ex=craft-001` 或 `…/craft-001/` |
| 编辑某展品 | `…/player.html?ex=craft-001&mode=edit` |

## 工作台功能

- **列表**：自动列出全部展品（启用保存服务时无需维护 `manifest.json`），卡片显示封面、热点/语音数量与**背景环境**。
- **排序**：目录序号（自然序，`craft-2` 排在 `craft-10` 前）、最后编辑、展品名称、**待完善优先**、**背景环境**、热点数量；可切换升/降序。选择记在本机浏览器，下次打开保持不变。
- **筛选**：全部 / 待完善 / 缺模型 / 缺封面 / 无全景，按钮上直接显示件数；可与搜索框叠加使用。
- **背景分组**：卡片上的背景徽标标出该展品用的全景图文件名或环境预设；按「背景环境」排序即可让同背景的展品挨在一起，便于成批统一。判据是服务端算的**内容指纹**，不是文件名——各展品自带的 `assets/panorama.jpg` 名字一样但往往是不同的图，同一张图复制进多个目录也仍算同一组。
- **公共全景图**：多件展品共用同一张背景时，在 `exhibits/` 下建一个目录（如 `共享背景/`）把图放进去，批量编辑的「全景贴图」下拉会自动列出所有接近 2:1 的图片，选中即填入 `../共享背景/xxx.jpg`。**务必用 `../` 相对写法**：它以展品目录为基准、退到 `exhibits/` 根，部署到任何子路径下都成立；`/开头` 的站点根绝对路径一旦部署到 `https://站点/exhibits/` 就会 404（而工作台仍显示「有全景」，最难查）。
- **批量编辑**：勾选多件展品 → 只勾选要统一修改的字段 → 应用；每件展品只覆盖被勾选的字段，其余各自保留。含**五光源**（每盏灯的启用 / 强度 / 颜色 / 方位角 + 仰角，以及整组跟随相机）、环境 IBL、落地阴影、用户端显隐、面板与热点样式。

## 编辑器功能

- **基本信息**：名称、副标题（实时更新左上角）。
- **用户端按钮**：勾选终端用户可见的功能（自动旋转、热点、重置、全屏、光源预设）。
- **资产**：从 URL 加载模型（相对或绝对路径；跨域需服务器允许 CORS）、本地 `.glb` 预览、查看当前模型路径。
- **模型摆放**：缩放、适配尺寸、位移 XYZ、旋转 Y°、复位模型。
- **相机**：视场角、自动旋转速度、最近/最远距离、旋转轴 Y 偏移（默认 0 为模型中轴）、保存当前视角为默认。
- **材质**：全局曝光、金属度、粗糙度；可按材质名分组覆盖（需先勾「启用覆盖」，勾选时按该材质当前真实值建立，观感不跳变；只写你动过的那一项）。**环境亮度不在这里调**——请用「环境 IBL → 环境光照」：本播放器 IBL 来自场景环境，three.js 会用场景值覆写材质上的同名参数，材质级的环境光强调了不会有任何变化。
- **灯光（五光源）**：环境光、主光、补光、轮廓光、地面反射光，每盏可单独 启用/停用、调 强度与颜色；四盏方向光另有 **方位角 / 仰角**（仰角为负即从下往上打光）。**地面反射光**默认不亮（旧配置零影响），专治顶光下器物底部死黑。另有 **灯光跟随相机**（灯组随视角绕 Y 轴转，任何角度都有主光）、**亮度诊断**（按曝光 → 环境照明 → 金属度的顺序给出可执行建议）、**恢复出厂灯光**。
- **环境 IBL**：**环境预设**（内置房间 / 影棚柔光 / 博物馆暖阁 / 户外阴天 / 夜展暗场，全部程序化生成，不占体积）、环境光照强度（`scene.environmentIntensity`，模型偏暗优先调这里）、环境旋转（转动环境改变高光落点）、环境背景开关、更换全景图地址。已配全景图时以全景为准，预设作为兜底。
- **落地阴影**：主光投影 + 正下方接触阴影两层叠加，另含**展台**（可被照亮、能接影子的圆形台面，带边缘柔化）与展台颜色。浓度 / 柔化 / 地面高低可调。默认关闭；深色背景下必须开展台，否则影子没有落处。阴影图不逐帧重算（`shadowMap.autoUpdate=false`），仅在灯位、模型或参数变化时刷新。
- **热点与面板**：面板样式（实底 / 毛玻璃 / 透明等）、热点颜色与大小、脉冲开关。
- **热点**：Shift+点击模型表面新增；拖拽或数字输入微调位置；编辑标题与文案；更新聚焦机位；绑定语音。
- **语音讲解**：新增/删除音频、修改名称与地址；多条时自动出现下拉切换。
- **预设**：从当前状态新建（含曝光、背景、五光源灯组、环境预设与旋转、落地阴影）；不记录全景图本身，切换预设不会顶掉展品的全景。可选是否显示为前台按钮（最多 4 个）。
- **性能**：帧率、绘制调用、三角面、顶点、材质、贴图、像素比等，超阈值时提示。
- **保存与导出**：保存到服务器（需配置保存服务）、导出 `config.json`、导出仅观看版 `player.view.html`、截取当前帧为封面、配置校验。

所有滑条均配有数字输入框，可直接键入精确值。

## 观看端交互

- **热点**：双环标记，可自定义颜色；点击后桌面端以引线连接信息面板，面板优先落在模型投影外的留白区；移动端面板就近显示并限制在视口内（无引线）。
- **信息面板**：多种样式可选（实底、毛玻璃、透明等）。
- **语音讲解**：左上角播放器（播放/暂停、进度、时长）；多条可下拉切换；热点可绑定自动播放。**可折叠**：收起后只剩一颗圆钮（手机默认收起，桌面默认展开，可在编辑器「语音讲解」段改成始终展开 / 始终收起）；播放中收起仍能看出正在播放；热点触发的语音会自动展开播放器。
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
  - `leader-geom.js`、`light-rig.mjs`、`hotspot-id.mjs`、`player-persist.mjs`（播放器模块依赖，遗漏任一都会导致浏览器加载失败）
  - `vendor/`（Three.js 与解码器）
  - 各展品数据目录（`craft-XXX/config.json`、`assets/` 等）
  - 外链可指向 `…/craft-001/` 或 `…/player.view.html?ex=craft-001`
- **编辑工作台（受保护路径）**：须**同时**部署以下文件（缺一会导致编辑器或工作台无法启动）：
  - `studio.html` + `studio-batch.mjs` + `studio-sort.mjs`（工作台 ES module 依赖，缺任一整页脚本不执行）
  - `player.html` + 上述全部模块依赖
  - `vendor/`
  - 各展品数据目录
  - 须 HTTP 访问；建议 `node _server/studio-server.mjs` 提供保存 API
- **安全提示**：`player.html?mode=edit` 与 `studio.html` 勿与公开展品同路径暴露；`craft-XXX/index.html` 跳转壳应指向 `player.view.html`，勿透传 `mode=edit`。
- **缓存**：`config.json` 不宜长期 CDN 缓存，保存后应能立即读到新版本；静态资源可加版本号或 hash 避免浏览器旧缓存。
- **保存服务**：浏览器内直接保存需启动 `_server/` 中的参考服务，详见 `_server/README.md`。

## 无障碍与兼容

- **快捷键**：Tab 在热点与按钮间移动，Enter/空格 打开热点，Esc 关闭讲解面板，空格 播放/暂停语音。
- **无障碍**：热点与按钮具备语义标签；背面不可见热点移出 Tab 序；`prefers-reduced-motion` 下停用脉冲与自动旋转。
- **压缩模型**：支持 Draco 几何压缩与 KTX2/Basis 贴图压缩（解码器在 `vendor/`，按需加载）。
- **移动端**：手机端限制像素比以省电控温，桌面端可更高像素比以保持清晰。

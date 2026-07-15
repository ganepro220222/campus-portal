# 工艺品沉浸式鉴赏 H5（工程骨架）

独立静态站，部署在 Nginx `/craft/` 下，与 `admin/` 分离构建。

> **分工**：本目录仅含 Vite 工程、API 拉取与类型约定；**Three.js 场景与全部视觉 UI 由 UI 工程师实现**（见下方对接说明）。

## 本地开发

```bash
cd viewer
npm install
npm run dev
```

浏览器访问：`http://localhost:5174/craft/1`（需后端运行且该文创已配置 3D）

当前骨架页会拉取 `GET /api/v1/crafts/{id}/viewer` 并以 JSON 展示，用于联调验证。

## UI 工程师对接说明

### 入口文件

| 文件 | 职责 |
|------|------|
| `src/main.ts` | 替换为 Three.js 主逻辑（现为配置拉取占位） |
| `src/api.ts` | 已就绪，勿改接口路径 |
| `src/types.ts` | 与后端 `CraftViewerService` 响应对齐 |
| `src/style.css` | 视觉样式由 UI 工程师重写 |
| `index.html` | 可增加 canvas / HUD 容器 |

### 配置字段（`GET /api/v1/crafts/{id}/viewer`）

- `modelUrl` — GLB 地址（须 OSS 公共读 + CORS）
- `transform` — `{ scale, offsetX, offsetY, offsetZ }`
- `material` — `{ roughness, metalness, envMapIntensity }`
- `camera` — `{ distance, phi, theta, autoRotate }`
- `posterUrl` — 加载期封面（可空）
- `envPresets[]` — MVP 内置 2 项，`panoramaUrl` 多为 `null`
- `hotspots[]` — MVP 为空数组

### 方案要求（MVP）

- PMREM + 内置环境（无全景时）
- OrbitControls 旋转缩放、自动旋转开关
- `renderer.toneMapping = ACESFilmicToneMapping`
- 降级：WebGL 不可用 / GLB 失败 / 无热点

### 依赖

已安装 `three`；UI 实现时可直接 `import` OrbitControls / GLTFLoader 等。

## 生产构建

```bash
npm run build
# viewer/dist/ → 部署到 /var/www/craft/
```

## 小程序入口（非本目录）

- 路由：`/packageA/craft/viewer-webview?id={craftId}`（已实现）
- 详情页：`onImmersiveViewer()` 已就绪，**按钮 UI 待 UI 工程师在 `detail.wxml` 增加**

## 只欠东风（上线勾选）

| # | 项 |
|---|-----|
| 1 | DB 补丁 `patch-craft-3d-mvp.sql` |
| 2 | 管理端上传 GLB + 开启鉴赏 |
| 3 | OSS 公共读 + CORS |
| 4 | Nginx `/craft/`（见 `scripts/nginx-craft-viewer.conf.example`） |
| 5 | 小程序 `craftViewerBaseUrl` + 业务域名白名单 |

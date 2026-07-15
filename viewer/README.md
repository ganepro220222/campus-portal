# 工艺品沉浸式鉴赏 H5（Three.js）

独立静态站，部署在 Nginx `/craft/` 下，与 `admin/` 分离构建。

## 本地开发

```bash
cd viewer
npm install
npm run dev
```

浏览器访问：`http://localhost:5174/craft/1`（需后端运行且该文创已配置 3D）

**静态资源路径（dev）**：`viewer/public/` 下文件在 dev 时挂在站点根路径，例如 `public/models/a.glb` → `http://localhost:5174/models/a.glb`（不是 `/craft/models/`）。生产 Nginx 将 `dist/` 部署在 `/craft/` 下时，同源模型可为 `/craft/models/...`；正式 GLB 通常走 OSS/CDN。

Vite 已将 `/api` 代理到 `http://localhost:8080`。

## 已实现（MVP）

| 能力 | 说明 |
|------|------|
| GLB 加载 | 套用入库 `transform`（scale + offset，**不重复自动居中**） |
| IBL | 内置 `RoomEnvironment` PMREM（无真实全景时） |
| 交互 | OrbitControls 旋转缩放、自动旋转、视角重置 |
| 环境预设 | 影棚布光 / 暖色展厅（切换背景色与曝光） |
| 降级 | WebGL 不可用、模型加载失败、加载进度与封面 |

入口：`src/main.ts`；配置拉取：`src/api.ts`（对接 `GET /api/v1/crafts/{id}/viewer`）。

## 二期未实现

- 真实展馆全景图 PMREM（`env_preset` 表 + equirectangular 加载）
- 热点锚点展示与点击弹层（`craft_hotspot`）
- 管理端热点编辑器（`ModelEditor.vue`）

## 生产构建

```bash
npm run build
# viewer/dist/ → 部署到 /var/www/craft/
```

可选环境变量（构建时）：

```bash
VITE_API_BASE=https://shuyuan.gzcpu.edu.cn/api/v1 npm run build
```

默认同域相对路径 `/api/v1`，与 Nginx 反代方案一致。

## 小程序入口（非本目录）

- 路由：`/packageC/craft/viewer-webview?id={craftId}`
- 详情页 `onImmersiveViewer()` 跳转全屏 web-view

## 只欠东风（上线勾选）

| # | 项 |
|---|-----|
| 1 | DB 补丁 `patch-craft-3d-mvp.sql` |
| 2 | 管理端上传 GLB + 开启鉴赏（自动/手动 transform） |
| 3 | OSS 公共读 + CORS |
| 4 | Nginx `/craft/`（见 `scripts/nginx-craft-viewer.conf.example`） |
| 5 | 小程序 `craftViewerBaseUrl` + 业务域名白名单 |

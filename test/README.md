# 展馆真实模型测试素材

用于本地联调沉浸式 3D 鉴赏（非生产数据）。

## 目录约定

```
test/
  1/          # 展馆工艺品编号 1：1.obj + 1.mtl + 1.jpg
  7/          # 编号 7
  8/          # 编号 8
  output_glb/ # 批处理输出（git 可不提交 *.glb，可本地重新生成）
```

## 1. OBJ → GLB（批处理）

```bash
cd docs/三维展示系统
pip install trimesh pillow numpy

# Windows 建议先设 UTF-8，避免控制台乱码
export PYTHONIOENCODING=utf-8   # Git Bash
python batch_glb.py ../../test -o ../../test/output_glb --max-texture 2048 --overwrite
```

检查 `test/output_glb/manifest.csv`：`贴图内嵌=是`，体积建议 ≤ 3MB（当前约 1.7–2.3MB）。

## 2. 同步到 H5 静态资源（本地 dev）

```bash
mkdir -p viewer/public/models viewer/public/posters
cp test/output_glb/*.glb viewer/public/models/
cp test/1/1.jpg test/7/7.jpg test/8/8.jpg viewer/public/posters/
```

## 3. 写入数据库（Docker MySQL）

```bash
docker compose -f docker-compose.dev.yml exec -T mysql \
  mysql -uroot -pdev123456 --default-character-set=utf8mb4 shuyuan \
  < sql/patch-test-exhibition-crafts.sql
```

将文创 **1、7、8** 指向 `http://localhost:5174/models/...`（Vite dev 的 `public/` 根路径；H5 页仍为 `/craft/1`）。

## 4. 启动并验证

```bash
# 终端 1：后端（若未跑）
docker compose -f docker-compose.dev.yml up -d backend

# 终端 2：H5 viewer
cd viewer && npm run dev
```

浏览器：

- API：`http://localhost:8080/api/v1/crafts/1/viewer`（7、8 同理）
- H5：`http://localhost:5174/craft/1`（7、8 同理）
- 小程序：详情页 `id=1/7/8`，需 `craftViewerBaseUrl` 与 web-view 域名配置

## 5. 上线前

生产环境应通过管理端「沉浸式鉴赏」上传 GLB 至 OSS，**不要**使用 `localhost` URL。本目录源文件可保留作批处理输入。

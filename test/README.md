# 展馆真实模型测试素材

用于本地验证 **VR 展馆静态 H5 展包** 的批处理与预览（非生产数据）。

## 目录约定

```
test/
  1/          # 工艺品源素材编号 1：1.obj + 1.mtl + 1.jpg
  4/          # 静态 H5 原型：index.html + model.glb + BJ.jpg
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

## 2. 本地预览静态展包

```bash
# 在 test/4 目录起静态服务（任选其一）
cd test/4
python -m http.server 8088
# 浏览器打开 http://localhost:8088/index.html
```

将 `test/output_glb/` 中对应 GLB 复制为 `test/4/model.glb` 可替换预览模型。

## 3. 部署到服务器（VR 展馆热点目标）

开发者将展包（`index.html` + `model.glb` + 全景图 + `config.json`）上传至静态目录，例如：

```
https://shuyuan.gzcpu.edu.cn/exhibits/craft-001/
```

再在 VR 平台配置热点外链，模板见 `scripts/vr-craft-hotlink.example.txt`。

## 4. 设计参考

- `test/4/index.html` — RoomEnvironment PMREM + 调参面板（待扩展全景 IBL 与热点）
- `docs/三维展示系统/工艺品立体鉴赏_演示.html` — 热点 + 环境切换完整原型

## 5. 与小程序 / 后端的关系

- 小程序工艺品模块：**仅多角度图片**，无 3D 入口
- 后端 `craft` API：**不返回** 3D 模型字段；3D 展包由开发者静态部署
- 展馆 720° VR（`hall.vr_url`）与本文档的 GLB 展包是两条独立链路

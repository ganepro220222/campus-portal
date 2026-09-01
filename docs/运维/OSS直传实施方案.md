# OSS 视频直传实施方案

> 贵州交通职业大学 · 云端书院
> 对应：技术方案 §4.4 大文件直传；本轮用 **PostObject 签名策略**，不新建 RAM/STS 角色。

管理后台「上传」按钮不变。仅课程视频与资料里的 MP4/MOV 在开关打开后由浏览器直传 OSS；图片/音频/文档/字幕仍走 ECS 中转。小程序播放仍用现有 CDN 短时签名，与上传路径无关。

## 1. 开关（默认关闭）

| 变量 | 默认 | 说明 |
|------|------|------|
| `OSS_DIRECT_UPLOAD_ENABLED` | `false` | `true` 后，视频走直传；未配 CORS 或接口失败时自动回退中转（中转仍 200MB） |

CORS 未配好时不要打开。打开后须重建 backend 容器，并重新部署管理后台静态资源。

## 2. 场景上限

| 场景 | 上限 | 路径 |
|------|------|------|
| 图片 | 20MB | 中转 |
| 字幕 | 10MB | 中转 |
| 音频 | 200MB | 中转 |
| 文档 / 非视频资料 | 200MB | 中转 |
| 视频 mp4/mov | 直传开：2GB；关：200MB | 直传（失败回退中转） |

## 3. 阿里云控制台（仅 CORS）

现有 Bucket、CDN 鉴权、AccessKey **不用改**，也**不要**把 Bucket 改成公共读。

OSS 控制台 → Bucket → **权限管理** → **跨域设置** → 创建规则：

- **来源**：管理后台页面的 Origin（不要带 `/admin`）。预发 HTTPS 是 `https://api.yunmanvr.com`；用 IP 打开时再加 `http://47.109.0.192`；本机开发再加 `http://localhost:5173`。OSS 按规则从上到下匹配，**同一来源必须出现在带 POST 的那条里**，否则直传会被浏览器拦住。
- **允许 Methods**：`POST`、`HEAD`、`GET`（不要 `*`）
- **允许 Headers**：`*`
- **暴露 Headers**：`ETag`、`x-oss-request-id`
- **缓存时间**：`600`

校验（把 Bucket 名换进去）：

```bash
curl -sI -X OPTIONS \
  -H "Origin: https://api.yunmanvr.com" \
  -H "Access-Control-Request-Method: POST" \
  "https://<bucket>.oss-cn-chengdu.aliyuncs.com/"
```

应出现 `Access-Control-Allow-Origin: https://api.yunmanvr.com` 且 Methods 含 `POST`。若返回 403 且没有该头，说明当前来源匹配到了只允许 GET/HEAD 的旧规则。

管理后台页面还有 CSP：`connect-src` 必须包含 `https://*.oss-cn-chengdu.aliyuncs.com`，否则浏览器会在发到 OSS 之前就拦请求（curl 测 CORS 是通的，后台仍红字）。改 CSP 后只需重新部署管理后台。

## 4. 打开直传

1. ECS `.env` 增加 `OSS_DIRECT_UPLOAD_ENABLED=true`
2. `cd /opt/shuyuan && bash scripts/update-staging-from-github.sh`（不要 `SKIP_DOCKER=1`）
3. 本机 `powershell -File scripts/deploy-admin-staging.ps1`
4. 后台强刷后传一个 **略大于 200MB** 的 MP4：应显示百分比，课程保存后小程序能播
5. 若进度条走完后红字「确认失败」，点 **重新确认**，不要重新选文件

回退：把开关改回 `false` 并重建 backend，上传恢复为 200MB 中转。

## 5. 使用限制（本轮不做 Multipart / 转码）

- 直传是一次性 POST：断网、刷新、休眠后必须从头再传。请保持页面打开。
- 上传中可点「取消」。不能暂停/续传。
- OSS POST 成功但 `/complete` 失败时，用「重新确认」只调确认接口；`/complete` 对同一 key 幂等。
- 确认时按 ISO BMFF box 大小跳转读取 moov：H.265/HEVC 会拒绝；moov 在文件尾会提示 Fast Start，不拦截。普通中转上传走同一套检查。
- 请上传 H.264 + AAC 的 MP4。本轮不做云转码。
- Policy 默认 1 小时（`OSS_DIRECT_POLICY_EXPIRE_SECONDS`），与浏览器直传超时对齐。

## 6. 不做

- 本轮不上 RAM 角色 / STS
- 不把 2GB 文件经 ECS 中转
- 不改小程序播放、微信域名、CDN 路径鉴权
- 不做视频转码、不做 OSS Multipart 断点续传

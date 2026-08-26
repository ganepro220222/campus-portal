# Staging File Browser（Docker 部署）

> **staging ECS 使用 Docker，不是 systemd 原生二进制。**  
> 勿将 `scripts/filebrowser.service.example` 复制到 `/etc/systemd/system/`（host 无 `/usr/local/bin/filebrowser` 会 203/EXEC）。

File Browser 供合伙人通过浏览器登录，向 `exhibits/craft-*` **整文件夹上传**展品资源。  
外网路径：**`http://<ECS-IP>/fm/`**（与书院 `/api/` 分离，避免 API 冲突）。

---

## 架构

```
浏览器 → Nginx :80 /fm/  →  127.0.0.1:8081  →  Docker filebrowser
                              exhibits 挂载   →  /opt/shuyuan/exhibits → /srv
                              数据卷          →  filebrowser_db → /database/filebrowser.db
```

| 项 | 值 |
|----|-----|
| 镜像 | `filebrowser/filebrowser:latest` |
| 容器名 | `filebrowser` |
| 进程用户 | 容器内 UID **1000**（非 root） |
| baseURL | `/fm` |
| 配置文件 | 仓库 `deploy/filebrowser-settings.json` → 容器 `/config/settings.json` |

---

## 首次部署 / 重建容器

SSH 登录 ECS，`cd /opt/shuyuan` 后执行：

```bash
mkdir -p /opt/shuyuan/deploy
# settings 已在仓库 deploy/filebrowser-settings.json，git checkout 即可

docker pull filebrowser/filebrowser:latest
docker rm -f filebrowser 2>/dev/null || true

docker run -d \
  --name filebrowser \
  --restart unless-stopped \
  -v /opt/shuyuan/exhibits:/srv \
  -v filebrowser_db:/database \
  -v /opt/shuyuan/deploy/filebrowser-settings.json:/config/settings.json:ro \
  -p 127.0.0.1:8081:80 \
  filebrowser/filebrowser:latest \
  --baseURL=/fm \
  --database=/database/filebrowser.db

sleep 5
docker ps --filter name=filebrowser
```

**说明：**

- 命令行 `--baseURL=/fm` 优先级高于配置文件，避免镜像默认空 baseURL 导致页面转圈。
- 数据库在 Docker volume `filebrowser_db`，删 volume 会重置账号密码。
- 首次初始化会在日志里打印 admin 随机密码，可用 `docker logs filebrowser 2>&1 | tail -30` 查看。

---

## Nginx（`/fm/` 反代）

`/etc/nginx/sites-enabled/shuyuan` 中应包含：

```nginx
location = /fm {
    return 301 /fm/;
}

location /fm/ {
    proxy_pass http://127.0.0.1:8081;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    client_max_body_size 2100m;
}
```

**关键：** `proxy_pass` 末尾 **不要** 写 `/fm/`（否则路径双叠或 API 错位）。

```bash
nginx -t && systemctl reload nginx
```

---

## 验收（不要用 HEAD 误判）

File Browser 对 `/fm/` 的 **HEAD** 请求常返回 404，**不能**用 `curl -I` 判断好坏。

```bash
# 1) 健康（必须 JSON）
curl -s http://127.0.0.1:8081/fm/health
# 期望: {"status":"OK"}

# 2) 页面 BaseURL（必须 /fm）
curl -s http://127.0.0.1:8081/fm/ | grep -o '"BaseURL":"[^"]*"'
# 期望: "BaseURL":"/fm"

# 3) 外网 GET（必须 200，用 GET 不用 HEAD）
curl -s -o /dev/null -w "GET /fm/ -> %{http_code}\n" http://127.0.0.1/fm/
```

浏览器：**Ctrl+F5** 打开 `http://<ECS-IP>/fm/`，应能登录并看到 `craft-*` 目录。

---

## 与 exhibits 权限脚本配合

更新权限策略后（或 `git checkout origin/main -- scripts/` 拉新脚本）：

```bash
cd /opt/shuyuan
EXHIBITS_GROUP=1000 bash scripts/fix-exhibits-permissions.sh
```

**Docker 说明：**

- 容器写文件时 host 上显示为 **UID 1000**（常为 `ubuntu`），不是系统用户 `filebrowser`。
- `FILEBROWSER_USER=filebrowser` 仅在使用 **systemd 原生** unit 时需要；Docker staging **不必**设。
- 脚本会：代码 `root:root 755/644`、内容 `2775/664`、default ACL `www-data:rX`、必要时 restart `studio-server`。

上传后 Nginx 静态读验收：

```bash
curl -sI http://127.0.0.1/exhibits/craft-001/<新文件名> | head -3
# 期望 HTTP/1.1 200
```

---

## File Browser 访问规则（建议）

合伙人账号只需读写 `craft-*` 与 `共享背景`，**不应**通过 FM 改代码树。登录 `http://<ECS-IP>/fm/` → **Settings → Global Settings → Rules**。

**推荐：路径 Deny（不要勾选 Regex）** — UI 输入框较窄，正则易被截断成非法表达式（如 `^/_server(/` 缺 `|$)`），会导致列表 API **500 服务器内部错误**。

对每条规则：**Regex 不勾**、**Allow 不勾**、路径填：

| 路径（Path） |
|--------------|
| `/_server` |
| `/_launch` |
| `/_dev` |
| `/vendor` |
| `/_template` |
| `/_runtime` |

保存后刷新；应仍能看到 `craft-*`，进入 `_server` 应被拒绝。

**若已 500：** Settings → Rules → 用右侧 **−** 删掉全部规则 → 保存 → 再按上表用**路径模式**重建。

**CLI 备选（容器内，路径 Deny）：**

```bash
for p in /_server /_launch /_dev /vendor /_template /_runtime; do
  docker exec filebrowser filebrowser rules add "$p" -d /database/filebrowser.db
done
docker logs filebrowser 2>&1 | tail -20
```

宿主机 `fix-exhibits-permissions.sh` 已用 root:root 755 保护代码；Rules 为 UI 层双保险。

---

## 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| 页面打开一直转圈 | baseURL 为空，JS 请求打到 `/api/`（书院后端） | 重建容器并加 `--baseURL=/fm`；确认 settings.json |
| `curl -I /fm/` 404 | HEAD 不支持 | 改用 GET 验收 |
| systemd `203/EXEC` | 误装了 native unit，host 无二进制 | `rm /etc/systemd/system/filebrowser.service && systemctl daemon-reload` |
| 新上传 Nginx 403 | umask 过严或 ACL 未刷 | 跑 `fix-exhibits-permissions.sh`；确认 `apt install acl` |
| FM「服务器内部错误」 | Rules 正则被 UI 截断（非法 regex） | 删光 Rules 后改用**路径 Deny**（见上文） |

---

## 原生 systemd（非 staging 默认）

若将来不用 Docker、改 host 二进制 + systemd，见 `scripts/filebrowser.service.example`。  
与本文 Docker 流程 **二选一**，不要同时启用。

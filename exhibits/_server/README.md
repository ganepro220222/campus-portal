# 立体鉴赏 · 保存与列目录服务

在浏览器中编辑展品后，点击「保存」即可写回服务器上的 `config.json`。提供两种等价实现，任选其一：

- `studio-server.mjs` — Node 版（零依赖，含静态托管、注入保存地址、Basic Auth）
- `api.php` — PHP 版（部署在已有 PHP 环境，仅提供两个接口）

## 接口

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/studio-api/list` | 扫描 `exhibits/` 下全部展品目录，供工作台自动加载 |
| POST | `/studio-api/save` | 请求体 `{ ex, config, poster? }` → 写回 `<ex>/config.json`；写前自动备份上一版到 `<ex>/.bak/`（保留最近 20 份） |

## 前端约定

- `studio.html`：检测到 `/studio-api/list` 可用时自动列出展品，否则读取 `manifest.json`。
- `player.html`：通过 `window.__SAVE_API__` 获取保存地址（Node 版访问 `player.html` 时自动注入）；未配置时「保存」降级为下载 `config.json`，需手动上传覆盖。

## 本地启动（Node）

```bash
cd exhibits
STUDIO_PASS=你的密码 node _server/studio-server.mjs
# 浏览器打开 http://127.0.0.1:8080/studio.html
```

未设置 `STUDIO_PASS` 时不启用鉴权，仅限本机调试，勿暴露到公网。

## 生产环境

1. **鉴权**：编辑入口（`studio.html`、带 `mode=edit` 的 `player.html`、本接口）统一放在受保护路径，设置 `STUDIO_PASS`，或使用 Web 服务器 Basic Auth / IP 白名单。公网仅部署仅观看版播放器与各展品数据。
2. **独立路径**：本服务使用独立端口或 URL 前缀，与业务后台分离；可与静态文件同机部署。
3. **缓存**：保存后 `config.json` 应立即可读；若经 CDN，需禁用对该文件的长期缓存或加版本参数。
4. **PHP 路由示例**（Nginx）：

   ```nginx
   location = /studio-api/list { rewrite ^ /_server/api.php?action=list break; fastcgi_pass ...; }
   location = /studio-api/save { rewrite ^ /_server/api.php?action=save break; fastcgi_pass ...; }
   ```

5. 静态资源（播放器、vendor、展品目录）可托管于对象存储与 CDN；若需云端写回，可将写盘逻辑改为对象存储 SDK 上传。

## 备份与回滚

每次保存前，旧配置备份为 `<ex>/.bak/config.<时间戳>.json`。回滚：将某份备份复制回 `<ex>/config.json` 即可。`.bak/` 已在 `.gitignore` 中，不入版本库。

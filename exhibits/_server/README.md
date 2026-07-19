# 3D 鉴赏工作台 · 保存/列目录 参考后端

让合伙人「在浏览器里编辑 → 点保存 → 直接写回服务器」。两份等价实现，任选其一：

- `studio-server.mjs` —— Node 版（零依赖，含静态托管 + 注入保存地址 + Basic Auth）
- `api.php` —— PHP 版（放到已装 PHP 的服务器上，只提供两个接口）

## 提供的接口
| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/studio-api/list` | 扫 `exhibits/` 目录，列出全部展品（工作台自动加载，免手维护 manifest） |
| POST | `/studio-api/save` | body `{ex, config}` → 写回 `<ex>/config.json`，**写前自动备份上一版**到 `<ex>/.bak/`（保留最近 20 份） |

前端约定：`studio.html` 有后端时走 `/studio-api/list`（否则回退 `manifest.json`）；`player.html` 通过 `window.__SAVE_API__` 得到保存地址（Node 版自动注入；静态部署时保存自动降级为「导出 config.json 手动上传」）。

## 本地/自测（Node）
```bash
cd exhibits
STUDIO_PASS=你的密码 node _server/studio-server.mjs
# 打开 http://127.0.0.1:8080/studio.html（弹 Basic Auth 登录）→ 点某展品「编辑」→ 改 → 「保存」
```
> 不设 `STUDIO_PASS` 则无鉴权、仅供本机自测，**切勿暴露公网**。

## 上线（要点）
1. **鉴权**：编辑地址（studio + player 编辑版 + 本接口）统一放**受保护路径**，设 `STUDIO_PASS` 或用 Nginx Basic Auth / IP 白名单。公开地址只放**仅观看版**。
2. **与甲方后台解耦**：本服务是你们开发/维护方自己的工具，走**独立端口/路径**，不接入、不经过小程序的 Spring Boot 管理后台（可同机）。
3. **config.json 不走 CDN 缓存**（或带版本号），否则保存后合伙人看不到更新。
4. **PHP 版重写**（Nginx 示例）：
   ```nginx
   location = /studio-api/list { rewrite ^ /_server/api.php?action=list break; fastcgi_pass ...; }
   location = /studio-api/save { rewrite ^ /_server/api.php?action=save break; fastcgi_pass ...; }
   ```
5. 静态（player/vendor/展品数据）建议 OSS+CDN；保存接口写回 OSS 时改 `api.php`/`studio-server.mjs` 的写盘为 OSS SDK PUT 即可。

## 备份与回滚
每次保存前的旧配置存于 `<ex>/.bak/config.<时间戳>.json`。回滚：把某个备份复制回 `<ex>/config.json` 即可。`.bak/` 已在 `.gitignore`，不入库。

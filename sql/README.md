# 数据库脚本说明

## 全新环境（推荐）

Docker 开发环境会在 MySQL 首次启动时自动执行：

1. `init.sql` — 建表 + 基础角色/规则
2. `seed-dev.sql` — 演示数据（新闻、展馆、课程等）

```bash
# 手动导入（非 Docker 时）
mysql -uroot -p shuyuan < sql/init.sql
mysql -uroot -p shuyuan < sql/seed-dev.sql
```

**全新库无需再跑 `patch-*.sql`**，除非下文标注为「仅旧库升级」。

---

## 旧库升级（已有数据、结构落后时）

按顺序执行；**已并入 init.sql 的补丁可跳过**。`patch-admin-account-security.sql` 与 `patch-point-record-unique.sql` 已做幂等，可重复执行。

| 顺序 | 文件 | 用途 | 是否已并入 init.sql |
|------|------|------|---------------------|
| 1 | `patch-fix-charset.sql` | 修复早期 latin1 乱码 | — |
| 2 | `patch-banner-columns.sql` | Banner 补 title/description | ✅ 已并入 |
| 3 | `patch-cover-fit-mode.sql` | 封面 fill/fit 字段 | ✅ 已并入 |
| 4 | `patch-feedback-type.sql` | 反馈 type 字段 | ✅ 已并入 |
| 5 | `patch-admin-account-security.sql` | 首次改密 + 发布权细分 + 内容审核角色 | 部分已并入（`must_change_password`、角色 4）；**可重复执行** |

#### `patch-admin-account-security.sql`（旧库必读）

**新库**：`init.sql` 已含 `must_change_password=1` 与角色 4，**勿**依赖本 patch 建表。

**旧库升级**：即使 `sys_user.must_change_password` **列已存在**，也**建议再执行**本 patch，原因：

1. 幂等 DDL 会跳过已存在的列，不会报错；
2. 后续的 `UPDATE sys_role ...` 仍会补齐发布权细分与「内容审核」角色；
3. 末尾 `UPDATE sys_user SET must_change_password = 1 WHERE username='admin'` 会修正旧库中默认 admin 仍为 `0` 的情况。

> 常见误区：「字段已经有了就不用跑 patch」—— 会漏掉**数据修正**，导致默认 admin 不强制首次改密（若口令仍是 `Admin@123`，prod/staging 启动门禁会拦截启动）。

| 6 | `patch-category-permissions.sql` | 旧库角色补 category 权限 | — |
| 7 | `patch-hall-sections.sql` | 校史馆章节 seed | seed-dev 已含 |
| 8 | `patch-hall-vr.sql` | 展馆 VR 链接数据修正 | 仅数据 |
| 9 | `patch-hall-real-data.sql` | 展馆真实数据补充 | 仅数据 |
| 10 | `patch-token-version.sql` | JWT `token_version`（改密后旧 token 失效） | ✅ 已并入；**可重复执行** |
| 10 | `patch-loadtest.sql` | 压测专用数据 | 非日常 |
| 11 | `patch-hall-vr-links-20260711.sql` | 校园安全教育馆、西部山区安全基地 VR 链接 | 仅数据 |
| 12 | `patch-point-record-unique-cleanup.sql` | **旧库** `point_record` 重复流水查重/清理（加唯一键前） | — |
| 13 | `patch-point-record-unique.sql` | **旧库** 添加 `uk_member_action_remark`（幂等，可重复执行） | ✅ 已并入 init.sql |
| 14 | `patch-sys-config-miniapp.sql` | AI 助手欢迎语/推荐问题、搜索热词配置项 | ✅ 已并入 init.sql |
| 15 | `patch-subtitle-asr-poll.sql` | 课程 ASR 轮询元数据字段（`subtitle_asr_*`） | ✅ 已并入 init.sql；**可重复执行** |

#### `patch-subtitle-asr-poll.sql`（旧库 ASR 字幕必读）

**新库**：`init.sql` 已含 `subtitle_asr_started_at` 等 4 列，**勿**再跑本 patch。

**旧库升级**（自 aab2175 及之后引入 ASR 轮询元数据的版本）：

1. 执行 `patch-subtitle-asr-poll.sql`（逐列幂等，部分列已存在时会补齐缺失列）。
2. 验收 SQL（应返回 **4** 行）：

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'course'
  AND column_name IN (
    'subtitle_asr_started_at',
    'subtitle_asr_last_poll_at',
    'subtitle_asr_attempt_count',
    'subtitle_asr_last_error'
  );
```

3. 重启后端后，在管理端打开课程列表 / 触发字幕，确认无 `Unknown column subtitle_asr_*` 报错。

#### `point_record` 唯一键（旧库必读）

**新库**：`init.sql` 已含 `uk_member_action_remark`，**勿**再跑 12、13。

**旧库升级**（尤其曾存在课程完成重复发放风险时）：

1. 执行 `patch-point-record-unique-cleanup.sql` **Step 1** 查重；有结果则 **Step 2** 审计 → **Step 3** 删重复（保留最小 `id`）。
2. **Step 4** 按 Step 2 汇总决定是否扣回 `member.points`（须业务/运维确认，脚本内为注释模板）。
3. 无重复或清理完成后，执行 `patch-point-record-unique.sql`（已判断索引是否存在，重复执行安全）。

### Docker 一键执行示例

```powershell
# 将补丁复制进容器后执行（避免 PowerShell 管道编码问题）
docker cp sql/patch-cover-fit-mode.sql shuyuan-mysql-1:/tmp/patch.sql
docker exec shuyuan-mysql-1 sh -c "mysql -uroot -pdev123456 shuyuan < /tmp/patch.sql"
```

本地开发默认密码见 `docker-compose.dev.yml`（`dev123456`）。

---

## 生产部署注意

1. 优先使用最新 `init.sql` 建新库；旧库按上表顺序打补丁。
2. `patch-admin-account-security.sql` 末尾注释：新建独立超管后应 **禁用默认 `admin` 账号**。
3. 打补丁后验收默认超管改密标记（期望 `must_change_password = 1`）：

```sql
SELECT username, status, must_change_password
FROM sys_user
WHERE username = 'admin';
```

4. 打补丁后重启后端（**勿**使用 `docker-compose.dev.yml`，该文件仅本地开发）：

```bash
# Docker 部署（推荐，替换为部署机真实 .env 路径）
docker restart shuyuan-api
# 或首次启动见 docs/运维/部署手册_V1.0.md §5.3

# systemd 部署
sudo systemctl restart shuyuan-backend
```

5. 结构变更后建议在管理后台点几个列表页（新闻、展馆、课程）确认无 500。

---

## 文件索引

| 文件 | 类型 |
|------|------|
| `init.sql` | 建表 + 初始角色 |
| `seed-dev.sql` | 开发演示数据 |
| `patch-*.sql` | 旧库增量升级或数据修正 |

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
| 10b | `patch-loadtest-cleanup.sql` | **删除**压测活动 99 + loadtest001–050 账号 | staging 压测后清理 |
| 11 | `patch-hall-vr-links-20260711.sql` | 校园安全教育馆、西部山区安全基地 VR 链接 | 仅数据 |
| 12 | `patch-point-record-unique-cleanup.sql` | **旧库** `point_record` 重复流水查重/清理（加唯一键前） | — |
| 13 | `patch-point-record-unique.sql` | **旧库** 添加 `uk_member_action_remark`（幂等，可重复执行） | ✅ 已并入 init.sql |
| 14 | `patch-sys-config-miniapp.sql` | AI 助手欢迎语/推荐问题、搜索热词配置项 | ✅ 已并入 init.sql |
| 15 | `patch-subtitle-asr-poll.sql` | 课程 ASR 轮询元数据字段（`subtitle_asr_*`） | ✅ 已并入 init.sql；**可重复执行** |
| 16 | `patch-subject-neutral-config.sql` | **主体归属对齐**：把库里随 init.sql 写入的旧默认文案与机构占位串换成中性表述 | ✅ 新库无需执行；**旧库必跑、可重复执行** |
| 17 | `patch-college-app-demo.sql` | **首页关联应用**：`college_app` 从旧版 11 条学院名收敛为通途星 + 2 条示例 | ✅ 新库无需执行；**旧库必跑、可重复执行** |

#### `patch-subject-neutral-config.sql`（旧库必读）

小程序备案主体已是**贵州云漫科技有限公司**，界面不再打学校名号；按微信审核口径，
内容表述也要避开「新闻 / 文化 / 历史 / 政治」类框架。

代码侧（miniapp、`SysConfigService` 的默认值、`init.sql`）已经改完，但**已经建好的库**里
存的还是旧值——接口读的是库，改代码不会自动生效。本 patch 负责把库补上：

- `sys_config` 的 AI 欢迎语 / 推荐问题 / 搜索热词；
- `badge` 里带「文化」字样的两个徽章名；
- `member_profile.college`、`enroll.college` 里的旧占位串
  「贵州交通职业大学 · 中华文化书院」（个人中心顶部显示的就是它）。

所有 UPDATE 都带 `WHERE 旧值 = '…'` 精确匹配，**只覆盖从未被人改过的默认值**，
后台里管理员自己写过的内容一律不动，可重复执行。

关于页简介与隐私 / 用户协议不在本 patch 范围内：那两项旧版是写死在 Java 里的，
库里通常没有对应行；代码侧已改成「后台没配就返回空」，小程序会落到自带基线。
若你们已在后台保存过带学校名或 edu.cn 邮箱的版本，请到后台「内容配置」直接改。

#### `patch-college-app-demo.sql`（旧库首页关联应用）

`seed-dev.sql` 对 `college_app` 使用 `INSERT IGNORE`，**不会覆盖**旧库里已有的 11 条学院名。
小程序首页「关联应用」读的就是这张表，因此仅改代码或跑 `patch-subject-neutral-config.sql`
仍可能看到马克思主义学院等旧条目。

本 patch 先 `DELETE` 再写入固定 id 1–3（通途星 + 2 条示例），可重复执行。
**会清空并重建整张 `college_app` 表**——若后台曾手工维护过关联应用，请先导出再决定是否执行。

与 `patch-subject-neutral-config.sql` 互补：后者不动 `college_app`；全新 Docker 库（`init.sql` +
`seed-dev.sql`）已含新数据，**无需**再跑本 patch。

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

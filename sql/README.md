# 数据库脚本说明

## 全新环境（推荐）

### Docker 开发环境自动初始化

`docker-compose.dev.yml` 在 **MySQL 数据卷首次创建** 时会依次自动执行：

1. `init.sql` — 建表 + 基础角色/规则
2. `seed-dev.sql` — 演示数据（新闻、展馆、课程等）
3. `patch-builtin-knowledge.sql` — **内置知识库（正式内容，任何环境都要跑）**

> 已有 `mysql_data` 卷不会因 `docker compose up` 或重启自动补跑第 3 步。
> 保留现有开发数据时请手动执行 builtin patch；或 `docker compose -f docker-compose.dev.yml down -v` 后重建。

机器可读清单见 `sql/sql-init-manifest.json`（由 `npm run check:sql-init` 校验）。

### 非 Docker 手动初始化

#### 生产新库

```bash
mysql -uroot -p shuyuan < sql/init.sql
mysql -uroot -p shuyuan < sql/patch-builtin-knowledge.sql
```

#### 开发 / 演示新库

```bash
mysql -uroot -p shuyuan < sql/init.sql
mysql -uroot -p shuyuan < sql/seed-dev.sql
mysql -uroot -p shuyuan < sql/patch-builtin-knowledge.sql
```

**全新库无需再跑其余 `patch-*.sql`**，除非下文标注为「仅旧库升级」。

### `patch-builtin-knowledge.sql`（所有环境都要执行）

写入 8 篇「云端书院小程序使用指南」——登录、报名、积分、课程、书院助手等自身功能说明。

**为什么必须跑：** 「书院助手」是先检索知识库、再据此作答。知识库空着的时候它检索不到
任何片段，只会反复回一句「没有找到相关资料」，而学生每问一次仍然要消耗当天 20 次额度中的
一次——助手看起来什么都不会，次数还在掉。校方与学院的文化资料我们无从代劳，但「这个小程序
怎么用」是我们自己的交付物，本来就该随系统一起给出。

| 特性 | 说明 |
|------|------|
| 可重复执行 | 按标题判重，已存在则跳过，不会插出重复文档 |
| 后台可管 | `source_type=manual`，与手工录入的资料同一套增删改查，可改可停用可删 |
| 不是演示数据 | `file_url` 前缀为 `builtin://`；`seed-dev-cleanup.sql` **不会**清除它 |
| 由脚本生成 | 源文件在 `sql/knowledge/*.md`，改完执行 `npm run build:builtin-knowledge` 重新生成 |

> **不要手改这个 .sql**：分段规则必须与后端 `TextChunker` 一致（500 字一段、50 字重叠）。
> 手写对不齐不会报错，但后台里编辑一次这篇文档，分段就会和内置的不一样，
> 同一份资料在检索时前后表现不一致，且没有任何提示。
> `npm run check:builtin-knowledge` 会拦住「源文件改了却没重新生成」。

> **执行顺序**：dev 环境请在 `seed-dev.sql` **之后**执行本脚本。`seed-dev.sql` 用的是显式
> id（`knowledge_doc` 1、2），先跑本脚本会占掉这两个 id，导致演示数据被 `INSERT IGNORE` 静默跳过。

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
| 18 | `seed-dev-cleanup.sql` | **交付前清场**：反向删除 `seed-dev.sql` 灌入的全部演示数据 | 非日常；两道护栏，见下 |
| 19 | `patch-course-progress-watched-seconds.sql` | 课程进度累计观看 + 上次上报位置；旧库高进度回填 | ✅ 已并入 init.sql；**可重复执行** |

#### 按 id 区间删数据的两个脚本（务必先读）

`seed-dev-cleanup.sql` 与 `patch-loadtest-cleanup.sql` 都是**按 id 区间**删数据的：
前者删 `news` 1–6、`category` 1–19 这类演示行，后者删 `member` 101–150 与 `activity` 99。
这些 id 在演示 / 压测库里是演示数据，**在生产库里就是真实内容和 50 个真实师生**。

两个脚本都带护栏，认错库就中止、一行不删：

| 脚本 | 护栏 |
|------|------|
| `seed-dev-cleanup.sql` | ① 必须显式 `SET @wipe_demo='YES'`；② 库里必须还有 seed 标记行（`member` id=1 / `acct:2021001` / 昵称「测试学员」） |
| `patch-loadtest-cleanup.sql` | ① `member` 101–150 必须全是 `loadtest_` 开头的 openid；② `activity` 99 的标题必须是压测活动 |

护栏用存储过程 + `SIGNAL` 实现（`SIGNAL` 只能在存储程序里用）。执行账号需要
`CREATE ROUTINE` 权限；没有权限时脚本停在 `CREATE PROCEDURE`，同样是「什么都没删」的安全失败。

清场用法（**务必先备份**）：

```bash
bash scripts/backup-staging-mysql.sh
{ echo "SET @wipe_demo='YES';"; cat sql/seed-dev-cleanup.sql; } \
  | docker compose -f docker-compose.staging.yml exec -T mysql \
      mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" shuyuan
```

`seed-dev-cleanup.sql` **不动** `sys_user` / `sys_role`：这两张表的行来自 `init.sql`，
`seed-dev.sql` 只是改了名称和密码，删掉就没人能登录后台了。清场后请在后台重设超管密码。

`npm run check:seed-cleanup` 会校验清理脚本覆盖了 `seed-dev.sql` 插入的每一张表——
往 seed 里加演示数据却忘了补清理，交付前清场就会剩几条演示数据留在列表里。

#### 日常删除请走后台，别写 SQL

后台「回收站」已覆盖动态 / 展馆 / 文创 / 课程 / 资源 / 活动 / 公告 / 轮播图 / 分类 /
书院应用 / 导航项 / 管理角色 / 管理员账号共 13 类，逐条彻底删除时会先算清影响面：
没有关联数据的直接删，连着报名收藏的会列清单并要求重输管理员密码，
分类下还挂着内容的会告诉你先改哪些内容。师生账号在「师生账号」页删。

上服务器手写 DELETE 是最后手段：那里没有确认框、没有权限校验、也没有操作记录。

**日志都不提供后台逐条删除**，但三张表性质不同：

- `sys_log`（管理员操作审计）、`subscribe_outbox`（通知投递记录）是**证据**——
  能挑着删的日志就不再是证据。只按 `shuyuan.retention.*` 的保留期整批过期，
  任何业务删除都不碰它们。
- `event_log`（用户行为分析）同样没有逐条删除入口，但**删除师生账号时会连同其行为记录一并抹掉**：
  那是在抹掉这个人本身，不是在销毁证据。

默认保留期：行为日志 90 天、系统日志 365 天、发件箱已发送 30 天 / 失败 180 天。

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

#### `patch-course-progress-watched-seconds.sql`（旧库课程进度必读）

**新库**：`init.sql` 已含 `watched_seconds`、`last_report_position_seconds`，**勿**再跑本 patch。

**旧库升级**（自引入累计观看完成判定版本起）：

1. 发布新版后端**前**执行本 patch（幂等，可重复执行）。
2. 补丁会新增两列，并将 `progress_percent >= 90` 且未完成的旧记录回填可信 `watched_seconds`，避免升级后永久卡死。
3. 验收 SQL（应返回 **2** 行）：

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'course_progress'
  AND column_name IN ('watched_seconds', 'last_report_position_seconds');
```

4. 重启后端后，打开课程详情 / 播放器，确认无 `Unknown column 'watched_seconds'` 报错。

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
| `knowledge/*.md` | 内置知识库源文件（改这里，不要改生成的 .sql） |
| `patch-builtin-knowledge.sql` | 内置知识库（**正式内容**，由上面的源文件生成，所有环境都要跑） |
| `patch-*.sql` | 旧库增量升级或数据修正 |

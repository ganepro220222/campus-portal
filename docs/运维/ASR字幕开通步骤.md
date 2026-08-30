# ASR 字幕开通步骤

> 后台「课程管理 → 触发 ASR 生成」走阿里云**智能语音交互 · 录音文件识别**（filetrans 4.0）。  
> 未开通时点按钮会 503，可继续手动上传 VTT/SRT。

## 1. 开通产品（控制台）

1. 用**现有书院阿里云账号**打开 [智能语音交互控制台](https://nls-portal.console.aliyun.com/overview)
2. 若未开通：点**开通服务**，服务类型选 **试用**
   - 勾选 **录音文件识别**（普通版即可）
   - **不要**只开通「闲时版 / 极速版」（那两档必须商用，试用调不通）
3. 试用：约 3 个月，每 24 小时免费转写 **2 小时**音视频；用完再等 24 小时或升级商用（约 1 元/小时）

## 2. 建项目拿 AppKey

1. 控制台 → [全部项目](https://nls-portal.console.aliyun.com/applist) → **创建项目**
2. 项目类型选 **仅语音识别**（或默认「识别+合成」也行）
3. 项目功能配置里，模型用 **中文普通话 / 识音石 或 音视频离线转写**（课程视频用这个）
4. 复制 **项目 Appkey**（一长串，不是 AccessKey）

## 3. AccessKey 权限

可复用现有 OSS 子账号 AK，只要再挂一条权限：

- 系统策略 **`AliyunNLSFullAccess`**

或新建 RAM 用户，只授这一条 + 不要开控制台登录。AccessKey 只填 ECS `.env`，**不要入库**。

## 4. 写入 staging 并重建后端

文件是 **ECS 上的** `/opt/shuyuan/.env`（不是本机仓库里的 `.env.example`）。插在文件**末尾**即可，不必插到某一行中间。

AccessKey 可复用现有 `OSS_ACCESS_KEY` / `OSS_SECRET_KEY`，但该 RAM 用户须已挂 **`AliyunNLSFullAccess`**。`ASR_APP_KEY` 换成控制台刚复制的 Appkey（不要带空格）。

SSH 到 ECS 后整段粘贴（**只改第二行 Appkey**）：

```bash
cd /opt/shuyuan
APPKEY='这里换成刚复制的Appkey'

cp .env .env.bak.$(date +%Y%m%d%H%M)
OSS_AK=$(grep -E '^OSS_ACCESS_KEY=' .env | tail -n1 | cut -d= -f2-)
OSS_SK=$(grep -E '^OSS_SECRET_KEY=' .env | tail -n1 | cut -d= -f2-)
upsert() { k="$1"; v="$2"; if grep -qE "^${k}=" .env; then sed -i "s|^${k}=.*|${k}=${v}|" .env; else echo "${k}=${v}" >> .env; fi; }
upsert ASR_PROVIDER aliyun
upsert ASR_ACCESS_KEY_ID "$OSS_AK"
upsert ASR_ACCESS_KEY_SECRET "$OSS_SK"
upsert ASR_APP_KEY "$APPKEY"
upsert ASR_REGION cn-shanghai
grep -E '^ASR_' .env | sed -E 's/(SECRET|KEY_ID|APP_KEY)=.*/\1=***/'
docker compose -f docker-compose.staging.yml up -d --force-recreate backend
```

`docker restart` **不会**重载 `.env`。改完必须 `--force-recreate`。  
若 `OSS_AK` 为空，说明变量名不是 `OSS_ACCESS_KEY`，先 `grep -E 'OSS_.*KEY' .env` 看实际名字再改命令。

后端镜像须包含本次 filetrans 接口修正（`Task` JSON + `filetrans.*.aliyuncs.com`）。旧镜像配了 Key 也会提交失败。

## 5. 管理端验收

1. 课程已上传 `videos/` 下的 **mp4/mov**（先保存课程）
2. 再点 **触发 ASR 生成**
3. 状态变为「生成中」，约 2–10 分钟后变「已就绪」（Job 每 2 分钟轮询）
4. 失败时编辑弹窗会显示 `subtitleLastError`；也可查库：

```sql
SELECT id, name, subtitle_status, subtitle_task_id, subtitle_asr_last_error
FROM course WHERE id = <课程ID>;
```

5. 小程序课程播放页打开「AI 字幕」应出现逐句字幕

## 6. 限制（避免误以为坏了）

| 项 | 说明 |
|----|------|
| 视频必须在本项目 OSS `videos/` | 外链域名不在白名单会 400 |
| 私有桶 | 提交时用 **OSS 签名原站 URL**，不走 CDN 改写 |
| 文件 | 音频 ≤512MB；视频 ≤2GB、时长 ≤12h |
| 格式 | mp4 / mov（后台已限制） |
| 试用额度 | 每 24h 共 2 小时，超额会失败 |

## 7. 不接 ASR 时

管理端上传 `.vtt` / `.srt` → **保存字幕地址** 即可，小程序同样能开字幕。

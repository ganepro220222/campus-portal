# UI Batch 6 · 错误态视觉对接说明

> **工程批次（本仓库直接提交）** 负责：页面状态机、接口不吞错、WXML 结构、全局占位 class、单测。  
> **UI 批次（uibatch6.bundle）** 负责：视觉 polish，不改业务逻辑。

## 工程侧已提供的 WXML 结构

所有内容详情/列表页统一使用 `app.wxss` 中的占位 class：

| Class | 用途 |
|-------|------|
| `.page-state-box` | 全页 loading / 错误 / 不存在容器 |
| `.page-state-text` | 主文案 |
| `.page-state-action` | 主按钮（重新加载） |
| `.page-state-link` | 次要链接（返回列表） |
| `.page-refresh-bar` | 有内容时的顶部静默刷新失败条 |

~~当前仅占位样式（居中、可读），intentionally 朴素，便于 UI 统一美化。~~

> **UI 批次已完成对接**（见 `小程序文案备案对照清单_V1.0.md` §14）。占位样式已替换为正式视觉，
> 逐页边距、按下反馈、错误态图标均已处理，并新增 `scripts/check-press-feedback.js` 作为回归关卡。

## UI 对接建议（uibatch6 范围）

1. **与活动详情/报名页视觉对齐**
   - `.page-state-action` → 对齐 `.detail-retry` / `.enroll-retry`（胶囊、背景 `--sky-2`、按下变深）
   - `.page-refresh-bar` → 对齐 `.detail-refresh-bar` / `.pl-refresh-bar`（边距、字号按各页容器 padding 微调）
   - `.page-state-link` → 对齐 `.detail-retry-link`

2. **各 Tab 列表页**
   - 动态 / 展馆 / 课程 / 活动 / 文创 / 资源：错误态与空态间距、icon 是否补全
   - 骨架屏与错误态互斥（工程已用 `!error` 条件，UI 只需美化）

3. **按下反馈扫描** ✅ 已落地
   - `scripts/check-press-feedback.js` 已创建并接入 `npm run preflight:local`，支持 hex / `var()` / `rgba()`

4. **不要改动的部分**
   - `contentPageInit.js` / `feedListPage.js` / `activityDetailLoad.js` 状态字段名
   - WXML 中 `wx:if` / `wx:elif` 分支顺序（loading → loadError → notFound → content）
   - `onRetry` / `onBackList` 绑定

## 已接入错误态的页面（逻辑完成，待 UI polish）

### 详情
- `packageA/news/detail`
- `packageA/hall/detail`
- `packageB/course/detail`
- `packageA/craft/detail`
- （活动详情/报名已在 uibatch 前完成，使用页面内 class）

### 列表 / Tab
- `pages/news/index`
- `pages/hall/index`
- `pages/course/index`
- `pages/activity/index`
- `packageA/craft/list`
- `packageB/resource/list`

## 验收勾选（UI 批次完成后写入文案备案清单 §14）

- [x] 全局 `.page-state-*` 与活动详情 retry 风格一致
- [x] 刷新失败条在各页边距与主内容对齐（10/10 逐页核对）
- [x] 错误态下点赞/收藏/报名等交互不可点（已确认：正文与底部操作栏均在 `wx:elif="{{content}}"` 内，错误态整块不渲染）
- [ ] 弱网首次进入 → 加载失败 → 重试 → 正常内容
- [ ] 有内容时静默刷新失败 → 保留旧列表/详情 + 顶栏可点重试

## 打包方式

```bash
git bundle create uibatch6.bundle HEAD
# 基线需包含本工程批次的 merge commit
```

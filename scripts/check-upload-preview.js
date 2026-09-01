#!/usr/bin/env node
/**
 * 后台上传预览框的几条约定，每条都对应一个具体的、老师看得见的毛病。
 *
 * 1) 语音不要第二颗播放键。那颗「试听」原本是为了绕开控件被裁切点不到的问题
 *    （播放器净宽只剩 202px，Chromium 把总时长和时间轴一起裁掉）。播放器铺满整行后
 *    原生控件已经完全可用，再留一颗按钮就是两个播放入口、两份播放状态。
 *    但删按钮的同时必须留下加载占位，否则签名地址还没换回来时整块是空的。
 *
 * 2) 文档预览框必须给得出「这是哪一份文件」。OSS 对象名是 32 位 hex 且被主动挡掉，
 *    刷新之后框里只剩「PDF 文件」四个字——老师无从确认自己传的是哪一版。
 *    所以要有分色角标（类型）、真实文件名、大小/时间，以及一个能真的打开来看的入口。
 *
 * 3) 「打开预览」必须懒签。签名地址是短时的，渲染时就签好，等老师去点时可能已经过期。
 *
 * 4) .preview-wrap--file 必须自己写 box-sizing。这个项目没有全局 border-box，
 *    width:320px + padding:10px 会叠成 342px，在窄栏里溢出。
 *
 * 5) 记录/查询上传元信息绝不能把上传本身弄挂。老库还没跑 patch-oss-object-meta.sql 时
 *    表不存在，若异常冒泡，等于「加了个显示文件名的小功能」把上传功能整个带走。
 *
 * 用法：node scripts/check-upload-preview.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = process.env.UPLOAD_PREVIEW_CHECK_ROOT || path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const vue = read('admin/src/components/OssUploadInput.vue')
const oss = read('backend/src/main/java/com/shuyuan/backend/service/OssService.java')

const errs = []
// 用 lastIndexOf：模板里有 <template v-else-if> 这种内层标签，
// indexOf 会在第一个内层闭合处就截断，后半段模板检查不到
const template = vue.slice(0, vue.lastIndexOf('</template>'))
const style = vue.slice(vue.indexOf('<style'))

// ---------- 1) 语音：没有第二颗播放键，但要有加载占位 ----------
if (/试听|暂停/.test(template)) {
  errs.push('语音预览又加回了「试听/暂停」按钮 —— 与原生控件重复，且多出一份播放状态')
}
/*
 * 只截音频那一段来查。不能直接在整个模板里搜 preview-loading：
 * showAudioPreview 第一次出现是在最外层 div 的 class 绑定上，
 * 从那里往后扫会先撞上视频分支的占位，音频分支删光了也照样「通过」。
 */
const audioBranch = template.slice(
  template.indexOf('v-else-if="showAudioPreview"'),
  template.indexOf('v-else-if="showFilePreview"')
)
if (!audioBranch) {
  errs.push('找不到语音预览分支')
} else if (!/preview-loading/.test(audioBranch)) {
  errs.push('语音分支缺少「预览加载中…」占位 —— 签名地址未就绪时整块是空的')
}
if (!/@loadedmetadata="onAudioLoadedMetadata"/.test(template)) {
  errs.push('语音未监听 loadedmetadata —— 时长无法自动带出，老师得听一遍再手打')
}

// ---------- 2) 文档卡：角标 + 真名 + 元信息 + 打开预览 ----------
for (const [re, msg] of [
  [/class="file-badge"/, '文档预览缺少分色角标 —— PDF/Word/PPT/字幕又变成同一个图标'],
  [/class="file-title"/, '文档预览缺少文件名行'],
  [/打开预览/, '文档预览缺少「打开预览」入口 —— 后台无法确认传的是不是对的文件'],
  [/fetchFileMeta/, '未反查上传元信息 —— 刷新后只能显示「PDF 文件」这种占位'],
  [/formatFileBadge/, '未使用 formatFileBadge'],
  [/formatFileMetaLine/, '未展示大小 / 上传时间']
]) {
  if (!re.test(vue)) errs.push(msg)
}

// ---------- 3) 打开预览必须懒签 ----------
const openFn = (vue.match(/async function openFileInNewTab\(\)[\s\S]*?\n\}/) || [''])[0]
if (!openFn) {
  errs.push('找不到 openFileInNewTab')
} else {
  if (!/fetchPreviewUrl\(/.test(openFn)) {
    errs.push('「打开预览」未在点击时换签名地址 —— 渲染时签好的短时地址点开可能已过期')
  }
  if (!/window\.open\(''/.test(openFn)) {
    errs.push('「打开预览」未先同步开好空窗口 —— await 之后再 window.open 会被弹窗拦截器拦掉')
  }
}

// ---------- 4) 文件卡自己写 box-sizing ----------
const fileRule = (style.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.preview-wrap--file\s*\{[^}]*\}/) || [''])[0]
if (!fileRule) {
  errs.push('找不到 .preview-wrap--file 规则')
} else if (!/box-sizing:\s*border-box/.test(fileRule)) {
  errs.push('.preview-wrap--file 未写 box-sizing:border-box —— width+padding 会叠成 342px 撑破窄栏')
}

// ---------- 5) 字幕预览 ----------
if (!/parseSubtitleCues/.test(vue) || !/fetchSubtitlePreview/.test(vue)) {
  errs.push('字幕未接内容预览 —— ASR 产出空文件 / 乱码时后台完全看不出来')
}
if (!/没有任何时间轴/.test(template)) {
  errs.push('缺少「字幕没有时间轴」的告警 —— 空字幕会一路混到学生端')
}

// ---------- 6) 元信息读写不得把上传弄挂 ----------
for (const [name, msg] of [
  ['recordObjectMeta', '记录上传元信息未包异常 —— 老库无表时会把上传整个带崩'],
  ['objectMeta', '查询上传元信息未包异常 —— 老库无表时会让后台表单打不开']
]) {
  const body = (oss.match(new RegExp(`\\b\\w[\\w<>, ]*\\s${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n    \\}`)) || [''])[0]
  if (!body) {
    errs.push(`找不到 OssService#${name}`)
  } else if (!/catch\s*\(Exception/.test(body)) {
    errs.push(msg)
  }
}

if (errs.length) {
  console.error('check-upload-preview 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-upload-preview OK')

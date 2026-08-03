/** 工作台全景候选下拉的选项文案（纯函数，studio.html 与单测共用） */

/** 下拉里那条「不从候选里选、我自己打路径」的占位项 */
export const PANO_MANUAL = '手动输入'

export function panoValueFor(rootRelPath) {
  return '../' + rootRelPath
}

/**
 * 选项显示文案。
 *
 * 原生 <option> 不吃 text-overflow，弹窗宽度由最长那条撑开：把完整路径 + 尺寸写进去，
 * 弹窗会宽到横跨半个屏幕。所以显示用短名——来源标签 + 首段目录 + 文件名，
 * 中间那些 assets/ 之类的层级用省略号代掉；完整信息交给 panoOptionTitle 的气泡。
 */
export function panoOptionLabel(c) {
  return `${panoSourceTag(c)} · ${shortenPath(c.path)}`
}

/** 悬停气泡：完整路径与尺寸，一个字都不省 */
export function panoOptionTitle(c) {
  return `${panoSourceTag(c)} · ${c.path}（${c.width}×${c.height}）`
}

function panoSourceTag(c) {
  return c.source === 'configured' ? '已配置' : '公共背景'
}

/** a/b/c/d.jpg → a/…/d.jpg；两段及以内原样保留（本来就短，省了反而看不出是哪张） */
function shortenPath(path) {
  const segs = String(path || '').split('/')
  if (segs.length <= 2) return path
  return `${segs[0]}/…/${segs[segs.length - 1]}`
}

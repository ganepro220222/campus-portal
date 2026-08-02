/** 工作台全景候选下拉的分组与选项文案（纯函数，studio.html 与单测共用） */

export function panoValueFor(rootRelPath) {
  return '../' + rootRelPath
}

export function panoOptgroupLabel(source) {
  return source === 'configured' ? '正在使用的全景' : '公共背景'
}

export function panoOptionLabel(c) {
  const tag = c.source === 'configured' ? '已配置' : '公共背景'
  return `${tag} · ${c.path}（${c.width}×${c.height}）`
}

/**
 * H5 沉浸式鉴赏 — 工程骨架（UI / Three.js 由前端工程师实现）
 *
 * 已实现：路由解析、配置拉取、类型定义（见 types.ts / api.ts）
 * 待实现：Three.js 场景、交互控件、加载/错误视觉、环境切换 UI
 * 参考：docs/三维展示系统/工艺品三维展示系统_实施方案.md 阶段 3
 */
import './style.css'
import { fetchViewerConfig, parseCraftId } from './api'

const statusEl = document.getElementById('status') as HTMLParagraphElement
const dumpEl = document.getElementById('config-dump') as HTMLPreElement

function setStatus(text: string) {
  statusEl.textContent = text
}

async function boot() {
  const craftId = parseCraftId()
  if (!craftId) {
    setStatus('缺少工艺品 ID：请使用 /craft/{id} 访问')
    return
  }

  setStatus(`正在拉取配置（id=${craftId}）…`)
  try {
    const config = await fetchViewerConfig(craftId)
    setStatus(`配置已就绪：${config.name}（UI / Three.js 待实现）`)
    dumpEl.hidden = false
    dumpEl.textContent = JSON.stringify(config, null, 2)
    console.info('[craft-viewer] config', config)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    setStatus(`配置加载失败：${msg}`)
  }
}

boot()

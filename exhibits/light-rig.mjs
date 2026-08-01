/**
 * 灯光方位换算与亮度诊断（player / player.view / 单元测试共用的纯函数）
 *
 * 角度约定（与编辑器 UI 一致）：
 *   方位角 azimuth：俯视看，+Z 方向为 0°，转向 +X 为正，范围 -180…180
 *   仰角   elevation：水平面为 0°，向上为正，范围 -90…90（负值＝从下往上打光）
 * 方向光（DirectionalLight）只看方向不看距离，radius 仅用于保持配置数值稳定。
 */

export const LIGHT_KEYS = ['key', 'fill', 'rim']

/** 与 _template/config.json 保持一致的出厂灯组 */
export const LIGHT_DEFAULTS = {
  ambient: { color: '#ffffff', intensity: 0.25 },
  key: { color: '#fff0e0', intensity: 1.1, position: [5, 8, 6] },
  fill: { color: '#a9c4ff', intensity: 0.35, position: [-5, 2, -3] },
  rim: { color: '#ffffff', intensity: 0.5, position: [-2, 3, -7] },
}

export const LIGHT_LABELS = { ambient: '环境光', key: '主光', fill: '补光', rim: '轮廓光' }

const DEG = 180 / Math.PI
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const fin = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d)
const r1 = (v) => Math.round(v * 10) / 10
const r3 = (v) => Math.round(v * 1000) / 1000

/** 出厂默认方向；position 缺失时的兜底 */
export function defaultPosition(key) {
  const p = LIGHT_DEFAULTS[key]?.position
  return p ? p.slice() : [3, 5, 4]
}

/** 出厂默认强度 */
export function defaultIntensity(key) {
  return fin(LIGHT_DEFAULTS[key]?.intensity, 0.4)
}

/** 一盏灯是否启用（缺省视为启用，保证旧配置行为不变） */
export function isLightOn(conf) {
  return !(conf && conf.enabled === false)
}

/** 送进 three.js 的实际强度：关闭时为 0，不改动配置里的原始强度值 */
export function effectiveIntensity(key, conf) {
  if (!isLightOn(conf)) return 0
  return fin(conf && conf.intensity, defaultIntensity(key))
}

/** [x,y,z] → { azimuth, elevation, radius } */
export function positionToAngles(pos) {
  const p = Array.isArray(pos) ? pos : []
  const x = fin(p[0], 0)
  const y = fin(p[1], 0)
  const z = fin(p[2], 0)
  const radius = Math.hypot(x, y, z)
  if (radius < 1e-6) return { azimuth: 0, elevation: 0, radius: 0 }
  return {
    azimuth: r1(Math.atan2(x, z) * DEG),
    elevation: r1(Math.asin(clamp(y / radius, -1, 1)) * DEG),
    radius: r3(radius),
  }
}

/** { azimuth, elevation, radius } → [x,y,z]；radius 为 0/非法时取 10（方向光只看方向） */
export function anglesToPosition(azimuth, elevation, radius) {
  const r = fin(radius, 0) > 1e-6 ? fin(radius, 10) : 10
  const az = fin(azimuth, 0) / DEG
  const el = clamp(fin(elevation, 0), -90, 90) / DEG
  const h = Math.cos(el) * r
  return [r3(h * Math.sin(az)), r3(Math.sin(el) * r), r3(h * Math.cos(az))]
}

/** 改单个角度并保持另一个角度与半径不变 */
export function withAngle(conf, key, which, deg) {
  const cur = positionToAngles((conf && conf.position) || defaultPosition(key))
  const azimuth = which === 'az' ? fin(deg, cur.azimuth) : cur.azimuth
  const elevation = which === 'el' ? fin(deg, cur.elevation) : cur.elevation
  return anglesToPosition(azimuth, elevation, cur.radius)
}

/** 出厂灯组深拷贝（「恢复默认灯光」用） */
export function defaultLights() {
  return JSON.parse(JSON.stringify(LIGHT_DEFAULTS))
}

/**
 * 亮度诊断：按「最有效 → 最没用」的顺序给出可执行建议。
 * 入参全部是编辑器已有的数值，返回 [{ level:'warn'|'tip'|'ok', text }]
 */
export function diagnoseBrightness(s = {}) {
  const exposure = fin(s.exposure, 1.05)
  const envMap = fin(s.envMapIntensity, 1.35)
  const envScene = fin(s.envIntensity, 1)
  const env = envMap * envScene // 场景级 × 材质级 = 实际打到模型上的环境照明
  const ambient = fin(s.ambient, 0.25)
  const key = fin(s.key, 1.1)
  const metalness = fin(s.metalness, 0)
  const roughness = fin(s.roughness, 0.5)
  const out = []

  if (metalness > 0.6 && env < 1.6) {
    out.push({
      level: 'warn',
      text: `金属度 ${r1(metalness)} 偏高，而环境照明只有 ${r1(env)}。金属材质几乎只反射环境，环境不够亮就会发黑——加多少灯都没用。先把「材质 → 金属度」降到 0.1 以下。`,
    })
  }
  if (ambient > 0.8) {
    out.push({
      level: 'warn',
      text: `环境光已到 ${r1(ambient)}。环境光是各方向均匀打亮，再拉高只会让画面发灰、丢掉立体感。请改用下面几项提亮。`,
    })
  }
  if (!s.hasPanorama) {
    out.push({
      level: 'tip',
      text: '当前用的是内置 RoomEnvironment（偏暗、偏中性）。在「环境 IBL」里换一张明亮的全景图，比加灯有效得多。',
    })
  }
  if (exposure < 1.25) {
    out.push({
      level: 'tip',
      text: `曝光 ${r1(exposure)} 偏低。这是提亮最有效的一档（相当于相机 ISO），先把「材质 → 曝光」提到 1.3～1.5。`,
    })
  }
  if (env < 1.4) {
    out.push({
      level: 'tip',
      text: `环境照明 ${r1(env)} 偏低（＝「环境 IBL → 环境光照」${r1(envScene)} × 「材质 → 环境光强」${r1(envMap)}）。PBR 材质主要靠环境照明，先把「环境 IBL → 环境光照」提到 1.5～2。`,
    })
  }
  if (key < 0.8) {
    out.push({ level: 'tip', text: `主光只有 ${r1(key)}，暗部缺少方向性。建议提到 1.0～1.5，并把仰角调到 25°～45°。` })
  }
  if (roughness > 0.85) {
    out.push({ level: 'tip', text: `粗糙度 ${r1(roughness)} 很高，表面几乎不反光，观感会又暗又平。建议降到 0.4～0.6。` })
  }
  if (!out.length) {
    out.push({
      level: 'ok',
      text: '曝光、环境照明、金属度、粗糙度都在合理区间。若仍偏暗，多半是模型贴图本身就暗，优先提「材质 → 曝光」。',
    })
  }
  return out
}

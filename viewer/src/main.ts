/**
 * H5 沉浸式鉴赏 — Three.js 实现
 *
 * 能力（MVP，对齐 docs/三维展示系统/工艺品三维展示系统_实施方案.md 阶段 3）：
 * - GLTF/GLB 加载 + 归一化（中心归零 + transform）
 * - PMREM + 内置 RoomEnvironment 作 IBL（无全景时的通用环境反射）
 * - OrbitControls：拖动旋转、双指/滚轮缩放、阻尼惯性、自动旋转、视角重置
 * - ACESFilmic 色调映射 + sRGB 输出；内置环境预设切换（影棚布光 / 暖色展厅）
 * - 加载封面 + 进度、WebGL 不可用 / 模型加载失败降级
 */
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { fetchViewerConfig, parseCraftId } from './api'
import type { EnvPreset, ViewerConfig } from './types'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const els = {
  canvas: $<HTMLCanvasElement>('scene'),
  topbar: $('topbar'),
  name: $('craft-name'),
  sub: $('craft-sub'),
  hint: $('hint'),
  hud: $('hud'),
  hudEnvs: $('hud-envs'),
  btnRotate: $('btn-rotate'),
  btnReset: $('btn-reset'),
  loading: $('loading'),
  poster: $('poster'),
  loadText: $('load-text'),
  loadBar: $<HTMLElement>('load-bar-fill'),
  error: $('error'),
  errText: $('err-text'),
  errRetry: $('err-retry')
}

function showError(text: string, retry = false) {
  els.loading.setAttribute('hidden', '')
  els.errText.textContent = text
  els.errRetry.toggleAttribute('hidden', !retry)
  els.error.removeAttribute('hidden')
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let raf = 0
const initialCamPos = new THREE.Vector3()
let presets: EnvPreset[] = []

function initRenderer(): boolean {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })
  } catch {
    return false
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.outputColorSpace = THREE.SRGBColorSpace
  return true
}

function applyPreset(preset: EnvPreset) {
  scene.background = new THREE.Color(preset.bgColor || '#14161d')
  renderer.toneMappingExposure = num(preset.exposure, 1)
  Array.from(els.hudEnvs.children).forEach((c) => {
    c.classList.toggle('active', (c as HTMLElement).dataset.id === String(preset.id))
  })
}

function buildEnvChips() {
  els.hudEnvs.innerHTML = ''
  if (presets.length < 2) return
  presets.forEach((p) => {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'env-chip'
    chip.dataset.id = String(p.id)
    chip.textContent = p.name
    chip.addEventListener('click', () => applyPreset(p))
    els.hudEnvs.appendChild(chip)
  })
}

function fitModel(model: THREE.Object3D, cfg: ViewerConfig) {
  // 归一化：先套用缩放，再按包围盒把中心移到原点，最后加配置偏移
  const scale = num(cfg.transform?.scale, 1)
  model.scale.setScalar(scale)
  model.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.x += -center.x + num(cfg.transform?.offsetX, 0)
  model.position.y += -center.y + num(cfg.transform?.offsetY, 0)
  model.position.z += -center.z + num(cfg.transform?.offsetZ, 0)
}

function applyMaterial(model: THREE.Object3D, cfg: ViewerConfig) {
  const m = cfg.material || {}
  model.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    mats.forEach((mat) => {
      const std = mat as THREE.MeshStandardMaterial
      if (!std || !('roughness' in std)) return
      if (typeof m.roughness === 'number') std.roughness = m.roughness
      if (typeof m.metalness === 'number') std.metalness = m.metalness
      if (typeof m.envMapIntensity === 'number') std.envMapIntensity = m.envMapIntensity
      std.needsUpdate = true
    })
  })
}

function placeCamera(cfg: ViewerConfig) {
  const distance = num(cfg.camera?.distance, 8.4)
  const phi = num(cfg.camera?.phi, 1.48)
  const theta = num(cfg.camera?.theta, 0.35)
  camera.position.setFromSpherical(new THREE.Spherical(distance, phi, theta))
  initialCamPos.copy(camera.position)
  controls.target.set(0, 0, 0)
  controls.minDistance = distance * 0.35
  controls.maxDistance = distance * 2.4
  controls.autoRotate = cfg.camera?.autoRotate !== false
  controls.update()
  updateRotateBtn()
}

function updateRotateBtn() {
  els.btnRotate.classList.toggle('active', controls.autoRotate)
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  raf = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function fadeOutLoading() {
  els.loading.classList.add('fade-out')
  setTimeout(() => els.loading.setAttribute('hidden', ''), 420)
}

function flashHint() {
  els.hint.removeAttribute('hidden')
  els.hint.classList.add('show')
  setTimeout(() => els.hint.classList.remove('show'), 2600)
}

function startScene(cfg: ViewerConfig) {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)

  // IBL：内置房间环境（无全景时提供柔和的方向光与反射）
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.autoRotateSpeed = 1.6
  controls.rotateSpeed = 0.9
  controls.addEventListener('start', () => {
    controls.autoRotate = false
    updateRotateBtn()
  })

  presets = Array.isArray(cfg.envPresets) && cfg.envPresets.length
    ? cfg.envPresets
    : [{ id: 1, name: '影棚布光', panoramaUrl: null, exposure: 1, bgColor: '#14161d' }]
  buildEnvChips()
  applyPreset(presets.find((p) => p.id === cfg.defaultEnvId) || presets[0])

  const loader = new GLTFLoader()
  loader.load(
    cfg.modelUrl,
    (gltf) => {
      const model = gltf.scene
      fitModel(model, cfg)
      applyMaterial(model, cfg)
      scene.add(model)
      placeCamera(cfg)

      els.topbar.removeAttribute('hidden')
      els.hud.removeAttribute('hidden')
      fadeOutLoading()
      flashHint()
      animate()
    },
    (evt) => {
      if (evt.total > 0) {
        const pct = Math.min(100, Math.round((evt.loaded / evt.total) * 100))
        els.loadBar.style.width = pct + '%'
        els.loadText.textContent = `正在加载模型… ${pct}%`
      }
    },
    () => showError('模型加载失败，请检查网络后重试', true)
  )

  window.addEventListener('resize', onResize)
  els.btnRotate.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate
    updateRotateBtn()
  })
  els.btnReset.addEventListener('click', () => {
    camera.position.copy(initialCamPos)
    controls.target.set(0, 0, 0)
    controls.update()
  })
}

async function boot() {
  els.error.setAttribute('hidden', '')
  els.loading.removeAttribute('hidden')
  els.loading.classList.remove('fade-out')

  const craftId = parseCraftId()
  if (!craftId) {
    showError('缺少工艺品 ID：请通过正确入口访问')
    return
  }
  if (!renderer && !initRenderer()) {
    showError('当前浏览器不支持 3D 展示，请更换浏览器或升级微信')
    return
  }

  let cfg: ViewerConfig
  try {
    cfg = await fetchViewerConfig(craftId)
  } catch (e) {
    showError((e instanceof Error ? e.message : '配置加载失败') + '，请稍后重试', true)
    return
  }

  if (!cfg.modelUrl) {
    showError('该工艺品暂未配置 3D 模型')
    return
  }

  els.name.textContent = cfg.name || '立体鉴赏'
  els.sub.textContent = cfg.summary || ''
  els.sub.toggleAttribute('hidden', !cfg.summary)
  if (cfg.posterUrl) {
    els.poster.style.backgroundImage = `url("${cfg.posterUrl}")`
    els.poster.classList.add('has-poster')
  }

  startScene(cfg)
}

els.errRetry.addEventListener('click', () => {
  if (raf) cancelAnimationFrame(raf)
  boot()
})

boot()

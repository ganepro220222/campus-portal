/**
 * iOS / 微信 / Telegram 里「器物本体全黑、只剩几块高光」的判定。
 * 不猜设备，只根据当时能读到的材质 / 环境 / 贴图事实分类。
 */

function n(v, d = 0) {
  const x = Number(v)
  return Number.isFinite(x) ? x : d
}

/**
 * @param {object} s
 * @param {number} [s.configMetalness]
 * @param {number} [s.materialMetalnessMax]
 * @param {boolean} [s.hasSceneEnvironment]
 * @param {boolean} [s.backgroundIsTexture]
 * @param {boolean} [s.hasBaseColorTexture]
 * @param {boolean} [s.mapImageMissing]
 * @param {number} [s.maxAlbedoEdge]
 */
/**
 * GPU 上下文丢了之后不能再拉一次全景原图。
 * 图1 的绿字已经证明：restore 后立刻 kick 5000 宽 JPEG，下一次就是 Safari「重複發生問題」。
 */
export function webglContextRestorePlan(s = {}) {
  return {
    refetchPanorama: false,
    action: s.hasCpuEnvBackground === true ? 'pmrem-from-cpu-bg' : 'preset-or-room',
  }
}

export function classifyIosBlackLook(s = {}) {
  const metal = Math.max(n(s.configMetalness), n(s.materialMetalnessMax))
  const envOk = s.hasSceneEnvironment === true
  const bgTex = s.backgroundIsTexture === true
  const hasMap = s.hasBaseColorTexture === true
  const mapFailed = s.mapImageMissing === true
  const edge = n(s.maxAlbedoEdge)

  const reasons = []
  if (metal >= 0.45 && bgTex && !envOk) {
    reasons.push({
      id: 'pmrem-missing-metal',
      severity: 'high',
      text: '全景背景在，环境立方体贴图不在。金属度偏高时漫反射几乎为 0，画面就只剩灯的高光。',
    })
  }
  if (metal >= 0.6) {
    reasons.push({
      id: 'high-metalness',
      severity: envOk ? 'medium' : 'high',
      text: `金属度 ${metal.toFixed(2)}。釉面被写成金属时，环境贴图一黑或没绑上，本体就会是这种全黑。`,
    })
  }
  if (hasMap && mapFailed) {
    reasons.push({
      id: 'albedo-upload-fail',
      severity: 'high',
      text: '漫反射贴图槽位在，像素没上去。微信 / Telegram WebView 对超大 JPEG/PNG 会静默失败。',
    })
  }
  if (edge >= 4096) {
    reasons.push({
      id: 'huge-albedo',
      severity: 'medium',
      text: `漫反射边长 ${edge}，超过不少 iOS WebView 的稳妥上限。`,
    })
  }
  if (s.hasEnvRt === true && n(s.envRtW) <= 0) {
    reasons.push({
      id: 'env-rt-empty',
      severity: 'high',
      text: '环境 render target 在，但宽为 0。PMREM 可能静默失败。',
    })
  }
  return reasons
}

export function summarizeGltfMaterials(json) {
  const mats = Array.isArray(json?.materials) ? json.materials : []
  const images = Array.isArray(json?.images) ? json.images : []
  const textures = Array.isArray(json?.textures) ? json.textures : []
  const out = []
  for (const m of mats) {
    const pbr = m.pbrMetallicRoughness || {}
    const color = Array.isArray(pbr.baseColorFactor) ? pbr.baseColorFactor : [1, 1, 1, 1]
    const texIndex = pbr.baseColorTexture?.index
    const imageIndex = Number.isInteger(texIndex) ? textures[texIndex]?.source : undefined
    const image = Number.isInteger(imageIndex) ? images[imageIndex] : null
    out.push({
      name: m.name || '',
      metallicFactor: n(pbr.metallicFactor, 1),
      roughnessFactor: n(pbr.roughnessFactor, 1),
      baseColor: color.slice(0, 4),
      hasBaseColorTexture: Number.isInteger(texIndex),
      imageIndex: Number.isInteger(imageIndex) ? imageIndex : -1,
      imageMime: image?.mimeType || '',
      imageUri: typeof image?.uri === 'string' ? image.uri.slice(0, 48) : '',
    })
  }
  return out
}

export function readPngOrJpegSize(bytes) {
  if (!bytes || bytes.length < 24) return null
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return { w: dv.getUint32(16), h: dv.getUint32(20), kind: 'png' }
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) break
      const marker = bytes[i + 1]
      const len = (bytes[i + 2] << 8) | bytes[i + 3]
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { w: (bytes[i + 7] << 8) | bytes[i + 8], h: (bytes[i + 5] << 8) | bytes[i + 6], kind: 'jpeg' }
      }
      if (len < 2) break
      i += 2 + len
    }
  }
  return null
}

export function parseGlbJson(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (u8.length < 20) throw new Error('GLB too short')
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB')
  const jsonLen = dv.getUint32(12, true)
  const jsonType = dv.getUint32(16, true)
  if (jsonType !== 0x4e4f534a) throw new Error('GLB JSON chunk missing')
  const jsonStart = 20
  const jsonBytes = u8.subarray(jsonStart, jsonStart + jsonLen)
  const json = JSON.parse(new TextDecoder().decode(jsonBytes))
  let bin = null
  const binStart = jsonStart + jsonLen
  if (binStart + 8 <= u8.length) {
    const binLen = dv.getUint32(binStart, true)
    const binType = dv.getUint32(binStart + 4, true)
    if (binType === 0x004e4942) bin = u8.subarray(binStart + 8, binStart + 8 + binLen)
  }
  return { json, bin }
}

export function attachImageSizes(materials, json, bin) {
  const images = Array.isArray(json?.images) ? json.images : []
  const views = Array.isArray(json?.bufferViews) ? json.bufferViews : []
  const sizes = images.map((img) => {
    if (!bin || !Number.isInteger(img.bufferView) || !views[img.bufferView]) return null
    const v = views[img.bufferView]
    const start = (v.byteOffset || 0)
    const slice = bin.subarray(start, start + (v.byteLength || 0))
    return readPngOrJpegSize(slice)
  })
  return materials.map((m) => {
    const sz = m.imageIndex >= 0 ? sizes[m.imageIndex] : null
    return { ...m, imageWidth: sz?.w || 0, imageHeight: sz?.h || 0, imageKind: sz?.kind || '' }
  })
}

export function inspectExhibit(cfg, gltfJson, bin) {
  const mats = attachImageSizes(summarizeGltfMaterials(gltfJson), gltfJson, bin)
  const configHasMetal = typeof cfg?.materials?.global?.metalness === 'number'
  const configMetalness = configHasMetal ? n(cfg.materials.global.metalness) : 0
  const authoredMetalnessMax = mats.reduce((a, m) => Math.max(a, m.metallicFactor), 0)
  const runtimeMetalness = configHasMetal ? configMetalness : authoredMetalnessMax
  const maxAlbedoEdge = mats.reduce((a, m) => Math.max(a, m.imageWidth, m.imageHeight), 0)
  const hasBaseColorTexture = mats.some((m) => m.hasBaseColorTexture)
  const usesKtx2 = mats.some((m) => /ktx2/i.test(m.imageMime) || /\.ktx2/i.test(m.imageUri))
  const usesDraco = !!(gltfJson?.extensionsUsed || []).includes('KHR_draco_mesh_compression')
  const snapshot = {
    configHasMetal,
    configMetalness,
    authoredMetalnessMax,
    materialMetalnessMax: runtimeMetalness,
    hasBaseColorTexture,
    maxAlbedoEdge,
    usesKtx2,
    usesDraco,
    materials: mats,
  }
  const risks = classifyIosBlackLook({
    configMetalness,
    materialMetalnessMax: runtimeMetalness,
    hasBaseColorTexture,
    maxAlbedoEdge,
  })
  if (authoredMetalnessMax >= 0.6 && configHasMetal && runtimeMetalness < 0.45) {
    risks.push({
      id: 'glb-metal-overridden',
      severity: 'low',
      text: `GLB 材质金属度 ${authoredMetalnessMax.toFixed(2)}，播放器配置压到 ${runtimeMetalness.toFixed(2)}。配置一旦拿掉，环境立方体失效时就会走全黑。`,
    })
  }
  return { ...snapshot, risks }
}

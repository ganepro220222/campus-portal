export interface ViewerTransform {
  scale?: number
  offsetX?: number
  offsetY?: number
  offsetZ?: number
  floorOffsetY?: number
}

export interface ViewerMaterial {
  roughness?: number
  metalness?: number
  envMapIntensity?: number
}

export interface ViewerCamera {
  distance?: number
  phi?: number
  theta?: number
  autoRotate?: boolean
}

export interface EnvPreset {
  id: number
  name: string
  panoramaUrl: string | null
  exposure: number
  bgColor: string
}

export interface ViewerConfig {
  id: number
  name: string
  summary: string | null
  modelUrl: string
  posterUrl: string | null
  transform: ViewerTransform
  material: ViewerMaterial
  camera: ViewerCamera
  hotspots: unknown[]
  envPresets: EnvPreset[]
  defaultEnvId: number
  viewerEnabled: boolean
  contactEnabled?: boolean
}

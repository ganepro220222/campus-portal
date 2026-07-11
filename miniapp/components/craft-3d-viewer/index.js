// components/craft-3d-viewer — xr-frame GLB 预览（验收 §2.5 立体展示）
Component({
  properties: {
    modelUrl: { type: String, value: '' },
    modelScale: { type: String, value: '1.2 1.2 1.2' }
  },

  data: {
    width: 320,
    height: 240,
    renderWidth: 640,
    renderHeight: 480,
    loading: true
  },

  lifetimes: {
    attached() {
      this._calcSize()
    }
  },

  methods: {
    _calcSize() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const padding = 28
      const width = Math.max(280, (info.windowWidth || 375) - padding * 2)
      const height = Math.floor(width * 0.72)
      const dpi = info.pixelRatio || 2
      this.setData({
        width,
        height,
        renderWidth: Math.floor(width * dpi),
        renderHeight: Math.floor(height * dpi)
      })
    },

    onSceneReady() {
      if (!this.properties.modelUrl) {
        this.triggerEvent('error', { message: '模型地址为空' })
      }
    },

    onSceneError(e) {
      this.setData({ loading: false })
      this.triggerEvent('error', e.detail || { message: '3D 场景异常' })
    },

    onAssetsLoaded(e) {
      this.setData({ loading: false })
      const detail = (e && e.detail) || {}
      if (detail.error || detail.errors) {
        this.triggerEvent('error', { message: '模型加载失败，已切换多图展示' })
      } else {
        this.triggerEvent('loaded')
      }
    }
  }
})

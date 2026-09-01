const player = require('../../utils/resourceAudioPlayer')

Component({
  data: {
    visible: false,
    name: '',
    playing: false,
    currentText: '00:00',
    durationText: '00:00',
    progress: 0,
    duration: 0,
    error: ''
  },

  lifetimes: {
    attached() {
      this._unsub = player.subscribe((snap) => {
        this.setData({
          visible: !!snap.visible,
          name: snap.name || '',
          playing: !!snap.playing,
          currentText: snap.currentText || '00:00',
          durationText: snap.durationText || '00:00',
          progress: snap.progress || 0,
          duration: snap.duration || 0,
          error: snap.error || ''
        })
      })
    },
    detached() {
      if (this._unsub) {
        this._unsub()
        this._unsub = null
      }
    }
  },

  methods: {
    onToggle() {
      player.toggle()
    },
    onClose() {
      player.stop()
    },
    onSeekChanging() {
      player.beginSeek()
    },
    onSeekChange(e) {
      player.seekPercent(e.detail.value)
    }
  }
})

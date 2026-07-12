// packageC/profile/list.js — 个人中心通用列表（收藏/报名/下载/足迹/徽章）
const { get } = require('../../utils/request')

const CONFIG = {
  favorites:  { title: '我的收藏',   api: '/profile/favorites',  empty: '暂无收藏' },
  enrolls:    { title: '我的报名',   api: '/profile/enrolls',    empty: '暂无报名' },
  downloads:  { title: '下载记录',   api: '/profile/downloads',  empty: '暂无下载记录' },
  footprints: { title: '学习足迹',   api: '/profile/footprints', empty: '近 30 天暂无足迹' },
  badges:     { title: '文化徽章',   api: '/profile/badges',     empty: '暂无徽章数据' }
}

// 有效报名状态；cancelled 由后端排除，不在「我的报名」列表返回
const ENROLL_STATUS = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

// 各类型的图标与配色
const TYPE_META = {
  favorites:  { icon: 'heart',     cls: 'tc-rose' },
  enrolls:    { icon: 'calendar',  cls: 'tc-blue' },
  downloads:  { icon: 'download',  cls: 'tc-green' },
  footprints: { icon: 'footprint', cls: 'tc-slate' },
  badges:     { icon: 'medal',     cls: 'tc-gold' }
}

Page({
  data: {
    type: '',
    list: [],
    loading: true,
    navTitle: '我的',
    emptyText: '暂无数据',
    typeIcon: 'heart',
    typeCls: 'tc-rose'
  },

  onLoad(options) {
    const type = options.type || 'favorites'
    const cfg = CONFIG[type] || CONFIG.favorites
    const meta = TYPE_META[type] || TYPE_META.favorites
    this.setData({ type, navTitle: cfg.title, emptyText: cfg.empty, typeIcon: meta.icon, typeCls: meta.cls })
    this._load(type, cfg.api)
  },

  async _load(type, api) {
    this.setData({ loading: true })
    try {
      const raw = await get(api).catch(() => [])
      this.setData({ list: this._normalize(type, raw || []), loading: false })
    } catch (e) {
      this.setData({ list: [], loading: false })
    }
  },

  /** 统一各接口字段，便于 WXML 复用 */
  _normalize(type, list) {
    return list.map(item => {
      if (type === 'enrolls') {
        const statusLabel = ENROLL_STATUS[item.status] || item.status
        // 活动已取消但报名仍为 rejected 时，后端会附带 activityStatusLabel
        const activityHint = item.activityStatusLabel || ''
        return {
          ...item,
          title: item.activityTitle,
          subtitle: item.activityLocation,
          statusLabel: activityHint ? `${statusLabel} · ${activityHint}` : statusLabel,
          statusClass: item.status || 'pending',
          route: item.activityStatus === 'cancelled' || !item.activityId
            ? ''
            : `/packageC/activity/detail?id=${item.activityId}`
        }
      }
      if (type === 'footprints') {
        return { ...item, title: item.title, createTime: item.createdAt }
      }
      if (type === 'badges') {
        return { ...item, title: item.name, createTime: item.achievedAt }
      }
      return item
    })
  },

  onItemTap(e) {
    const route = e.currentTarget.dataset.route
    if (route) {
      wx.navigateTo({ url: route, fail: () => {} })
    }
  }
})

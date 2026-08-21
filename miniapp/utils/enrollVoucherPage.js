// utils/enrollVoucherPage.js — 报名页凭证二维码：远程优先，本地 Canvas 降级

const {
  buildVoucherQrText,
  pickRemoteQrSrc,
  shouldShowVoucherQr,
  mapEnrollVoucherFields
} = require('./enrollVoucher')

/**
 * 解析报名凭证二维码展示状态。
 * deps.fetchVoucherQrUrl(enrollId) → qrCodeUrl 字符串
 * deps.exportLocalQr(text) → 本地临时图片路径
 */
async function resolveVoucherQrSrc(ctx, deps = {}) {
  const fields = mapEnrollVoucherFields(ctx)
  const { status, voucherCode, qrCodeUrl, enrollId } = fields

  if (!shouldShowVoucherQr(status, voucherCode)) {
    return { showVoucherQr: false, voucherQrSrc: '', usedLocal: false }
  }

  let remote = pickRemoteQrSrc(qrCodeUrl)
  if (!remote && enrollId && deps.fetchVoucherQrUrl) {
    try {
      remote = pickRemoteQrSrc(await deps.fetchVoucherQrUrl(enrollId))
    } catch (e) {
      // 页面层记录日志；此处继续尝试本地生成
    }
  }
  if (remote) {
    return { showVoucherQr: true, voucherQrSrc: remote, usedLocal: false }
  }

  const exportLocalQr = deps.exportLocalQr
  if (typeof exportLocalQr !== 'function') {
    throw new Error('exportLocalQr is required for local voucher QR')
  }
  const text = buildVoucherQrText(voucherCode)
  const path = await exportLocalQr(text)
  return { showVoucherQr: true, voucherQrSrc: path, usedLocal: true }
}

module.exports = {
  resolveVoucherQrSrc,
  mapEnrollVoucherFields
}

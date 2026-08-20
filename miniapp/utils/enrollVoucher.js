// utils/enrollVoucher.js — 报名凭证码与二维码展示

const VOUCHER_QR_PREFIX = 'SHUYUAN:VOUCHER:'

function buildVoucherQrText(voucherCode) {
  const code = voucherCode != null ? String(voucherCode).trim() : ''
  return code ? `${VOUCHER_QR_PREFIX}${code}` : ''
}

function pickRemoteQrSrc(qrCodeUrl) {
  if (!qrCodeUrl) return ''
  const url = String(qrCodeUrl).trim()
  if (/^https?:\/\//i.test(url)) return url
  return ''
}

function shouldShowVoucherQr(status, voucherCode) {
  return status === 'approved' && !!buildVoucherQrText(voucherCode)
}

function mapEnrollVoucherFields(raw) {
  if (!raw) {
    return {
      enrollId: null,
      voucherCode: '',
      qrCodeUrl: '',
      status: ''
    }
  }
  return {
    enrollId: raw.enrollId != null ? raw.enrollId : (raw.id != null ? raw.id : null),
    voucherCode: raw.voucherCode || '',
    qrCodeUrl: raw.qrCodeUrl || '',
    status: raw.status || raw.enrollStatus || ''
  }
}

module.exports = {
  VOUCHER_QR_PREFIX,
  buildVoucherQrText,
  pickRemoteQrSrc,
  shouldShowVoucherQr,
  mapEnrollVoucherFields
}

// utils/wxacode.js — 小程序码接口响应校验（海报生成等）

function parseWxacodeResponse(wxacode) {
  if (!wxacode || wxacode.available !== true) {
    return { ok: false, reason: 'unavailable' }
  }
  const base64 = wxacode.imageBase64 != null ? String(wxacode.imageBase64).trim() : ''
  if (!base64) {
    return { ok: false, reason: 'empty' }
  }
  return { ok: true, base64 }
}

module.exports = { parseWxacodeResponse }

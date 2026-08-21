// utils/uploadResponse.js — wx.uploadFile success 回调响应解析（可单测）

function uploadErrorMessage(statusCode, body) {
  if (statusCode === 413) return '图片过大，请重新选择或压缩'
  if (body && body.message) return body.message
  return '上传失败'
}

/**
 * 解析 uploadFile success 回调的 res，统一为 { ok, data?, error?, unauthorized? }
 */
function parseUploadFileResponse(res) {
  let body
  try {
    body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: res.statusCode || 500,
        message: '上传服务返回异常',
        cause
      }
    }
  }

  const statusCode = res.statusCode || 0
  if (statusCode < 200 || statusCode >= 300) {
    return {
      ok: false,
      error: {
        code: statusCode,
        message: uploadErrorMessage(statusCode, body),
        body
      }
    }
  }

  if (body && body.code === 200) {
    return { ok: true, data: body.data }
  }

  if (body && body.code === 401) {
    return { ok: false, unauthorized: true, error: body }
  }

  return {
    ok: false,
    error: body || { code: statusCode || 500, message: 'upload failed' }
  }
}

module.exports = {
  uploadErrorMessage,
  parseUploadFileResponse
}

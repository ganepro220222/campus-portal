/**
 * 下载失败体与成功提示：公共层吞异常时，调用方只能看返回值决定要不要说「已开始下载」。
 */
export function interpretDownloadErrorBody(body) {
  if (body == null || typeof body !== 'object') {
    return { kind: 'unparsed' }
  }
  if (body.code === 401) {
    return { kind: 'unauthorized', message: body.message || '' }
  }
  if (body.code === 429) {
    return { kind: 'rateLimited', message: body.message || '操作过于频繁' }
  }
  return { kind: 'error', message: body.message || '下载失败' }
}

export function shouldAnnounceDownloadStarted(downloaded) {
  return downloaded === true
}

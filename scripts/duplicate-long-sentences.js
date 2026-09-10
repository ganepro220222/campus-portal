/**
 * 知识库源文件里「完全相同的长句」出现多次。
 *
 * 不能从上一个句号一路累积到下一个：这个语料大量段首是「标题：正文。」，
 * 冒号不是终止符，第一份会粘上前一段，第二份不粘，比对永远不相等。
 * 按行内、以 。！？ 收尾的片段抽取后再计数，句号后、冒号后、段首都一样能查到。
 */
function findDuplicateLongSentences(text) {
  const matches = String(text || '').match(/[^。！？\n]{20,}[。！？]/g) || []
  const counts = new Map()
  for (const raw of matches) {
    const norm = raw.replace(/\s+/g, '')
    if (norm.length < 20) continue
    counts.set(norm, (counts.get(norm) || 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([sentence, n]) => ({ sentence, n }))
}

module.exports = { findDuplicateLongSentences }

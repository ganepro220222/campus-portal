/**
 * 侧栏切页：立刻发请求，分类与列表并行，动态列表不带正文。
 * 用法：node scripts/test-admin-sidebar-load.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const layout = readFileSync(new URL('../admin/src/layouts/AdminLayout.vue', import.meta.url), 'utf8')
assert.match(layout, /<transition name="fade-slide">/)
assert.doesNotMatch(layout, /mode="out-in"/)
assert.match(layout, /position:\s*relative/)
assert.match(layout, /fade-slide-leave-active[\s\S]*position:\s*absolute/)

for (const [rel, extra] of [
  ['admin/src/views/news/NewsListView.vue', /fetchNewsDetail/],
  ['admin/src/views/resource/ResourceListView.vue', null],
  ['admin/src/composables/useHallList.ts', null],
  ['admin/src/composables/useCraftList.ts', null]
]) {
  const src = readFileSync(new URL('../' + rel, import.meta.url), 'utf8')
  assert.match(src, /Promise\.all\(\[loadCategories\(\), loadData\(\)\]\)/, `${rel} 分类与列表须并行`)
  if (extra) assert.match(src, extra)
}

const course = readFileSync(new URL('../admin/src/composables/useCourseList.ts', import.meta.url), 'utf8')
assert.match(course, /Promise\.all\(\[loadCategories\(\), loadResourceOptions\(\), loadData\(\)\]\)/)

const newsApi = readFileSync(new URL('../admin/src/api/news.ts', import.meta.url), 'utf8')
assert.match(newsApi, /\/admin\/news\/\$\{id\}/)

const java = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/service/AdminNewsService.java', import.meta.url), 'utf8')
assert.match(java, /toVo\(n, catMap, false\)/)
assert.match(java, /\.select\(\s*"id"/)
assert.match(java, /cover_fit_mode/)
assert.doesNotMatch(java, /News::getContent/)

const controller = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/controller/admin/AdminNewsController.java', import.meta.url), 'utf8')
assert.match(controller, /@GetMapping\("\/\{id\}"\)/)

console.log('test-admin-sidebar-load OK')

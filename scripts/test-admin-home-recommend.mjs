/**
 * 首页推荐：候选翻完全部分页、添加弹窗代际防串台、公开列表 sort 后再按 id。
 * 用法：node scripts/test-admin-home-recommend.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { loadAllPagedRecords } from '../admin/src/utils/pagedRecords.mjs'
import { nextRecommendSort } from '../admin/src/utils/homeRecommendSort.mjs'

const require = createRequire(import.meta.url)
const { shouldApplyCandidateResult } = require('./lib/listRequestSeq')

function pageOf(all, page, size) {
  const start = (page - 1) * size
  return {
    records: all.slice(start, start + size),
    total: all.length
  }
}

const twoHundred = Array.from({ length: 250 }, (_, i) => ({ id: i + 1 }))
const pages = []
const all = await loadAllPagedRecords(async (page, size) => {
  pages.push({ page, size })
  return pageOf(twoHundred, page, size)
}, 100)
assert.equal(all.length, 250)
assert.deepEqual(pages, [
  { page: 1, size: 100 },
  { page: 2, size: 100 },
  { page: 3, size: 100 }
])

const cappedPages = []
const capped = await loadAllPagedRecords(async (page, size) => {
  cappedPages.push(page)
  return pageOf(twoHundred, page, size)
}, 100, 2)
assert.equal(capped.length, 200)
assert.deepEqual(cappedPages, [1, 2])

const empty = await loadAllPagedRecords(async () => ({ records: [], total: 0 }), 100)
assert.deepEqual(empty, [])

assert.equal(nextRecommendSort([]), 0)
assert.equal(nextRecommendSort([0, 3]), 4)
assert.equal(nextRecommendSort([999]), 999)

assert.equal(shouldApplyCandidateResult(1, 1, true, 'hall', 'hall'), true)
assert.equal(shouldApplyCandidateResult(1, 1, true, 'news', 'course'), false)

const view = readFileSync(new URL('../admin/src/views/home/HomeRecommendView.vue', import.meta.url), 'utf8')
assert.match(view, /shouldApplyCandidateResult/)
assert.match(view, /let candidateSeq = 0/)
assert.match(view, /candidateSeq \+= 1/)
assert.match(view, /contentOptions\.value = \[\]/)
assert.match(view, /loadBannerContentOptions/)

const banner = readFileSync(new URL('../admin/src/utils/banner-link.ts', import.meta.url), 'utf8')
assert.match(banner, /loadAllPagedRecords/)
assert.doesNotMatch(banner, /fetchNews\(\{\s*page:\s*1,\s*size:\s*100/)
assert.doesNotMatch(banner, /fetchHalls\(1,\s*100\)/)
assert.doesNotMatch(banner, /fetchCourses\(\{\s*page:\s*1,\s*size:\s*100/)

const homeService = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/service/HomeService.java', import.meta.url), 'utf8')
assert.match(homeService, /orderByAsc\(HomeRecommend::getSort\)/)
assert.match(homeService, /orderByAsc\(HomeRecommend::getId\)/)
assert.match(homeService, /不为这点改成三组 IN/)

const initSql = readFileSync(new URL('../sql/init.sql', import.meta.url), 'utf8')
const table = initSql.match(/CREATE TABLE IF NOT EXISTS `home_recommend` \([\s\S]*?\) ENGINE=InnoDB/)
assert.ok(table, '缺少 home_recommend 建表')
assert.doesNotMatch(table[0], /UNIQUE KEY/, '逻辑删除行仍占唯一键，故不加 (module_type, target_id) 唯一索引')
assert.match(initSql, /不加 \(module_type, target_id\) 唯一索引/)

const duplicate = readFileSync(
  new URL('../backend/src/main/java/com/shuyuan/backend/service/AdminHomeRecommendService.java', import.meta.url),
  'utf8'
)
assert.match(duplicate, /assertNotDuplicate/)
assert.match(duplicate, /不加 \(module_type, target_id\) 唯一索引/)

const newsSave = readFileSync(
  new URL('../backend/src/main/java/com/shuyuan/backend/dto/NewsSaveRequest.java', import.meta.url),
  'utf8'
)
assert.match(newsSave, /不加 \{@code @Size\}/)
assert.doesNotMatch(newsSave, /import jakarta\.validation\.constraints\.Size/)
assert.doesNotMatch(newsSave, /@Size\(/)

const newsController = readFileSync(
  new URL('../backend/src/main/java/com/shuyuan/backend/controller/admin/AdminNewsController.java', import.meta.url),
  'utf8'
)
assert.match(newsController, /不加 \{@code @Valid\}/)
assert.doesNotMatch(newsController, /@Valid @RequestBody NewsSaveRequest/)

const editor = readFileSync(new URL('../admin/src/components/WangEditor.vue', import.meta.url), 'utf8')
assert.match(editor, /不强制 \.png 配 image\/png/)
assert.match(editor, /真实类型由后端按文件头判定/)

console.log('test-admin-home-recommend OK')

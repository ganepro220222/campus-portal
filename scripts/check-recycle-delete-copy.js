#!/usr/bin/env node
/**
 * 回收站软删除入口的文案门禁。
 *
 * 真出过：管理员账号删除写「此操作不可恢复」，实际只是逻辑删除且可在回收站恢复。
 *
 * 规则：
 *   - recycleBinCopy.ts 须含「回收站」/「移入回收站」，且不得写「不可恢复」
 *   - 下列 13 个入口须 import recycleBinCopy，并用统一 confirm + MOVED_TO_RECYCLE_BIN
 *   - 上述入口文件里不得出现「不可恢复」
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')

const COPY_MODULE = 'admin/src/utils/recycleBinCopy.ts'

/** 删除后进入 RecycleBinService 13 类的管理端入口 */
const SOFT_DELETE_SOURCES = [
  { file: 'admin/src/views/news/NewsListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/activity/ActivityListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/resource/ResourceListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/composables/useHallList.ts', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/composables/useCraftList.ts', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/composables/useCourseList.ts', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/announcement/AnnouncementListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/banner/BannerListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/category/CategoryListView.vue', confirm: 'categoryDeleteConfirm' },
  { file: 'admin/src/views/college/CollegeListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/nav/NavItemListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/admin/AdminRoleListView.vue', confirm: 'softDeleteConfirm' },
  { file: 'admin/src/views/admin/AdminUserListView.vue', confirm: 'adminUserDeleteConfirm' },
]

/** 允许「不可恢复」——物理删除或回收站内彻底删除 */
const IRREVERSIBLE_OK = [
  'admin/src/views/knowledge/KnowledgeListView.vue',
  'admin/src/components/DangerDeleteDialog.vue',
]

const errs = []

const copyPath = path.join(root, COPY_MODULE)
if (!fs.existsSync(copyPath)) {
  errs.push(`${COPY_MODULE} 不存在`)
} else {
  const copySrc = fs.readFileSync(copyPath, 'utf8')
  if (!/回收站|移入回收站/.test(copySrc)) {
    errs.push(`${COPY_MODULE} 未包含回收站相关文案`)
  }
  if (/不可恢复/.test(copySrc)) {
    errs.push(`${COPY_MODULE} 误写「不可恢复」——软删除应说明移入回收站`)
  }
  if (!/export const MOVED_TO_RECYCLE_BIN/.test(copySrc)) {
    errs.push(`${COPY_MODULE} 缺少 MOVED_TO_RECYCLE_BIN`)
  }
}

for (const { file: rel, confirm } of SOFT_DELETE_SOURCES) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) {
    errs.push(`${rel} 不存在`)
    continue
  }
  const src = fs.readFileSync(abs, 'utf8')
  if (!/@\/utils\/recycleBinCopy/.test(src)) {
    errs.push(`${rel} 未 import recycleBinCopy`)
  }
  if (!new RegExp(confirm).test(src)) {
    errs.push(`${rel} 未使用 ${confirm}()`)
  }
  if (!/MOVED_TO_RECYCLE_BIN/.test(src)) {
    errs.push(`${rel} 未使用 MOVED_TO_RECYCLE_BIN 成功提示`)
  }
  if (/不可恢复/.test(src)) {
    errs.push(`${rel} 误写「不可恢复」——软删除应说明移入回收站`)
  }
}

for (const rel of IRREVERSIBLE_OK) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) {
    errs.push(`${rel} 不存在（白名单文件）`)
  }
}

if (errs.length) {
  console.error('check-recycle-delete-copy 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}

console.log(
  `check-recycle-delete-copy OK（${SOFT_DELETE_SOURCES.length} 个软删除入口，` +
    `${IRREVERSIBLE_OK.length} 个物理删白名单，文案集中在 ${COPY_MODULE}）`,
)

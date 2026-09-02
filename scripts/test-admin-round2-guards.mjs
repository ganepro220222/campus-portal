/**
 * 第二轮修订：统计月份、blob 下载 401、列表 seq。
 * 用法：node scripts/test-admin-round2-guards.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { currentYearMonth } from '../admin/src/utils/localYearMonth.mjs'

const localMorning = new Date(2026, 8, 1, 0, 30, 0)
assert.equal(currentYearMonth(localMorning), '2026-09')
assert.notEqual(localMorning.toISOString().slice(0, 7), currentYearMonth(localMorning),
  'UTC slice 与本地月份在月初窗口必须能分叉')

const statsPanel = readFileSync(new URL('../admin/src/components/StatsPanel.vue', import.meta.url), 'utf8')
assert.match(statsPanel, /currentYearMonth\(/)
assert.doesNotMatch(statsPanel, /toISOString\(\)\.slice\(0,\s*7\)/)

const download = readFileSync(new URL('../admin/src/utils/download.ts', import.meta.url), 'utf8')
assert.match(download, /downloadFilePost/)
assert.match(download, /status === 401/)
assert.match(download, /method:\s*'post'/)
assert.match(download, /logoutOnUnauthorized|auth\.logout\(\)/)

const statsApi = readFileSync(new URL('../admin/src/api/stats.ts', import.meta.url), 'utf8')
assert.match(statsApi, /downloadFile\(/)
assert.doesNotMatch(statsApi, /from 'axios'/)

const memberApi = readFileSync(new URL('../admin/src/api/member.ts', import.meta.url), 'utf8')
assert.match(memberApi, /downloadFile\(/)
assert.match(memberApi, /downloadFilePost\(/)
assert.doesNotMatch(memberApi, /from 'axios'/)

const memberList = readFileSync(new URL('../admin/src/views/member/MemberListView.vue', import.meta.url), 'utf8')
assert.match(memberList, /listRequestSeq/)
assert.match(memberList, /shouldApplyListResult/)

const courseList = readFileSync(new URL('../admin/src/composables/useCourseList.ts', import.meta.url), 'utf8')
assert.match(courseList, /listRequestSeq/)
assert.match(courseList, /shouldApplyListResult/)

console.log('test-admin-round2-guards OK')

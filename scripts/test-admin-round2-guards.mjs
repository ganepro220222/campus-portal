/**
 * 第二轮修订：统计月份、blob 下载 401、列表 seq。
 * 用法：node scripts/test-admin-round2-guards.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { currentYearMonth } from '../admin/src/utils/localYearMonth.mjs'
import {
  interpretDownloadErrorBody,
  shouldAnnounceDownloadStarted
} from '../admin/src/utils/downloadOutcome.mjs'

const localMorning = new Date(2026, 8, 1, 0, 30, 0)
assert.equal(currentYearMonth(localMorning), '2026-09')

const statsPanel = readFileSync(new URL('../admin/src/components/StatsPanel.vue', import.meta.url), 'utf8')
assert.match(statsPanel, /currentYearMonth\(/)
assert.doesNotMatch(statsPanel, /toISOString\(\)\.slice\(0,\s*7\)/)

const download = readFileSync(new URL('../admin/src/utils/download.ts', import.meta.url), 'utf8')
assert.match(download, /downloadFilePost/)
assert.match(download, /status === 401/)
assert.match(download, /method:\s*'post'/)
assert.match(download, /logoutOnUnauthorized|auth\.logout\(\)/)
assert.match(download, /triggerDownload\(blob, name\)\s*\n\s*return true/)
assert.match(download, /return false/)
assert.match(download, /return requestDownload\(/)

assert.equal(interpretDownloadErrorBody({ code: 500, message: 'boom' }).kind, 'error')
assert.equal(shouldAnnounceDownloadStarted(false), false, 'HTTP 500 / 失败不得显示成功')
assert.equal(interpretDownloadErrorBody({ code: 400, message: '月报生成失败' }).kind, 'error')
assert.equal(shouldAnnounceDownloadStarted(undefined), false, 'JSON Blob 错误不得显示成功')
assert.equal(interpretDownloadErrorBody({ code: 401 }).kind, 'unauthorized')
assert.equal(shouldAnnounceDownloadStarted(false), false, '401 跳登录且不显示下载成功')
assert.equal(interpretDownloadErrorBody({ code: 429 }).kind, 'rateLimited')
assert.equal(interpretDownloadErrorBody({ code: 429 }).message, '操作过于频繁')
assert.equal(shouldAnnounceDownloadStarted(true), true, '正常 Blob 才显示开始下载')

assert.match(statsPanel, /shouldAnnounceDownloadStarted\(downloaded\)/)
assert.doesNotMatch(statsPanel, /await exportStatsMonth\([^)]*\)\s*\r?\n\s*ElMessage\.success\('月报已开始下载'\)/)

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

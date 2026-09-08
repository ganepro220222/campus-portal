/**
 * 关联小程序图标展示：后台表单与保存规则一致。
 * 用法：node scripts/test-admin-college-icon-display.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  COLLEGE_ICON_FIT_FILL,
  COLLEGE_ICON_FIT_FIT,
  COLLEGE_ICON_SHAPE_CIRCLE,
  COLLEGE_ICON_SHAPE_SQUARE,
  normalizeCollegeIconFit,
  normalizeCollegeIconShape
} from '../admin/src/utils/collegeIcon.mjs'

assert.equal(normalizeCollegeIconFit(null), COLLEGE_ICON_FIT_FIT)
assert.equal(normalizeCollegeIconFit('fill'), COLLEGE_ICON_FIT_FILL)
assert.equal(normalizeCollegeIconShape(''), COLLEGE_ICON_SHAPE_SQUARE)
assert.equal(normalizeCollegeIconShape('circle'), COLLEGE_ICON_SHAPE_CIRCLE)

const view = readFileSync(new URL('../admin/src/views/college/CollegeListView.vue', import.meta.url), 'utf8')
assert.match(view, /v-model:fit-mode="form\.iconFitMode"/)
assert.match(view, /v-model:icon-shape="form\.iconShape"/)
assert.match(view, /show-icon-shape/)
assert.match(view, /show-cover-fit/)
assert.match(view, /normalizeCollegeIconFit/)
assert.match(view, /normalizeCollegeIconShape/)
assert.match(view, /reactive<CollegeForm>/)
assert.match(view, /iconFitMode: NonNullable<CollegeAppItem\['iconFitMode'\]>/)
assert.match(view, /iconShape: NonNullable<CollegeAppItem\['iconShape'\]>/)

const oss = readFileSync(new URL('../admin/src/components/OssUploadInput.vue', import.meta.url), 'utf8')
assert.match(oss, /showIconShape/)
assert.match(oss, /preview-wrap--icon/)
assert.match(oss, /preview-wrap--circle/)
assert.match(oss, /圆形/)

const java = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/service/AdminCollegeAppService.java', import.meta.url), 'utf8')
assert.match(java, /CollegeIconDisplay\.normalizeFit/)
assert.match(java, /CollegeIconDisplay\.normalizeShape/)

const entity = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/entity/CollegeApp.java', import.meta.url), 'utf8')
assert.match(entity, /iconFitMode/)
assert.match(entity, /iconShape/)

const initSql = readFileSync(new URL('../sql/init.sql', import.meta.url), 'utf8')
assert.match(initSql, /icon_fit_mode/)
assert.match(initSql, /icon_shape/)

console.log('test-admin-college-icon-display OK')

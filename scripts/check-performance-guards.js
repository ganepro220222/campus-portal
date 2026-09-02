#!/usr/bin/env node
/**
 * 已修复性能路径的静态回归门禁。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const errors = []

const viewCount = read('backend/src/main/java/com/shuyuan/backend/service/ViewCountService.java')
if (/redis\.keys\s*\(/.test(viewCount)) {
  errors.push('ViewCountService：禁止恢复 Redis KEYS 全键扫描')
}
if (!/redis\.scan\s*\(/.test(viewCount)) {
  errors.push('ViewCountService：待落库计数必须使用 SCAN')
}

const stats = read('backend/src/main/java/com/shuyuan/backend/service/StatsAggregationService.java')
if (/eventLogMapper\.selectList\s*\(/.test(stats)) {
  errors.push('StatsAggregationService：禁止把 event_log 明细重新拉入 JVM 聚合')
}
for (const method of ['aggregateDaily', 'aggregateModuleViews', 'aggregateContentViews', 'aggregateTopViews']) {
  if (!stats.includes(`eventLogMapper.${method}(`)) {
    errors.push(`StatsAggregationService：缺少 SQL 聚合调用 ${method}`)
  }
}

const eventMapper = read('backend/src/main/java/com/shuyuan/backend/mapper/EventLogMapper.java')
if (!/COUNT\s*\(/i.test(eventMapper) || !/GROUP BY/i.test(eventMapper)) {
  errors.push('EventLogMapper：统计查询必须保留 SQL COUNT/GROUP BY')
}
if (!/stat_daily\.date\s*=\s*DATE\(event_log\.created_at\)/i.test(eventMapper)) {
  errors.push('EventLogMapper：过期明细删除必须受 stat_daily 聚合结果保护')
}

const searchSync = read('backend/src/main/java/com/shuyuan/backend/service/SearchIndexSyncService.java')
if (!/disableAllEnabled\(/.test(searchSync) || !/upsertBatch\(/.test(searchSync)) {
  errors.push('SearchIndexSyncService：全量同步必须保持集合式禁用与批量 upsert')
}

const activity = read('backend/src/main/java/com/shuyuan/backend/service/ActivityService.java')
if (!/MAX_PAGE_SIZE\s*=\s*100/.test(activity)
    || !/Math\.min\(size,\s*MAX_PAGE_SIZE\)/.test(activity)) {
  errors.push('ActivityService：公开活动分页必须限制单页最多 100 条')
}

const appConfig = read('backend/src/main/resources/application.yaml')
if (!/scheduling:[\s\S]{0,180}size:\s*\$\{SCHEDULING_POOL_SIZE:4\}/.test(appConfig)) {
  errors.push('application.yaml：定时任务线程池默认值必须保持为 4 且可配置')
}

const compose = read('docker-compose.dev.yml')
if (!/backend:[\s\S]*?logging:[\s\S]*?max-size:\s*"50m"[\s\S]*?max-file:\s*"5"/.test(compose)) {
  errors.push('docker-compose.dev.yml：backend 容器日志必须保持 50m × 5 轮转上限')
}

if (errors.length) {
  console.error('check-performance-guards 失败：')
  errors.forEach((error) => console.error(`  - ${error}`))
  process.exit(1)
}

console.log('check-performance-guards OK')

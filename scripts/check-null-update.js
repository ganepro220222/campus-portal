#!/usr/bin/env node
/**
 * 拦截「以为在清空字段、其实没有」的写法。
 *
 * 背景：MyBatis-Plus 的 updateStrategy 默认是 FieldStrategy.NOT_NULL
 * （3.5.11 的 GlobalConfig$DbConfig 构造器里写死，本仓库 application.yaml 未覆盖），
 * 所以 `entity.setXxx(null)` 之后再 updateById，那一列压根不会进 SET 子句。
 * 代码看着在清空，数据库里纹丝不动。
 *
 * 这个坑一次性坑了 5 个 Service、8 处调用：
 *   - 师生「清退」没清掉学号和手机号，弹窗上「将脱敏学号、手机号」是句做不到的承诺，
 *     学号还一直占着 uk_student_no，同一个学号再也导不进来
 *   - 报名被拒后重新报名，reject_reason 留着，后台「待审核」旁边挂着上次的拒绝理由
 *   - 通知发送成功没清 last_error，「已发送」的记录还显示着失败原因和处置建议
 *   - 字幕重新转写 / 转写成功没清 last_error，「已就绪」还挂着旧报错
 *
 * 规则：实体 setter 一律不许传 null。要把列写成 NULL 就用 LambdaUpdateWrapper 的
 * `.set(Entity::getXxx, null)`（形态是 `::getXxx, null`，不会被这条规则命中），
 * 测试用 UpdateWrapperAssertions.assertSetsColumn 断到列级。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const srcRoot = path.join(root, 'backend/src/main/java')

/** 实体 setter 传 null：`.setFoo(null)`。LambdaUpdateWrapper 的 `.set(X::getFoo, null)` 不是这个形态 */
const OFFENDING = /\.set[A-Z][A-Za-z0-9]*\(\s*null\s*\)/

function* javaFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* javaFiles(full)
    } else if (entry.name.endsWith('.java')) {
      yield full
    }
  }
}

const hits = []
for (const file of javaFiles(srcRoot)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const code = line.split('//')[0]
    if (OFFENDING.test(code)) {
      hits.push(`${path.relative(root, file)}:${i + 1}  ${line.trim()}`)
    }
  })
}

if (hits.length) {
  console.error('check-null-update 失败：实体 setter 传了 null，updateById 不会把该列写进 SET 子句')
  for (const h of hits) console.error('  ✖ ' + h)
  console.error('')
  console.error('  改用 LambdaUpdateWrapper：mapper.update(null, new LambdaUpdateWrapper<T>()')
  console.error('      .eq(T::getId, id).set(T::getXxx, null))')
  console.error('  并用 UpdateWrapperAssertions.assertSetsColumn(wrapper, "xxx", null) 断言到列级')
  process.exit(1)
}
console.log('check-null-update OK（未发现 setXxx(null) + updateById 的清空失效写法）')

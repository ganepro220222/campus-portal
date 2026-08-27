#!/usr/bin/env node
/**
 * 构造器注入 Bean 循环依赖门禁（Tarjan 强连通分量）。
 *
 * 不能替代 @SpringBootTest contextLoads()——只覆盖 @Service/@Component 等类上
 * Lombok @RequiredArgsConstructor 或显式构造器里的 private final 依赖。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const srcRoot = path.join(root, 'backend/src/main/java')

const BEAN_MARKERS = ['Service', 'Component', 'Repository', 'Controller', 'RestController', 'Configuration']
const SKIP_SIMPLE = new Set([
  'String', 'Integer', 'Long', 'Boolean', 'Double', 'Float', 'Short', 'Byte', 'Character',
  'int', 'long', 'boolean', 'double', 'float', 'short', 'byte', 'char',
  'Logger', 'ObjectMapper', 'RestTemplate', 'WebClient', 'JdbcTemplate',
  'RedisTemplate', 'StringRedisTemplate', 'ObjectProvider', 'Optional', 'List', 'Map', 'Set',
  'ApplicationContext', 'Environment', 'ResourceLoader',
])

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

function stripGenerics(type) {
  let depth = 0
  let out = ''
  for (const ch of type) {
    if (ch === '<') depth++
    else if (ch === '>') depth = Math.max(0, depth - 1)
    else if (depth === 0) out += ch
  }
  return out.trim()
}

function simpleName(type) {
  const base = stripGenerics(type).replace(/\?$/, '').trim()
  const parts = base.split('.')
  return parts[parts.length - 1]
}

function parseClass(content) {
  const pkg = content.match(/^package\s+([\w.]+);/m)?.[1] ?? ''
  const classMatch = content.match(/(?:public\s+)?(?:abstract\s+)?(?:class|enum)\s+(\w+)/)
  if (!classMatch) return null
  const className = classMatch[1]
  const fqcn = pkg ? `${pkg}.${className}` : className
  const isBean = BEAN_MARKERS.some((m) => new RegExp(`@${m}\\b`).test(content))
  if (!isBean) return null

  const imports = new Map()
  for (const m of content.matchAll(/^import\s+(?:static\s+)?([\w.]+);/gm)) {
    const fq = m[1]
    imports.set(simpleName(fq), fq)
  }

  const deps = new Set()

  for (const m of content.matchAll(/private\s+final\s+(?!static)([\w.<>,\s?]+)\s+\w+\s*;/g)) {
    const sn = simpleName(m[1])
    if (!SKIP_SIMPLE.has(sn)) deps.add(sn)
  }

  const ctorMatch = content.match(
    /(?:@RequiredArgsConstructor\s*\n)?(?:public\s+)?\w+\s*\(([\s\S]*?)\)\s*(?:throws[\s\S]*?)?\{/
  )
  if (ctorMatch && !/@RequiredArgsConstructor/.test(content)) {
    for (const part of ctorMatch[1].split(',')) {
      const pm = part.trim().match(/^([\w.<>,\s?]+)\s+\w+$/)
      if (pm) {
        const sn = simpleName(pm[1])
        if (!SKIP_SIMPLE.has(sn)) deps.add(sn)
      }
    }
  }

  return { fqcn, className, file: '', imports, deps: [...deps] }
}

/** @type {Map<string, { fqcn: string, className: string, file: string, imports: Map<string,string>, deps: string[] }>} */
const beansByFqcn = new Map()
/** @type {Map<string, string[]>} */
const beansBySimple = new Map()

for (const file of javaFiles(srcRoot)) {
  const content = fs.readFileSync(file, 'utf8')
  const parsed = parseClass(content)
  if (!parsed) continue
  parsed.file = path.relative(root, file)
  beansByFqcn.set(parsed.fqcn, parsed)
  if (!beansBySimple.has(parsed.className)) beansBySimple.set(parsed.className, [])
  beansBySimple.get(parsed.className).push(parsed.fqcn)
}

function resolveDep(fromBean, depSimple) {
  if (fromBean.imports.has(depSimple)) {
    return fromBean.imports.get(depSimple)
  }
  const cands = beansBySimple.get(depSimple) ?? []
  if (cands.length === 1) return cands[0]
  return null
}

/** @type {Map<string, Set<string>>} */
const graph = new Map()
for (const bean of beansByFqcn.values()) {
  const edges = new Set()
  for (const dep of bean.deps) {
    const target = resolveDep(bean, dep)
    if (target && beansByFqcn.has(target) && target !== bean.fqcn) {
      edges.add(target)
    }
  }
  graph.set(bean.fqcn, edges)
}

function tarjan() {
  let index = 0
  const stack = []
  const onStack = new Set()
  /** @type {Map<string, number>} */
  const indices = new Map()
  /** @type {Map<string, number>} */
  const lowlink = new Map()
  /** @type {string[][]} */
  const sccs = []

  function strongConnect(v) {
    indices.set(v, index)
    lowlink.set(v, index)
    index++
    stack.push(v)
    onStack.add(v)

    for (const w of graph.get(v) ?? []) {
      if (!indices.has(w)) {
        strongConnect(w)
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)))
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)))
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const comp = []
      let w
      do {
        w = stack.pop()
        onStack.delete(w)
        comp.push(w)
      } while (w !== v)
      if (comp.length > 1) sccs.push(comp)
    }
  }

  for (const v of graph.keys()) {
    if (!indices.has(v)) strongConnect(v)
  }
  return sccs
}

const cycles = tarjan()
if (cycles.length) {
  console.error('check-spring-bean-cycles 失败：发现构造器注入循环依赖')
  for (const comp of cycles) {
    console.error('  ✖ 环：' + comp.map((fq) => beansByFqcn.get(fq).className).join(' → ') + ' → …')
    for (const fq of comp) {
      const b = beansByFqcn.get(fq)
      const targets = [...(graph.get(fq) ?? [])].filter((t) => comp.includes(t))
      console.error(`      ${b.className} (${b.file}) → ${targets.map((t) => beansByFqcn.get(t).className).join(', ')}`)
    }
  }
  console.error('')
  console.error('  说明：此为静态构造器依赖扫描，不能替代 Spring 全上下文启动测试。')
  process.exit(1)
}

console.log(
  `check-spring-bean-cycles OK（${beansByFqcn.size} 个 Spring Bean，未发现构造器循环依赖）`,
)

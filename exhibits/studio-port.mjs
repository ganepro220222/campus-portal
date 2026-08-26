/**
 * 工作台端口选择（纯逻辑，零依赖，可单测）。
 *
 * 为什么需要回退：Windows 会把一些端口段划给 Hyper-V / WSL / Docker 做动态排除
 * （`netsh interface ipv4 show excludedportrange protocol=tcp` 能看到），
 * 排除段随机且每台机器不同，任何一个写死的端口都可能在某台机器上绑不上。
 * 老师双击「打开工作台.bat」时不该看到一堆报错，服务器却相反——端口必须确定，
 * 否则 Nginx 反代会打到空处。
 *
 * 于是规则是：
 *   - 默认不回退：绑不上就报错退出。服务器（systemd 里写死 PORT=8200）走这条。
 *   - STUDIO_PORT_FALLBACK=1 时才回退：按候选表逐个试。Windows 启动器设这个开关。
 * 无论走哪条，实际用的端口都写进 studio-port.txt，启动器据此拼 URL，
 * 不再靠「猜服务在哪个端口」。
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * 候选端口。8888 是默认值；其余几档刻意跨不同段位，
 * 避免一整段被系统保留时全军覆没（8100–8699、8901–9000 是 Windows 上的常见排除段）。
 */
export const PORT_CANDIDATES = Object.freeze([8888, 8010, 7788, 9310, 8200])

/** 启动器与服务约定的端口文件（相对 exhibits/） */
export const PORT_FILE_REL = '_runtime/studio-port.txt'

export function isFallbackEnabled(env = process.env) {
  return env.STUDIO_PORT_FALLBACK === '1'
}

/** 端口是否可用作监听目标 */
export function isValidPort(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 65535
}

/**
 * 按优先级给出要依次尝试的端口。
 * 首选项永远排第一；不回退时只有它一项。
 */
export function portAttempts(preferred, { fallback = false } = {}) {
  const first = isValidPort(preferred) ? Number(preferred) : PORT_CANDIDATES[0]
  if (!fallback) return [first]
  const out = [first]
  for (const p of PORT_CANDIDATES) {
    if (!out.includes(p)) out.push(p)
  }
  return out
}

/** 绑定失败是否值得换个端口再试；其它错误（如权限、地址非法）直接暴露 */
export function isPortUnavailableError(err) {
  return err != null && (err.code === 'EADDRINUSE' || err.code === 'EACCES')
}

/** 记下实际端口供启动器读取；写不进去不影响服务运行（systemd 固定 PORT 时不写，属预期） */
export function writePortFile(root, port) {
  try {
    const file = path.join(root, PORT_FILE_REL)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, String(port), 'utf8')
    return file
  } catch {
    return ''
  }
}

/** 退出时清掉，免得下次启动器读到一个早就没人监听的端口 */
export function removePortFile(root) {
  try {
    fs.rmSync(path.join(root, PORT_FILE_REL), { force: true })
  } catch {
    /* 清理失败不影响退出 */
  }
}

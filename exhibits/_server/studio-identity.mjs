/**
 * Stable per-exhibits-root instance ID (portable copies each get their own).
 * Used by launchers to detect 8199 occupied by another directory's server.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const INSTANCE_ID_FILE = '.studio-instance-id'

export function instanceIdPath(root) {
  return path.join(root, INSTANCE_ID_FILE)
}

export function readInstanceId(root) {
  try {
    const id = fs.readFileSync(instanceIdPath(root), 'utf8').trim()
    return id || null
  } catch {
    return null
  }
}

export function getOrCreateInstanceId(root) {
  const existing = readInstanceId(root)
  if (existing) return existing
  const id = crypto.randomUUID()
  fs.writeFileSync(instanceIdPath(root), id + '\n', 'utf8')
  return id
}

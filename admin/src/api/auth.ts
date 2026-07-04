import { post } from './request'
import type { AdminLoginData } from '@/types/api'

export function login(username: string, password: string) {
  return post<AdminLoginData>('/admin/auth/login', { username, password })
}

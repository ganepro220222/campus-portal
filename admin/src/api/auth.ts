import { post, put } from './request'
import type { AdminLoginData } from '@/types/api'

export function login(username: string, password: string) {
  return post<AdminLoginData>('/admin/auth/login', { username, password })
}

export function changePassword(oldPassword: string, newPassword: string) {
  return put<AdminLoginData>('/admin/auth/change-password', { oldPassword, newPassword })
}

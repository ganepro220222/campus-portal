import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from '@/types/api'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/** axios 实例：统一 baseURL、鉴权头、错误提示 */
const http = axios.create({
  baseURL: '/api/v1',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data as ApiResult
    if (body.code === 200) {
      return body.data as never
    }
    if (body.code === 401) {
      const auth = useAuthStore()
      // 登录页密码错误不清理会话
      if (!res.config.url?.includes('/admin/auth/login')) {
        auth.logout()
        router.push({ name: 'Login' })
      }
      ElMessage.error(body.message || '登录已过期')
      return Promise.reject(body)
    }
    if (body.code === 429) {
      ElMessage.warning({ message: body.message || '操作过于频繁', duration: 4000 })
      return Promise.reject(body)
    }
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(body)
  },
  (err) => {
    ElMessage.error('网络异常，请检查后端服务')
    return Promise.reject(err)
  }
)

export function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
  return http.get<T, T>(url, { params, ...config })
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return http.post<T, T>(url, data, config)
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return http.put<T, T>(url, data, config)
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return http.delete<T, T>(url, config)
}

export default http

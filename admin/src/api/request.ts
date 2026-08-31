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

/** silent=true 时失败不弹全局错误提示（调用方自行兜底，如预览签名地址换取） */
export type RequestConfig = AxiosRequestConfig & { silent?: boolean }

function isSilent(config?: AxiosRequestConfig): boolean {
  return (config as RequestConfig | undefined)?.silent === true
}

function rejectApiBody(body: ApiResult, config?: AxiosRequestConfig): Promise<never> {
  if (body.code === 401) {
    const auth = useAuthStore()
    // 登录页密码错误不清理会话
    if (!config?.url?.includes('/admin/auth/login')) {
      auth.logout()
      router.push({ name: 'Login' })
    }
    ElMessage.error(body.message || '登录已过期')
    return Promise.reject(body)
  }
  if (body.code === 403 && body.errorKey === 'ADMIN_PASSWORD_CHANGE_REQUIRED') {
    const auth = useAuthStore()
    auth.markMustChangePassword()
    if (router.currentRoute.value.name !== 'AdminChangePassword') {
      router.push({ name: 'AdminChangePassword' })
    }
    ElMessage.warning(body.message || '请先修改初始密码')
    return Promise.reject(body)
  }
  if (body.code === 429) {
    ElMessage.warning({ message: body.message || '操作过于频繁', duration: 4000 })
    return Promise.reject(body)
  }
  if (!isSilent(config)) {
    ElMessage.error(body.message || '请求失败')
  }
  return Promise.reject(body)
}

function dispatchApiBody(body: ApiResult, config?: AxiosRequestConfig) {
  if (body.code === 200) {
    return body.data as never
  }
  return rejectApiBody(body, config)
}

http.interceptors.response.use(
  (res) => dispatchApiBody(res.data as ApiResult, res.config),
  (err) => {
    const body = err.response?.data as ApiResult | undefined
    if (body && typeof body.code === 'number') {
      return rejectApiBody(body, err.config)
    }
    if (!isSilent(err.config)) {
      const aborted = err.code === 'ECONNABORTED' || /timeout/i.test(String(err.message || ''))
      ElMessage.error(aborted ? '请求超时，请稍后重试' : '网络异常，请检查后端服务')
    }
    return Promise.reject(err)
  }
)

export function get<T>(url: string, params?: Record<string, unknown>, config?: RequestConfig) {
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

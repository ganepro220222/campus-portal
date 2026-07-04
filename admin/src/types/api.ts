/** 统一接口响应格式（与后端 Result 一致） */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页结果 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** 管理员登录结果 */
export interface AdminLoginData {
  token: string
  adminId: number
  username: string
  realName: string
  roleId: number
  roleName: string
  permissions: string[]
}

export interface BannerItem {
  id: number
  title: string
  description: string
  imageUrl: string | null
  linkType: string
  linkValue: string
  sort: number
  status: number
}

export interface NewsItem {
  id: number
  title: string
  cover: string | null
  summary: string
  content: string
  categoryId: number | null
  categoryName: string
  status: 'draft' | 'published'
  isTop: number
  viewCount: number
  publishTime: string
  updateTime: string
}

export interface HallItem {
  id: number
  name: string
  cover: string | null
  intro: string
  categoryId: number | null
  categoryName: string
  sort: number
  status: number
}

export interface CategoryOption {
  id: number
  name: string
}

/** 活动（后台） */
export interface ActivityItem {
  id: number
  title: string
  cover: string | null
  intro: string
  location: string
  startTime: string
  endTime: string
  enrollStartTime: string
  enrollEndTime: string
  quota: number
  enrolledCount: number
  status: 'draft' | 'published' | 'cancelled'
  needReview: boolean
  full: boolean
}

/** 报名记录（后台） */
export interface EnrollItem {
  id: number
  activityId: number
  memberId: number
  name: string
  phone: string
  college: string
  grade: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  statusLabel: string
  voucherCode: string | null
  rejectReason: string | null
  createTime: string
}

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

export interface AnnouncementItem {
  id: number
  content: string
  linkUrl?: string | null
  sort?: number
  isScroll?: number
  startTime?: string | null
  endTime?: string | null
  status?: number
  activeNow?: boolean
}

export interface FeedbackItem {
  id: number
  memberId: number
  memberNickname: string
  type: string
  content: string
  contact?: string | null
  images?: string[]
  status: 'pending' | 'replied' | string
  reply?: string | null
  repliedAt?: string | null
  createTime: string
}

export interface StatsOverview {
  date: string
  pv: number
  uv: number
  dau: number
  newMember: number
  enrollCount: number
}

export interface StatsTrendItem {
  date: string
  pv: number
  uv: number
  dau: number
  newMember: number
  enrollCount: number
}

export interface StatsModuleItem {
  module: string
  moduleLabel: string
  count: number
}

export interface StatsContentTopItem {
  targetType: string
  targetTypeLabel: string
  targetId: number
  title: string
  viewCount: number
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
  shortName?: string | null
  cover: string | null
  intro: string
  vrUrl?: string | null
  vrReady?: boolean
  categoryId: number | null
  categoryName: string
  sort: number
  status: number
  slides?: HallSlideItem[]
  audioUrl?: string | null
  audioTime?: string | null
  sections?: HallSectionItem[]
}

export interface HallSectionItem {
  title: string
  sort?: number
  items?: HallSlideItem[]
}

export interface HallSlideItem {
  url: string
  caption?: string
  sort?: number
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

/** 课程（后台） */
export interface CourseItem {
  id: number
  name: string
  cover: string | null
  categoryId: number | null
  categoryName: string
  targetAudience: string
  durationMinutes: number | null
  startTime: string
  intro: string
  videoUrl: string | null
  subtitleUrl: string | null
  subtitleStatus: string
  subtitleStatusLabel: string
  subtitleTaskId: string | null
  status: number
  resourceIds?: number[]
  resources?: { id: number; name: string; fileType: string }[]
}

/** 资源选项（下拉用） */
export interface ResourceOption {
  id: number
  name: string
  fileType: string
  categoryName: string
}

/** 资源（后台） */
export interface ResourceItem {
  id: number
  name: string
  fileUrl: string
  previewUrl: string | null
  fileType: string
  fileTypeLabel: string
  fileSizeKb: number | null
  fileSizeText: string
  categoryId: number | null
  categoryName: string
  downloadCount: number
  status: number
  createTime: string
}

/** 文创（后台） */
export interface CraftItem {
  id: number
  name: string
  cover: string | null
  categoryId: number | null
  categoryName: string
  introZh: string
  introEn: string
  previewType: string
  previewTypeLabel: string
  model3dUrl: string | null
  sort: number
  status: number
  images?: { id?: number; imageUrl: string; angleLabel: string; sort: number }[]
  contact?: {
    phone: string | null
    wechat: string | null
    workWechat: string | null
    email: string | null
  } | null
}

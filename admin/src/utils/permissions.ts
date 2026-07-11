/** 权限目录（与后端 AdminPermissionCatalog 一致） */
export interface PermissionEntry {
  key: string
  label: string
}

export interface PermissionGroup {
  group: string
  permissions: PermissionEntry[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: '系统管理',
    permissions: [{ key: 'admin:super', label: '超级管理员（全部权限）' }]
  },
  {
    group: '新闻',
    permissions: [
      { key: 'news:read', label: '查看新闻' },
      { key: 'news:write', label: '编辑新闻' },
      { key: 'news:publish', label: '发布/下架新闻' }
    ]
  },
  {
    group: '展馆与文创',
    permissions: [
      { key: 'hall:read', label: '查看展馆、文创' },
      { key: 'hall:write', label: '编辑展馆、文创' },
      { key: 'hall:publish', label: '上架/下架展馆、文创' }
    ]
  },
  {
    group: '课程与资源',
    permissions: [
      { key: 'course:read', label: '查看课程、资源' },
      { key: 'course:write', label: '编辑课程、资源' },
      { key: 'course:publish', label: '上架/下架课程、资源' }
    ]
  },
  {
    group: '活动报名',
    permissions: [
      { key: 'enroll:read', label: '查看活动与报名' },
      { key: 'enroll:export', label: '导出报名 Excel' }
    ]
  },
  {
    group: '分类与统计',
    permissions: [
      { key: 'category:read', label: '查看分类' },
      { key: 'category:write', label: '编辑分类' },
      { key: 'stats:view', label: '查看数据看板' }
    ]
  }
]

export const PASSWORD_HINT =
  '至少 12 位，须包含大写字母、小写字母和数字'

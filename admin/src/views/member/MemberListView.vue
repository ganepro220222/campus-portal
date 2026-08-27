<template>
  <div class="page-card">
    <div class="page-header">
      <h2>师生账号</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增账号</el-button>
        <el-button @click="onDownloadTemplate">下载导入模板</el-button>
        <el-button
          v-if="lastImportErrors.length"
          type="warning"
          @click="onDownloadErrors"
        >导出上次失败明细</el-button>
        <el-upload
          :show-file-list="false"
          accept=".xlsx,.xls"
          :http-request="onImport"
        >
          <el-button type="primary">Excel 批量导入</el-button>
        </el-upload>
      </div>
    </div>

    <p class="text-muted">
      零星一两个人用「新增账号」，整批入学用「Excel 批量导入」——两条路建出来的账号完全一致。
      初始密码默认身份证后 6 位（无身份证则取学号后 6 位）。学生首次登录须修改初始密码；微信登录须绑定学号。
    </p>

    <el-alert type="info" :closable="false" show-icon class="import-hint">
      <template #title>导入格式说明</template>
      <p>仅 <strong>学号</strong>、<strong>姓名</strong> 必填；学院/年级/手机号/身份证可选。</p>
      <p>校方内部表不必逐格手抄：在 Excel 中将表头改为系统识别的列名即可直接导入（如「学生学号」→「学号」、「院系」→「学院」）。</p>
      <p>支持的表头别名见《师生 Excel 导入说明》；导入失败可导出明细 Excel 逐行核对。</p>
    </el-alert>

    <div class="toolbar">
      <el-input v-model="keyword" placeholder="学号 / 姓名" clearable style="width: 220px" @keyup.enter="loadData" />
      <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="loadData">
        <el-option label="正常" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="realName" label="姓名" width="100" />
      <el-table-column prop="college" label="学院" min-width="160" show-overflow-tooltip />
      <el-table-column prop="grade" label="年级" width="80" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="points" label="积分" width="80" align="center" />
      <el-table-column label="微信绑定" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.wxBound ? 'success' : 'info'" size="small">{{ row.wxBound ? '已绑定' : '未绑定' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.anonymized" type="info" size="small">已清退</el-tag>
          <el-tag v-else :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <!-- el-tag 不带 el-button 之间的默认间距，混排时「已清退」会贴死「删除」，
               统一用 flex 排一行，间距由容器给 -->
          <div class="row-ops">
            <template v-if="!row.anonymized">
              <el-button
                v-if="row.status === 1"
                link
                type="warning"
                @click="onToggleStatus(row, 0)"
              >禁用</el-button>
              <el-button
                v-else
                link
                type="primary"
                @click="onToggleStatus(row, 1)"
              >启用</el-button>
            </template>
            <el-button
              v-if="!row.anonymized"
              link
              type="danger"
              @click="onAnonymize(row)"
            >清退</el-button>
            <el-tag v-else type="info" size="small" effect="plain">已清退</el-tag>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>

    <el-drawer v-model="createVisible" title="新增师生账号" size="440px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="76px">
        <el-form-item label="学号" prop="studentNo">
          <el-input v-model="createForm.studentNo" placeholder="全库唯一，登录用" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="createForm.realName" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="学院">
          <el-input v-model="createForm.college" placeholder="选填" />
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="createForm.grade" placeholder="选填，如 2024" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="createForm.phone" placeholder="选填" />
        </el-form-item>
        <el-form-item label="身份证">
          <el-input v-model="createForm.idCard" placeholder="选填，仅用于取后 6 位作初始密码" />
          <FieldHint text="不填则取学号后 6 位作初始密码。身份证号不入库。" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="onCreate">创建账号</el-button>
      </template>
    </el-drawer>

    <DangerDeleteDialog
      v-model="deleteVisible"
      title="删除师生账号"
      subject-label="师生账号"
      :name="deleteImpact?.name ?? pendingName"
      :risk="deleteRisk"
      :references="deleteRefs"
      :blocked-title="deleteGuidance?.blockedTitle"
      :blocked-description="deleteGuidance?.blockedDescription"
      :requires-password="deleteImpact?.requiresPassword ?? false"
      :can-proceed="deleteCanProceed"
      :loading-impact="deleteImpactLoading"
      :submitting="deleting"
      confirm-text="彻底删除账号"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import DangerDeleteDialog, { type DangerReference } from '@/components/DangerDeleteDialog.vue'
import FieldHint from '@/components/FieldHint.vue'
import { memberDeleteGuidance } from '@/utils/memberDeleteGuidance'
import { normalizeListPage } from '@/utils/listPageNormalize'
import {
  deleteImpactMatchesPending,
  shouldApplyDeleteImpactResult
} from '@/utils/deleteImpactRequest'
import {
  downloadMemberImportErrors,
  downloadMemberImportTemplate,
  anonymizeMember,
  createMember,
  deleteMember,
  fetchMemberDeleteImpact,
  fetchMembers,
  importMembers,
  updateMemberStatus,
  type MemberDeleteImpact,
  type MemberImportErrorRow,
  type MemberItem
} from '@/api/member'

const loading = ref(false)
const list = ref<MemberItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const statusFilter = ref<number | undefined>()
const lastImportErrors = ref<MemberImportErrorRow[]>([])

const createVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  studentNo: '',
  realName: '',
  college: '',
  grade: '',
  phone: '',
  idCard: ''
})
const createRules: FormRules = {
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const deleteVisible = ref(false)
const deleting = ref(false)
const deleteImpactLoading = ref(false)
const deleteImpact = ref<MemberDeleteImpact | null>(null)
const pendingId = ref<number | null>(null)
const pendingName = ref('')
let deleteImpactRequestSeq = 0

function invalidateDeleteImpactRequest() {
  deleteImpactRequestSeq++
  pendingId.value = null
  pendingName.value = ''
  deleteImpact.value = null
  deleteImpactLoading.value = false
}

watch(deleteVisible, (visible) => {
  if (!visible) {
    invalidateDeleteImpactRequest()
  }
})

/** 账号只有两档：干净的能真删（LOW），留下记录的删不了（BLOCKED） */
const deleteGuidance = computed(() => memberDeleteGuidance(deleteImpact.value))

const deleteRisk = computed<'LOW' | 'BLOCKED'>(() => deleteGuidance.value?.risk ?? 'LOW')

const deleteCanProceed = computed(
  () =>
    (deleteImpact.value?.canDelete ?? false) &&
    deleteImpactMatchesPending(deleteImpact.value, pendingId.value)
)

const deleteRefs = computed<DangerReference[]>(() => {
  const guidance = deleteGuidance.value
  if (!guidance?.referenceHint) {
    return []
  }
  return (deleteImpact.value?.references ?? []).map((r) => ({
    label: r.label,
    count: r.count,
    blocking: true,
    hint: guidance.referenceHint
  }))
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchMembers(keyword.value || undefined, statusFilter.value, page.value, pageSize.value)
    const nextPage = normalizeListPage(page.value, res.total, pageSize.value)
    if (nextPage !== page.value) {
      page.value = nextPage
      return loadData()
    }
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function onDownloadTemplate() {
  await downloadMemberImportTemplate()
}

async function onDownloadErrors() {
  await downloadMemberImportErrors(lastImportErrors.value)
}

async function onImport(options: UploadRequestOptions) {
  try {
    const result = await importMembers(options.file as File)
    lastImportErrors.value = result.errorRows ?? []
    const msg = `导入完成：成功 ${result.successCount}，跳过 ${result.skippedCount}，失败 ${result.failedCount}`
    if (result.errors?.length) {
      const extra = result.failedCount > 0 ? '\n\n可点击「导出上次失败明细」下载 Excel 核对。' : ''
      await ElMessageBox.alert(
        result.errors.join('\n') + extra,
        msg,
        { confirmButtonText: '知道了' }
      )
    } else {
      ElMessage.success(msg)
    }
    await loadData()
  } catch {
    // 错误由 request 拦截器提示
  }
}

async function onToggleStatus(row: MemberItem, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定${action}学号 ${row.studentNo} 吗？`, '确认')
  await updateMemberStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  await loadData()
}

async function onAnonymize(row: MemberItem) {
  await ElMessageBox.confirm(
    `清退会抹掉「${row.realName}（${row.studentNo}）」的姓名、学号、手机号，并禁止其再登录；` +
      `报名、积分、学习等记录保留用于统计。学号会被释放，之后可以重新导入。此操作不可撤销，确定清退吗？`,
    '清退确认',
    { type: 'warning', confirmButtonText: '确定清退', confirmButtonClass: 'el-button--danger' }
  )
  await anonymizeMember(row.id)
  ElMessage.success('已清退')
  await loadData()
}

function openCreate() {
  createFormRef.value?.resetFields()
  Object.assign(createForm, {
    studentNo: '',
    realName: '',
    college: '',
    grade: '',
    phone: '',
    idCard: ''
  })
  createVisible.value = true
}

async function onCreate() {
  const form = createFormRef.value
  if (!form) {
    return
  }
  await form.validate()
  creating.value = true
  try {
    await createMember({
      studentNo: createForm.studentNo.trim(),
      realName: createForm.realName.trim(),
      college: createForm.college.trim() || undefined,
      grade: createForm.grade.trim() || undefined,
      phone: createForm.phone.trim() || undefined,
      idCard: createForm.idCard.trim() || undefined
    })
    createVisible.value = false
    ElMessage.success('账号已创建，初始密码见页面说明')
    await loadData()
  } finally {
    creating.value = false
  }
}

async function onDelete(row: MemberItem) {
  const id = row.id
  const seq = ++deleteImpactRequestSeq

  pendingId.value = id
  pendingName.value = row.realName || row.studentNo || `账号 ${row.id}`
  deleteImpact.value = null
  deleteImpactLoading.value = true
  deleteVisible.value = true

  try {
    const result = await fetchMemberDeleteImpact(id)
    if (
      !shouldApplyDeleteImpactResult({
        requestedId: id,
        currentId: pendingId.value,
        seq,
        latestSeq: deleteImpactRequestSeq,
        dialogVisible: deleteVisible.value
      })
    ) {
      return
    }
    deleteImpact.value = result
  } catch (e) {
    if (
      shouldApplyDeleteImpactResult({
        requestedId: id,
        currentId: pendingId.value,
        seq,
        latestSeq: deleteImpactRequestSeq,
        dialogVisible: deleteVisible.value
      })
    ) {
      deleteVisible.value = false
    }
    throw e
  } finally {
    if (seq === deleteImpactRequestSeq) {
      deleteImpactLoading.value = false
    }
  }
}

async function onDeleteConfirm(password: string) {
  if (
    pendingId.value == null ||
    !deleteImpactMatchesPending(deleteImpact.value, pendingId.value)
  ) {
    return
  }
  deleting.value = true
  try {
    await deleteMember(pendingId.value, password)
    deleteVisible.value = false
    ElMessage.success('账号已彻底删除')
    await loadData()
  } finally {
    deleting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.row-ops {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
/* flex 容器已统一给间距，去掉 Element 给相邻按钮的默认左边距，免得叠加 */
.row-ops .el-button + .el-button {
  margin-left: 0;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.import-hint {
  margin-bottom: 16px;
}
.import-hint p {
  margin: 4px 0;
  line-height: 1.5;
}
</style>

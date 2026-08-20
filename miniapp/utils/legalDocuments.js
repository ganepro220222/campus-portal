// utils/legalDocuments.js — 隐私/用户协议：远程配置 + 本地缓存 + 内置基线

const { get } = require('./request')

const CACHE_KEY = 'legal_documents_cache_v1'
const BASELINE_VERSION = 'baseline-2026-08'

const BASELINE = {
  version: BASELINE_VERSION,
  privacy: `<p><strong>隐私政策</strong>（内置基线，运营后台配置后将自动更新）</p>
<p>「云端书院」小程序由运营方提供线上学习与服务。我们重视您的个人信息保护，并遵循合法、正当、必要原则处理信息。</p>
<p><strong>1. 我们可能收集的信息</strong></p>
<p>账号与学籍信息（学号、姓名、学院等）、登录凭证、学习进度、收藏与报名记录、设备与日志信息（用于安全与统计）、您主动提交的反馈与问答内容。</p>
<p><strong>2. 信息用途</strong></p>
<p>用于身份验证、课程与活动服务、消息通知、学习统计、问题排查及法律法规要求的其他用途。</p>
<p><strong>3. 智能问答（AI）</strong></p>
<p>您在「智能问答」中提交的问题将用于生成回答；相关内容可能经第三方模型服务处理。AI 回答仅供参考，不构成正式意见。请勿输入违法违规或敏感个人信息。</p>
<p><strong>4. 存储与安全</strong></p>
<p>信息存储于中华人民共和国境内服务器，并采取合理安全措施。除法律要求或取得您同意外，不向无关第三方提供可识别个人身份的信息。</p>
<p><strong>5. 您的权利</strong></p>
<p>您可查询、更正个人信息，撤回授权或注销账号（按校方/运营方流程办理）。</p>
<p><strong>6. 联系我们</strong></p>
<p>如有疑问，请通过小程序「意见反馈」或校方公布渠道联系。</p>
<p>生效日期：2026-08-01</p>`,
  agreement: `<p><strong>用户协议</strong>（内置基线，运营后台配置后将自动更新）</p>
<p>欢迎使用「云端书院」小程序。使用本服务即表示您同意本协议。</p>
<p><strong>1. 服务内容</strong></p>
<p>本小程序提供动态资讯、线上展馆、课程学习、资源下载、活动报名、智能问答等功能，具体以实际上线模块为准。</p>
<p><strong>2. 账号与安全</strong></p>
<p>您应妥善保管账号密码，不得转借他人。因保管不善导致的损失由您自行承担。</p>
<p><strong>3. 用户行为规范</strong></p>
<p>不得利用本服务从事违法、侵权、干扰系统运行或发布不当内容等行为。</p>
<p><strong>4. 内容与知识产权</strong></p>
<p>小程序内课程、图文、音视频等内容的知识产权归校方或权利人所有，未经授权不得擅自传播或商用。</p>
<p><strong>5. 智能问答声明</strong></p>
<p>AI 生成内容仅供参考，可能存在不准确之处；重要事项请以校方正式通知或人工答复为准。</p>
<p><strong>6. 免责声明</strong></p>
<p>因网络、设备、第三方服务或不可抗力导致的服务中断，我们在法律允许范围内不承担责任。</p>
<p>生效日期：2026-08-01</p>`
}

function readCache() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY)
    if (!raw || typeof raw !== 'object') return null
    if (!raw.privacy && !raw.agreement) return null
    return raw
  } catch (e) {
    return null
  }
}

function writeCache(doc) {
  try {
    wx.setStorageSync(CACHE_KEY, {
      privacy: doc.privacy || '',
      agreement: doc.agreement || '',
      version: doc.version || '',
      updatedAt: doc.updatedAt || '',
      cachedAt: Date.now()
    })
  } catch (e) {
    // 缓存失败不影响展示
  }
}

function pickRemoteField(remote, key) {
  const val = remote && remote[key]
  return val != null && String(val).trim() ? String(val) : ''
}

function resolveFromSources(remote, cache) {
  const privacy = pickRemoteField(remote, 'privacy')
    || (cache && cache.privacy) || BASELINE.privacy
  const agreement = pickRemoteField(remote, 'agreement')
    || (cache && cache.agreement) || BASELINE.agreement

  let source = 'baseline'
  if (pickRemoteField(remote, 'privacy') && pickRemoteField(remote, 'agreement')) {
    source = 'remote'
  } else if (cache && (cache.privacy || cache.agreement)) {
    source = 'cache'
  }

  const version = (remote && remote.version) || (cache && cache.version) || BASELINE.version
  const updatedAt = (remote && remote.updatedAt) || (cache && cache.updatedAt) || ''

  return {
    privacy,
    agreement,
    source,
    version,
    updatedAt,
    fromRemote: {
      privacy: !!pickRemoteField(remote, 'privacy'),
      agreement: !!pickRemoteField(remote, 'agreement')
    }
  }
}

function sourceHint(doc) {
  if (doc.source === 'remote') return ''
  if (doc.source === 'cache') {
    return '当前显示上次成功获取的协议内容，可下拉刷新或点击重新加载以获取最新版本。'
  }
  return '当前显示内置基线版本；联网后将自动尝试从服务器获取正式版本。'
}

async function loadLegalDocuments() {
  const cache = readCache()
  let remote = null
  let fetchError = false

  try {
    remote = await get('/config/documents', {}, { silent: true })
    const hasPrivacy = !!pickRemoteField(remote, 'privacy')
    const hasAgreement = !!pickRemoteField(remote, 'agreement')
    if (hasPrivacy || hasAgreement) {
      writeCache({
        privacy: pickRemoteField(remote, 'privacy') || (cache && cache.privacy) || '',
        agreement: pickRemoteField(remote, 'agreement') || (cache && cache.agreement) || '',
        version: (remote && remote.version) || '',
        updatedAt: (remote && remote.updatedAt) || ''
      })
    }
  } catch (e) {
    fetchError = true
    remote = null
  }

  const resolved = resolveFromSources(remote, readCache())
  return {
    ...resolved,
    fetchError,
    hint: sourceHint(resolved)
  }
}

module.exports = {
  BASELINE,
  CACHE_KEY,
  loadLegalDocuments,
  resolveFromSources,
  sourceHint,
  pickRemoteField
}

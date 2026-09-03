// utils/legalDocuments.js — 隐私/用户协议：远程配置 + 本地缓存 + 内置基线

const { get } = require('./request')
const { hideAiChatLegalCopy } = require('../config/features')

const CACHE_KEY = 'legal_documents_cache_v1'
const BASELINE_VERSION = 'baseline-2026-09'

const BASELINE = {
  version: BASELINE_VERSION,
  privacy: `<p><strong>云端书院小程序隐私政策</strong></p>
<p>本政策适用于微信小程序「通途云」（产品界面名称「云端书院」）。运营方为贵州云漫科技有限公司（下称「我们」）。平台学习与展示内容由中华文化书院提供。备案号：黔ICP备17005610号-10X。</p>
<p>我们遵循合法、正当、必要原则处理个人信息。使用本小程序即表示您已阅读并同意本政策。</p>
<p><strong>1. 我们可能收集的信息</strong></p>
<p>（1）账号信息：管理员分配的登录账号、姓名、所属单位，以及登录凭证。<br/>
（2）微信授权信息：当您使用微信登录时，我们通过微信开放平台获取识别用户所需的标识（如 openid），用于登录与账号绑定。<br/>
（3）使用信息：学习进度、收藏、报名、消息已读状态、您提交的意见反馈及附图。<br/>
（4）智能问答：您主动输入的问题及生成的回答记录，用于提供问答服务与安全风控。<br/>
（5）设备与日志：设备型号、系统版本、网络状态、操作日志，用于保障服务安全与排查故障。<br/>
（6）系统权限：保存海报到相册（仅在您主动保存时）、从相册或相机选择图片用于反馈附图（仅在您主动上传时）。我们不会在未使用相应功能时申请上述权限。</p>
<p><strong>2. 信息用途</strong></p>
<p>用于身份验证、课程与活动服务、消息通知、学习统计、问题排查、内容安全审核，以及法律法规要求的其他用途。我们不会向无关第三方出售您的个人信息。</p>
<p><strong>3. 智能问答（AI）</strong></p>
<p>您在「智能问答」中提交的问题将用于生成回答；相关内容可能经已备案的第三方模型服务处理。AI 回答仅供参考，不构成正式通知或法律意见。请勿输入违法违规内容或过多个人敏感信息。</p>
<p><strong>4. 存储与安全</strong></p>
<p>信息存储于中华人民共和国境内服务器。反馈附图等文件存储于对象存储服务。我们采取合理的访问控制与安全措施。除法律要求、监管要求或取得您同意外，不向无关第三方提供可识别个人身份的信息。</p>
<p><strong>5. 您的权利</strong></p>
<p>您可在小程序中查询、更正个人资料，也可通过「意见反馈」申请更正或注销账号。我们将在核实身份后依法处理。</p>
<p><strong>6. 未成年人</strong></p>
<p>本服务主要面向校园学习与活动。如您为未成年人，请在监护人同意与指导下使用。</p>
<p><strong>7. 政策更新</strong></p>
<p>我们可能适时更新本政策，更新后通过本页面公布。如您继续使用本服务，视为同意更新后的政策。</p>
<p><strong>8. 联系我们</strong></p>
<p>如有疑问，请通过小程序「意见反馈」联系。运营主体：贵州云漫科技有限公司。</p>
<p>生效日期：2026-09-03</p>`,
  agreement: `<p><strong>云端书院小程序用户协议</strong></p>
<p>欢迎使用微信小程序「通途云」（产品界面名称「云端书院」）。本协议由贵州云漫科技有限公司（下称「我们」）与用户订立。平台内容由中华文化书院提供。使用本服务即表示您同意本协议。</p>
<p><strong>1. 服务内容</strong></p>
<p>本小程序提供动态、线上展馆、课程学习、资源下载、活动报名、文创展示、智能问答等功能，具体以实际上线模块为准。部分内容可能随运营需要调整、下架或维护。</p>
<p><strong>2. 账号与安全</strong></p>
<p>账号由管理员分配，您应妥善保管账号和密码，不得转借、出租或与他人共享。因保管不善导致的损失由您自行承担。首次登录如需修改初始密码，请按页面提示完成后再使用。</p>
<p><strong>3. 用户行为规范</strong></p>
<p>您不得利用本服务从事违法、侵权、干扰系统运行、传播违法违规信息或侵害他人合法权益的行为。我们有权对违规内容与账号采取限制、下线或终止服务等措施。</p>
<p><strong>4. 内容与知识产权</strong></p>
<p>小程序内课程、图文、音视频、展陈与文创等内容的知识产权归权利人所有，未经授权不得擅自传播、镜像或用于商业用途。您提交的反馈内容，您保证有权提交，并授权我们为处理问题之目的进行存储与展示。</p>
<p><strong>5. 智能问答声明</strong></p>
<p>AI 生成内容仅供参考，可能存在不准确之处；活动安排、报名结果、课程通知等重要事项以页面展示及管理员通知为准。</p>
<p><strong>6. 免责声明</strong></p>
<p>因网络、设备、第三方服务、不可抗力或您自身原因导致的服务中断、数据延迟或无法使用，我们在法律允许范围内不承担责任。展馆外链、关联应用等第三方页面由其提供方负责。</p>
<p><strong>7. 协议变更与终止</strong></p>
<p>我们可能更新本协议并在本页面公布。您可随时停止使用本服务。我们亦可在依法或依本协议的情形下中止或终止向您提供服务。</p>
<p><strong>8. 适用法律</strong></p>
<p>本协议适用中华人民共和国法律。因本协议产生的争议，由我们住所地有管辖权的人民法院管辖。</p>
<p>生效日期：2026-09-03</p>`
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
    privacy: hideAiChatLegalCopy(privacy),
    agreement: hideAiChatLegalCopy(agreement),
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
  if (doc.source === 'remote' || doc.source === 'baseline') return ''
  if (doc.source === 'cache') {
    return '当前显示上次成功获取的协议内容，可下拉刷新或点击重新加载以获取最新版本。'
  }
  return ''
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

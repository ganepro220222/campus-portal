package com.shuyuan.backend.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.MemberCreateRequest;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.mapper.MemberPurgeMapper;
import com.shuyuan.backend.util.FormatUtils;
import com.shuyuan.backend.util.StudentPasswordPolicy;
import com.shuyuan.backend.vo.MemberImportErrorRow;
import com.shuyuan.backend.vo.MemberImportResult;
import com.shuyuan.backend.vo.MemberImportRow;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 小程序师生账号：列表、Excel 导入、启用/禁用 */
@Service
@RequiredArgsConstructor
public class AdminMemberService {

    private static final int MAX_IMPORT_ROWS = 5000;
    private static final int MAX_ERROR_LINES = 50;

    static final String ANONYMIZED_NICKNAME = "已清退用户";
    static final String ANONYMIZED_REAL_NAME = "已清退";
    /** 清退占位 openid 前缀；与 StudentPasswordPolicy 的 "acct:" 区分开，便于识别与排查 */
    static final String ANONYMIZED_OPENID_PREFIX = "anon:";

    private final MemberMapper memberMapper;
    private final MemberAccountMapper memberAccountMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final MemberPurgeMapper memberPurgeMapper;
    private final DangerousActionGuard dangerousActionGuard;
    private final AdminPermissionService adminPermissionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public PageResult<Map<String, Object>> list(String keyword, Integer status, int page, int size) {
        adminPermissionService.require("admin:super");
        LambdaQueryWrapper<Member> qw = new LambdaQueryWrapper<Member>()
                .orderByDesc(Member::getCreateTime);
        if (status != null) {
            qw.eq(Member::getStatus, status);
        }
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim();
            List<Long> accountMemberIds = memberAccountMapper.selectList(
                            new LambdaQueryWrapper<MemberAccount>()
                                    .like(MemberAccount::getStudentNo, kw))
                    .stream().map(MemberAccount::getMemberId).toList();
            List<Long> profileMemberIds = memberProfileMapper.selectList(
                            new LambdaQueryWrapper<MemberProfile>()
                                    .like(MemberProfile::getRealName, kw))
                    .stream().map(MemberProfile::getMemberId).toList();
            qw.and(w -> w.like(Member::getNickname, kw)
                    .or().in(!accountMemberIds.isEmpty(), Member::getId, accountMemberIds)
                    .or().in(!profileMemberIds.isEmpty(), Member::getId, profileMemberIds));
        }
        Page<Member> p = memberMapper.selectPage(new Page<>(page, size), qw);
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    @Transactional
    public MemberImportResult importExcel(MultipartFile file) {
        adminPermissionService.require("admin:super");
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "请上传 Excel 文件");
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            throw new BusinessException(400, "仅支持 .xlsx / .xls 格式");
        }

        ImportAccumulator acc = new ImportAccumulator();
        List<Map<Integer, String>> rows;
        try {
            // 以「无模型 + 首行不作为表头」方式读取，避免 EasyExcel 把多别名当成多级表头；
            // 表头改由 HEADER_ALIAS 归一化匹配，兼容校方内部表的多种列名写法。
            rows = EasyExcel.read(file.getInputStream()).sheet().headRowNumber(0).doReadSync();
        } catch (Exception e) {
            throw new BusinessException(400, "读取 Excel 失败：" + e.getMessage());
        }
        if (rows == null || rows.isEmpty()) {
            throw new BusinessException(400, "Excel 内容为空，请下载导入模板参照填写");
        }

        // 第 1 行为表头：按别名归一化映射「列序号 -> 字段名」
        Map<Integer, String> colToField = new HashMap<>();
        rows.get(0).forEach((idx, header) -> {
            String field = MemberImportRow.HEADER_ALIAS.get(MemberImportRow.normalizeHeader(header));
            if (field != null) {
                colToField.put(idx, field);
            }
        });
        if (!colToField.containsValue("studentNo") || !colToField.containsValue("realName")) {
            throw new BusinessException(400, "表头缺少「学号」或「姓名」列，请下载导入模板参照填写");
        }

        for (int i = 1; i < rows.size(); i++) {
            Map<Integer, String> raw = rows.get(i);
            if (raw == null || raw.values().stream().allMatch(v -> v == null || v.isBlank())) {
                continue; // 跳过整行空白
            }
            acc.totalRows++;
            if (acc.totalRows > MAX_IMPORT_ROWS) {
                throw new BusinessException(400, "单次导入不得超过 " + MAX_IMPORT_ROWS + " 行");
            }
            MemberImportRow row = new MemberImportRow();
            raw.forEach((idx, val) -> {
                String field = colToField.get(idx);
                if (field == null || val == null) {
                    return;
                }
                String v = val.trim();
                switch (field) {
                    case "studentNo" -> row.setStudentNo(v);
                    case "realName" -> row.setRealName(v);
                    case "college" -> row.setCollege(v);
                    case "grade" -> row.setGrade(v);
                    case "phone" -> row.setPhone(v);
                    case "idCard" -> row.setIdCard(v);
                    default -> { }
                }
            });
            processRow(row, i + 1, acc);
        }

        return MemberImportResult.builder()
                .totalRows(acc.totalRows)
                .successCount(acc.successCount)
                .skippedCount(acc.skippedCount)
                .failedCount(acc.failedCount)
                .errors(acc.errors)
                .errorRows(acc.errorRows)
                .build();
    }

    public void writeImportErrorReport(List<MemberImportErrorRow> rows, HttpServletResponse response) throws IOException {
        adminPermissionService.require("admin:super");
        if (rows == null || rows.isEmpty()) {
            throw new BusinessException(400, "没有可导出的失败记录");
        }
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String fileName = URLEncoder.encode("师生导入失败明细.xlsx", StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + fileName);
        EasyExcel.write(response.getOutputStream(), MemberImportErrorRow.class)
                .sheet("失败明细")
                .doWrite(rows);
    }

    public void writeImportTemplate(HttpServletResponse response) throws IOException {
        adminPermissionService.require("admin:super");
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String fileName = URLEncoder.encode("师生导入模板.xlsx", StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + fileName);
        // 单行标准表头 + 一行示例数据（此前用多别名 @ExcelProperty 会被 EasyExcel 当成多级表头，
        // 导致模板出现 7 行叠加表头且导入自动把前 6 行数据当表头吞掉）
        List<List<String>> head = new ArrayList<>();
        for (String h : MemberImportRow.TEMPLATE_HEADERS) {
            head.add(List.of(h));
        }
        List<List<String>> sample = List.of(
                List.of("2024001", "示例学生", "示例学院", "2024", "13800000000", "520101200001011234"));
        EasyExcel.write(response.getOutputStream())
                .head(head)
                .sheet("师生账号")
                .doWrite(sample);
    }

    @Transactional
    public Map<String, Object> updateStatus(Long memberId, int status) {
        adminPermissionService.require("admin:super");
        if (status != 0 && status != 1) {
            throw new BusinessException(400, "状态值无效");
        }
        Member member = requireMember(memberId);
        member.setStatus(status);
        memberMapper.updateById(member);
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, memberId)
                .last("LIMIT 1"));
        if (account != null) {
            account.setStatus(status);
            memberAccountMapper.updateById(account);
        }
        return toVo(memberMapper.selectById(memberId));
    }

    /**
     * 清退（匿名化）：脱敏账号 PII 并禁用登录，但保留 member / 各业务外键行，
     * 以维护报名、积分、浏览等历史统计的完整性——不做物理删除。
     *
     * <p>置空一律走 LambdaUpdateWrapper。MyBatis-Plus 的 updateStrategy 默认 NOT_NULL，
     * {@code setXxx(null)} + updateById 根本不会把该列写进 SET 子句，学号和手机号会原样留在库里。
     *
     * <p>openid 不能置空（NOT NULL + uk_openid），但导入账号的 openid 是 {@code acct:<学号>}，
     * 本身就带身份信息，且不换掉的话同一学号重新导入会撞唯一键。这里换成与学号无关的匿名值。
     */
    @Transactional
    public Map<String, Object> anonymize(Long memberId) {
        adminPermissionService.require("admin:super");
        Member member = requireMember(memberId);

        // 主账号脱敏 + 禁用 + 递增 tokenVersion 使旧 JWT 立即失效
        memberMapper.update(null, new LambdaUpdateWrapper<Member>()
                .eq(Member::getId, memberId)
                .set(Member::getOpenid, anonymizedOpenid(memberId))
                .set(Member::getNickname, ANONYMIZED_NICKNAME)
                .set(Member::getAvatar, null)
                .set(Member::getStatus, 0)
                .set(Member::getTokenVersion,
                        (member.getTokenVersion() == null ? 0 : member.getTokenVersion()) + 1));

        // 登录账号：清空学号 / 用户名（释放学号可再次导入），随机化密码彻底锁定
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, memberId)
                .last("LIMIT 1"));
        if (account != null) {
            memberAccountMapper.update(null, new LambdaUpdateWrapper<MemberAccount>()
                    .eq(MemberAccount::getId, account.getId())
                    .set(MemberAccount::getStudentNo, null)
                    .set(MemberAccount::getUsername, null)
                    .set(MemberAccount::getPasswordHash,
                            passwordEncoder.encode(UUID.randomUUID().toString()))
                    .set(MemberAccount::getStatus, 0)
                    .set(MemberAccount::getMustChangePassword, 0));
        }

        // 资料表：脱敏姓名 / 手机号，保留学院、年级等非直接身份字段用于聚合统计
        MemberProfile profile = memberProfileMapper.selectById(memberId);
        if (profile != null) {
            memberProfileMapper.update(null, new LambdaUpdateWrapper<MemberProfile>()
                    .eq(MemberProfile::getMemberId, memberId)
                    .set(MemberProfile::getRealName, ANONYMIZED_REAL_NAME)
                    .set(MemberProfile::getPhone, null));
        }

        return toVo(memberMapper.selectById(memberId));
    }

    /**
     * 删除前的影响预览：这个账号留下过什么、能不能真删掉。
     *
     * <p>老师可能会辞职、学生可能会转学，导错的账号更是天天有。
     * 分两种情况，不存在「只能一直挂着」：
     * <ul>
     *   <li>没留下任何业务记录（导错的、测试的、演示的）→ 可以物理删除，从库里彻底消失</li>
     *   <li>留下过报名 / 积分 / 学习 / 反馈 / 徽章 → 只能清退：明细要留着支撑历史统计，
     *       但姓名、学号、手机号会被抹掉，账号也无法再登录</li>
     * </ul>
     */
    public Map<String, Object> deleteImpact(Long memberId) {
        adminPermissionService.require("admin:super");
        Member member = requireMember(memberId);

        List<Map<String, Object>> refs = collectBlockingRecords(memberId);

        boolean anonymized = isAnonymizedOpenid(member.getOpenid());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", memberId);
        m.put("name", displayName(member, memberId));
        m.put("anonymized", anonymized);
        m.put("references", refs);
        m.put("canDelete", refs.isEmpty());
        m.put("requiresPassword", refs.isEmpty());
        m.put("canAnonymize", !anonymized);
        return m;
    }

    /**
     * 物理删除师生账号：连同其私有痕迹一起从库里抹掉。
     *
     * <p>只对「没留下业务记录」的账号开放——有报名 / 积分 / 学习 / 反馈 / 徽章的必须走清退，
     * 否则统计里会出现指向不存在用户的行。
     *
     * <p>要求重输管理员密码：这个动作不可撤销，且回收站接不住它
     * （member 的软删除位一被置起，学号仍占着 uk_student_no，等于卡死）。
     */
    @Transactional
    public void delete(Long memberId, String password) {
        adminPermissionService.require("admin:super");
        Member member = requireMember(memberId);

        List<Map<String, Object>> refs = collectBlockingRecords(memberId);
        if (!refs.isEmpty()) {
            String detail = refs.stream()
                    .map(r -> r.get("label") + " " + r.get("count") + " 条")
                    .reduce((a, b) -> a + "、" + b)
                    .orElse("");
            throw new BusinessException(400, "「" + displayName(member, memberId) + "」已留下 " + detail
                    + "，删除会让历史统计对不上。请改用「清退」：姓名、学号、手机号会被抹掉且无法再登录，"
                    + "但这些记录会保留。");
        }

        dangerousActionGuard.verifyCurrentAdminPassword(password);

        // 先子后父：ai_message 只认 session_id，父会话没了就再也定位不到
        memberPurgeMapper.purgeAiMessages(memberId);
        memberPurgeMapper.purgeAiSessions(memberId);
        memberPurgeMapper.purgeFavorite(memberId);
        memberPurgeMapper.purgeLike(memberId);
        memberPurgeMapper.purgeDownload(memberId);
        memberPurgeMapper.purgeMessage(memberId);
        memberPurgeMapper.purgeShareRecord(memberId);
        memberPurgeMapper.purgeSubscribeRecord(memberId);
        memberPurgeMapper.purgeSubscribeOutbox(memberId);
        // 账号都不存在了，指向它的行为日志既不是证据也无处可查；
        // 且能走到这一步的账号按定义没有业务记录，聚合快照不受影响
        memberPurgeMapper.purgeEventLog(memberId);

        memberPurgeMapper.purgeAccount(memberId);
        memberPurgeMapper.purgeProfile(memberId);
        int n = memberPurgeMapper.purgeMember(memberId);
        if (n == 0) {
            throw new BusinessException(404, "账号不存在或已被删除");
        }
    }

    /**
     * 汇总阻断物理删除的业务记录。
     *
     * <p>预览与真删必须用同一份判定：两处各写一遍迟早会漂移，
     * 那时界面说「可以删」、点下去却被拒，比不给删更让人火大。
     */
    private List<Map<String, Object>> collectBlockingRecords(Long memberId) {
        List<Map<String, Object>> refs = new ArrayList<>();
        addRef(refs, "报名记录", memberPurgeMapper.countEnroll(memberId));
        addRef(refs, "积分记录", memberPurgeMapper.countPointRecord(memberId));
        addRef(refs, "学习记录", memberPurgeMapper.countCourseProgress(memberId));
        addRef(refs, "反馈", memberPurgeMapper.countFeedback(memberId));
        addRef(refs, "获得的徽章", memberPurgeMapper.countBadge(memberId));
        return refs;
    }

    private static void addRef(List<Map<String, Object>> refs, String label, long count) {
        if (count > 0) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", label);
            m.put("count", count);
            refs.add(m);
        }
    }

    private String displayName(Member member, Long memberId) {
        MemberProfile profile = memberProfileMapper.selectById(memberId);
        if (profile != null && profile.getRealName() != null && !profile.getRealName().isBlank()) {
            return profile.getRealName();
        }
        return member.getNickname() != null && !member.getNickname().isBlank()
                ? member.getNickname() : ("账号 " + memberId);
    }

    /** 清退后的占位 openid：只含 member 主键，不含学号，且天然唯一。 */
    static String anonymizedOpenid(Long memberId) {
        return ANONYMIZED_OPENID_PREFIX + memberId;
    }

    /** 该 openid 是否属于已清退账号。 */
    public static boolean isAnonymizedOpenid(String openid) {
        return openid != null && openid.startsWith(ANONYMIZED_OPENID_PREFIX);
    }

    /**
     * 后台单个新增师生账号。
     *
     * <p>只有一两个人要建号时，「下载模板→填→上传」这一圈太重了。这里和 Excel 导入
     * 共用同一段建号逻辑（{@link #insertMemberAccount}），初始密码规则、占位 openid、
     * 首登改密标记完全一致，不会出现两条路建出来的账号行为不同。
     */
    @Transactional
    public Map<String, Object> create(MemberCreateRequest req) {
        adminPermissionService.require("admin:super");
        if (req == null) {
            throw new BusinessException(400, "请填写账号信息");
        }
        String studentNo = trim(req.getStudentNo());
        String realName = trim(req.getRealName());
        if (studentNo == null || studentNo.isBlank()) {
            throw new BusinessException(400, "学号不能为空");
        }
        if (realName == null || realName.isBlank()) {
            throw new BusinessException(400, "姓名不能为空");
        }
        if (studentNoTaken(studentNo)) {
            throw new BusinessException(400, "学号 " + studentNo + " 已存在");
        }
        Long memberId = insertMemberAccount(studentNo, realName, trim(req.getIdCard()),
                trim(req.getCollege()), trim(req.getGrade()), trim(req.getPhone()));
        return toVo(memberMapper.selectById(memberId));
    }

    private boolean studentNoTaken(String studentNo) {
        Long exists = memberAccountMapper.selectCount(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getStudentNo, studentNo));
        return exists != null && exists > 0;
    }

    /**
     * 建号三件套：member / member_account / member_profile。
     *
     * @return 新建的 memberId
     * @throws BusinessException 初始密码算不出来（学号过短且无身份证）
     */
    private Long insertMemberAccount(String studentNo, String realName, String idCard,
                                     String college, String grade, String phone) {
        String plainPassword = StudentPasswordPolicy.resolveInitialPassword(studentNo, idCard);

        Member member = new Member();
        member.setOpenid(StudentPasswordPolicy.placeholderOpenid(studentNo));
        member.setNickname(realName);
        member.setPoints(0);
        member.setStatus(1);
        memberMapper.insert(member);

        MemberAccount account = new MemberAccount();
        account.setMemberId(member.getId());
        account.setStudentNo(studentNo);
        account.setUsername(studentNo);
        account.setPasswordHash(passwordEncoder.encode(plainPassword));
        account.setStatus(1);
        account.setMustChangePassword(1);
        memberAccountMapper.insert(account);

        MemberProfile profile = new MemberProfile();
        profile.setMemberId(member.getId());
        profile.setRealName(realName);
        profile.setCollege(college);
        profile.setGrade(grade);
        profile.setPhone(phone);
        memberProfileMapper.insert(profile);

        return member.getId();
    }

    private void processRow(MemberImportRow row, int rowNum, ImportAccumulator acc) {
        String studentNo = trim(row.getStudentNo());
        String realName = trim(row.getRealName());
        if (studentNo == null || studentNo.isBlank()) {
            acc.fail(rowNum, row, "学号不能为空");
            return;
        }
        if (realName == null || realName.isBlank()) {
            acc.fail(rowNum, row, "姓名不能为空");
            return;
        }
        if (studentNoTaken(studentNo)) {
            acc.skip();
            return;
        }
        try {
            insertMemberAccount(studentNo, realName, row.getIdCard(),
                    trim(row.getCollege()), trim(row.getGrade()), trim(row.getPhone()));
            acc.success();
        } catch (BusinessException e) {
            acc.fail(rowNum, row, e.getMessage());
        } catch (Exception e) {
            acc.fail(rowNum, row, "写入失败");
        }
    }

    private Map<String, Object> toVo(Member member) {
        MemberAccount account = memberAccountMapper.selectOne(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getMemberId, member.getId())
                .last("LIMIT 1"));
        MemberProfile profile = memberProfileMapper.selectById(member.getId());
        Map<String, Object> m = new HashMap<>();
        m.put("id", member.getId());
        m.put("studentNo", account != null && account.getStudentNo() != null ? account.getStudentNo() : "");
        m.put("realName", profile != null ? profile.getRealName() : member.getNickname());
        m.put("college", profile != null ? profile.getCollege() : "");
        m.put("grade", profile != null ? profile.getGrade() : "");
        m.put("phone", profile != null && profile.getPhone() != null ? profile.getPhone() : "");
        m.put("points", member.getPoints() != null ? member.getPoints() : 0);
        m.put("status", member.getStatus());
        m.put("anonymized", isAnonymizedOpenid(member.getOpenid()));
        // 清退后 openid 换成了 anon:<id>，既不是占位 openid 也不是真实微信 openid，
        // 不排除的话会被当成「已绑定微信」显示
        m.put("wxBound", account != null
                && !isAnonymizedOpenid(member.getOpenid())
                && !StudentPasswordPolicy.isPlaceholderOpenid(member.getOpenid()));
        m.put("createTime", FormatUtils.formatDateTime(member.getCreateTime()));
        return m;
    }

    private Member requireMember(Long id) {
        Member member = memberMapper.selectById(id);
        if (member == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return member;
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private static final class ImportAccumulator {
        int totalRows;
        int successCount;
        int skippedCount;
        int failedCount;
        final List<String> errors = new ArrayList<>();
        final List<MemberImportErrorRow> errorRows = new ArrayList<>();

        void success() {
            successCount++;
        }

        void skip() {
            skippedCount++;
        }

        void fail(int rowNum, MemberImportRow row, String message) {
            failedCount++;
            if (errors.size() < MAX_ERROR_LINES) {
                errors.add("第" + rowNum + "行：" + message);
                MemberImportErrorRow err = new MemberImportErrorRow();
                err.setRowNum(rowNum);
                err.setStudentNo(trim(row.getStudentNo()));
                err.setRealName(trim(row.getRealName()));
                err.setReason(message);
                errorRows.add(err);
            }
        }
    }
}

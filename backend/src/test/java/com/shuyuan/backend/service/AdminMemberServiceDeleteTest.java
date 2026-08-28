package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.dto.MemberCreateRequest;
import com.shuyuan.backend.dto.MemberResetPasswordRequest;
import com.shuyuan.backend.util.MemberPasswordPolicy;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.mapper.MemberPurgeMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 师生账号的「单个新增」与「有条件物理删除」。
 *
 * <p>老师会辞职、学生会转学、账号会导错——原来后台只有清退一条路，一条数据永远躺在库里。
 * 现在分两种情况：没留下业务记录的可以真删；留下过记录的只能清退，但会说清为什么。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminMemberServiceDeleteTest {

    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;
    @Mock
    private MemberProfileMapper memberProfileMapper;
    @Mock
    private MemberPurgeMapper memberPurgeMapper;
    @Mock
    private DangerousActionGuard dangerousActionGuard;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private MemberRowImportService memberRowImportService;

    @InjectMocks
    private AdminMemberService adminMemberService;

    /** 重置密码走 LambdaUpdateWrapper，需要 MyBatis-Plus 的实体元数据缓存 */
    @org.junit.jupiter.api.BeforeAll
    static void initMybatisPlusEntityCache() {
        UpdateWrapperAssertions.initEntityCache(Member.class, MemberAccount.class, MemberProfile.class);
    }

    private Member existingMember(long id) {
        Member m = new Member();
        m.setId(id);
        m.setOpenid("acct:2024001");
        m.setNickname("张三");
        m.setStatus(1);
        when(memberMapper.selectById(id)).thenReturn(m);
        MemberProfile p = new MemberProfile();
        p.setMemberId(id);
        p.setRealName("张三");
        when(memberProfileMapper.selectById(id)).thenReturn(p);
        return m;
    }

    // ---------- 影响预览 ----------

    @Test
    void 没留下记录的账号可以真删() {
        existingMember(5L);

        Map<String, Object> impact = adminMemberService.deleteImpact(5L);

        assertEquals(Boolean.TRUE, impact.get("canDelete"));
        assertEquals(Boolean.TRUE, impact.get("requiresPassword"));
        assertTrue(((List<?>) impact.get("references")).isEmpty());
        assertEquals("张三", impact.get("name"));
    }

    @Test
    void 有报名和积分的账号只能清退() {
        existingMember(6L);
        when(memberPurgeMapper.countEnroll(6L)).thenReturn(3L);
        when(memberPurgeMapper.countPointRecord(6L)).thenReturn(12L);

        Map<String, Object> impact = adminMemberService.deleteImpact(6L);

        assertEquals(Boolean.FALSE, impact.get("canDelete"));
        List<?> refs = (List<?>) impact.get("references");
        assertEquals(2, refs.size());
        assertEquals("报名记录", ((Map<?, ?>) refs.get(0)).get("label"));
        assertEquals(3L, ((Map<?, ?>) refs.get(0)).get("count"));
    }

    @Test
    void 已清退账号不再提供清退入口() {
        Member m = existingMember(7L);
        m.setOpenid(AdminMemberService.anonymizedOpenid(7L));

        Map<String, Object> impact = adminMemberService.deleteImpact(7L);

        assertEquals(Boolean.TRUE, impact.get("anonymized"));
        assertEquals(Boolean.FALSE, impact.get("canAnonymize"));
    }

    // ---------- 物理删除 ----------

    @Test
    void 有业务记录时拒绝物理删除并指向清退() {
        existingMember(8L);
        when(memberPurgeMapper.countCourseProgress(8L)).thenReturn(4L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.delete(8L, "pwd"));

        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("学习记录 4 条"), ex.getMessage());
        assertTrue(ex.getMessage().contains("清退"), ex.getMessage());
        verify(memberPurgeMapper, never()).purgeMember(anyLong());
        // 拒绝的分支不该先把密码收走
        verify(dangerousActionGuard, never()).verifyCurrentAdminPassword(any());
    }

    @Test
    void 干净账号物理删除会清空全部私有痕迹() {
        existingMember(9L);
        when(memberPurgeMapper.purgeMember(9L)).thenReturn(1);

        adminMemberService.delete(9L, "correct-horse");

        verify(dangerousActionGuard).verifyCurrentAdminPassword("correct-horse");
        // 先子后父：ai_message 只认 session_id，父会话先没了就再也定位不到
        var order = org.mockito.Mockito.inOrder(memberPurgeMapper);
        order.verify(memberPurgeMapper).purgeAiMessages(9L);
        order.verify(memberPurgeMapper).purgeAiSessions(9L);

        verify(memberPurgeMapper).purgeFavorite(9L);
        verify(memberPurgeMapper).purgeLike(9L);
        verify(memberPurgeMapper).purgeDownload(9L);
        verify(memberPurgeMapper).purgeMessage(9L);
        verify(memberPurgeMapper).purgeShareRecord(9L);
        verify(memberPurgeMapper).purgeSubscribeRecord(9L);
        verify(memberPurgeMapper).purgeSubscribeOutbox(9L);
        verify(memberPurgeMapper).purgeEventLog(9L);
        verify(memberPurgeMapper).purgeAccount(9L);
        verify(memberPurgeMapper).purgeProfile(9L);
        verify(memberPurgeMapper).purgeMember(9L);
    }

    @Test
    void 密码不对时一行都不删() {
        existingMember(10L);
        doThrow(new BusinessException(400, "管理员密码不正确"))
                .when(dangerousActionGuard).verifyCurrentAdminPassword(any());

        assertThrows(BusinessException.class, () -> adminMemberService.delete(10L, "wrong"));

        verify(memberPurgeMapper, never()).purgeMember(anyLong());
        verify(memberPurgeMapper, never()).purgeAccount(anyLong());
        verify(memberPurgeMapper, never()).purgeEventLog(anyLong());
    }

    // ---------- 重置密码 ----------

    private MemberAccount accountOf(long memberId, String studentNo) {
        MemberAccount account = new MemberAccount();
        account.setId(memberId * 10);
        account.setMemberId(memberId);
        account.setStudentNo(studentNo);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
        return account;
    }

    /**
     * 学生忘记密码后，此前只能连数据库改 password_hash——后台没有入口，小程序也没有自助找回。
     */
    @Test
    void 重置密码返回一次性明文并强制下次改密() {
        Member m = existingMember(20L);
        m.setTokenVersion(4);
        accountOf(20L, "2024001");

        Map<String, Object> vo = adminMemberService.resetPassword(20L, null);

        String plain = (String) vo.get("temporaryPassword");
        assertEquals(Boolean.TRUE, vo.get("generated"));
        assertEquals("2024001", vo.get("studentNo"));
        assertNotNull(plain);
        // 生成的临时密码本身必须过得了师生密码策略，否则学生下次改密时无从对照
        MemberPasswordPolicy.validate(plain);
        // 电话口述用，剔除易混字符
        assertFalse(plain.matches(".*[0O1lI].*"), "临时密码不应包含易混字符：" + plain);

        ArgumentCaptor<LambdaUpdateWrapper<MemberAccount>> accountCap = UpdateWrapperAssertions.updateCaptor();
        verify(memberAccountMapper).update(isNull(), accountCap.capture());
        UpdateWrapperAssertions.assertSetsColumn(accountCap.getValue(), "must_change_password", 1);
        UpdateWrapperAssertions.assertSetsNonNullColumn(accountCap.getValue(), "password_hash");

        // 旧登录态必须立即失效，否则「重置密码」挡不住已经登进去的人
        ArgumentCaptor<LambdaUpdateWrapper<Member>> memberCap = UpdateWrapperAssertions.updateCaptor();
        verify(memberMapper).update(isNull(), memberCap.capture());
        UpdateWrapperAssertions.assertSetsColumn(memberCap.getValue(), "token_version", 5);
    }

    @Test
    void 重置密码可指定但要满足师生密码策略() {
        existingMember(21L);
        accountOf(21L, "2024002");

        MemberResetPasswordRequest ok = new MemberResetPasswordRequest();
        ok.setNewPassword("shuyuan2026");
        Map<String, Object> vo = adminMemberService.resetPassword(21L, ok);
        assertEquals("shuyuan2026", vo.get("temporaryPassword"));
        assertEquals(Boolean.FALSE, vo.get("generated"));

        MemberResetPasswordRequest tooWeak = new MemberResetPasswordRequest();
        tooWeak.setNewPassword("123456");
        assertEquals(400,
                assertThrows(BusinessException.class,
                        () -> adminMemberService.resetPassword(21L, tooWeak)).getCode());
    }

    @Test
    void 已清退账号不能重置密码() {
        Member m = existingMember(22L);
        m.setOpenid(AdminMemberService.anonymizedOpenid(22L));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.resetPassword(22L, null));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("已清退"), ex.getMessage());
        verify(memberAccountMapper, never()).update(any(), any());
    }

    @Test
    void 没有学号账号时拒绝重置() {
        existingMember(23L);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.resetPassword(23L, null));
        assertEquals(400, ex.getCode());
        verify(memberMapper, never()).update(any(), any());
    }

    @Test
    void 每次重置的临时密码都不同() {
        existingMember(24L);
        accountOf(24L, "2024003");

        String a = (String) adminMemberService.resetPassword(24L, null).get("temporaryPassword");
        String b = (String) adminMemberService.resetPassword(24L, null).get("temporaryPassword");
        assertTrue(!a.equals(b), "临时密码必须是随机的，不能可预测");
    }

    // ---------- 单个新增 ----------

    @Test
    void 单个新增建齐账号三件套且与导入同规则() {
        when(memberAccountMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(memberRowImportService.insertSingle(
                org.mockito.ArgumentMatchers.eq("2024099"),
                org.mockito.ArgumentMatchers.eq("李四"),
                org.mockito.ArgumentMatchers.eq("110101200001011234"),
                org.mockito.ArgumentMatchers.eq("文学院"),
                org.mockito.ArgumentMatchers.eq("2024"),
                org.mockito.ArgumentMatchers.eq("13900000000"))).thenReturn(77L);
        Member saved = new Member();
        saved.setId(77L);
        saved.setOpenid("acct:2024099");
        saved.setNickname("李四");
        when(memberMapper.selectById(77L)).thenReturn(saved);

        MemberCreateRequest req = new MemberCreateRequest();
        req.setStudentNo("2024099");
        req.setRealName("李四");
        req.setCollege("文学院");
        req.setGrade("2024");
        req.setPhone("13900000000");
        req.setIdCard("110101200001011234");

        adminMemberService.create(req);

        verify(memberRowImportService).insertSingle(
                "2024099", "李四", "110101200001011234", "文学院", "2024", "13900000000");
    }

    @Test
    void 单个新增拒绝重复学号() {
        when(memberAccountMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

        MemberCreateRequest req = new MemberCreateRequest();
        req.setStudentNo("2024001");
        req.setRealName("张三");

        BusinessException ex = assertThrows(BusinessException.class, () -> adminMemberService.create(req));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("2024001"), ex.getMessage());
        verify(memberMapper, never()).insert(any(Member.class));
    }

    @Test
    void 单个新增校验必填项() {
        MemberCreateRequest noNo = new MemberCreateRequest();
        noNo.setRealName("张三");
        assertEquals("学号不能为空",
                assertThrows(BusinessException.class, () -> adminMemberService.create(noNo)).getMessage());

        MemberCreateRequest noName = new MemberCreateRequest();
        noName.setStudentNo("2024001");
        assertEquals("姓名不能为空",
                assertThrows(BusinessException.class, () -> adminMemberService.create(noName)).getMessage());
    }
}

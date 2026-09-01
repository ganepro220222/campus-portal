package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.util.StudentPasswordPolicy;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Map;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 管理员解绑微信。
 *
 * <p>补的是一个已经被承诺过的能力：内置知识库《登录与账号》写着「联系管理员解绑」，
 * 而那份知识库是 AI 助手答学生问题的检索源——在此之前后台根本没有这个入口。
 *
 * <p>这些用例盯的是三件容易出事的地方：
 * <ul>
 *   <li>解绑后必须让 {@link StudentPasswordPolicy#isPlaceholderOpenid} 重新为真，
 *       否则 AuthService 两条绑定路径仍然认为「已绑定其他微信」，等于没解；</li>
 *   <li>必须递增 tokenVersion，否则被解绑那台手机上的旧 JWT 还能继续用，
 *       而「微信号被盗」正是这个功能的主要场景；</li>
 *   <li>不许顺手改 status —— 解绑不是禁用，学号密码要照常能登。</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminMemberServiceUnbindWechatTest {

    @BeforeAll
    static void initMybatisPlusEntityCache() {
        initEntityCache(Member.class, MemberAccount.class, MemberProfile.class);
    }

    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;
    @Mock
    private MemberProfileMapper memberProfileMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private MemberRowImportService memberRowImportService;

    @InjectMocks
    private AdminMemberService adminMemberService;

    private static Member member(long id, String openid) {
        Member m = new Member();
        m.setId(id);
        m.setOpenid(openid);
        m.setStatus(1);
        m.setTokenVersion(3);
        return m;
    }

    private void givenAccount(long memberId, String studentNo) {
        MemberAccount account = new MemberAccount();
        account.setId(31L);
        account.setMemberId(memberId);
        account.setStudentNo(studentNo);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);
    }

    @Test
    void 解绑把openid还原成占位值并递增tokenVersion() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(memberMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        Map<String, Object> vo = adminMemberService.unbindWechat(7L);

        var captor = UpdateWrapperAssertions.<Member>updateCaptor();
        verify(memberMapper).update(isNull(), captor.capture());
        LambdaUpdateWrapper<Member> wrapper = captor.getValue();

        assertSetsColumn(wrapper, "openid", "acct:2024001");
        assertTrue(StudentPasswordPolicy.isPlaceholderOpenid("acct:2024001"),
                "还原出来的值必须能被 isPlaceholderOpenid 认成未绑定，否则等于没解绑");
        // 3 -> 4：被解绑那台手机上的旧 JWT 立刻失效
        assertSetsColumn(wrapper, "token_version", 4);

        assertEquals("2024001", vo.get("studentNo"));
        assertEquals(false, vo.get("wxBound"));
    }

    /** 解绑不是禁用：学号密码必须照常能登，绝不能顺手把 status 改掉 */
    @Test
    void 解绑不改status也不动密码() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(memberMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        adminMemberService.unbindWechat(7L);

        var captor = UpdateWrapperAssertions.<Member>updateCaptor();
        verify(memberMapper).update(isNull(), captor.capture());
        UpdateWrapperAssertions.assertDoesNotSetColumn(captor.getValue(), "status");
        // 密码在 member_account 上；解绑一次都不该去写那张表
        verify(memberAccountMapper, never()).update(any(), any());
        verify(memberAccountMapper, never()).updateById(any(MemberAccount.class));
    }

    /** tokenVersion 为 NULL 的老数据不能算成 NULL+1 */
    @Test
    void tokenVersion为空时按0递增() {
        Member m = member(7L, "oWxRealOpenid123");
        m.setTokenVersion(null);
        when(memberMapper.selectById(7L)).thenReturn(m);
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(memberMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        adminMemberService.unbindWechat(7L);

        var captor = UpdateWrapperAssertions.<Member>updateCaptor();
        verify(memberMapper).update(isNull(), captor.capture());
        assertSetsColumn(captor.getValue(), "token_version", 1);
    }

    /** 本来就没绑：不做成幂等成功，否则白跑一次会把本人的学号登录态踢掉 */
    @Test
    void 未绑定时拒绝且不写库() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "acct:2024001"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("未绑定"));
        verify(memberMapper, never()).update(any(), any());
    }

    @Test
    void 已清退账号拒绝解绑() {
        when(memberMapper.selectById(7L))
                .thenReturn(member(7L, AdminMemberService.anonymizedOpenid(7L)));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(400, ex.getCode());
        verify(memberMapper, never()).update(any(), any());
    }

    /** openid 是 NOT NULL，占位值又必须由学号构造；没有学号就没有能还原的目标值 */
    @Test
    void 没有学号账号时拒绝解绑() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("学号"));
        verify(memberMapper, never()).update(any(), any());
    }

    @Test
    void 学号为空白时拒绝解绑() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "   ");

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(400, ex.getCode());
        verify(memberMapper, never()).update(any(), any());
    }

    /** 占位 openid 被别人占着：提前给一句能照着查的话，而不是让 uk_openid 抛 500 */
    @Test
    void 占位openid被他人占用时给可读报错() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(member(99L, "acct:2024001"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("2024001"));
        verify(memberMapper, never()).update(any(), any());
    }

    /** 同一行占位 openid（理论上不该出现）不算冲突，允许继续 */
    @Test
    void 占位openid就是自己时不算冲突() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(member(7L, "acct:2024001"));
        when(memberMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        assertFalse((Boolean) adminMemberService.unbindWechat(7L).get("wxBound"));
    }

    /**
     * WHERE 必须带上原 openid。
     *
     * <p>少了这个条件，「影响 0 行」这件事根本不会发生：两个管理员同时点、
     * 或本人正好在这一刻绑了别的微信时，后到的那次会把刚绑好的新微信又解掉。
     * 只断言 409 拦不住这种改动——把条件删了，mock 照样返回 1，测试照样绿。
     */
    @Test
    void update条件必须带原openid才不会解掉刚绑的新微信() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(memberMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        adminMemberService.unbindWechat(7L);

        var captor = UpdateWrapperAssertions.<Member>updateCaptor();
        verify(memberMapper).update(isNull(), captor.capture());
        LambdaUpdateWrapper<Member> wrapper = captor.getValue();

        assertTrue(wrapper.getSqlSegment().contains("openid"),
                "WHERE 子句里必须有 openid 条件，实际：" + wrapper.getSqlSegment());
        // SET 绑的是占位值 acct:2024001；原 openid 只可能来自 WHERE
        assertTrue(wrapper.getParamNameValuePairs().containsValue("oWxRealOpenid123"),
                "WHERE 必须绑定解绑前的 openid，实际绑定：" + wrapper.getParamNameValuePairs().values());
    }

    /**
     * 并发：两个管理员同时点，或本人正好在这一刻绑了别的微信。
     * update 带着原 openid 做条件，后到的那次只会影响 0 行——必须报冲突，
     * 不能静默当成功，否则管理员以为解了、实际没解。
     */
    @Test
    void 绑定状态被并发改动时报冲突() {
        when(memberMapper.selectById(7L)).thenReturn(member(7L, "oWxRealOpenid123"));
        givenAccount(7L, "2024001");
        when(memberMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(memberMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(0);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(409, ex.getCode());
    }

    @Test
    void 用户不存在时404() {
        when(memberMapper.selectById(7L)).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.unbindWechat(7L));
        assertEquals(404, ex.getCode());
    }

    /** 权限：与师生管理其余操作一致，必须是超管 */
    @Test
    void 需要超管权限() {
        doThrowOnRequire();
        assertThrows(BusinessException.class, () -> adminMemberService.unbindWechat(7L));
        verify(adminPermissionService).require("admin:super");
        verify(memberMapper, never()).update(any(), any());
    }

    private void doThrowOnRequire() {
        org.mockito.Mockito.doThrow(new BusinessException(403, "无权限"))
                .when(adminPermissionService).require("admin:super");
    }
}

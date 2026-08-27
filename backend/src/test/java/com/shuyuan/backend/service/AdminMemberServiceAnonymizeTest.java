package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static com.shuyuan.backend.service.UpdateWrapperAssertions.assertSetsColumn;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.initEntityCache;
import static com.shuyuan.backend.service.UpdateWrapperAssertions.updateCaptor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 清退（anonymize）必须真的把 PII 写成 NULL。
 *
 * <p>原实现走 {@code setXxx(null)} + updateById，学号和手机号从来没被清掉过：
 * 后台列表里照样显示，确认弹窗上「将脱敏姓名、学号、手机号」是一句做不到的承诺；
 * 而且学号还占着 uk_student_no，同一个学号再也导不进来。
 */
@ExtendWith(MockitoExtension.class)
class AdminMemberServiceAnonymizeTest {

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
        m.setNickname("张三");
        m.setAvatar("https://cdn/a.png");
        m.setStatus(1);
        m.setTokenVersion(2);
        return m;
    }

    @Test
    void 清退把学号用户名头像手机号真的写成NULL() {
        Member before = member(7L, "acct:2024001");
        Member after = member(7L, AdminMemberService.anonymizedOpenid(7L));
        after.setNickname(AdminMemberService.ANONYMIZED_NICKNAME);
        after.setAvatar(null);
        after.setStatus(0);
        when(memberMapper.selectById(7L)).thenReturn(before, after);

        MemberAccount account = new MemberAccount();
        account.setId(31L);
        account.setMemberId(7L);
        account.setStudentNo("2024001");
        account.setUsername("2024001");
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(account, (MemberAccount) null);

        MemberProfile profile = new MemberProfile();
        profile.setMemberId(7L);
        profile.setRealName("张三");
        profile.setPhone("13800000000");
        when(memberProfileMapper.selectById(7L)).thenReturn(profile);

        adminMemberService.anonymize(7L);

        ArgumentCaptor<LambdaUpdateWrapper<Member>> memberCap = updateCaptor();
        verify(memberMapper).update(isNull(), memberCap.capture());
        assertSetsColumn(memberCap.getValue(), "avatar", null);
        assertSetsColumn(memberCap.getValue(), "nickname", AdminMemberService.ANONYMIZED_NICKNAME);
        assertSetsColumn(memberCap.getValue(), "status", 0);
        // openid 是 NOT NULL + uk_openid，不能置空；但 acct:<学号> 本身带身份信息，
        // 且不换掉的话同一学号重新导入会在唯一键上撞车
        assertSetsColumn(memberCap.getValue(), "openid", "anon:7");
        assertSetsColumn(memberCap.getValue(), "token_version", 3);

        ArgumentCaptor<LambdaUpdateWrapper<MemberAccount>> accountCap = updateCaptor();
        verify(memberAccountMapper).update(isNull(), accountCap.capture());
        assertSetsColumn(accountCap.getValue(), "student_no", null);
        assertSetsColumn(accountCap.getValue(), "username", null);
        assertSetsColumn(accountCap.getValue(), "status", 0);

        ArgumentCaptor<LambdaUpdateWrapper<MemberProfile>> profileCap = updateCaptor();
        verify(memberProfileMapper).update(isNull(), profileCap.capture());
        assertSetsColumn(profileCap.getValue(), "phone", null);
        assertSetsColumn(profileCap.getValue(), "real_name", AdminMemberService.ANONYMIZED_REAL_NAME);
        // 学院 / 年级刻意保留：聚合统计要用，且不属于直接身份信息
        UpdateWrapperAssertions.assertDoesNotSetColumn(profileCap.getValue(), "college");
        UpdateWrapperAssertions.assertDoesNotSetColumn(profileCap.getValue(), "grade");
    }

    @Test
    void 清退后的openid不含学号且可识别() {
        assertEquals("anon:42", AdminMemberService.anonymizedOpenid(42L));
        assertTrue(AdminMemberService.isAnonymizedOpenid("anon:42"));
        assertFalse(AdminMemberService.isAnonymizedOpenid("acct:2024001"));
        assertFalse(AdminMemberService.isAnonymizedOpenid("oABCdef"));
        assertFalse(AdminMemberService.isAnonymizedOpenid(null));
    }
}

package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminMemberServiceTest {

    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;
    @Mock
    private MemberProfileMapper memberProfileMapper;
    @Mock
    private AdminPermissionService adminPermissionService;

    @InjectMocks
    private AdminMemberService adminMemberService;

    @Test
    void importExcel_rejectsNonExcelFile() {
        MockMultipartFile file = new MockMultipartFile("file", "a.txt", "text/plain", "x".getBytes());
        BusinessException ex = assertThrows(BusinessException.class, () -> adminMemberService.importExcel(file));
        assertEquals("仅支持 .xlsx / .xls 格式", ex.getMessage());
    }

    @Test
    void updateStatus_disablesMemberAndAccount() {
        Member member = new Member();
        member.setId(3L);
        member.setStatus(1);
        member.setOpenid("acct:2024001");
        when(memberMapper.selectById(3L)).thenReturn(member, member);
        MemberAccount account = new MemberAccount();
        account.setId(10L);
        account.setMemberId(3L);
        account.setStatus(1);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);

        adminMemberService.updateStatus(3L, 0);

        verify(memberMapper).updateById(any(Member.class));
        verify(memberAccountMapper).updateById(any(MemberAccount.class));
    }
}

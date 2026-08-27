package com.shuyuan.backend.service;

import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberRowImportServiceTest {

    @Mock
    private MemberMapper memberMapper;
    @Mock
    private MemberAccountMapper memberAccountMapper;
    @Mock
    private MemberProfileMapper memberProfileMapper;

    @InjectMocks
    private MemberRowImportService memberRowImportService;

    @Test
    void insertRow_writesAllThreeTables() {
        doAnswer(inv -> {
            Member m = inv.getArgument(0);
            m.setId(99L);
            return 1;
        }).when(memberMapper).insert(any(Member.class));

        Long id = memberRowImportService.insertRow(
                "2024999", "测试", null, "学院", "2024", "13800000001");

        assertEquals(99L, id);
        verify(memberMapper).insert(any(Member.class));
        verify(memberAccountMapper).insert(any(MemberAccount.class));
        verify(memberProfileMapper).insert(any(MemberProfile.class));

        ArgumentCaptor<MemberAccount> accountCap = ArgumentCaptor.forClass(MemberAccount.class);
        verify(memberAccountMapper).insert(accountCap.capture());
        assertEquals("2024999", accountCap.getValue().getStudentNo());
    }

    @Test
    void insertRow_profileFailure_propagatesException() {
        doAnswer(inv -> {
            Member m = inv.getArgument(0);
            m.setId(100L);
            return 1;
        }).when(memberMapper).insert(any(Member.class));
        when(memberProfileMapper.insert(any(MemberProfile.class)))
                .thenThrow(new RuntimeException("profile constraint"));

        assertThrows(RuntimeException.class, () -> memberRowImportService.insertRow(
                "2024888", "失败行", null, null, null, null));
    }
}

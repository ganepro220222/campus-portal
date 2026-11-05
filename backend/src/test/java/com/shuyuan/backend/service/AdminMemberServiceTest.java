package com.shuyuan.backend.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import com.shuyuan.backend.dto.MemberCreateRequest;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
import com.shuyuan.backend.mapper.MemberPurgeMapper;
import com.shuyuan.backend.vo.MemberImportResult;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.mockito.ArgumentCaptor;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminMemberServiceTest {

    @BeforeAll
    static void initMybatisPlusEntityCache() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), Member.class.getName()),
                Member.class);
    }

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
    @Spy
    private ShuyuanProperties properties = new ShuyuanProperties();

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

    @Test
    void updateStatus_rejectsEnableForAnonymizedMember() {
        Member member = new Member();
        member.setId(8L);
        member.setStatus(0);
        member.setOpenid(AdminMemberService.anonymizedOpenid(8L));
        when(memberMapper.selectById(8L)).thenReturn(member);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> adminMemberService.updateStatus(8L, 1));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("已清退"));
        verify(memberMapper, never()).updateById(any(Member.class));
        verify(memberAccountMapper, never()).updateById(any(MemberAccount.class));
    }

    @Test
    void updateStatus_allowsDisableForAnonymizedMember() {
        Member member = new Member();
        member.setId(9L);
        member.setStatus(0);
        member.setOpenid(AdminMemberService.anonymizedOpenid(9L));
        when(memberMapper.selectById(9L)).thenReturn(member, member);
        MemberAccount account = new MemberAccount();
        account.setId(11L);
        account.setMemberId(9L);
        account.setStatus(0);
        when(memberAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(account);

        adminMemberService.updateStatus(9L, 0);

        verify(memberMapper).updateById(any(Member.class));
        verify(memberAccountMapper).updateById(any(MemberAccount.class));
    }

    /* —— 学号 / 工号格式：号码都是编的，学号 12 位、工号 7 位 —— */

    private static MockMultipartFile xlsx(List<List<Object>> rows) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<List<String>> head = List.of(List.of("学号"), List.of("姓名"));
        EasyExcel.write(out).head(head).sheet("师生账号").doWrite(rows);
        return new MockMultipartFile("file", "roster.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
    }

    private static List<Object> row(Object no, String name) {
        List<Object> r = new ArrayList<>();
        r.add(no);
        r.add(name);
        return r;
    }

    @Test
    void importExcel_按位数核对_老账号先跳过() {
        // 每行按顺序查一次是否已存在；最后一行是建号前的老账号
        when(memberAccountMapper.selectCount(any(LambdaQueryWrapper.class)))
                .thenReturn(0L, 0L, 0L, 0L, 0L, 1L);

        MemberImportResult r = adminMemberService.importExcel(xlsx(List.of(
                row("123456789012", "学生甲"),
                row(1234567L, "教师乙"),               // 数字格式的单元格
                row("12345678901", "少一位"),
                row("1.23457E+11", "科学计数法"),
                row(" 1234 5678\u00A09013 ", "带空格"),
                row("T2024", "老账号"))));

        assertEquals(6, r.getTotalRows());
        assertEquals(3, r.getSuccessCount());
        assertEquals(1, r.getSkippedCount(), "已存在的老账号照旧跳过，不因格式变成失败");
        assertEquals(2, r.getFailedCount());
        assertTrue(r.getErrors().get(0).startsWith("第4行：") && r.getErrors().get(0).contains("是 11 位"),
                r.getErrors().get(0));
        assertTrue(r.getErrors().get(1).contains("科学计数法"), r.getErrors().get(1));
        assertEquals("12345678901", r.getErrorRows().get(0).getStudentNo(), "失败明细照原样写出表里的号");

        verify(memberRowImportService).insertImportRow(eq("123456789012"), eq("学生甲"), any(), any(), any(), any());
        verify(memberRowImportService).insertImportRow(eq("1234567"), eq("教师乙"), any(), any(), any(), any());
        verify(memberRowImportService).insertImportRow(eq("123456789013"), eq("带空格"), any(), any(), any(), any());
        verify(memberRowImportService, times(3)).insertImportRow(anyString(), anyString(), any(), any(), any(), any());
    }

    @Test
    void importExcel_位数设0就不查() {
        properties.getMemberNo().setStaffDigits(0);
        when(memberAccountMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

        MemberImportResult r = adminMemberService.importExcel(xlsx(List.of(row("T2024", "字母工号"))));

        assertEquals(1, r.getSuccessCount());
        assertEquals(0, r.getFailedCount());
    }

    @Test
    void create_位数不对直接拒绝() {
        MemberCreateRequest req = new MemberCreateRequest();
        req.setStudentNo("12345678901");
        req.setRealName("少一位");

        BusinessException ex = assertThrows(BusinessException.class, () -> adminMemberService.create(req));
        assertEquals(400, ex.getCode());
        assertTrue(ex.getMessage().contains("是 11 位") && ex.getMessage().contains("学号应为 12 位"), ex.getMessage());
        verify(memberRowImportService, never()).insertSingle(any(), any(), any(), any(), any(), any());
    }

    @Test
    void create_全角和空格洗掉再建() {
        MemberCreateRequest req = new MemberCreateRequest();
        req.setStudentNo(" １２３４５６７ ");
        req.setRealName("教师乙");
        when(memberAccountMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
        when(memberRowImportService.insertSingle(any(), any(), any(), any(), any(), any())).thenReturn(5L);
        Member m = new Member();
        m.setId(5L);
        when(memberMapper.selectById(5L)).thenReturn(m);

        adminMemberService.create(req);

        verify(memberRowImportService).insertSingle(eq("1234567"), eq("教师乙"), any(), any(), any(), any());
    }

    @Test
    void noFormat_跟着配置走() {
        Map<String, Object> on = adminMemberService.noFormat();
        assertEquals(12, on.get("studentDigits"));
        assertEquals(7, on.get("staffDigits"));

        properties.getMemberNo().setStudentDigits(0);
        Map<String, Object> off = adminMemberService.noFormat();
        assertEquals(0, off.get("studentDigits"));
        assertEquals(0, off.get("staffDigits"), "任一设 0 就整个不查，两项都报 0");
    }

    @Test
    void list_默认不列出已清退_指定时只列已清退() {
        when(memberMapper.selectPage(any(), any())).thenReturn(new Page<>(1, 20));

        adminMemberService.list(null, null, null, 1, 20);
        ArgumentCaptor<LambdaQueryWrapper<Member>> hidden = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(memberMapper).selectPage(any(), hidden.capture());
        String hiddenSql = hidden.getValue().getCustomSqlSegment().toLowerCase();
        assertTrue(hiddenSql.contains("not like"), hiddenSql);

        adminMemberService.list(null, null, true, 1, 20);
        ArgumentCaptor<LambdaQueryWrapper<Member>> only = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(memberMapper, times(2)).selectPage(any(), only.capture());
        String onlySql = only.getValue().getCustomSqlSegment().toLowerCase();
        assertTrue(onlySql.contains("like") && !onlySql.contains("not like"), onlySql);
    }
}

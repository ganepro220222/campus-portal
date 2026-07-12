package com.shuyuan.backend.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.Member;
import com.shuyuan.backend.entity.MemberAccount;
import com.shuyuan.backend.entity.MemberProfile;
import com.shuyuan.backend.mapper.MemberAccountMapper;
import com.shuyuan.backend.mapper.MemberMapper;
import com.shuyuan.backend.mapper.MemberProfileMapper;
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
import java.util.List;
import java.util.Map;

/** 小程序师生账号：列表、Excel 导入、启用/禁用 */
@Service
@RequiredArgsConstructor
public class AdminMemberService {

    private static final int MAX_IMPORT_ROWS = 5000;
    private static final int MAX_ERROR_LINES = 50;

    private final MemberMapper memberMapper;
    private final MemberAccountMapper memberAccountMapper;
    private final MemberProfileMapper memberProfileMapper;
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
        try {
            EasyExcel.read(file.getInputStream(), MemberImportRow.class, new ReadListener<MemberImportRow>() {
                @Override
                public void invoke(MemberImportRow row, AnalysisContext context) {
                    acc.totalRows++;
                    if (acc.totalRows > MAX_IMPORT_ROWS) {
                        throw new BusinessException(400, "单次导入不得超过 " + MAX_IMPORT_ROWS + " 行");
                    }
                    int rowNum = context.readRowHolder().getRowIndex() + 1;
                    processRow(row, rowNum, acc);
                }

                @Override
                public void doAfterAllAnalysed(AnalysisContext context) {
                    // no-op
                }
            }).sheet().doRead();
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException(400, "读取 Excel 失败");
        } catch (Exception e) {
            throw new BusinessException(400, "导入失败：" + e.getMessage());
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
        EasyExcel.write(response.getOutputStream(), MemberImportRow.class)
                .sheet("师生账号")
                .doWrite(List.of(sampleRow()));
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
        Long exists = memberAccountMapper.selectCount(new LambdaQueryWrapper<MemberAccount>()
                .eq(MemberAccount::getStudentNo, studentNo));
        if (exists != null && exists > 0) {
            acc.skip();
            return;
        }
        try {
            String plainPassword = StudentPasswordPolicy.resolveInitialPassword(studentNo, row.getIdCard());
            String openid = StudentPasswordPolicy.placeholderOpenid(studentNo);

            Member member = new Member();
            member.setOpenid(openid);
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
            profile.setCollege(trim(row.getCollege()));
            profile.setGrade(trim(row.getGrade()));
            profile.setPhone(trim(row.getPhone()));
            memberProfileMapper.insert(profile);

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
        m.put("studentNo", account != null ? account.getStudentNo() : "");
        m.put("realName", profile != null ? profile.getRealName() : member.getNickname());
        m.put("college", profile != null ? profile.getCollege() : "");
        m.put("grade", profile != null ? profile.getGrade() : "");
        m.put("phone", profile != null ? profile.getPhone() : "");
        m.put("points", member.getPoints() != null ? member.getPoints() : 0);
        m.put("status", member.getStatus());
        m.put("wxBound", account != null && !StudentPasswordPolicy.isPlaceholderOpenid(member.getOpenid()));
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

    private static MemberImportRow sampleRow() {
        MemberImportRow row = new MemberImportRow();
        row.setStudentNo("2024001");
        row.setRealName("示例学生");
        row.setCollege("示例学院");
        row.setGrade("2024");
        row.setPhone("13800000000");
        row.setIdCard("520101200001011234");
        return row;
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

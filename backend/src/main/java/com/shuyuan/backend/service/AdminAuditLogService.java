package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.entity.SysLog;
import com.shuyuan.backend.entity.SysUser;
import com.shuyuan.backend.mapper.SysLogMapper;
import com.shuyuan.backend.mapper.SysUserMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 管理后台操作审计（写入 sys_log，验收 §三「操作日志」、E2-2）
 */
@Service
@RequiredArgsConstructor
public class AdminAuditLogService {

    private final SysLogMapper sysLogMapper;
    private final SysUserMapper sysUserMapper;
    private final AdminPermissionService adminPermissionService;

    /** 记录一条写操作审计 */
    @Transactional
    public void record(Long userId, String action, String target, String ip) {
        if (userId == null || action == null || action.isBlank()) {
            return;
        }
        SysLog row = new SysLog();
        row.setUserId(userId);
        row.setAction(trim(action, 100));
        row.setTarget(trim(target, 200));
        row.setIp(trim(ip, 50));
        row.setCreatedAt(LocalDateTime.now());
        sysLogMapper.insert(row);
    }

    /** 分页查询，仅超管可访问 */
    public PageResult<Map<String, Object>> list(int page, int size, Long userId, String keyword,
                                                LocalDate startDate, LocalDate endDate) {
        adminPermissionService.require("admin:super");
        LambdaQueryWrapper<SysLog> qw = new LambdaQueryWrapper<SysLog>()
                .orderByDesc(SysLog::getCreatedAt);
        if (userId != null) {
            qw.eq(SysLog::getUserId, userId);
        }
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim();
            qw.and(w -> w.like(SysLog::getAction, kw).or().like(SysLog::getTarget, kw));
        }
        if (startDate != null) {
            qw.ge(SysLog::getCreatedAt, startDate.atStartOfDay());
        }
        if (endDate != null) {
            qw.le(SysLog::getCreatedAt, endDate.atTime(LocalTime.MAX));
        }
        Page<SysLog> p = sysLogMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, SysUser> users = loadUsers(p.getRecords());
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(log -> toVo(log, users.get(log.getUserId())))
                .toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    private Map<Long, SysUser> loadUsers(List<SysLog> logs) {
        Set<Long> ids = logs.stream().map(SysLog::getUserId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return sysUserMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(SysUser::getId, u -> u, (a, b) -> a));
    }

    private Map<String, Object> toVo(SysLog log, SysUser user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", log.getId());
        m.put("userId", log.getUserId());
        m.put("operatorName", user != null ? displayName(user) : "—");
        m.put("action", log.getAction());
        m.put("target", log.getTarget());
        m.put("ip", log.getIp());
        m.put("createdAt", FormatUtils.formatDateTime(log.getCreatedAt()));
        return m;
    }

    private String displayName(SysUser user) {
        if (user.getRealName() != null && !user.getRealName().isBlank()) {
            return user.getRealName();
        }
        return user.getUsername();
    }

    private String trim(String s, int max) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }
}

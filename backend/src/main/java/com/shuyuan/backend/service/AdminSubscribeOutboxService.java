package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.entity.SubscribeOutbox;
import com.shuyuan.backend.mapper.SubscribeOutboxMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminSubscribeOutboxService {

    private final SubscribeOutboxMapper outboxMapper;
    private final AdminPermissionService adminPermissionService;

    public PageResult<Map<String, Object>> list(int page, int size, String status) {
        adminPermissionService.require("admin:super");
        LambdaQueryWrapper<SubscribeOutbox> qw = new LambdaQueryWrapper<SubscribeOutbox>()
                .orderByDesc(SubscribeOutbox::getCreateTime);
        if (status != null && !status.isBlank()) {
            qw.eq(SubscribeOutbox::getStatus, status.trim());
        }
        Page<SubscribeOutbox> p = outboxMapper.selectPage(new Page<>(page, size), qw);
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    private Map<String, Object> toVo(SubscribeOutbox row) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", row.getId());
        m.put("memberId", row.getMemberId());
        m.put("scene", row.getScene());
        m.put("status", row.getStatus());
        m.put("attemptCount", row.getAttemptCount());
        m.put("lastError", row.getLastError());
        m.put("createTime", FormatUtils.formatDateTime(row.getCreateTime()));
        m.put("updateTime", FormatUtils.formatDateTime(row.getUpdateTime()));
        m.put("sentAt", FormatUtils.formatDateTime(row.getSentAt()));
        m.put("nextRetryAt", FormatUtils.formatDateTime(row.getNextRetryAt()));
        return m;
    }
}

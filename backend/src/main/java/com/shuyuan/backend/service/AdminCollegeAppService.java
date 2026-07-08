package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CollegeAppSaveRequest;
import com.shuyuan.backend.entity.CollegeApp;
import com.shuyuan.backend.mapper.CollegeAppMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminCollegeAppService {

    private static final Set<String> CONTENT_TYPES = Set.of("manual", "jump", "embed_h5", "api_sync");

    private final CollegeAppMapper collegeAppMapper;
    private final AdminPermissionService adminPermissionService;

    public PageResult<Map<String, Object>> list(int page, int size) {
        adminPermissionService.require("admin:super");
        Page<CollegeApp> p = collegeAppMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<CollegeApp>()
                        .orderByAsc(CollegeApp::getSort)
                        .orderByAsc(CollegeApp::getId));
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> create(CollegeAppSaveRequest req) {
        adminPermissionService.require("admin:super");
        validateRequest(req);
        CollegeApp row = fromRequest(req);
        collegeAppMapper.insert(row);
        return toVo(collegeAppMapper.selectById(row.getId()));
    }

    public Map<String, Object> update(Long id, CollegeAppSaveRequest req) {
        adminPermissionService.require("admin:super");
        validateRequest(req);
        CollegeApp existing = requireRow(id);
        applyRequest(existing, req);
        collegeAppMapper.updateById(existing);
        return toVo(collegeAppMapper.selectById(id));
    }

    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        requireRow(id);
        collegeAppMapper.deleteById(id);
    }

    private CollegeApp requireRow(Long id) {
        CollegeApp row = collegeAppMapper.selectById(id);
        if (row == null) {
            throw new BusinessException(404, "学院配置不存在");
        }
        return row;
    }

    private void validateRequest(CollegeAppSaveRequest req) {
        String type = normalizeContentType(req.getContentType());
        if ("jump".equals(type)) {
            if (req.getAppid() == null || req.getAppid().isBlank()) {
                throw new BusinessException(400, "跳转方式须填写目标小程序 AppID");
            }
        }
        if ("embed_h5".equals(type) || "api_sync".equals(type)) {
            if (req.getContentUrl() == null || req.getContentUrl().isBlank()) {
                throw new BusinessException(400, "该对接方式须填写内容地址");
            }
        }
    }

    private CollegeApp fromRequest(CollegeAppSaveRequest req) {
        CollegeApp row = new CollegeApp();
        applyRequest(row, req);
        if (row.getSort() == null) {
            row.setSort(0);
        }
        if (row.getStatus() == null) {
            row.setStatus(1);
        }
        if (row.getContentType() == null || row.getContentType().isBlank()) {
            row.setContentType("manual");
        }
        return row;
    }

    private void applyRequest(CollegeApp row, CollegeAppSaveRequest req) {
        if (req.getName() != null) {
            row.setName(req.getName().trim());
        }
        if (req.getAppid() != null) {
            row.setAppid(req.getAppid().trim());
        }
        if (req.getPath() != null) {
            row.setPath(req.getPath().trim());
        }
        if (req.getIconUrl() != null) {
            row.setIconUrl(req.getIconUrl().trim());
        }
        if (req.getDescription() != null) {
            row.setDescription(req.getDescription().trim());
        }
        if (req.getSort() != null) {
            row.setSort(req.getSort());
        }
        if (req.getStatus() != null) {
            row.setStatus(req.getStatus());
        }
        if (req.getContentType() != null) {
            row.setContentType(normalizeContentType(req.getContentType()));
        }
        if (req.getContentUrl() != null) {
            row.setContentUrl(req.getContentUrl().trim());
        }
        if (req.getApiToken() != null) {
            row.setApiToken(req.getApiToken().trim());
        }
    }

    private String normalizeContentType(String type) {
        if (type == null || type.isBlank()) {
            return "manual";
        }
        String t = type.trim().toLowerCase();
        if (!CONTENT_TYPES.contains(t)) {
            throw new BusinessException(400, "不支持的对接方式：" + type);
        }
        return t;
    }

    private Map<String, Object> toVo(CollegeApp c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("appid", c.getAppid());
        m.put("path", c.getPath());
        m.put("iconUrl", c.getIconUrl());
        m.put("description", c.getDescription());
        m.put("sort", c.getSort());
        m.put("status", c.getStatus());
        m.put("contentType", c.getContentType());
        m.put("contentTypeLabel", CollegeAppService.contentTypeLabel(c.getContentType()));
        m.put("contentUrl", c.getContentUrl());
        m.put("hasApiToken", c.getApiToken() != null && !c.getApiToken().isBlank());
        return m;
    }
}

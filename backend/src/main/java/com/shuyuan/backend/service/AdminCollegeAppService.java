package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CollegeAppSaveRequest;
import com.shuyuan.backend.entity.CollegeApp;
import com.shuyuan.backend.mapper.CollegeAppMapper;
import com.shuyuan.backend.util.CollegeIconDisplay;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminCollegeAppService {

    private static final Set<String> CONTENT_TYPES = Set.of("manual", "jump", "embed_h5", "api_sync");
    private static final Pattern MINI_PROGRAM_APPID = Pattern.compile("^wx[0-9A-Fa-f]{16}$");
    private static final String APPID_FORMAT_MESSAGE = "AppID 格式不正确，应为 wx 开头的 18 位小程序 AppID";

    private final CollegeAppMapper collegeAppMapper;
    private final AdminPermissionService adminPermissionService;
    private final OssMediaCleanupService ossMediaCleanupService;

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
        String oldIcon = existing.getIconUrl();
        applyRequest(existing, req);
        collegeAppMapper.updateById(existing);
        CollegeApp saved = collegeAppMapper.selectById(id);
        ossMediaCleanupService.afterReplace(oldIcon, saved.getIconUrl());
        return toVo(saved);
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
            String appid = req.getAppid() == null ? "" : req.getAppid().trim();
            if (appid.isEmpty()) {
                throw new BusinessException(400, "跳转方式须填写目标小程序 AppID");
            }
            if (!MINI_PROGRAM_APPID.matcher(appid).matches()) {
                throw new BusinessException(400, APPID_FORMAT_MESSAGE);
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
        row.setIconFitMode(CollegeIconDisplay.normalizeFit(req.getIconFitMode()));
        row.setIconShape(CollegeIconDisplay.normalizeShape(req.getIconShape()));
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
        // 密钥只写不回显；编辑表单留空表示保持现值，不能静默抹掉已有密钥。
        if (req.getApiToken() != null && !req.getApiToken().isBlank()) {
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
        m.put("iconFitMode", CollegeIconDisplay.normalizeFit(c.getIconFitMode()));
        m.put("iconShape", CollegeIconDisplay.normalizeShape(c.getIconShape()));
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

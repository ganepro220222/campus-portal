package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.ResourceSaveRequest;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.ResourceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminResourceService {

    private static final Set<String> ALLOWED_FILE_TYPES = Set.of("pdf", "word", "ppt", "mp4", "mp3");

    private final ResourceMapper resourceMapper;
    private final CategoryService categoryService;
    private final AdminPermissionService adminPermissionService;
    private final SearchIndexSyncService searchIndexSyncService;

    public PageResult<Map<String, Object>> list(Long categoryId, String fileType, Integer status,
                                                int page, int size) {
        adminPermissionService.require("course:read");
        LambdaQueryWrapper<Resource> qw = new LambdaQueryWrapper<Resource>()
                .orderByDesc(Resource::getCreateTime);
        if (categoryId != null && categoryId > 0) {
            qw.eq(Resource::getCategoryId, categoryId);
        }
        if (fileType != null && !fileType.isBlank()) {
            qw.eq(Resource::getFileType, fileType.trim().toLowerCase());
        }
        if (status != null) {
            qw.eq(Resource::getStatus, status);
        }
        Page<Resource> p = resourceMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, String> catMap = categoryService.nameMap("resource");
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(r -> toVo(r, catMap)).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("course:read");
        return toVo(requireResource(id), categoryService.nameMap("resource"));
    }

    @Transactional
    public Map<String, Object> create(ResourceSaveRequest req) {
        adminPermissionService.require("course:write");
        validateRequest(req);
        Resource resource = fromRequest(new Resource(), req);
        resource.setDownloadCount(0);
        if (resource.getStatus() == null) {
            resource.setStatus(0);
        }
        resourceMapper.insert(resource);
        Resource saved = resourceMapper.selectById(resource.getId());
        syncSearchIfOnline(saved);
        return toVo(saved, categoryService.nameMap("resource"));
    }

    @Transactional
    public Map<String, Object> update(Long id, ResourceSaveRequest req) {
        adminPermissionService.require("course:write");
        Resource resource = requireResource(id);
        validateRequest(req);
        fromRequest(resource, req);
        resourceMapper.updateById(resource);
        Resource saved = resourceMapper.selectById(id);
        syncSearchIfOnline(saved);
        return toVo(saved, categoryService.nameMap("resource"));
    }

    private Resource requireResource(Long id) {
        Resource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BusinessException(404, "资源不存在");
        }
        return resource;
    }

    private void validateRequest(ResourceSaveRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException(400, "资源名称不能为空");
        }
        if (req.getFileUrl() == null || req.getFileUrl().isBlank()) {
            throw new BusinessException(400, "文件地址不能为空");
        }
        if (req.getFileType() == null || req.getFileType().isBlank()) {
            throw new BusinessException(400, "请选择文件格式");
        }
        String type = req.getFileType().trim().toLowerCase();
        if (!ALLOWED_FILE_TYPES.contains(type)) {
            throw new BusinessException(400, "不支持的文件格式");
        }
    }

    private Resource fromRequest(Resource resource, ResourceSaveRequest req) {
        if (req.getName() != null) {
            resource.setName(req.getName().trim());
        }
        if (req.getFileUrl() != null) {
            resource.setFileUrl(req.getFileUrl().trim());
        }
        if (req.getPreviewUrl() != null) {
            resource.setPreviewUrl(req.getPreviewUrl().trim());
        }
        if (req.getFileType() != null) {
            resource.setFileType(req.getFileType().trim().toLowerCase());
        }
        if (req.getFileSizeKb() != null) {
            resource.setFileSizeKb(Math.max(0, req.getFileSizeKb()));
        }
        if (req.getCategoryId() != null) {
            resource.setCategoryId(req.getCategoryId());
        }
        if (req.getStatus() != null) {
            resource.setStatus(req.getStatus());
        }
        return resource;
    }

    private void syncSearchIfOnline(Resource resource) {
        if (resource.getStatus() != null && resource.getStatus() == 1) {
            searchIndexSyncService.syncResource(resource);
        } else {
            searchIndexSyncService.removeResource(resource.getId());
        }
    }

    private Map<String, Object> toVo(Resource r, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("fileUrl", r.getFileUrl());
        m.put("previewUrl", r.getPreviewUrl());
        m.put("fileType", r.getFileType());
        m.put("fileTypeLabel", fileTypeLabel(r.getFileType()));
        m.put("fileSizeKb", r.getFileSizeKb());
        m.put("fileSizeText", formatFileSize(r.getFileSizeKb()));
        m.put("categoryId", r.getCategoryId());
        m.put("categoryName", categoryService.getName(r.getCategoryId(), catMap));
        m.put("downloadCount", r.getDownloadCount() != null ? r.getDownloadCount() : 0);
        m.put("status", r.getStatus());
        m.put("createTime", r.getCreateTime() != null ? r.getCreateTime().toString().replace('T', ' ').substring(0, 16) : "");
        return m;
    }

    private String fileTypeLabel(String fileType) {
        if (fileType == null) {
            return "";
        }
        return switch (fileType.toLowerCase()) {
            case "pdf" -> "PDF";
            case "word" -> "Word";
            case "ppt" -> "PPT";
            case "mp4" -> "视频";
            case "mp3" -> "音频";
            default -> fileType.toUpperCase();
        };
    }

    private String formatFileSize(Integer kb) {
        if (kb == null || kb <= 0) {
            return "";
        }
        if (kb >= 1024) {
            return String.format("%.1f MB", kb / 1024.0);
        }
        return kb + " KB";
    }
}

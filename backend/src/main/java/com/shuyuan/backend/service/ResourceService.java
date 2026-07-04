package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.DownloadRecord;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.DownloadRecordMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceMapper resourceMapper;
    private final DownloadRecordMapper downloadRecordMapper;
    private final CategoryService categoryService;

    public List<Map<String, Object>> list(String category, String fileType) {
        Map<Long, String> catMap = categoryService.nameMap("resource");
        LambdaQueryWrapper<Resource> qw = new LambdaQueryWrapper<Resource>()
                .eq(Resource::getStatus, 1)
                .orderByDesc(Resource::getCreateTime);
        if (category != null && !category.isBlank() && !"全部".equals(category)) {
            Long cid = categoryService.findIdByName("resource", category);
            if (cid != null) {
                qw.eq(Resource::getCategoryId, cid);
            }
        }
        if (fileType != null && !fileType.isBlank() && !"全部".equals(fileType)) {
            qw.eq(Resource::getFileType, fileType);
        }
        return resourceMapper.selectList(qw).stream()
                .map(r -> toListItem(r, catMap))
                .toList();
    }

    public Map<String, Object> detail(Long id) {
        Resource resource = requireResource(id);
        Map<Long, String> catMap = categoryService.nameMap("resource");
        return toDetailVo(resource, catMap);
    }

    /** 记录下载并返回文件地址 */
    @Transactional
    public Map<String, Object> download(Long id) {
        Resource resource = requireResource(id);
        Long memberId = MemberContext.getMemberId();
        if (memberId != null) {
            DownloadRecord record = new DownloadRecord();
            record.setMemberId(memberId);
            record.setResourceId(id);
            record.setFileName(resource.getName());
            record.setDownloadedAt(LocalDateTime.now());
            downloadRecordMapper.insert(record);
        }
        Resource update = new Resource();
        update.setId(id);
        update.setDownloadCount((resource.getDownloadCount() != null ? resource.getDownloadCount() : 0) + 1);
        resourceMapper.updateById(update);

        Map<String, Object> m = new HashMap<>();
        m.put("fileUrl", resource.getFileUrl());
        m.put("previewUrl", resource.getPreviewUrl());
        m.put("fileType", resource.getFileType());
        m.put("name", resource.getName());
        return m;
    }

    private Resource requireResource(Long id) {
        Resource resource = resourceMapper.selectById(id);
        if (resource == null || resource.getStatus() == null || resource.getStatus() != 1) {
            throw new BusinessException(404, "资源不存在");
        }
        return resource;
    }

    private Map<String, Object> toListItem(Resource r, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("fileType", r.getFileType());
        m.put("fileSizeKb", r.getFileSizeKb());
        m.put("fileSizeText", formatFileSize(r.getFileSizeKb()));
        m.put("downloadCount", r.getDownloadCount());
        m.put("categoryName", categoryService.getName(r.getCategoryId(), catMap));
        return m;
    }

    private Map<String, Object> toDetailVo(Resource r, Map<Long, String> catMap) {
        Map<String, Object> m = toListItem(r, catMap);
        m.put("fileUrl", r.getFileUrl());
        m.put("previewUrl", r.getPreviewUrl());
        return m;
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

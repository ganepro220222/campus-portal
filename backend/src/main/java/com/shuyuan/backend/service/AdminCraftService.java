package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.CraftContactSave;
import com.shuyuan.backend.dto.CraftImageItem;
import com.shuyuan.backend.dto.CraftSaveRequest;
import com.shuyuan.backend.entity.Craft;
import com.shuyuan.backend.entity.CraftContact;
import com.shuyuan.backend.entity.CraftImage;
import com.shuyuan.backend.mapper.CraftContactMapper;
import com.shuyuan.backend.mapper.CraftImageMapper;
import com.shuyuan.backend.mapper.CraftMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 文创后台管理（与 docs Phase 3 文创展示、Phase 5 内容管理对齐）
 */
@Service
@RequiredArgsConstructor
public class AdminCraftService {

    private static final Set<String> PREVIEW_TYPES = Set.of("multi_image", "model3d");

    private final CraftMapper craftMapper;
    private final CraftImageMapper craftImageMapper;
    private final CraftContactMapper craftContactMapper;
    private final CategoryService categoryService;
    private final AdminPermissionService adminPermissionService;
    private final SearchIndexSyncService searchIndexSyncService;

    public PageResult<Map<String, Object>> list(Long categoryId, Integer status, int page, int size) {
        adminPermissionService.require("hall:read");
        LambdaQueryWrapper<Craft> qw = new LambdaQueryWrapper<Craft>()
                .orderByAsc(Craft::getSort)
                .orderByDesc(Craft::getUpdateTime);
        if (categoryId != null && categoryId > 0) {
            qw.eq(Craft::getCategoryId, categoryId);
        }
        if (status != null) {
            qw.eq(Craft::getStatus, status);
        }
        Page<Craft> p = craftMapper.selectPage(new Page<>(page, size), qw);
        Map<Long, String> catMap = categoryService.nameMap("craft");
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(c -> toVo(c, catMap)).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("hall:read");
        Craft craft = requireCraft(id);
        Map<String, Object> vo = toVo(craft, categoryService.nameMap("craft"));
        vo.put("images", listImages(id));
        vo.put("contact", loadContact(id));
        return vo;
    }

    @Transactional
    public Map<String, Object> create(CraftSaveRequest req) {
        adminPermissionService.require("hall:write");
        validateRequest(req);
        Craft craft = fromRequest(new Craft(), req);
        if (craft.getSort() == null) {
            craft.setSort(0);
        }
        if (craft.getStatus() == null) {
            craft.setStatus(0);
        }
        if (craft.getPreviewType() == null || craft.getPreviewType().isBlank()) {
            craft.setPreviewType("multi_image");
        }
        craftMapper.insert(craft);
        syncImages(craft.getId(), req.getImages());
        syncContact(craft.getId(), req.getContact());
        Craft saved = craftMapper.selectById(craft.getId());
        syncSearchIfOnline(saved);
        return detail(saved.getId());
    }

    @Transactional
    public Map<String, Object> update(Long id, CraftSaveRequest req) {
        adminPermissionService.require("hall:write");
        Craft craft = requireCraft(id);
        validateRequest(req);
        fromRequest(craft, req);
        craftMapper.updateById(craft);
        syncImages(id, req.getImages());
        syncContact(id, req.getContact());
        Craft saved = craftMapper.selectById(id);
        syncSearchIfOnline(saved);
        return detail(id);
    }

    private Craft requireCraft(Long id) {
        Craft craft = craftMapper.selectById(id);
        if (craft == null) {
            throw new BusinessException(404, "文创不存在");
        }
        return craft;
    }

    private void validateRequest(CraftSaveRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException(400, "文创名称不能为空");
        }
        if (req.getPreviewType() != null && !req.getPreviewType().isBlank()
                && !PREVIEW_TYPES.contains(req.getPreviewType())) {
            throw new BusinessException(400, "展示方式无效");
        }
        if ("model3d".equals(req.getPreviewType())
                && (req.getModel3dUrl() == null || req.getModel3dUrl().isBlank())) {
            throw new BusinessException(400, "3D 展示需填写 GLB 模型地址");
        }
    }

    private Craft fromRequest(Craft craft, CraftSaveRequest req) {
        if (req.getName() != null) {
            craft.setName(req.getName().trim());
        }
        if (req.getCover() != null) {
            craft.setCover(req.getCover().trim());
        }
        if (req.getCoverFitMode() != null) {
            craft.setCoverFitMode(com.shuyuan.backend.util.CoverFitMode.normalize(req.getCoverFitMode()));
        }
        if (req.getCategoryId() != null) {
            craft.setCategoryId(req.getCategoryId());
        }
        if (req.getIntroZh() != null) {
            craft.setIntroZh(req.getIntroZh());
        }
        if (req.getIntroEn() != null) {
            craft.setIntroEn(req.getIntroEn());
        }
        if (req.getPreviewType() != null && !req.getPreviewType().isBlank()) {
            craft.setPreviewType(req.getPreviewType());
        }
        if (req.getModel3dUrl() != null) {
            craft.setModel3dUrl(req.getModel3dUrl().trim());
        }
        if (req.getSort() != null) {
            craft.setSort(req.getSort());
        }
        if (req.getStatus() != null) {
            craft.setStatus(req.getStatus());
        }
        return craft;
    }

    /** 同步多角度图片：先清后插 */
    private void syncImages(Long craftId, List<CraftImageItem> images) {
        if (images == null) {
            return;
        }
        craftImageMapper.delete(new LambdaQueryWrapper<CraftImage>()
                .eq(CraftImage::getCraftId, craftId));
        int sort = 0;
        for (CraftImageItem item : images) {
            if (item == null || item.getImageUrl() == null || item.getImageUrl().isBlank()) {
                continue;
            }
            CraftImage img = new CraftImage();
            img.setCraftId(craftId);
            img.setImageUrl(item.getImageUrl().trim());
            img.setAngleLabel(item.getAngleLabel() != null ? item.getAngleLabel().trim() : null);
            img.setSort(item.getSort() != null ? item.getSort() : sort++);
            craftImageMapper.insert(img);
        }
    }

    /** 同步咨询联系方式 */
    private void syncContact(Long craftId, CraftContactSave contactSave) {
        if (contactSave == null) {
            return;
        }
        CraftContact existing = craftContactMapper.selectById(craftId);
        CraftContact contact = existing != null ? existing : new CraftContact();
        contact.setCraftId(craftId);
        contact.setPhone(trimOrNull(contactSave.getPhone()));
        contact.setWechat(trimOrNull(contactSave.getWechat()));
        contact.setWorkWechat(trimOrNull(contactSave.getWorkWechat()));
        contact.setEmail(trimOrNull(contactSave.getEmail()));
        if (existing != null) {
            craftContactMapper.updateById(contact);
        } else {
            craftContactMapper.insert(contact);
        }
    }

    private List<Map<String, Object>> listImages(Long craftId) {
        return craftImageMapper.selectList(new LambdaQueryWrapper<CraftImage>()
                        .eq(CraftImage::getCraftId, craftId)
                        .orderByAsc(CraftImage::getSort))
                .stream()
                .map(img -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", img.getId());
                    m.put("imageUrl", img.getImageUrl());
                    m.put("angleLabel", img.getAngleLabel());
                    m.put("sort", img.getSort());
                    return m;
                }).toList();
    }

    private Map<String, Object> loadContact(Long craftId) {
        CraftContact contact = craftContactMapper.selectById(craftId);
        if (contact == null) {
            return null;
        }
        Map<String, Object> m = new HashMap<>();
        m.put("phone", contact.getPhone());
        m.put("wechat", contact.getWechat());
        m.put("workWechat", contact.getWorkWechat());
        m.put("email", contact.getEmail());
        return m;
    }

    private void syncSearchIfOnline(Craft craft) {
        if (craft.getStatus() != null && craft.getStatus() == 1) {
            searchIndexSyncService.syncCraft(craft);
        } else {
            searchIndexSyncService.removeCraft(craft.getId());
        }
    }

    private Map<String, Object> toVo(Craft c, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("cover", c.getCover());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(c.getCoverFitMode()));
        m.put("categoryId", c.getCategoryId());
        m.put("categoryName", categoryService.getName(c.getCategoryId(), catMap));
        m.put("introZh", c.getIntroZh());
        m.put("introEn", c.getIntroEn());
        m.put("previewType", c.getPreviewType());
        m.put("previewTypeLabel", previewTypeLabel(c.getPreviewType()));
        m.put("model3dUrl", c.getModel3dUrl());
        m.put("sort", c.getSort());
        m.put("status", c.getStatus());
        return m;
    }

    private String previewTypeLabel(String type) {
        if ("model3d".equals(type)) {
            return "3D 模型";
        }
        return "多角度图片";
    }

    private String trimOrNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}

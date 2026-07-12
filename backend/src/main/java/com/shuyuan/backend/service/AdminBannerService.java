package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.BannerSaveRequest;
import com.shuyuan.backend.entity.Banner;
import com.shuyuan.backend.mapper.BannerMapper;
import com.shuyuan.backend.util.BannerLinkPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminBannerService {

    private final BannerMapper bannerMapper;
    private final AdminPermissionService adminPermissionService;
    private final BannerLinkPolicy bannerLinkPolicy;

    public PageResult<Map<String, Object>> list(int page, int size) {
        adminPermissionService.require("admin:super");
        Page<Banner> p = bannerMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Banner>().orderByAsc(Banner::getSort));
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> create(BannerSaveRequest req) {
        adminPermissionService.require("admin:super");
        bannerLinkPolicy.validate(req.getLinkType(), req.getLinkValue());
        Banner banner = fromRequest(req);
        bannerMapper.insert(banner);
        return toVo(bannerMapper.selectById(banner.getId()));
    }

    public Map<String, Object> update(Long id, BannerSaveRequest req) {
        adminPermissionService.require("admin:super");
        bannerLinkPolicy.validate(req.getLinkType(), req.getLinkValue());
        Banner existing = requireBanner(id);
        applyRequest(existing, req);
        bannerMapper.updateById(existing);
        return toVo(bannerMapper.selectById(id));
    }

    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        requireBanner(id);
        bannerMapper.deleteById(id);
    }

    private Banner requireBanner(Long id) {
        Banner banner = bannerMapper.selectById(id);
        if (banner == null) {
            throw new BusinessException(404, "Banner 不存在");
        }
        return banner;
    }

    private Banner fromRequest(BannerSaveRequest req) {
        Banner b = new Banner();
        applyRequest(b, req);
        if (b.getLinkType() == null || b.getLinkType().isBlank()) {
            b.setLinkType("none");
        }
        if (b.getSort() == null) {
            b.setSort(0);
        }
        if (b.getStatus() == null) {
            b.setStatus(1);
        }
        return b;
    }

    private void applyRequest(Banner b, BannerSaveRequest req) {
        if (req.getTitle() != null) {
            b.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            b.setDescription(req.getDescription());
        }
        if (req.getImageUrl() != null) {
            b.setImageUrl(req.getImageUrl());
        }
        if (req.getCoverFitMode() != null) {
            b.setCoverFitMode(com.shuyuan.backend.util.CoverFitMode.normalize(req.getCoverFitMode()));
        }
        if (req.getLinkType() != null) {
            b.setLinkType(req.getLinkType());
        }
        if (req.getLinkValue() != null) {
            b.setLinkValue(req.getLinkValue());
        }
        if (req.getSort() != null) {
            b.setSort(req.getSort());
        }
        if (req.getStatus() != null) {
            b.setStatus(req.getStatus());
        }
    }

    private Map<String, Object> toVo(Banner b) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", b.getId());
        m.put("title", b.getTitle());
        m.put("description", b.getDescription());
        m.put("imageUrl", b.getImageUrl());
        m.put("coverFitMode", com.shuyuan.backend.util.CoverFitMode.normalize(b.getCoverFitMode()));
        m.put("linkType", b.getLinkType());
        m.put("linkValue", b.getLinkValue());
        m.put("linkLabel", bannerLinkPolicy.resolveLabel(b.getLinkType(), b.getLinkValue()));
        m.put("sort", b.getSort());
        m.put("status", b.getStatus());
        return m;
    }
}

package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.AnnouncementSaveRequest;
import com.shuyuan.backend.entity.Announcement;
import com.shuyuan.backend.mapper.AnnouncementMapper;
import com.shuyuan.backend.util.FormatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 首页公告后台管理（docs Phase 2 公告通知条、Phase 5 系统设置）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAnnouncementService {

    private static final String CACHE_KEY = "announcement:active";

    private final AnnouncementMapper announcementMapper;
    private final AdminPermissionService adminPermissionService;
    private final StringRedisTemplate redis;

    public PageResult<Map<String, Object>> list(int page, int size) {
        adminPermissionService.require("admin:super");
        Page<Announcement> p = announcementMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Announcement>()
                        .orderByAsc(Announcement::getSort)
                        .orderByDesc(Announcement::getUpdateTime));
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> detail(Long id) {
        adminPermissionService.require("admin:super");
        return toVo(requireAnnouncement(id));
    }

    @Transactional
    public Map<String, Object> create(AnnouncementSaveRequest req) {
        adminPermissionService.require("admin:super");
        validateContent(req);
        Announcement announcement = fromRequest(new Announcement(), req);
        if (announcement.getSort() == null) {
            announcement.setSort(0);
        }
        if (announcement.getIsScroll() == null) {
            announcement.setIsScroll(1);
        }
        if (announcement.getStatus() == null) {
            announcement.setStatus(1);
        }
        announcementMapper.insert(announcement);
        evictActiveCache();
        return toVo(announcementMapper.selectById(announcement.getId()));
    }

    @Transactional
    public Map<String, Object> update(Long id, AnnouncementSaveRequest req) {
        adminPermissionService.require("admin:super");
        Announcement announcement = requireAnnouncement(id);
        validateContent(req);
        fromRequest(announcement, req);
        announcementMapper.updateById(announcement);
        evictActiveCache();
        return toVo(announcementMapper.selectById(id));
    }

    @Transactional
    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        requireAnnouncement(id);
        announcementMapper.deleteById(id);
        evictActiveCache();
    }

    /** 后台变更后清除小程序读缓存（TTL 5 分钟，docs Phase 2） */
    public void evictActiveCache() {
        try {
            redis.delete(CACHE_KEY);
        } catch (Exception e) {
            log.warn("公告缓存清除失败: {}", e.getMessage());
        }
    }

    private Announcement requireAnnouncement(Long id) {
        Announcement announcement = announcementMapper.selectById(id);
        if (announcement == null) {
            throw new BusinessException(404, "公告不存在");
        }
        return announcement;
    }

    private void validateContent(AnnouncementSaveRequest req) {
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new BusinessException(400, "公告内容不能为空");
        }
    }

    private Announcement fromRequest(Announcement a, AnnouncementSaveRequest req) {
        if (req.getContent() != null) {
            a.setContent(req.getContent().trim());
        }
        if (req.getLinkUrl() != null) {
            a.setLinkUrl(req.getLinkUrl().trim());
        }
        if (req.getSort() != null) {
            a.setSort(req.getSort());
        }
        if (req.getIsScroll() != null) {
            a.setIsScroll(req.getIsScroll());
        }
        if (req.getStartTime() != null) {
            a.setStartTime(FormatUtils.parseDateTime(req.getStartTime()));
        }
        if (req.getEndTime() != null) {
            a.setEndTime(FormatUtils.parseDateTime(req.getEndTime()));
        }
        if (req.getStatus() != null) {
            a.setStatus(req.getStatus());
        }
        return a;
    }

    private Map<String, Object> toVo(Announcement a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("content", a.getContent());
        m.put("linkUrl", a.getLinkUrl());
        m.put("sort", a.getSort());
        m.put("isScroll", a.getIsScroll());
        m.put("startTime", FormatUtils.formatDateTime(a.getStartTime()));
        m.put("endTime", FormatUtils.formatDateTime(a.getEndTime()));
        m.put("status", a.getStatus());
        m.put("activeNow", isActiveNow(a));
        return m;
    }

    private boolean isActiveNow(Announcement a) {
        if (a.getStatus() == null || a.getStatus() != 1) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (a.getStartTime() != null && a.getStartTime().isAfter(now)) {
            return false;
        }
        if (a.getEndTime() != null && a.getEndTime().isBefore(now)) {
            return false;
        }
        return true;
    }
}

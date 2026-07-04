package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.HallSaveRequest;
import com.shuyuan.backend.entity.Hall;
import com.shuyuan.backend.mapper.HallMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminHallService {

    private final HallMapper hallMapper;
    private final CategoryService categoryService;
    private final AdminPermissionService adminPermissionService;
    private final SearchIndexSyncService searchIndexSyncService;

    public PageResult<Map<String, Object>> list(int page, int size) {
        adminPermissionService.require("hall:read");
        Page<Hall> p = hallMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Hall>().orderByAsc(Hall::getSort));
        Map<Long, String> catMap = categoryService.nameMap("hall");
        List<Map<String, Object>> records = p.getRecords().stream()
                .map(h -> toVo(h, catMap)).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    @Transactional
    public Map<String, Object> create(HallSaveRequest req) {
        adminPermissionService.require("hall:write");
        validateName(req);
        Hall hall = fromRequest(new Hall(), req);
        if (hall.getSort() == null) {
            hall.setSort(0);
        }
        if (hall.getStatus() == null) {
            hall.setStatus(1);
        }
        hallMapper.insert(hall);
        Hall saved = hallMapper.selectById(hall.getId());
        if (saved.getStatus() == 1) {
            searchIndexSyncService.syncHall(saved);
        }
        return toVo(saved, categoryService.nameMap("hall"));
    }

    @Transactional
    public Map<String, Object> update(Long id, HallSaveRequest req) {
        adminPermissionService.require("hall:write");
        Hall hall = requireHall(id);
        fromRequest(hall, req);
        hallMapper.updateById(hall);
        Hall saved = hallMapper.selectById(id);
        if (saved.getStatus() != null && saved.getStatus() == 1) {
            searchIndexSyncService.syncHall(saved);
        } else {
            searchIndexSyncService.removeHall(id);
        }
        return toVo(saved, categoryService.nameMap("hall"));
    }

    private Hall requireHall(Long id) {
        Hall hall = hallMapper.selectById(id);
        if (hall == null) {
            throw new BusinessException(404, "展馆不存在");
        }
        return hall;
    }

    private void validateName(HallSaveRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException(400, "展馆名称不能为空");
        }
    }

    private Hall fromRequest(Hall hall, HallSaveRequest req) {
        if (req.getName() != null) {
            hall.setName(req.getName());
        }
        if (req.getCover() != null) {
            hall.setCover(req.getCover());
        }
        if (req.getIntro() != null) {
            hall.setIntro(req.getIntro());
        }
        if (req.getCategoryId() != null) {
            hall.setCategoryId(req.getCategoryId());
        }
        if (req.getSort() != null) {
            hall.setSort(req.getSort());
        }
        if (req.getStatus() != null) {
            hall.setStatus(req.getStatus());
        }
        return hall;
    }

    private Map<String, Object> toVo(Hall h, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("name", h.getName());
        m.put("cover", h.getCover());
        m.put("intro", h.getIntro());
        m.put("categoryId", h.getCategoryId());
        m.put("categoryName", categoryService.getName(h.getCategoryId(), catMap));
        m.put("sort", h.getSort());
        m.put("status", h.getStatus());
        return m;
    }
}

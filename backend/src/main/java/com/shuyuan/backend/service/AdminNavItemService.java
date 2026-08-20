package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shuyuan.backend.common.PageResult;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.dto.NavItemSaveRequest;
import com.shuyuan.backend.entity.NavItem;
import com.shuyuan.backend.mapper.NavItemMapper;
import com.shuyuan.backend.util.NavPathPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminNavItemService {

    private final NavItemMapper navItemMapper;
    private final AdminPermissionService adminPermissionService;

    public PageResult<Map<String, Object>> list(int page, int size) {
        adminPermissionService.require("admin:super");
        Page<NavItem> p = navItemMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<NavItem>().orderByAsc(NavItem::getSort).orderByAsc(NavItem::getId));
        List<Map<String, Object>> records = p.getRecords().stream().map(this::toVo).toList();
        return new PageResult<>(records, p.getTotal(), page, size);
    }

    public Map<String, Object> create(NavItemSaveRequest req) {
        adminPermissionService.require("admin:super");
        NavItem item = fromRequest(new NavItem(), req);
        navItemMapper.insert(item);
        return toVo(navItemMapper.selectById(item.getId()));
    }

    public Map<String, Object> update(Long id, NavItemSaveRequest req) {
        adminPermissionService.require("admin:super");
        NavItem existing = requireItem(id);
        fromRequest(existing, req);
        navItemMapper.updateById(existing);
        return toVo(navItemMapper.selectById(id));
    }

    public void delete(Long id) {
        adminPermissionService.require("admin:super");
        requireItem(id);
        navItemMapper.deleteById(id);
    }

    private NavItem requireItem(Long id) {
        NavItem item = navItemMapper.selectById(id);
        if (item == null) {
            throw new BusinessException(404, "入口不存在");
        }
        return item;
    }

    private NavItem fromRequest(NavItem item, NavItemSaveRequest req) {
        if (req == null) {
            throw new BusinessException(400, "请填写入口信息");
        }
        if (!StringUtils.hasText(req.getLabel())) {
            throw new BusinessException(400, "请填写入口名称");
        }
        item.setLabel(req.getLabel().trim());
        item.setIcon(StringUtils.hasText(req.getIcon()) ? req.getIcon().trim() : "grid");
        item.setPath(NavPathPolicy.normalize(req.getPath()));
        item.setSort(req.getSort() != null ? req.getSort() : 0);
        item.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        return item;
    }

    private Map<String, Object> toVo(NavItem item) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", item.getId());
        m.put("label", item.getLabel());
        m.put("icon", item.getIcon());
        m.put("path", item.getPath());
        m.put("sort", item.getSort());
        m.put("status", item.getStatus());
        return m;
    }
}

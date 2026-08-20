package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.NavItem;
import com.shuyuan.backend.mapper.NavItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NavItemService {

    private final NavItemMapper navItemMapper;

    /** 小程序首页：仅返回上架项 */
    public List<Map<String, Object>> listPublished() {
        List<NavItem> list = navItemMapper.selectList(new LambdaQueryWrapper<NavItem>()
                .eq(NavItem::getStatus, 1)
                .orderByAsc(NavItem::getSort)
                .orderByAsc(NavItem::getId));
        return list.stream().map(this::toVo).toList();
    }

    private Map<String, Object> toVo(NavItem item) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", item.getId());
        m.put("label", item.getLabel());
        m.put("icon", item.getIcon());
        m.put("path", item.getPath());
        m.put("sort", item.getSort());
        return m;
    }
}
